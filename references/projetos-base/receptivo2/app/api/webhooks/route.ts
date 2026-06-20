import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getStripe } from '@/lib/stripe';

// ==========================================
// IDEMPOTÊNCIA (dedupe de eventos do Stripe)
// In-memory por instância. Para múltiplas instâncias, mover para tabela/Redis.
// ==========================================
const processedEvents = new Set<string>();
const processedOrder: string[] = [];
const MAX_PROCESSED = 1000;

function markEventProcessed(eventId: string): void {
  processedEvents.add(eventId);
  processedOrder.push(eventId);
  if (processedOrder.length > MAX_PROCESSED) {
    const oldest = processedOrder.shift();
    if (oldest) processedEvents.delete(oldest);
  }
}

// ==========================================
// TIPOS
// ==========================================
interface BookingItemData {
  quantity: number;
  unit_price: number;
  products: {
    id: string;
    cost_price: number | null;
    supplier_id: string | null;
    suppliers: { stripe_account_id: string | null; commission_rate: number | null } | null;
  } | null;
}

export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  const body = await request.text();
  const reqHeaders = await headers();
  const sig = reqHeaders.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const stripe = await getStripe();
    const { data: settings } = await supabaseAdmin
      .from('system_settings')
      .select('stripe_webhook_secret')
      .single();

    if (!settings?.stripe_webhook_secret) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    event = stripe.webhooks.constructEvent(body, sig, settings.stripe_webhook_secret);
  } catch (err: any) {
    console.error('[webhook] Signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Idempotency check
  if (processedEvents.has(event.id)) {
    return NextResponse.json({ received: true, deduplicated: true });
  }
  markEventProcessed(event.id);

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
      case 'payment_intent.canceled':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent, event.type);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object as Stripe.Dispute);
        break;

      case 'charge.dispute.closed':
        await handleDisputeClosed(event.data.object as Stripe.Dispute);
        break;

      default:
        console.log(`[webhook] Unhandled event type: ${event.type}`);
    }
  } catch (handlerError: any) {
    console.error(`[webhook] Error handling ${event.type}:`, handlerError.message);
  }

  return NextResponse.json({ received: true });
}

// ==========================================
// PAYMENT SUCCEEDED
// ==========================================
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const stripe = await getStripe();
  const supabaseAdmin = getSupabaseAdmin();

  // 1. Update booking status
  const { data: updatedBooking } = await supabaseAdmin
    .from('bookings')
    .update({ status: 'paid', payment_status: 'confirmed', updated_at: new Date().toISOString() })
    .eq('payment_intent_id', paymentIntent.id)
    .select('*, partners(stripe_account_id, commission_percent)')
    .single();

  if (!updatedBooking) return;

  // 2. Mark income transaction as paid
  await supabaseAdmin
    .from('transactions')
    .update({ status: 'paid', payment_date: new Date().toISOString() })
    .eq('booking_id', updatedBooking.id)
    .eq('type', 'income');

  // 3. Increment coupon usage
  if (updatedBooking.coupon_id) {
    await supabaseAdmin.rpc('increment_coupon_usage', { coupon_id_to_increment: updatedBooking.coupon_id });
  }

  // 4. Generate supplier payables (Accounts Payable) + Stripe Connect splits
  const { data: rawBookingItems } = await supabaseAdmin
    .from('booking_items')
    .select(`
      quantity,
      unit_price,
      products (
        id,
        cost_price,
        supplier_id,
        suppliers ( stripe_account_id, commission_rate )
      )
    `)
    .eq('booking_id', updatedBooking.id);

  const bookingItems = rawBookingItems as unknown as BookingItemData[];

  if (bookingItems && bookingItems.length > 0) {
    const expensesToInsert = [];

    for (const item of bookingItems) {
      const product = Array.isArray(item.products) ? item.products[0] : item.products;
      if (!product) continue;

      // Supplier payable
      if (product.cost_price && product.supplier_id) {
        const totalNet = product.cost_price * item.quantity;
        expensesToInsert.push({
          description: `Pagamento Fornecedor - Reserva #${updatedBooking.id.slice(0, 6)}`,
          amount: totalNet,
          type: 'expense',
          category: 'Fornecedores (NET)',
          status: 'pending',
          due_date: updatedBooking.tour_date || new Date().toISOString(),
          booking_id: updatedBooking.id,
          supplier_id: product.supplier_id,
        });
      }

      // Stripe Connect transfer to supplier
      const supplier = Array.isArray(product.suppliers) ? product.suppliers[0] : product.suppliers;
      if (supplier?.stripe_account_id) {
        const commissionRate = supplier.commission_rate ?? 20;
        const totalItemValue = item.quantity * item.unit_price;
        const supplierAmount = totalItemValue * (1 - (commissionRate / 100));
        const amountInCents = Math.round(supplierAmount * 100);

        if (amountInCents > 0) {
          try {
            await stripe.transfers.create({
              amount: amountInCents,
              currency: 'brl',
              destination: supplier.stripe_account_id,
              transfer_group: paymentIntent.transfer_group || paymentIntent.id,
            });
          } catch (transferError) {
            console.error(`[webhook] Supplier transfer error for ${supplier.stripe_account_id}:`, transferError);
          }
        }
      }
    }

    if (expensesToInsert.length > 0) {
      await supabaseAdmin.from('transactions').insert(expensesToInsert);
    }
  }

  // 5. Affiliate commission split
  const partner = updatedBooking.partners;
  if (updatedBooking.affiliate_id && partner?.stripe_account_id) {
    const commissionRate = partner.commission_percent || 10;
    const affiliateCommission = updatedBooking.total * (commissionRate / 100);
    const amountInCents = Math.round(affiliateCommission * 100);

    if (amountInCents > 0) {
      try {
        await stripe.transfers.create({
          amount: amountInCents,
          currency: 'brl',
          destination: partner.stripe_account_id,
          transfer_group: paymentIntent.transfer_group || updatedBooking.id,
          description: `Comissao de Indicacao - Reserva #${updatedBooking.id.slice(0, 6)}`,
        });

        await supabaseAdmin.from('affiliate_commissions').insert([{
          partner_id: updatedBooking.affiliate_id,
          booking_id: updatedBooking.id,
          booking_total: updatedBooking.total,
          commission_percent: commissionRate,
          commission_amount: affiliateCommission,
          status: 'paid',
          paid_at: new Date().toISOString(),
        }]);
      } catch (transferError) {
        console.error('[webhook] Affiliate transfer error:', transferError);
        await supabaseAdmin.from('affiliate_commissions').insert([{
          partner_id: updatedBooking.affiliate_id,
          booking_id: updatedBooking.id,
          booking_total: updatedBooking.total,
          commission_percent: commissionRate,
          commission_amount: affiliateCommission,
          status: 'failed',
        }]);
      }
    }
  }

  // 6. Send voucher (fire-and-forget)
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  fetch(`${apiBaseUrl}/api/send-voucher`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      bookingId: updatedBooking.id,
      email: updatedBooking.customer_email,
      name: updatedBooking.customer_name,
    }),
  }).catch(console.error);
}

