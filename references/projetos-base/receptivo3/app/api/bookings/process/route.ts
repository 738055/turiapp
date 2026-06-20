import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { checkOrderRateLimit, sanitizeString, isValidEmail } from '@/lib/validation';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let currentStep = 'init';
  const supabaseAdmin = getSupabaseAdmin();

  try {
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!checkOrderRateLimit(clientIp)) {
      return NextResponse.json({ error: 'Muitas tentativas. Aguarde um momento.' }, { status: 429 });
    }

    const body = await request.json();
    const { cartItems, customer, paymentMethod, couponCode } = body;

    currentStep = 'validation';
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0 || !customer?.email) {
      return NextResponse.json({ error: 'Carrinho vazio ou dados incompletos.' }, { status: 400 });
    }

    if (cartItems.length > 20) {
      return NextResponse.json({ error: 'Limite de 20 itens por pedido.' }, { status: 400 });
    }

    customer.name = sanitizeString(customer.name, 200);
    customer.email = sanitizeString(customer.email, 254);
    customer.phone = sanitizeString(customer.phone, 30);
    customer.document = sanitizeString(customer.document, 30);

    if (!isValidEmail(customer.email)) return NextResponse.json({ error: 'Email invalido.' }, { status: 400 });
    if (!customer.name || customer.name.length < 2) return NextResponse.json({ error: 'Nome invalido.' }, { status: 400 });

    const allowedMethods = ['credit_card', 'pix'];
    const safePaymentMethod = allowedMethods.includes(paymentMethod) ? paymentMethod : 'credit_card';

    currentStep = 'stripe_settings';
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('system_settings')
      .select('stripe_secret_key')
      .single();

    if (settingsError || !settings?.stripe_secret_key) {
      return NextResponse.json({ error: 'Gateway de pagamento não configurado no ERP.' }, { status: 500 });
    }

    const stripe = new Stripe(settings.stripe_secret_key, { apiVersion: '2023-10-16' });

    currentStep = 'auth_resolution';
    let authUserId: string | null = null;
    let isNewAccount = false;
    let tempPassword = '';

    // Try to get session from cookies (optional - invisible checkout works without login)
    let session = null;
    try {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
        {
          cookies: {
            getAll() { return cookieStore.getAll(); },
            setAll() {}, // read-only in route handlers
          },
        }
      );
      const { data } = await supabase.auth.getSession();
      session = data.session;
    } catch {
      // Session not available - proceed without auth (invisible checkout)
    }

    if (session) {
      authUserId = session.user.id;
    } else {
      const { data: existingCustomerLink } = await supabaseAdmin
        .from('customers')
        .select('user_id')
        .eq('email', customer.email)
        .maybeSingle();

      if (existingCustomerLink?.user_id) {
        authUserId = existingCustomerLink.user_id;
      } else {
        const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const specials = '!@#$%';
        tempPassword = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
          + specials[Math.floor(Math.random() * specials.length)]
          + Math.floor(Math.random() * 10);

        const { data: newUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
          email: customer.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { full_name: customer.name },
        });

        if (createAuthError) {
          const { data: usersPage } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 50 });
          const found = usersPage?.users.find((u) => u.email === customer.email);
          authUserId = found?.id ?? null;
        } else {
          authUserId = newUser.user.id;
          isNewAccount = true;
        }
      }
    }

    currentStep = 'customer_upsert';
    let customerId: string | null = null;
    const { data: existingCustomer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('email', customer.email)
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.id;
      if (authUserId) await supabaseAdmin.from('customers').update({ user_id: authUserId }).eq('id', customerId);
    } else {
      const { data: newCustomer, error: createCustError } = await supabaseAdmin
        .from('customers')
        .insert([{
          full_name: customer.name,
          email: customer.email,
          phone: customer.phone || customer.whatsapp || null,
          document: customer.document || null,
          user_id: authUserId,
        }])
        .select('id')
        .single();

      if (createCustError) throw new Error('Erro ao cadastrar cliente: ' + createCustError.message);
      customerId = newCustomer.id;
    }

    currentStep = 'price_calculation';
    let finalTotalAmount = 0;
    const itemsToInsert: any[] = [];

    for (const item of cartItems) {
      const productData = item.product || item;

      const { data: realProduct, error: productError } = await supabaseAdmin
        .from('products')
        .select('price, title, metadata')
        .eq('id', productData.id)
        .single();

      if (productError || !realProduct) {
        throw new Error(`Produto "${productData.name || productData.id}" não encontrado.`);
      }

      const basePrice = Number(realProduct.price);
      const pricingTiers = realProduct.metadata?.pricingTiers || [];
      const productExtras = realProduct.metadata?.extras || [];
      let itemTotal = 0;
      let quantity = 0;

      // Calcula com pricingTiers se existirem e foram selecionados
      if (item.selectedTiers && Object.keys(item.selectedTiers).length > 0 && pricingTiers.length > 0) {
        for (const tier of pricingTiers) {
          const tierQty = item.selectedTiers[tier.id] || 0;
          itemTotal += tierQty * Number(tier.price);
          quantity += tierQty;
        }
      } else {
        // Fallback: adultos (preço cheio) + crianças (70%)
        const adults = item.adults || 0;
        const children = item.children || 0;
        quantity = adults + children || item.quantity || 1;
        itemTotal = (adults * basePrice) + (children * basePrice * 0.7);
        if (adults === 0 && children === 0) {
          itemTotal = quantity * basePrice;
        }
      }

      // Soma extras com preços do banco (nunca do frontend)
      if (item.selectedExtras && Object.keys(item.selectedExtras).length > 0 && productExtras.length > 0) {
        for (const extra of productExtras) {
          const key = extra.id || extra.name;
          const extraQty = item.selectedExtras[key] || item.selectedExtras[extra.name] || 0;
          if (extraQty > 0) {
            itemTotal += extraQty * Number(extra.price);
          }
        }
      }

      finalTotalAmount += itemTotal;

      itemsToInsert.push({
        product_id: productData.id,
        product_title: realProduct.title,
        quantity,
        unit_price: quantity > 0 ? Math.round((itemTotal / quantity) * 100) / 100 : basePrice,
        date: item.date || null,
        pickup_location: (item as any).pickupLocation || null,
        metadata: {
          adults: item.adults,
          children: item.children,
          selected_extras: item.selectedExtras,
          selected_tiers: item.selectedTiers,
          time: item.time,
        },
      });
    }

    currentStep = 'coupon';
    let discountApplied = 0;
    let couponNote = '';
    let couponIdToSave: string | null = null;

    if (couponCode) {
      const { data: coupon } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase().trim())
        .eq('active', true)
        .maybeSingle();

      if (coupon) {
        const isExpired = coupon.expiration_date && new Date(coupon.expiration_date) < new Date();
        const limitReached = coupon.max_uses && coupon.used_count >= coupon.max_uses;

        if (!isExpired && !limitReached) {
          discountApplied = coupon.discount_type === 'percentage'
            ? finalTotalAmount * (Number(coupon.discount_value) / 100)
            : Number(coupon.discount_value);

          discountApplied = Math.min(discountApplied, finalTotalAmount);
          finalTotalAmount -= discountApplied;
          couponNote = ` | Cupom: ${couponCode}`;
          couponIdToSave = coupon.id;
        }
      }
    }

    // Desconto PIX (5%) — aplicado no servidor
    let pixDiscount = 0;
    if (paymentMethod === 'pix') {
      pixDiscount = Math.round(finalTotalAmount * 0.05 * 100) / 100;
      finalTotalAmount -= pixDiscount;
    }

    finalTotalAmount = Math.round(finalTotalAmount * 100) / 100;

    // Validate affiliate if provided
    let validAffiliateId: string | null = null;
    if (body.affiliateId) {
      const { data: partner } = await supabaseAdmin
        .from('partners')
        .select('id')
        .eq('id', body.affiliateId)
        .eq('active', true)
        .maybeSingle();
      if (partner) validAffiliateId = partner.id;
    }

    currentStep = 'booking_insert';
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert([{
        customer_name: customer.name,
        customer_email: customer.email,
        customer_whatsapp: customer.phone || null,
        customer_document: customer.document || null,
        user_id: authUserId,
        product_name: `Pedido Web (${cartItems.length} ${cartItems.length === 1 ? 'item' : 'itens'})`,
        product_id: null,
        quantity: itemsToInsert.reduce((acc, i) => acc + i.quantity, 0),
        total: finalTotalAmount,
        total_amount: finalTotalAmount,
        status: 'pending',
        payment_method: safePaymentMethod,
        coupon_id: couponIdToSave,
        date: new Date().toISOString(),
        tour_date: itemsToInsert[0]?.date || null,
        notes: `Venda Site.${couponNote}${pixDiscount > 0 ? ` | PIX -R$${pixDiscount.toFixed(2)}` : ''}`,
        affiliate_id: validAffiliateId,
      }])
      .select()
      .single();

    if (bookingError) throw new Error('Erro ao gerar reserva: ' + bookingError.message);

    currentStep = 'booking_items_insert';
    const itemsWithBookingId = itemsToInsert.map((item) => ({ booking_id: booking.id, ...item }));
    const { error: itemsError } = await supabaseAdmin.from('booking_items').insert(itemsWithBookingId);
    if (itemsError) console.error('[booking_items] insert error:', itemsError.message);

    currentStep = 'transaction_insert';
    const todayDate = new Date().toISOString().split('T')[0];
    const { error: txError } = await supabaseAdmin.from('transactions').insert([{
      description: `Pedido #${booking.id.slice(0, 6)} - ${customer.name}`,
      amount: finalTotalAmount,
      type: 'income',
      category: 'Venda Site',
      status: 'pending',
      due_date: todayDate,
      booking_id: booking.id,
      payment_date: null,
    }]);
    if (txError) console.error('[transactions] insert error:', txError.message);

    currentStep = 'stripe_payment_intent';
    let clientSecret: string | null = null;

    if (finalTotalAmount > 0) {
      const orderGroupId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(finalTotalAmount * 100),
        currency: 'brl',
        payment_method_types: [paymentMethod === 'pix' ? 'pix' : 'card'],
        transfer_group: orderGroupId,
        metadata: {
          booking_id: booking.id,
          customer_email: customer.email,
          pending_booking_ids: booking.id,
          order_group_id: orderGroupId,
        },
      });

      clientSecret = paymentIntent.client_secret;
      await supabaseAdmin
        .from('bookings')
        .update({ payment_intent_id: paymentIntent.id, transfer_group: orderGroupId })
        .eq('id', booking.id);
    } else {
      // Compra 100% coberta por cupom — marca como paga imediatamente
      await supabaseAdmin
        .from('bookings')
        .update({ status: 'paid', payment_status: 'confirmed', updated_at: new Date().toISOString() })
        .eq('id', booking.id);

      await supabaseAdmin
        .from('transactions')
        .update({ status: 'paid', payment_date: new Date().toISOString() })
        .eq('booking_id', booking.id);

      // Envia voucher direto (sem webhook pois não houve pagamento Stripe)
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://reserva-turismo.vercel.app';
      fetch(`${appUrl}/api/send-voucher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, email: customer.email, name: customer.name }),
      }).catch((err) => console.error('[send-voucher] zero purchase email error:', err));
    }

    if (isNewAccount) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://reserva-turismo.vercel.app';
      fetch(`${appUrl}/api/send-voucher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'welcome',
          email: customer.email,
          name: customer.name,
          password: tempPassword,
        }),
      }).catch((err) => console.error('[send-voucher] welcome email error:', err));
    }

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      clientSecret,
      zeroPurchase: finalTotalAmount === 0,
    });

  } catch (error: any) {
    console.error(`[bookings/process] ERRO no step "${currentStep}":`, error?.message ?? error);
    return NextResponse.json(
      { error: error.message || 'Erro interno no servidor.' },
      { status: 500 },
    );
  }
}
