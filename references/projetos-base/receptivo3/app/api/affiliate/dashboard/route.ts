import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { headers } from 'next/headers';

export async function GET(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    // 1. Auth: verify user via JWT
    const reqHeaders = await headers();
    const authHeader = reqHeaders.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token ausente.' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Token invalido.' }, { status: 401 });
    }

    // 2. Find the partner record for this user
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('partners')
      .select('id, name, commission_percent, stripe_account_id')
      .eq('user_id', user.id)
      .single();

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Parceiro nao encontrado.' }, { status: 404 });
    }

    // 3. Fetch commissions
    const { data: commissions } = await supabaseAdmin
      .from('affiliate_commissions')
      .select('id, booking_id, booking_total, commission_percent, commission_amount, status, paid_at, created_at')
      .eq('partner_id', partner.id)
      .order('created_at', { ascending: false })
      .limit(100);

    // 4. Fetch bookings referred by this partner
    const { data: bookings } = await supabaseAdmin
      .from('bookings')
      .select('id, customer_name, total, status, payment_status, tour_date, created_at, product_name')
      .eq('affiliate_id', partner.id)
      .order('created_at', { ascending: false })
      .limit(100);

    // 5. Calculate KPIs
    const safeCommissions = commissions || [];
    const safeBookings = bookings || [];

    const totalEarned = safeCommissions
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + Number(c.commission_amount), 0);

    const totalPending = safeCommissions
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + Number(c.commission_amount), 0);

    const totalBookings = safeBookings.length;
    const confirmedBookings = safeBookings.filter(b => b.status === 'paid' || b.status === 'confirmed').length;
    const totalSalesVolume = safeBookings
      .filter(b => b.status === 'paid' || b.status === 'confirmed')
      .reduce((sum, b) => sum + Number(b.total), 0);

    // 6. Monthly breakdown (last 6 months)
    const now = new Date();
    const monthlyData: Record<string, { sales: number; commission: number; count: number }> = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = { sales: 0, commission: 0, count: 0 };
    }

    safeCommissions.forEach(c => {
      const date = new Date(c.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[key] && c.status === 'paid') {
        monthlyData[key].commission += Number(c.commission_amount);
        monthlyData[key].sales += Number(c.booking_total);
        monthlyData[key].count++;
      }
    });

    const monthlyBreakdown = Object.entries(monthlyData).map(([key, data]) => ({
      month: key,
      ...data,
    }));

    return NextResponse.json({
      partner: {
        name: partner.name,
        commissionPercent: partner.commission_percent || 10,
        hasStripeAccount: !!partner.stripe_account_id,
      },
      kpis: {
        totalEarned,
        totalPending,
        totalBookings,
        confirmedBookings,
        totalSalesVolume,
        conversionRate: totalBookings > 0 ? Math.round((confirmedBookings / totalBookings) * 100) : 0,
      },
      commissions: safeCommissions,
      bookings: safeBookings,
      monthlyBreakdown,
    });

  } catch (error: any) {
    console.error('[affiliate/dashboard] ERRO:', error?.message || error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
