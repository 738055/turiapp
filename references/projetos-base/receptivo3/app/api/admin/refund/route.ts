import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { headers } from 'next/headers';

// Rate limiting map (in-memory, per-instance)
const refundAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 5; // max 5 refunds per minute per admin

function checkRateLimit(adminId: string): boolean {
  const now = Date.now();
  const entry = refundAttempts.get(adminId);

  if (!entry || now > entry.resetAt) {
    refundAttempts.set(adminId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    // 1. Auth: verify admin role via service key in Authorization header
    const reqHeaders = await headers();
    const authHeader = reqHeaders.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token ausente.' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the JWT and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Token invalido.' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado. Somente administradores.' }, { status: 403 });
    }

    // Rate limit check
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: 'Limite de reembolsos excedido. Aguarde 1 minuto.' },
        { status: 429 }
      );
    }

    // 2. Parse & validate body
    const body = await request.json();
    const { bookingId, reason, amount: requestedAmount } = body;

    if (!bookingId || typeof bookingId !== 'string') {
      return NextResponse.json({ error: 'bookingId e obrigatorio.' }, { status: 400 });
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
      return NextResponse.json({ error: 'Motivo do reembolso e obrigatorio (min 3 caracteres).' }, { status: 400 });
    }

    // Sanitize reason to prevent injection
    const sanitizedReason = reason.trim().slice(0, 500);

    // 3. Fetch the booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('id, total, status, payment_status, payment_intent_id, customer_name, customer_email')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Reserva nao encontrada.' }, { status: 404 });
    }

    if (!booking.payment_intent_id) {
      return NextResponse.json({ error: 'Reserva sem pagamento registrado no Stripe.' }, { status: 400 });
    }

    if (booking.status === 'cancelled' && booking.payment_status === 'refunded') {
      return NextResponse.json({ error: 'Reserva ja foi reembolsada.' }, { status: 409 });
    }

    // 4. Get Stripe key from settings
    const { data: settings } = await supabaseAdmin
      .from('system_settings')
      .select('stripe_secret_key')
      .single();

    if (!settings?.stripe_secret_key) {
      return NextResponse.json({ error: 'Stripe nao configurado no ERP.' }, { status: 500 });
    }

    const stripe = new Stripe(settings.stripe_secret_key, { apiVersion: '2023-10-16' });

    // 5. Determine refund amount (full or partial)
    const refundAmount = requestedAmount
      ? Math.min(Number(requestedAmount), booking.total)
      : booking.total;

    if (refundAmount <= 0 || isNaN(refundAmount)) {
      return NextResponse.json({ error: 'Valor de reembolso invalido.' }, { status: 400 });
    }

    const isPartialRefund = refundAmount < booking.total;
    const refundAmountCents = Math.round(refundAmount * 100);

    // 6. Execute refund on Stripe
    const refund = await stripe.refunds.create({
      payment_intent: booking.payment_intent_id,
      amount: refundAmountCents,
      reason: 'requested_by_customer',
      metadata: {
        booking_id: bookingId,
        admin_id: user.id,
        admin_reason: sanitizedReason,
      },
    });

    // 7. Update booking status
    const newStatus = isPartialRefund ? booking.status : 'cancelled';
    const newPaymentStatus = isPartialRefund ? 'partially_refunded' : 'refunded';

    await supabaseAdmin
      .from('bookings')
      .update({
        status: newStatus,
        payment_status: newPaymentStatus,
        refund_amount: refundAmount,
        refund_reason: sanitizedReason,
        refunded_at: new Date().toISOString(),
        refunded_by: user.id,
      })
      .eq('id', bookingId);

    // 8. Create refund transaction in financial ledger
    await supabaseAdmin.from('transactions').insert([{
      description: `Reembolso${isPartialRefund ? ' Parcial' : ''} - Reserva #${bookingId.slice(0, 6)} - ${booking.customer_name}`,
      amount: refundAmount,
      type: 'expense',
      category: 'Reembolsos',
      status: 'paid',
      due_date: new Date().toISOString().split('T')[0],
      payment_date: new Date().toISOString(),
      booking_id: bookingId,
    }]);

    // 9. If full refund, cancel pending supplier payables for this booking
    if (!isPartialRefund) {
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'cancelled' })
        .eq('booking_id', bookingId)
        .eq('type', 'expense')
        .eq('status', 'pending')
        .eq('category', 'Fornecedores (NET)');
    }

    // 10. Audit log (non-blocking, table may not exist yet)
    try {
      await supabaseAdmin.from('audit_logs').insert([{
        action: 'refund',
        entity_type: 'booking',
        entity_id: bookingId,
        user_id: user.id,
        details: {
          refund_id: refund.id,
          amount: refundAmount,
          is_partial: isPartialRefund,
          reason: sanitizedReason,
          stripe_status: refund.status,
        },
      }]);
    } catch {
      // audit_logs table may not exist yet
    }

    return NextResponse.json({
      success: true,
      refundId: refund.id,
      amount: refundAmount,
      isPartial: isPartialRefund,
      status: refund.status,
    });

  } catch (error: any) {
    console.error('[refund] ERRO:', error?.message || error);

    // Handle Stripe-specific errors
    if (error?.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: `Erro Stripe: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno ao processar reembolso.' },
      { status: 500 }
    );
  }
}