// ==========================================
// PAYMENT FAILED / CANCELED
// ==========================================
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent, eventType: string) {
  const supabaseAdmin = getSupabaseAdmin();
  const lastError = paymentIntent.last_payment_error;
  const failureMessage = lastError?.message || 'Pagamento recusado';
  const failureCode = lastError?.code || 'unknown';
  const failedStatus = eventType === 'payment_intent.canceled' ? 'cancelled' : 'failed';

  // 1. Update booking with failure details
  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .update({
      status: failedStatus,
      payment_status: failedStatus,
      payment_failure_reason: `${failureCode}: ${failureMessage}`,
      updated_at: new Date().toISOString(),
    })
    .eq('payment_intent_id', paymentIntent.id)
    .select('id')
    .single();

  if (!booking) return;

  // 2. Cancel income transactions
  await supabaseAdmin
    .from('transactions')
    .update({ status: 'cancelled' })
    .eq('booking_id', booking.id)
    .eq('type', 'income')
    .eq('status', 'pending');

  // 3. Release inventory for failed bookings
  const pendingBookingIds = paymentIntent.metadata.pending_booking_ids?.split(',').filter(Boolean) || [booking.id];

  const { data: failedItems } = await supabaseAdmin
    .from('booking_items')
    .select('product_id, quantity, date')
    .in('booking_id', pendingBookingIds);

  if (failedItems && failedItems.length > 0) {
    for (const item of failedItems) {
      if (!item.product_id || !item.date) continue;

      try {
        await supabaseAdmin.rpc('release_inventory', {
          p_product_id: item.product_id,
          p_travel_date: item.date,
          p_quantity: item.quantity || 1,
        });
      } catch (rpcError) {
        // Fallback: decrement usedSlots directly
        const { data: slot } = await supabaseAdmin
          .from('availability_slots')
          .select('id, used_slots')
          .eq('product_id', item.product_id)
          .eq('date', item.date)
          .maybeSingle();

        if (slot) {
          const newUsed = Math.max(0, (slot.used_slots || 0) - (item.quantity || 1));
          await supabaseAdmin
            .from('availability_slots')
            .update({ used_slots: newUsed })
            .eq('id', slot.id);
        }
      }
    }
    console.log(`[webhook] Inventory released for ${failedItems.length} item(s).`);
  }

  console.log(`[webhook] Payment ${failedStatus} for booking ${booking.id}: ${failureMessage}`);
}

