'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@/lib/supabaseBrowser';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, MapPin, Phone, CheckCircle, Clock, XCircle, Search, FileText } from 'lucide-react';

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchMonthBookings();
  }, [currentMonth]);

  const fetchMonthBookings = async () => {
    setLoading(true);
    
    // Pega o primeiro dia do mês atual e o último dia do próximo mês para garantir margem
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1).toISOString();
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 2, 0).toISOString();

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        tour_date,
        status,
        customer_name,
        customer_whatsapp,
        quantity,
        notes,
        booking_items (
          product_title,
          quantity,
          pickup_location
        )
      `)
      .not('tour_date', 'is', null)
      .gte('tour_date', start)
      .lte('tour_date', end)
      .neq('status', 'cancelled'); // Oculta cancelados da operação diária

    if (data) {
      setBookings(data);
    }
    setLoading(false);
  };

  // --- Funções de Navegação do Calendário ---
  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  const startDay = getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth());

  // Formatação segura de Data Local (Evita bugs de fuso horário)
  const getLocalYYYYMMDD = (d: Date) => {
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split('T')[0];
  };

  const selectedDateStr = getLocalYYYYMMDD(selectedDate);

  // --- Lógica de Agrupamento do Dia Selecionado ---
  const dayBookings = bookings.filter(b => b.tour_date && b.tour_date.startsWith(selectedDateStr));
  
  // Agrupa as reservas do dia pelo Nome do Passeio
  const groupedTours: Record<string, { totalPax: number; bookings: any[] }> = {};
  
  dayBookings.forEach(b => {
     // Busca o nome do primeiro item, ou usa um genérico
     const productName = b.booking_items?.[0]?.product_title || 'Outros Serviços';
     // Pega a quantidade do item específico ou a quantidade total da reserva
     const qty = b.booking_items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || b.quantity || 1;
     
     if (!groupedTours[productName]) {
        groupedTours[productName] = { totalPax: 0, bookings: [] };
     }
     
     groupedTours[productName].totalPax += qty;
     groupedTours[productName].bookings.push({ ...b, calculatedQty: qty, pickup: b.booking_items?.[0]?.pickup_location });
  });

  // Filtro de busca na listagem do dia
  const filteredTours = Object.entries(groupedTours).filter(([productName, group]) => {
     if (!searchTerm) return true;
     const term = searchTerm.toLowerCase();
     return productName.toLowerCase().includes(term) || 
            group.bookings.some(b => b.customer_name?.toLowerCase().includes(term));
  });

  // --- Renderização do Grid do Calendário ---
  const calendarGrid = [];
  for (let i = 0; i < startDay; i++) {
     calendarGrid.push(<div key={`empty-${i}`} className="bg-transparent h-10 md:h-12"></div>);
  }
  for (let day = 1; day <= daysInMonth; day++) {
     const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
     const dateStr = getLocalYYYYMMDD(dateObj);
     const isSelected = dateStr === selectedDateStr;
     const isToday = dateStr === getLocalYYYYMMDD(new Date());
     
     // Verifica se há alguma reserva neste dia
     const hasBookings = bookings.some(b => b.tour_date && b.tour_date.startsWith(dateStr));

     calendarGrid.push(
        <button 
            key={`day-${day}`} 
            onClick={() => setSelectedDate(dateObj)}
            className={`h-10 md:h-12 flex flex-col items-center justify-center rounded-lg text-sm font-medium transition-all relative border border-transparent
               ${isSelected ? 'bg-primary text-white shadow-md' : 'bg-white hover:border-gray-300 text-gray-700'}
               ${isToday && !isSelected ? 'text-primary font-black bg-primary-50' : ''}
            `}
        >
           {day}
           {hasBookings && !isSelected && <span className="w-1.5 h-1.5 rounded-full bg-urgent mt-1"></span>}
           {hasBookings && isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white mt-1"></span>}
        </button>
     );
  }

  const getStatusIcon = (status: string) => {
    if (status === 'confirmed' || status === 'paid') return <CheckCircle size={14} className="text-green-500" />;
    if (status === 'pending') return <Clock size={14} className="text-yellow-500" />;
    return <XCircle size={14} className="text-red-500" />;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
       <div className="mb-6 flex justify-between items-end shrink-0">
          <div>
             <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><CalendarIcon className="text-primary"/> Operação & Agenda</h1>
             <p className="text-gray-500 text-sm">Controle diário de passageiros, passeios e pontos de embarque.</p>
          </div>
       </div>

       <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
          
          {/* COLUNA ESQUERDA: Navegação do Calendário */}
          <div className="w-full lg:w-[320px] xl:w-[380px] shrink-0 flex flex-col gap-4">
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-6">
                   <button onClick={handlePrevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600"><ChevronLeft/></button>
                   <span className="font-bold text-gray-800">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
                   <button onClick={handleNextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600"><ChevronRight/></button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 mb-2">
                   {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                      <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase">{d}</div>
                   ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                   {calendarGrid}
                </div>
             </div>

             <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 text-sm text-primary-800">
                <p className="font-bold flex items-center gap-2 mb-1"><FileText size={16}/> Resumo do Mês</p>
                <p>Use o calendário para navegar. Dias com uma bolinha laranja possuem atividades agendadas e confirmadas.</p>
             </div>
          </div>

          {/* COLUNA DIREITA: Manifesto do Dia Selecionado */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col min-h-0 overflow-hidden">
             
             {/* Header do Manifesto */}
             <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
                <div>
                   <h2 className="text-xl font-bold text-gray-800">
                      Manifesto do Dia: <span className="text-primary">{selectedDate.toLocaleDateString('pt-BR')}</span>
                   </h2>
                   <p className="text-sm text-gray-500">
                      {loading ? 'Carregando operação...' : `${dayBookings.length} reservas | ${Object.keys(groupedTours).length} passeios diferentes`}
                   </p>
                </div>
                
                <div className="relative w-full md:w-64">
                   <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                   <input
                     placeholder="Buscar cliente ou passeio..."
                     className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary outline-none"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                   />
                </div>
             </div>

             {/* Corpo do Manifesto (Lista Agrupada) */}
             <div className="flex-1 overflow-y-auto p-5 bg-gray-50/30">
                {loading ? (
                   <div className="flex items-center justify-center h-full text-gray-400">Processando informações...</div>
                ) : filteredTours.length === 0 ? (
                   <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <CalendarIcon size={48} className="mb-4 opacity-20" />
                      <p>Nenhum passeio agendado ou encontrado para este dia.</p>
                   </div>
                ) : (
                   <div className="space-y-6">
                      {filteredTours.map(([productName, group], idx) => (
                         <div key={idx} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden animate-fadeIn">
                            
                            {/* Cabeçalho do Passeio */}
                            <div className="bg-secondary p-4 flex justify-between items-center text-white">
                               <h3 className="font-bold text-lg flex items-center gap-2"><MapPin size={18} className="text-urgent"/> {productName}</h3>
                               <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                                  <Users size={14}/> Total: {group.totalPax} pax
                               </span>
                            </div>

                            {/* Tabela de Clientes */}
                            <div className="overflow-x-auto">
                               <table className="w-full text-sm text-left">
                                  <thead className="bg-gray-50 text-gray-500 text-xs border-b border-gray-100">
                                     <tr>
                                        <th className="px-4 py-3 font-medium">Cliente</th>
                                        <th className="px-4 py-3 font-medium text-center">Pax</th>
                                        <th className="px-4 py-3 font-medium">Local de Embarque (Pickup)</th>
                                        <th className="px-4 py-3 font-medium">Contato</th>
                                        <th className="px-4 py-3 font-medium">Status</th>
                                     </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-50">
                                     {group.bookings.map((booking, bIdx) => (
                                        <tr key={bIdx} className="hover:bg-primary-50/30 transition-colors">
                                           <td className="px-4 py-3">
                                              <div className="font-bold text-gray-800">{booking.customer_name}</div>
                                              <div className="text-[10px] text-gray-400 font-mono">#{booking.id.slice(0,6).toUpperCase()}</div>
                                           </td>
                                           <td className="px-4 py-3 text-center font-bold text-gray-700">
                                              {booking.calculatedQty}
                                           </td>

                                           <td className="px-4 py-3 text-gray-600 text-xs">
                                              {booking.pickup || <span className="text-gray-400 italic">Ponto de Encontro</span>}
                                              {booking.notes && <div className="text-[10px] text-orange-500 mt-0.5">{booking.notes}</div>}
                                           </td>
                                           <td className="px-4 py-3">
                                              {booking.customer_whatsapp ? (
                                                <a href={`https://wa.me/${booking.customer_whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-green-600 hover:underline text-xs font-medium">
                                                   <Phone size={12}/> {booking.customer_whatsapp}
                                                </a>
                                              ) : <span className="text-xs text-gray-400">Sem telefone</span>}
                                           </td>
                                           <td className="px-4 py-3">
                                              <div className="flex items-center gap-1">
                                                 {getStatusIcon(booking.status)}
                                                 <span className="text-[10px] uppercase font-bold text-gray-600">{booking.status === 'paid' ? 'PAGO' : booking.status}</span>
                                              </div>
                                           </td>
                                        </tr>
                                     ))}
                                  </tbody>
                               </table>
                            </div>
                         </div>
                      ))}
                   </div>
                )}
             </div>
          </div>
       </div>
    </div>
  );
}
