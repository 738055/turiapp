'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@/lib/supabaseBrowser';
import { Search, Mail, Phone, CreditCard, ShoppingBag, MoreHorizontal, Loader2, User } from 'lucide-react';

interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  createdAt: string;
  totalSpent: number;
  bookingsCount: number;
  lastBooking: string | null;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // Busca clientes e já faz um JOIN com as reservas para calcular LTV
      const { data, error } = await supabase
        .from('customers')
        .select(`
          id,
          full_name,
          email,
          phone,
          document,
          created_at,
          bookings (
            id,
            total,
            created_at,
            status
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedCustomers: CustomerData[] = data.map((c: any) => {
          // Filtra apenas reservas que não foram canceladas para somar o LTV
          const validBookings = c.bookings?.filter((b: any) => b.status !== 'cancelled') || [];
          
          const totalSpent = validBookings.reduce((sum: number, b: any) => sum + (Number(b.total) || 0), 0);
          const bookingsCount = validBookings.length;
          
          // Encontra a data da reserva mais recente
          let lastBooking = null;
          if (bookingsCount > 0) {
            const sortedBookings = [...validBookings].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            lastBooking = sortedBookings[0].created_at;
          }

          return {
            id: c.id,
            name: c.full_name || 'Sem Nome',
            email: c.email || 'Sem E-mail',
            phone: c.phone || 'Sem telefone',
            document: c.document || 'N/A',
            createdAt: c.created_at,
            totalSpent,
            bookingsCount,
            lastBooking
          };
        });

        setCustomers(formattedCustomers);
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtro de busca na listagem
  const filteredCustomers = customers.filter(c => {
     if (!searchTerm) return true;
     const term = searchTerm.toLowerCase();
     return c.name.toLowerCase().includes(term) || 
            c.email.toLowerCase().includes(term) || 
            c.phone.includes(term) ||
            c.document.includes(term);
  });

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
       <div className="flex justify-between items-center mb-6 shrink-0">
          <div>
             <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><User className="text-primary"/> Base de Clientes</h1>
             <p className="text-gray-500 text-sm">Gerencie o relacionamento com seus passageiros e histórico de compras.</p>
          </div>
          <button className="bg-primary text-white font-bold py-2 px-6 rounded-lg shadow-sm hover:bg-primary-dark transition-colors">
             Exportar CSV
          </button>
       </div>

       <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col min-h-0 overflow-hidden">
          {/* Header da Tabela com Busca */}
          <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/50 shrink-0">
             <div className="relative flex-1 w-full md:max-w-lg">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={20}/>
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome, email, telefone ou CPF..." 
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
                />
             </div>
             <div className="text-sm text-gray-500 font-medium">
                <strong>{filteredCustomers.length}</strong> clientes encontrados
             </div>
          </div>

          {/* Tabela com Scroll Interno */}
          <div className="flex-1 overflow-y-auto">
             <table className="w-full text-left">
                <thead className="bg-white sticky top-0 z-10 text-gray-500 text-xs font-bold uppercase border-b border-gray-200">
                   <tr>
                      <th className="px-6 py-4">Cliente</th>
                      <th className="px-6 py-4">Contato</th>
                      <th className="px-6 py-4">Documento</th>
                      <th className="px-6 py-4">Histórico</th>
                      <th className="px-6 py-4 text-right">LTV (Total Gasto)</th>
                      <th className="px-6 py-4 text-center">Ações</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {loading ? (
                      <tr>
                         <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                            <div className="flex flex-col items-center justify-center gap-2">
                               <Loader2 className="animate-spin text-primary" size={32} />
                               <span>Carregando base de clientes...</span>
                            </div>
                         </td>
                      </tr>
                   ) : filteredCustomers.length === 0 ? (
                      <tr>
                         <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                            <User size={48} className="mx-auto mb-4 opacity-20" />
                            <p>Nenhum cliente encontrado na base de dados.</p>
                         </td>
                      </tr>
                   ) : (
                      filteredCustomers.map((customer) => (
                         <tr key={customer.id} className="hover:bg-primary-50/30 transition-colors group">
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-primary-100 text-primary flex items-center justify-center font-bold shrink-0">
                                     {customer.name.substring(0,2).toUpperCase()}
                                  </div>
                                  <div>
                                     <div className="font-bold text-gray-800">{customer.name}</div>
                                     <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">
                                        Cadastrado em {new Date(customer.createdAt).toLocaleDateString('pt-BR')}
                                     </div>
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                               <div className="flex items-center gap-2 mb-1">
                                  <Mail size={14} className="text-gray-400 shrink-0"/> 
                                  <span className="truncate max-w-[150px] block" title={customer.email}>{customer.email}</span>
                               </div>
                               <div className="flex items-center gap-2 text-green-600 font-medium">
                                  <Phone size={14} className="shrink-0"/> {customer.phone}
                               </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                               <div className="flex items-center gap-2">
                                  <CreditCard size={14} className="text-gray-400 shrink-0"/> {customer.document}
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <div className="flex flex-col gap-1 text-sm">
                                  <span className="bg-primary-50 border border-primary-100 text-primary px-2 py-1 rounded font-bold flex items-center gap-1 w-fit text-xs">
                                     <ShoppingBag size={12}/> {customer.bookingsCount} reserva(s)
                                  </span>
                                  {customer.lastBooking && (
                                     <span className="text-[10px] text-gray-400">Última: {new Date(customer.lastBooking).toLocaleDateString('pt-BR')}</span>
                                  )}
                               </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                               <span className="font-black text-gray-800 text-lg">R$ {customer.totalSpent.toFixed(2)}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                               <button className="p-2 text-gray-400 hover:bg-gray-100 hover:text-primary rounded-full transition-colors" title="Ver Detalhes">
                                  <MoreHorizontal size={20}/>
                               </button>
                            </td>
                         </tr>
                      ))
                   )}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  );
}