// ==========================================
// CHARGE REFUNDED (from Stripe dashboard or API)
// ==========================================
async function handleChargeRefunded(charge: Stripe.Charge) {
  const supabaseAdmin = getSupabaseAdmin();
  const paymentIntentId = typeof charge.payment_intent === 'string'
    ? charge.payment_intent
    : charge.payment_intent?.id;

  if (!paymentIntentId) return;

  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('id, total, status, payment_status')
    .eq('payment_intent_id', paymentIntentId)
    .single();

  if (!booking) return;

  // Already processed via our refund API
  if (booking.payment_status === 'refunded') return;

  const refundedAmountCents = charge.amount_refunded;
  const totalAmountCents = charge.amount;
  const isFullRefund = refundedAmountCents >= totalAmountCents;
  const refundedAmount = refundedAmountCents / 100;

  const newPaymentStatus = isFullRefund ? 'refunded' : 'partially_refunded';
  const newStatus = isFullRefund ? 'cancelled' : booking.status;

  await supabaseAdmin
    .from('bookings')
    .update({
      status: newStatus,
      payment_status: newPaymentStatus,
      refund_amount: refundedAmount,
      refund_reason: 'Reembolso processado via Stripe Dashboard',
      refunded_at: new Date().toISOString(),
    })
    .eq('id', booking.id);

  // Create refund transaction if not already existing
  const { data: existingRefundTx } = await supabaseAdmin
    .from('transactions')
    .select('id')
    .eq('booking_id', booking.id)
    .eq('category', 'Reembolsos')
    .maybeSingle();

  if (!existingRefundTx) {
    await supabaseAdmin.from('transactions').insert([{
      description: `Reembolso${isFullRefund ? '' : ' Parcial'} via Stripe - Reserva #${booking.id.slice(0, 6)}`,
      amount: refundedAmount,
      type: 'expense',
      category: 'Reembolsos',
      status: 'paid',
      due_date: new Date().toISOString().split('T')[0],
      payment_date: new Date().toISOString(),
      booking_id: booking.id,
    }]);
  }

  // Cancel supplier payables if full refund
  if (isFullRefund) {
    await supabaseAdmin
      .from('transactions')
      .update({ status: 'cancelled' })
      .eq('booking_id', booking.id)
      .eq('type', 'expense')
      .eq('status', 'pending')
      .eq('category', 'Fornecedores (NET)');
  }
}

// ==========================================
// DISPUTE CREATED (chargeback)
// ==========================================
async function handleDisputeCreated(dispute: Stripe.Dispute) {
  const stripe = await getStripe();
  const supabaseAdmin = getSupabaseAdmin();
  const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;
  if (!chargeId) return;

  let paymentIntentId: string | undefined;
  try {
    const charge = await stripe.charges.retrieve(chargeId);
    paymentIntentId = typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent?.id || undefined;
  } catch {
    return;
  }

  if (!paymentIntentId) return;

  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('id, customer_name, customer_email, total')
    .eq('payment_intent_id', paymentIntentId)
    .single();

  if (!booking) return;

  await supabaseAdmin
    .from('bookings')
    .update({
      payment_status: 'disputed',
      dispute_id: dispute.id,
      dispute_reason: dispute.reason || 'unspecified',
      dispute_amount: (dispute.amount || 0) / 100,
    })
    .eq('id', booking.id);

  await supabaseAdmin.from('transactions').insert([{
    description: `DISPUTA/Chargeback - Reserva #${booking.id.slice(0, 6)} - ${booking.customer_name}`,
    amount: (dispute.amount || 0) / 100,
    type: 'expense',
    category: 'Disputas/Chargebacks',
    status: 'pending',
    due_date: new Date().toISOString().split('T')[0],
    booking_id: booking.id,
  }]);

  console.log(`[webhook] DISPUTE CREATED for booking ${booking.id}: ${dispute.reason} - R$ ${(dispute.amount || 0) / 100}`);
}

// ==========================================
// DISPUTE CLOSED
// ==========================================
async function handleDisputeClosed(dispute: Stripe.Dispute) {
  const stripe = await getStripe();
  const supabaseAdmin = getSupabaseAdmin();
  const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;
  if (!chargeId) return;

  let paymentIntentId: string | undefined;
  try {
    const charge = await stripe.charges.retrieve(chargeId);
    paymentIntentId = typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent?.id || undefined;
  } catch {
    return;
  }

  if (!paymentIntentId) return;

  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('payment_intent_id', paymentIntentId)
    .single();

  if (!booking) return;

  const won = dispute.status === 'won';

  await supabaseAdmin
    .from('bookings')
    .update({
      payment_status: won ? 'confirmed' : 'refunded',
      status: won ? 'paid' : 'cancelled',
      dispute_status: dispute.status,
    })
    .eq('id', booking.id);

  await supabaseAdmin
    .from('transactions')
    .update({
      status: won ? 'cancelled' : 'paid',
      description: won
        ? `DISPUTA GANHA - Reserva #${booking.id.slice(0, 6)}`
        : `DISPUTA PERDIDA (Chargeback) - Reserva #${booking.id.slice(0, 6)}`,
    })
    .eq('booking_id', booking.id)
    .eq('category', 'Disputas/Chargebacks');

  console.log(`[webhook] Dispute ${dispute.id} closed: ${dispute.status} for booking ${booking.id}`);
}
