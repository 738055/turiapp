'use client';

import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@/lib/supabaseBrowser';
import {
  Search, Calendar, Filter, Download, Eye, FileEdit, Trash2,
  CheckCircle, XCircle, Clock, X, MapPin, CreditCard, RotateCcw, Loader2, AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';

// Interface local
interface BookingWithDetails {
  id: string;
  created_at: string;
  tour_date: string;
  status: string;
  total_amount: number;
  payment_method: string;
  customerName: string;
  customerEmail: string;
  customerWhatsapp?: string;
  productName: string;
  quantity: number;
  notes?: string;
  booking_items: {
    product_title: string;
    quantity: number;
    pickup_location?: string;
  }[];
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de Filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Estado do Modal de Detalhes
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);

  // Estado do Modal de Reembolso
  const [refundBooking, setRefundBooking] = useState<BookingWithDetails | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [isPartialRefund, setIsPartialRefund] = useState(false);
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundError, setRefundError] = useState('');

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id, created_at, tour_date, status, total, payment_method, 
          customer_name, customer_email, customer_whatsapp, notes,
          booking_items ( product_title, quantity, pickup_location )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formatted: BookingWithDetails[] = data.map((b: any) => {
            const calculatedQuantity = b.booking_items?.reduce((acc: number, item: any) => acc + (item.quantity || 0), 0) || b.quantity || 1;
            return {
                id: b.id,
                created_at: b.created_at,
                tour_date: b.tour_date,
                status: b.status,
                total_amount: b.total,
                payment_method: b.payment_method,
                customerName: b.customer_name || 'Cliente Removido',
                customerEmail: b.customer_email || '-',
                customerWhatsapp: b.customer_whatsapp,
                notes: b.notes,
                productName: b.booking_items?.[0]?.product_title || 'Múltiplos Itens',
                quantity: calculatedQuantity,
                booking_items: b.booking_items || []
            };
        });
        setBookings(formatted);
      }
    } catch (error) {
      console.error('Erro ao buscar reservas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (id: string) => {
      if (!confirm('Tem certeza que deseja cancelar esta reserva? O status sera alterado para Cancelado.')) return;

      try {
          const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id);
          if (error) throw error;

          setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
      } catch (err) {
          alert('Erro ao cancelar reserva.');
      }
  };

  const handleRefund = async () => {
    if (!refundBooking) return;
    if (!refundReason.trim() || refundReason.trim().length < 3) {
      setRefundError('Informe o motivo do reembolso (min 3 caracteres).');
      return;
    }

    setRefundLoading(true);
    setRefundError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessao expirada.');

      const body: any = {
        bookingId: refundBooking.id,
        reason: refundReason.trim(),
      };

      if (isPartialRefund && refundAmount) {
        const amount = parseFloat(refundAmount.replace(',', '.'));
        if (isNaN(amount) || amount <= 0) {
          setRefundError('Valor de reembolso invalido.');
          setRefundLoading(false);
          return;
        }
        if (amount > refundBooking.total_amount) {
          setRefundError('Valor nao pode exceder o total da reserva.');
          setRefundLoading(false);
          return;
        }
        body.amount = amount;
      }

      const res = await fetch('/api/admin/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao processar reembolso.');
      }

      // Update local state
      setBookings(prev => prev.map(b =>
        b.id === refundBooking.id
          ? { ...b, status: data.isPartial ? b.status : 'cancelled' }
          : b
      ));

      setRefundBooking(null);
      setRefundReason('');
      setRefundAmount('');
      setIsPartialRefund(false);
      alert(`Reembolso de R$ ${data.amount.toFixed(2)} processado com sucesso! ID: ${data.refundId}`);
    } catch (err: any) {
      setRefundError(err.message);
    } finally {
      setRefundLoading(false);
    }
  };

  const handleExportCSV = () => {
      if (filteredBookings.length === 0) return alert('Não há dados para exportar com os filtros atuais.');
      
      let csvContent = '\uFEFFID;Data Compra;Cliente;Email;Telefone;Produto;Data Passeio;Qtd;Total;Status\n';
      
      filteredBookings.forEach(b => {
          const dataCompra = format(new Date(b.created_at), 'dd/MM/yyyy HH:mm');
          const dataPasseio = b.tour_date ? format(new Date(b.tour_date), 'dd/MM/yyyy') : '-';
          const totalStr = b.total_amount ? b.total_amount.toFixed(2).replace('.', ',') : '0,00';
          
          csvContent += `"${b.id.slice(0,8)}";"${dataCompra}";"${b.customerName}";"${b.customerEmail}";"${b.customerWhatsapp || ''}";"${b.productName}";"${dataPasseio}";"${b.quantity}";"${totalStr}";"${b.status}"\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Reservas_Exportadas_${new Date().getTime()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      confirmed: 'bg-green-100 text-green-800 border-green-200',
      paid: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      completed: 'bg-primary-100 text-primary-800 border-primary-200',
      refunded: 'bg-orange-100 text-orange-800 border-orange-200',
      disputed: 'bg-purple-100 text-purple-800 border-purple-200',
    };

    const labels: Record<string, string> = {
      paid: 'PAGO', confirmed: 'CONFIRMADO', pending: 'PENDENTE',
      cancelled: 'CANCELADO', completed: 'CONCLUIDO',
      refunded: 'REEMBOLSADO', disputed: 'EM DISPUTA',
    };

    const cssClass = styles[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    const label = labels[status] || status.toUpperCase();

    return (
      <span className={`px-2 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border ${cssClass} inline-flex items-center gap-1`}>
        {status === 'confirmed' || status === 'paid' ? <CheckCircle size={10} /> : 
         status === 'pending' ? <Clock size={10} /> :
         status === 'cancelled' ? <XCircle size={10} /> : null}
        {label}
      </span>
    );
  };

  // Aplicação dos Filtros Combinados (Busca + Status)
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || booking.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* --- MODAL DE REEMBOLSO --- */}
      {refundBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b bg-red-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-red-800 flex items-center gap-2">
                <RotateCcw size={20} /> Processar Reembolso
              </h3>
              <button onClick={() => { setRefundBooking(null); setRefundError(''); }} className="text-gray-400 hover:text-red-500">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border">
                <p className="text-sm text-gray-500">Reserva</p>
                <p className="font-bold text-gray-800">#{refundBooking.id.slice(0, 8).toUpperCase()} - {refundBooking.customerName}</p>
                <p className="text-sm text-gray-600 mt-1">Total: <strong>R$ {refundBooking.total_amount?.toFixed(2)}</strong></p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Motivo do Reembolso *</label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none h-20 focus:ring-2 focus:ring-red-200 outline-none"
                  placeholder="Ex: Cliente solicitou cancelamento, erro de reserva..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="partialRefund"
                  checked={isPartialRefund}
                  onChange={(e) => setIsPartialRefund(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded"
                />
                <label htmlFor="partialRefund" className="text-sm text-gray-700 font-medium">Reembolso parcial</label>
              </div>

              {isPartialRefund && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Valor do Reembolso (R$)</label>
                  <input
                    type="text"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-200 outline-none"
                    placeholder={`Max: ${refundBooking.total_amount?.toFixed(2)}`}
                  />
                </div>
              )}

              {refundError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} />
                  <p className="text-sm text-red-700">{refundError}</p>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800 font-medium">
                  O valor sera devolvido ao cliente via Stripe. Esta acao nao pode ser desfeita.
                </p>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
              <button
                onClick={() => { setRefundBooking(null); setRefundError(''); }}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleRefund}
                disabled={refundLoading}
                className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 text-sm"
              >
                {refundLoading ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                {refundLoading ? 'Processando...' : 'Confirmar Reembolso'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE DETALHES --- */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                 Detalhes do Pedido <span className="font-mono text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">#{selectedBooking.id.slice(0,8).toUpperCase()}</span>
               </h3>
               <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={24}/></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
               <div className="flex justify-between items-start">
                  <div>
                     <p className="text-sm text-gray-500 mb-1">Cliente</p>
                     <p className="font-bold text-gray-800 text-lg">{selectedBooking.customerName}</p>
                     <p className="text-sm text-gray-600">{selectedBooking.customerEmail}</p>
                     <p className="text-sm text-gray-600">{selectedBooking.customerWhatsapp}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-sm text-gray-500 mb-1">Status</p>
                     {getStatusBadge(selectedBooking.status)}
                  </div>
               </div>

               <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 font-bold text-sm text-gray-700">Itens do Pedido</div>
                  <div className="divide-y divide-gray-50">
                     {selectedBooking.booking_items.map((item, idx) => (
                        <div key={idx} className="p-4 flex flex-col gap-1">
                           <div className="font-bold text-gray-800 text-sm">{item.product_title}</div>
                           <div className="text-xs text-gray-500 flex items-center gap-4">
                              <span>Qtd: {item.quantity}</span>
                              {item.pickup_location && <span className="flex items-center gap-1 text-primary"><MapPin size={12}/> {item.pickup_location}</span>}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4 bg-primary-50/50 p-4 rounded-xl border border-primary-100">
                  <div>
                     <p className="text-xs text-gray-500 uppercase font-bold mb-1">Data do Passeio Principal</p>
                     <p className="font-bold text-gray-800">{selectedBooking.tour_date ? format(new Date(selectedBooking.tour_date), 'dd/MM/yyyy') : 'A Combinar'}</p>
                  </div>
                  <div>
                     <p className="text-xs text-gray-500 uppercase font-bold mb-1">Pagamento</p>
                     <p className="font-bold text-gray-800 flex items-center gap-2">
                        <CreditCard size={14} className="text-primary"/> 
                        R$ {selectedBooking.total_amount?.toFixed(2)} ({selectedBooking.payment_method?.toUpperCase()})
                     </p>
                  </div>
               </div>
               
               {selectedBooking.notes && (
                  <div>
                     <p className="text-xs text-gray-500 uppercase font-bold mb-1">Observações / Cupom</p>
                     <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-lg border border-yellow-100 italic">{selectedBooking.notes}</p>
                  </div>
               )}
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 text-right">
               <button onClick={() => setSelectedBooking(null)} className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-bold text-sm transition-colors">
                  Fechar
               </button>
            </div>
          </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservas e Pedidos</h1>
          <p className="text-sm text-gray-500">Gerencie todas as vendas do sistema.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <button onClick={handleExportCSV} className="flex-1 md:flex-none justify-center items-center flex gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-bold transition-colors shadow-sm">
                <Download size={16} /> Exportar
            </button>
            <button onClick={() => window.open('/', '_blank')} className="flex-1 md:flex-none justify-center items-center flex gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark text-sm font-bold transition-colors shadow-sm">
                <Calendar size={16} /> Nova Reserva
            </button>
        </div>
      </div>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Filtros */}
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4 bg-gray-50/50">
          <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                placeholder="Buscar por nome do cliente ou ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
          <div className="flex items-center gap-2">
             <Filter size={18} className="text-gray-400 hidden md:block" />
             <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary outline-none font-medium text-gray-700"
             >
                <option value="all">Todos os Status</option>
                <option value="pending">Pendentes</option>
                <option value="paid">Pagos / Confirmados</option>
                <option value="cancelled">Cancelados</option>
             </select>
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">ID / Data</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Produto Principal</th>
                <th className="px-6 py-4 text-center">Data Passeio</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                  <tr>
                      <td colSpan={7} className="px-6 py-20 text-center text-gray-500">
                          <div className="flex flex-col items-center gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            Buscando reservas...
                          </div>
                      </td>
                  </tr>
              ) : filteredBookings.length === 0 ? (
                  <tr>
                      <td colSpan={7} className="px-6 py-20 text-center text-gray-500">
                          Nenhuma reserva encontrada para os filtros aplicados.
                      </td>
                  </tr>
              ) : (
                  filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-primary-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-mono text-xs font-bold text-gray-800">#{booking.id.slice(0, 8).toUpperCase()}</div>
                        <div className="text-[10px] text-gray-400 mt-1">{format(new Date(booking.created_at), 'dd/MM/yyyy')}</div>
                      </td>
                      <td className="px-6 py-4">
                          <div className="flex flex-col">
                              <span className="font-bold text-gray-800">{booking.customerName}</span>
                              <span className="text-xs text-gray-500">{booking.customerWhatsapp || booking.customerEmail}</span>
                          </div>
                      </td>
                      <td className="px-6 py-4 max-w-[200px] truncate text-gray-600 text-xs font-medium" title={booking.productName}>
                          {booking.productName}
                          {booking.booking_items.length > 1 && <span className="text-[10px] text-primary ml-2 bg-primary-50 px-1 rounded">+{booking.booking_items.length - 1} itens</span>}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-800 font-medium">
                          {booking.tour_date ? format(new Date(booking.tour_date), 'dd/MM/yyyy') : '-'}
                      </td>
                      <td className="px-6 py-4 font-black text-gray-800 text-right">
                          R$ {booking.total_amount?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(booking.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                           <button onClick={() => setSelectedBooking(booking)} className="p-2 text-primary-600 hover:bg-primary-50 hover:shadow-sm rounded transition-all" title="Ver Detalhes">
                              <Eye size={18} />
                           </button>
                           {(booking.status === 'paid' || booking.status === 'confirmed') && (
                             <button onClick={() => { setRefundBooking(booking); setRefundReason(''); setRefundAmount(''); setIsPartialRefund(false); setRefundError(''); }} className="p-2 text-orange-500 hover:text-orange-700 hover:bg-orange-50 hover:shadow-sm rounded transition-all" title="Reembolsar">
                                <RotateCcw size={18} />
                             </button>
                           )}
                           {booking.status !== 'cancelled' && (
                             <button onClick={() => handleCancelBooking(booking.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 hover:shadow-sm rounded transition-all" title="Cancelar Pedido">
                                <Trash2 size={18} />
                             </button>
                           )}
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center text-xs font-bold text-gray-500">
            <span>Exibindo {filteredBookings.length} resultados.</span>
        </div>
      </div>
    </div>
  );
}
