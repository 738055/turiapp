'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, PieChart, Loader2, Calendar, BarChart3, CheckCircle, Package, RotateCcw, AlertTriangle } from 'lucide-react';
import { Transaction } from '@/app/types';
import { markTransactionAsPaid } from '@/app/actions';

// Tipos auxiliares para os gráficos
interface ChartData {
  name: string;
  income: number;
  expense: number;
  profit: number;
  rawDate: Date;
}

interface CategoryData {
  name: string;
  value: number;
}

export default function FinancePage() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [view, setView] = useState('dashboard'); // 'dashboard', 'payables', or 'refunds'
  const [payables, setPayables] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [totalRefunds, setTotalRefunds] = useState(0);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Estados de KPI
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [balanceFuture, setBalanceFuture] = useState(0); // A Receber
  const [totalPayables, setTotalPayables] = useState(0);

  // Estados de Gráficos
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*, suppliers(name)')
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Erro ao buscar financeiro:', error);
    } else if (data) {
      processFinancialData(data);
    }
    
    setLoading(false);
  };

  const processFinancialData = (data: any[]) => {
    let income = 0;
    let expense = 0;
    let future = 0;
    let payablesSum = 0;

    const pendingPayables = data
      .filter(t => t.type === 'expense' && t.status === 'pending' && t.category !== 'Disputas/Chargebacks')
      .map(t => {
        payablesSum += Number(t.amount);
        return { ...t, supplier_name: t.suppliers?.name || 'N/A' };
      });

    setPayables(pendingPayables.reverse());
    setTotalPayables(payablesSum);

    // Refunds
    let refundsSum = 0;
    const refundTxs = data
      .filter(t => t.category === 'Reembolsos')
      .map(t => {
        refundsSum += Number(t.amount);
        return t;
      });
    setRefunds(refundTxs.reverse());
    setTotalRefunds(refundsSum);

    // Disputes
    const disputeTxs = data.filter(t => t.category === 'Disputas/Chargebacks');
    setDisputes(disputeTxs.reverse());

    const formattedTransactions: Transaction[] = data.map(t => {
      const amount = Number(t.amount);
      const isPaid = t.status === 'paid';
      const isIncome = t.type === 'income';

      if (isPaid) {
        if (isIncome) income += amount;
        else expense += amount;
      } else if (t.status === 'pending' && isIncome) {
        future += amount;
      }

      return {
        id: t.id,
        description: t.description,
        amount: amount,
        type: t.type,
        category: t.category,
        status: t.status,
        dueDate: t.due_date,
        paymentDate: t.payment_date
      };
    });

    setTotalIncome(income);
    setTotalExpense(expense);
    setNetProfit(income - expense);
    setBalanceFuture(future);
    setTransactions(formattedTransactions.slice().reverse().slice(0, 10));

    const monthlyData: Record<string, { income: number; expense: number }> = {};
    
    data.forEach(t => {
      if (t.status !== 'paid') return;
      
      const date = new Date(t.due_date);
      const key = `${date.getMonth() + 1}/${date.getFullYear()}`; 

      if (!monthlyData[key]) {
        monthlyData[key] = { income: 0, expense: 0 };
      }
      
      if (t.type === 'income') monthlyData[key].income += Number(t.amount);
      else monthlyData[key].expense += Number(t.amount);
    });

    const chartProcessed: ChartData[] = Object.keys(monthlyData).map(key => {
       const [month, year] = key.split('/');
       const dateObj = new Date(parseInt(year), parseInt(month)-1, 1);
       return {
         name: dateObj.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase(),
         rawDate: dateObj, 
         income: monthlyData[key].income,
         expense: monthlyData[key].expense,
         profit: monthlyData[key].income - monthlyData[key].expense
       };
    }).sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());

    setChartData(chartProcessed);

    const catMap: Record<string, number> = {};
    data.forEach(t => {
       if (t.type === 'income' && t.status === 'paid') {
          const cat = t.category || 'Geral';
          catMap[cat] = (catMap[cat] || 0) + Number(t.amount);
       }
    });

    const catProcessed = Object.keys(catMap)
       .map(key => ({ name: key, value: catMap[key] }))
       .sort((a, b) => b.value - a.value)
       .slice(0, 5); 

    setCategoryData(catProcessed);
  };
  
  const handleMarkAsPaid = async (transactionId: string) => {
    setProcessingId(transactionId);
    const result = await markTransactionAsPaid(transactionId);
    if (result.error) {
        alert(`Erro: ${result.error}`);
    }
    // Revalidation will trigger a re-render with fresh data
    // No need to call fetchFinancialData() manually
    setProcessingId(null);
  };

  if (loading) {
     return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" size={40}/></div>;
  }
  
  const renderDashboard = () => (
     <>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"><p className="text-sm font-bold text-gray-500 uppercase">Receita Realizada</p><h3 className="text-3xl font-black text-gray-800 mt-2">R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3></div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"><p className="text-sm font-bold text-gray-500 uppercase">Lucro Líquido</p><h3 className={`text-3xl font-black mt-2 ${netProfit >= 0 ? 'text-gray-800' : 'text-red-600'}`}>R$ {netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3></div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"><p className="text-sm font-bold text-gray-500 uppercase">A Receber</p><h3 className="text-3xl font-black text-gray-800 mt-2">R$ {balanceFuture.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3></div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"><p className="text-sm font-bold text-gray-500 uppercase">Despesas Pagas</p><h3 className="text-3xl font-black text-gray-800 mt-2">R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3></div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border"><h3 className="font-bold text-gray-800 mb-6">Fluxo de Caixa (Mensal)</h3><div className="h-[300px]">{chartData.length > 0 ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#16a34a" stopOpacity={0.8}/><stop offset="95%" stopColor="#16a34a" stopOpacity={0}/></linearGradient><linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#dc2626" stopOpacity={0.8}/><stop offset="95%" stopColor="#dc2626" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" tick={{fontSize: 12}}/><YAxis tick={{fontSize: 12}} tickFormatter={(val) => `R$${val/1000}k`}/><Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}/><Area type="monotone" dataKey="income" name="Receita" stroke="#16a34a" fill="url(#colorIncome)" /><Area type="monotone" dataKey="expense" name="Despesa" stroke="#dc2626" fill="url(#colorExpense)" /></AreaChart></ResponsiveContainer> : <div className="h-full flex items-center justify-center text-gray-400">Sem dados</div>}</div></div>
          <div className="bg-white p-6 rounded-xl shadow-sm border"><h3 className="font-bold text-gray-800 mb-6">Receita por Categoria</h3><div className="h-[300px]">{categoryData.length > 0 ? <ResponsiveContainer width="100%" height="100%"><BarChart data={categoryData} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={false}/><XAxis type="number" hide/><YAxis dataKey="name" type="category" width={120} tick={{fontSize: 11}}/><Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}/><Bar dataKey="value" radius={[0, 4, 4, 0]}><Cell fill="#0ea5e9"/><Cell fill="#22c55e"/><Cell fill="#eab308"/><Cell fill="#f97316"/><Cell fill="#a855f7"/></Bar></BarChart></ResponsiveContainer> : <div className="h-full flex items-center justify-center text-gray-400">Sem dados</div>}</div></div>
       </div>

       <div className="bg-white rounded-xl shadow-sm border overflow-hidden"><div className="p-4 border-b font-bold text-gray-800">Últimas Transações</div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-50 text-gray-500 uppercase text-xs"><tr><th className="px-6 py-3">Vencimento</th><th className="px-6 py-3">Descrição</th><th className="px-6 py-3">Valor</th><th className="px-6 py-3 text-center">Status</th></tr></thead><tbody className="divide-y">{transactions.map((t) => (<tr key={t.id}><td className="px-6 py-4">{new Date(t.dueDate).toLocaleDateString('pt-BR')}</td><td className="px-6 py-4">{t.description}</td><td className={`px-6 py-4 font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'income' ? '+' : '-'} R$ {Number(t.amount).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td><td className="px-6 py-4 text-center"><span className={`px-2 py-1 rounded-full text-xs ${t.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{t.status}</span></td></tr>))}</tbody></table></div></div>
     </>
  );

  const renderPayables = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div>
                <h2 className="font-bold text-gray-800">Contas a Pagar a Fornecedores</h2>
                <p className="text-sm text-gray-500">Total pendente: <span className="font-bold text-red-600">R$ {totalPayables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                <tr>
                    <th className="px-6 py-3">Vencimento</th>
                    <th className="px-6 py-3">Fornecedor</th>
                    <th className="px-6 py-3">Descrição (Reserva)</th>
                    <th className="px-6 py-3 text-right">Valor a Pagar (NET)</th>
                    <th className="px-6 py-3 text-center">Ação</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {payables.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3 text-gray-500 font-mono text-xs">{new Date(p.due_date).toLocaleDateString('pt-BR')}</td>
                        <td className="px-6 py-3 font-medium text-gray-800 flex items-center gap-2"><Package size={14} className="text-gray-400"/> {p.supplier_name}</td>
                        <td className="px-6 py-3 text-gray-600">{p.description}</td>
                        <td className="px-6 py-3 text-right font-bold text-red-600">R$ {Number(p.amount).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                        <td className="px-6 py-3 text-center">
                            <button 
                                onClick={() => handleMarkAsPaid(p.id)}
                                disabled={processingId === p.id}
                                className="bg-green-600 text-white text-xs font-bold py-1 px-3 rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-1 w-28"
                            >
                                {processingId === p.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                {processingId === p.id ? 'Processando' : 'Marcar Pago'}
                            </button>
                        </td>
                    </tr>
                ))}
                {payables.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhuma conta a pagar pendente.</td></tr>
                )}
            </tbody>
            </table>
        </div>
    </div>
  );

  const renderRefunds = () => (
    <div className="space-y-6">
      {/* Disputes Section */}
      {disputes.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-purple-200 overflow-hidden">
          <div className="p-4 border-b border-purple-200 bg-purple-50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-purple-600" size={18} />
              <h2 className="font-bold text-purple-800">Disputas / Chargebacks</h2>
            </div>
            <p className="text-sm text-purple-600 mt-1">Atencao: disputas podem resultar em perda do valor + taxa.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-purple-50/50 text-gray-500 font-bold uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Data</th>
                  <th className="px-6 py-3">Descricao</th>
                  <th className="px-6 py-3 text-right">Valor</th>
                  <th className="px-6 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {disputes.map((d) => (
                  <tr key={d.id} className="hover:bg-purple-50/30">
                    <td className="px-6 py-3 text-gray-500 font-mono text-xs">{new Date(d.due_date).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-3 text-gray-800">{d.description}</td>
                    <td className="px-6 py-3 text-right font-bold text-purple-600">R$ {Number(d.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${d.status === 'paid' ? 'bg-red-100 text-red-700' : d.status === 'cancelled' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {d.status === 'paid' ? 'PERDIDA' : d.status === 'cancelled' ? 'GANHA' : 'PENDENTE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Refunds Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-gray-800">Historico de Reembolsos</h2>
            <p className="text-sm text-gray-500">Total reembolsado: <span className="font-bold text-orange-600">R$ {totalRefunds.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3">Descricao</th>
                <th className="px-6 py-3 text-right">Valor Reembolsado</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {refunds.length > 0 ? refunds.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 text-gray-500 font-mono text-xs">{new Date(r.due_date).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-3 text-gray-800">{r.description}</td>
                  <td className="px-6 py-3 text-right font-bold text-orange-600">R$ {Number(r.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${r.status === 'paid' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                      {r.status === 'paid' ? 'PROCESSADO' : r.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400">Nenhum reembolso registrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <>
       <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Painel Financeiro</h1>
          <p className="text-gray-500">Visão em tempo real do fluxo de caixa e faturamento.</p>
       </div>

       <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-4">
             <button onClick={() => setView('dashboard')} className={`py-2 px-4 text-sm font-bold ${view === 'dashboard' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}>
                Dashboard
             </button>
             <button onClick={() => setView('payables')} className={`py-2 px-4 text-sm font-bold flex items-center gap-2 ${view === 'payables' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}>
                Contas a Pagar
                {payables.length > 0 && <span className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">{payables.length}</span>}
             </button>
             <button onClick={() => setView('refunds')} className={`py-2 px-4 text-sm font-bold flex items-center gap-2 ${view === 'refunds' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}>
                <RotateCcw size={14} /> Reembolsos
                {refunds.length > 0 && <span className="bg-orange-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">{refunds.length}</span>}
             </button>
          </div>
       </div>
       
       {view === 'dashboard' ? renderDashboard() : view === 'payables' ? renderPayables() : renderRefunds()}
    </>
  );
}
