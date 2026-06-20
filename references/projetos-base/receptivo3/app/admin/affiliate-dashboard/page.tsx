'use client';

import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@/lib/supabaseBrowser';
import { useRouter } from 'next/navigation';
import {
  DollarSign, TrendingUp, ShoppingBag, Users, Clock,
  CheckCircle, XCircle, Loader2, LogOut, BarChart3,
  Calendar, ExternalLink, Copy, Check
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';

interface DashboardData {
  partner: {
    name: string;
    commissionPercent: number;
    hasStripeAccount: boolean;
  };
  kpis: {
    totalEarned: number;
    totalPending: number;
    totalBookings: number;
    confirmedBookings: number;
    totalSalesVolume: number;
    conversionRate: number;
  };
  commissions: any[];
  bookings: any[];
  monthlyBreakdown: { month: string; sales: number; commission: number; count: number }[];
}

export default function AffiliateDashboardPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'commissions' | 'bookings'>('overview');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/admin/login');
        return;
      }

      const res = await fetch('/api/affiliate/dashboard', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao carregar dashboard.');
      }

      setData(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/admin/login';
  };

  const copyAffiliateLink = async () => {
    if (!data) return;
    const { data: { session } } = await supabase.auth.getSession();
    // Get partner ID from URL or from partner record
    const link = `${window.location.origin}?ref=${session?.user?.id || 'affiliate'}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (value: number) =>
    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-primary-600" size={40} />
          <p className="text-gray-500 font-medium">Carregando painel...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md">
          <XCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Acesso Negado</h2>
          <p className="text-gray-500 mb-6">{error || 'Voce nao tem acesso ao painel de afiliados.'}</p>
          <button onClick={() => router.push('/')} className="bg-primary-600 text-white px-6 py-2 rounded-lg font-bold">
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const { partner, kpis, commissions, bookings, monthlyBreakdown } = data;

  const chartData = monthlyBreakdown.map(m => ({
    name: formatMonth(m.month),
    comissao: m.commission,
    vendas: m.sales,
    reservas: m.count,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black text-primary-600 tracking-tighter">
              Pratik<span className="text-gray-800">Turismo</span>
            </span>
            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full font-bold">PARCEIRO</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:block">
              Ola, <strong>{partner.name}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              <LogOut size={16} /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome + Affiliate Link */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Painel do Parceiro</h1>
            <p className="text-gray-500">Acompanhe suas comissoes e indicacoes em tempo real.</p>
          </div>
          <button
            onClick={copyAffiliateLink}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Link Copiado!' : 'Copiar Meu Link'}
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-green-600" size={20} />
              </div>
              <p className="text-sm font-bold text-gray-500 uppercase">Total Ganho</p>
            </div>
            <h3 className="text-2xl font-black text-gray-800">{formatCurrency(kpis.totalEarned)}</h3>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="text-yellow-600" size={20} />
              </div>
              <p className="text-sm font-bold text-gray-500 uppercase">Pendente</p>
            </div>
            <h3 className="text-2xl font-black text-gray-800">{formatCurrency(kpis.totalPending)}</h3>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="text-primary-600" size={20} />
              </div>
              <p className="text-sm font-bold text-gray-500 uppercase">Reservas</p>
            </div>
            <h3 className="text-2xl font-black text-gray-800">
              {kpis.confirmedBookings} <span className="text-sm font-medium text-gray-400">/ {kpis.totalBookings}</span>
            </h3>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-purple-600" size={20} />
              </div>
              <p className="text-sm font-bold text-gray-500 uppercase">Volume de Vendas</p>
            </div>
            <h3 className="text-2xl font-black text-gray-800">{formatCurrency(kpis.totalSalesVolume)}</h3>
          </div>
        </div>

        {/* Commission info banner */}
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BarChart3 className="text-primary-600 shrink-0" size={24} />
            <div>
              <p className="font-bold text-primary-900 text-sm">Sua taxa de comissao: {partner.commissionPercent}%</p>
              <p className="text-xs text-primary-700">Taxa de conversao: {kpis.conversionRate}% das indicacoes viram reserva.</p>
            </div>
          </div>
          {!partner.hasStripeAccount && (
            <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full">
              Conta Stripe pendente
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-4 text-sm font-bold transition-colors ${activeTab === 'overview' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Visao Geral
            </button>
            <button
              onClick={() => setActiveTab('commissions')}
              className={`py-2 px-4 text-sm font-bold transition-colors ${activeTab === 'commissions' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Comissoes ({commissions.length})
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`py-2 px-4 text-sm font-bold transition-colors ${activeTab === 'bookings' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Reservas ({bookings.length})
            </button>
          </div>
        </div>

        {/* TAB: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="font-bold text-gray-800 mb-6">Comissoes Mensais</h3>
              <div className="h-[300px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorComissao" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(val) => `R$${val}`} />
                      <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                      <Area type="monotone" dataKey="comissao" name="Comissao" stroke="#16a34a" fill="url(#colorComissao)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">Sem dados ainda</div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="font-bold text-gray-800 mb-6">Reservas por Mes</h3>
              <div className="h-[300px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="reservas" name="Reservas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">Sem dados ainda</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: Commissions */}
        {activeTab === 'commissions' && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold border-b">
                  <tr>
                    <th className="px-6 py-3">Data</th>
                    <th className="px-6 py-3">Reserva</th>
                    <th className="px-6 py-3 text-right">Valor Venda</th>
                    <th className="px-6 py-3 text-center">Taxa</th>
                    <th className="px-6 py-3 text-right">Comissao</th>
                    <th className="px-6 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {commissions.length > 0 ? commissions.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-gray-500 text-xs">
                        {new Date(c.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-3 font-mono text-xs text-gray-700">
                        #{c.booking_id?.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-3 text-right text-gray-600">
                        {formatCurrency(Number(c.booking_total))}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className="bg-primary-50 text-primary-700 text-xs font-bold px-2 py-1 rounded">
                          {c.commission_percent}%
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-green-600">
                        {formatCurrency(Number(c.commission_amount))}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          c.status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : c.status === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {c.status === 'paid' ? 'PAGO' : c.status === 'failed' ? 'FALHOU' : 'PENDENTE'}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400">
                        Nenhuma comissao registrada ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: Bookings */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold border-b">
                  <tr>
                    <th className="px-6 py-3">Data</th>
                    <th className="px-6 py-3">Cliente</th>
                    <th className="px-6 py-3">Produto</th>
                    <th className="px-6 py-3 text-center">Data Passeio</th>
                    <th className="px-6 py-3 text-right">Total</th>
                    <th className="px-6 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bookings.length > 0 ? bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-gray-500 text-xs">
                        {new Date(b.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-3 font-medium text-gray-800">
                        {b.customer_name}
                      </td>
                      <td className="px-6 py-3 text-gray-600 text-xs max-w-[200px] truncate">
                        {b.product_name}
                      </td>
                      <td className="px-6 py-3 text-center text-gray-600">
                        {b.tour_date ? new Date(b.tour_date).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-gray-800">
                        {formatCurrency(Number(b.total))}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          b.status === 'paid' || b.status === 'confirmed'
                            ? 'bg-green-100 text-green-700'
                            : b.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {b.status === 'paid' ? 'PAGO' : b.status === 'confirmed' ? 'CONFIRMADO' : b.status === 'cancelled' ? 'CANCELADO' : 'PENDENTE'}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400">
                        Nenhuma reserva indicada ainda. Compartilhe seu link!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
