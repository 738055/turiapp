import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { checkPaymentRateLimit } from '@/lib/validation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );
    const { data: { session } } = await supabaseAuth.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado. Inicie sessao para comprar.' }, { status: 401 });
    }

    const authenticatedUserId = session.user.id;
    const authenticatedUserEmail = session.user.email;

    // Rate limit per user
    if (!checkPaymentRateLimit(authenticatedUserId)) {
      return NextResponse.json({ error: 'Muitas tentativas de pagamento. Aguarde um momento.' }, { status: 429 });
    }

    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Carrinho vazio' }, { status: 400 });
    }

    if (items.length > 20) {
      return NextResponse.json({ error: 'Limite de 20 itens por pedido.' }, { status: 400 });
    }

    // Get Stripe key from settings
    const { data: settings } = await supabaseAdmin
      .from('system_settings')
      .select('stripe_secret_key')
      .single();

    if (!settings?.stripe_secret_key) {
      return NextResponse.json({ error: 'Gateway de pagamento nao configurado.' }, { status: 500 });
    }

    const stripe = new Stripe(settings.stripe_secret_key, { apiVersion: '2023-10-16' });

    const orderGroupId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const pendingBookingIds = [];
    let totalAmount = 0;

    for (const item of items) {
      // Validate item structure
      if (!item.product?.id || typeof item.product.id !== 'string') {
        return NextResponse.json({ error: 'Estrutura de item invalida.' }, { status: 400 });
      }

      const quantity = Math.max(1, Math.min(100, Math.floor(Number(item.quantity) || 1)));

      // Fetch the real price from the database (never trust client)
      const { data: productData, error: productError } = await supabaseAdmin
        .from('products')
        .select('price')
        .eq('id', item.product.id)
        .single();

      if (productError || !productData) {
        return NextResponse.json(
          { error: `Produto com ID ${item.product.id} nao encontrado.` },
          { status: 404 }
        );
      }

      const realPrice = Number(productData.price);
      if (isNaN(realPrice) || realPrice < 0) {
        return NextResponse.json({ error: 'Preco do produto invalido.' }, { status: 400 });
      }

      const serverSubtotal = realPrice * quantity;
      totalAmount += serverSubtotal;

      const { data: bookingId, error } = await supabaseAdmin.rpc('reserve_inventory', {
        p_product_id: item.product.id,
        p_travel_date: item.travelDate,
        p_quantity: quantity,
        p_customer_id: authenticatedUserId,
      });

      if (error) {
        return NextResponse.json({ error: `Erro de inventario: ${error.message}` }, { status: 409 });
      }

      pendingBookingIds.push(bookingId);
    }

    // Sanity check on total amount
    if (totalAmount <= 0 || totalAmount > 1_000_000) {
      return NextResponse.json({ error: 'Valor do pedido fora do limite permitido.' }, { status: 400 });
    }

    const amountInCents = Math.round(totalAmount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'brl',
      automatic_payment_methods: { enabled: true },
      receipt_email: authenticatedUserEmail || '',
      transfer_group: orderGroupId,
      metadata: {
        customer_email: authenticatedUserEmail || '',
        pending_booking_ids: pendingBookingIds.join(','),
        order_group_id: orderGroupId,
      },
      description: `Pratik Turismo - ${items.length} item(s)`,
    });

    await supabaseAdmin
      .from('bookings')
      .update({ payment_intent_id: paymentIntent.id, transfer_group: orderGroupId })
      .in('id', pendingBookingIds);

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error('Stripe Error:', error);
    // Don't leak internal error details to client
    return NextResponse.json(
      { error: 'Erro ao processar pagamento. Tente novamente.' },
      { status: 400 }
    );
  }
}
