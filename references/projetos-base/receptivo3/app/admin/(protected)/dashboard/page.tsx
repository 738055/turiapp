'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Calendar, ShoppingBag, Users, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
     salesToday: 0,
     bookingsPending: 0,
     activeCustomers: 0,
     totalRevenueMonth: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const firstDayMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    // 1. Vendas Hoje (Transactions)
    const { data: transactionsToday } = await supabase
       .from('transactions')
       .select('amount')
       .eq('type', 'income')
       .eq('status', 'paid') // Apenas pago
       .gte('payment_date', `${today}T00:00:00`)
       .lte('payment_date', `${today}T23:59:59`);
    
    const salesToday = transactionsToday?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

    // 2. Faturamento Mês
    const { data: transactionsMonth } = await supabase
       .from('transactions')
       .select('amount, payment_date')
       .eq('type', 'income')
       .eq('status', 'paid')
       .gte('payment_date', firstDayMonth);

    const totalRevenueMonth = transactionsMonth?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

    // 3. Reservas Pendentes
    const { count: pendingCount } = await supabase
       .from('bookings')
       .select('*', { count: 'exact', head: true })
       .eq('status', 'pending');

    // 4. Clientes Totais
    const { count: customersCount } = await supabase
       .from('customers')
       .select('*', { count: 'exact', head: true });

    // 5. Gráfico (Vendas por Dia nos últimos 7 dias)
    // Para simplificar, vamos processar os dados do mês buscados no passo 2
    const last7DaysMap: Record<string, number> = {};
    const days = [];
    
    // Inicializa últimos 7 dias com 0
    for(let i=6; i>=0; i--) {
       const d = new Date();
       d.setDate(d.getDate() - i);
       const key = d.toISOString().split('T')[0];
       const label = d.toLocaleDateString('pt-BR', { weekday: 'short' });
       last7DaysMap[key] = 0;
       days.push({ key, name: label, sales: 0 });
    }

    if (transactionsMonth) {
       transactionsMonth.forEach((t: any) => {
          const dateKey = t.payment_date.split('T')[0];
          if (last7DaysMap[dateKey] !== undefined) {
             last7DaysMap[dateKey] += Number(t.amount);
          }
       });
    }

    // Mapeia para o array final do gráfico
    const finalChartData = days.map(d => ({
       name: d.name,
       sales: last7DaysMap[d.key]
    }));

    setStats({
       salesToday,
       bookingsPending: pendingCount || 0,
       activeCustomers: customersCount || 0,
       totalRevenueMonth
    });
    setChartData(finalChartData);
    setLoading(false);
  };

  if (loading) {
     return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40}/></div>;
  }

  return (
    <div>
      <div className="mb-6">
         <h1 className="text-2xl font-bold text-gray-800">Visão Geral</h1>
         <p className="text-gray-500">Bem-vindo de volta ao painel administrativo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card Vendas Hoje */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
          <div>
            <p className="text-sm text-gray-500 font-medium uppercase">Vendas Hoje</p>
            <h3 className="text-2xl font-black text-gray-800 mt-1">
               R$ {stats.salesToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <span className="text-xs text-green-500 flex items-center gap-1 mt-1 font-bold">
               <TrendingUp size={12}/> Dinâmico
            </span>
          </div>
          <div className="bg-green-100 p-3 rounded-full text-green-600 group-hover:scale-110 transition-transform">
            <DollarSign size={24} />
          </div>
        </div>

        {/* Card Pendentes */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
          <div>
            <p className="text-sm text-gray-500 font-medium uppercase">Reservas Pendentes</p>
            <h3 className="text-2xl font-black text-gray-800 mt-1">{stats.bookingsPending}</h3>
            <span className="text-xs text-yellow-600 flex items-center gap-1 mt-1 font-bold">
               Aguardando Ação
            </span>
          </div>
          <div className="bg-yellow-100 p-3 rounded-full text-yellow-600 group-hover:scale-110 transition-transform">
            <Calendar size={24} />
          </div>
        </div>

        {/* Card Clientes */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
          <div>
            <p className="text-sm text-gray-500 font-medium uppercase">Base de Clientes</p>
            <h3 className="text-2xl font-black text-gray-800 mt-1">{stats.activeCustomers}</h3>
            <span className="text-xs text-primary-500 flex items-center gap-1 mt-1 font-bold">
               Cadastrados
            </span>
          </div>
          <div className="bg-primary-100 p-3 rounded-full text-primary-600 group-hover:scale-110 transition-transform">
            <Users size={24} />
          </div>
        </div>

        {/* Card Faturamento Mês */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
          <div>
            <p className="text-sm text-gray-500 font-medium uppercase">Faturamento (Mês)</p>
            <h3 className="text-2xl font-black text-gray-800 mt-1">
               R$ {stats.totalRevenueMonth.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </h3>
            <span className="text-xs text-purple-500 flex items-center gap-1 mt-1 font-bold">
               Acumulado
            </span>
          </div>
          <div className="bg-purple-100 p-3 rounded-full text-purple-600 group-hover:scale-110 transition-transform">
            <ShoppingBag size={24} />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Gráfico */}
         <div className="lg:col-span-2 h-[400px] bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-6">Performance de Vendas (7 Dias)</h3>
            <ResponsiveContainer width="100%" height="85%">
               <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                     cursor={{fill: '#f8fafc'}}
                     contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                     formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Vendas']}
                  />
                  <Bar dataKey="sales" fill="#16a34a" radius={[4, 4, 0, 0]} barSize={40} />
               </BarChart>
            </ResponsiveContainer>
         </div>

         {/* Atalhos Rápidos */}
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-4">Ações Rápidas</h3>
            <div className="space-y-3">
               <button onClick={() => window.location.href='/admin/products/new'} className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border border-gray-100 flex items-center gap-3 transition-colors">
                  <div className="bg-primary-100 p-2 rounded text-primary-600"><ShoppingBag size={18}/></div>
                  <span className="font-medium text-gray-700">Cadastrar Produto</span>
               </button>
               <button onClick={() => window.location.href='/admin/bookings'} className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border border-gray-100 flex items-center gap-3 transition-colors">
                  <div className="bg-yellow-100 p-2 rounded text-yellow-600"><Calendar size={18}/></div>
                  <span className="font-medium text-gray-700">Verificar Agenda</span>
               </button>
               <button onClick={() => window.location.href='/admin/finance'} className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border border-gray-100 flex items-center gap-3 transition-colors">
                  <div className="bg-green-100 p-2 rounded text-green-600"><DollarSign size={18}/></div>
                  <span className="font-medium text-gray-700">Lançar Despesa</span>
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}