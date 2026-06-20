'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PublicLayout } from '@/components/Layout/PublicLayout';
import { MapPin, Ticket, Download, Search, AlertCircle, CheckCircle, XCircle, Loader, LogOut } from 'lucide-react';
import Link from 'next/link';
import { createClientComponentClient } from '@/lib/supabaseBrowser';
import { pdf } from '@react-pdf/renderer';
import { VoucherTemplate } from '@/components/PDF/VoucherTemplate';
import { Booking } from '@/app/types';

export default function MyBookingsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Proteção de Rota: Se não tem usuário, joga pro login
        router.push('/login');
        return;
      }
      
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id) 
        .order('tour_date', { ascending: false });

      if (!error && data) {
        const formattedBookings = data.map(b => ({
            ...b,
            productName: b.product_name,
            customerName: b.customer_name,
            total: b.total,
            date: b.tour_date || b.created_at,
            quantity: b.adults + (b.children || 0), // Assumindo que você salva adults e children
        })) as unknown as Booking[];
        setMyBookings(formattedBookings);
      }
      setLoading(false);
    };

    fetchBookings();
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Função mágica que gera e baixa o PDF no lado do cliente
  const handleDownloadVoucher = async (booking: any) => {
    try {
      setDownloadingId(booking.id);
      
      // Mapeia os dados da reserva para as props que o VoucherTemplate espera
      const voucherData = {
        id: booking.id,
        customerName: booking.customerName || 'Cliente',
        productName: booking.productName || 'Passeio',
        date: booking.date,
        time: booking.time,
        quantity: booking.quantity || 1,
        total: booking.total,
      };

      // Gera o Blob do PDF
      const blob = await pdf(<VoucherTemplate booking={voucherData} />).toBlob();
      
      // Cria um link temporário para download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Voucher-${booking.productName.replace(/\s+/g, '-')}-${booking.id.slice(0,6)}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Limpeza
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao gerar voucher:', error);
      alert('Não foi possível gerar o voucher neste momento.');
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'paid':
      case 'confirmed': 
        return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle size={12}/> Confirmada</span>;
      case 'pending': 
        return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><AlertCircle size={12}/> Pendente</span>;
      case 'cancelled': 
        return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><XCircle size={12}/> Cancelada</span>;
      default: return null;
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="p-12 text-center text-gray-500 flex flex-col items-center">
           <Loader size={48} className="mx-auto mb-4 opacity-50 animate-spin"/>
           <p>A carregar as suas reservas...</p>
        </div>
      );
    }
    
    if (myBookings.length === 0) {
      return (
        <div className="p-12 text-center text-gray-500">
           <Ticket size={48} className="mx-auto mb-4 opacity-20"/>
           <p>Nenhuma reserva encontrada.</p>
           <Link href="/" className="text-primary font-bold mt-4 inline-block hover:underline">Explorar Passeios</Link>
        </div>
      );
    }

    return myBookings.map((booking: any) => (
      <div key={booking.id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col md:flex-row gap-6 items-center">
         <div className="flex flex-col items-center justify-center bg-gray-100 rounded-xl w-full md:w-24 h-24 shrink-0">
            <span className="text-xs font-bold text-gray-500 uppercase">{new Date(booking.date).toLocaleString('pt-BR', { month: 'short' })}</span>
            <span className="text-3xl font-black text-gray-800">{new Date(booking.date).getDate()}</span>
            <span className="text-xs text-gray-500">{new Date(booking.date).getFullYear()}</span>
         </div>
         <div className="flex-1 w-full text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2 justify-center md:justify-start">
               <h3 className="font-bold text-lg text-gray-800">{booking.productName}</h3>
               {getStatusBadge(booking.status)}
            </div>
            <div className="flex flex-col md:flex-row gap-4 text-sm text-gray-500 justify-center md:justify-start">
               <span className="flex items-center gap-1 justify-center md:justify-start"><Ticket size={16}/> Pedido #{booking.id.slice(0,8).toUpperCase()}</span>
               <span className="flex items-center gap-1 justify-center md:justify-start"><MapPin size={16}/> Foz do Iguaçu</span>
            </div>
         </div>
         <div className="flex flex-col gap-2 w-full md:w-auto">
            <span className="text-lg font-black text-gray-800 text-center md:text-right block mb-1">
              {Number(booking.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
            {/* Botão de Download do Voucher */}
            {(booking.status === 'confirmed' || booking.status === 'paid') && (
              <button 
                onClick={() => handleDownloadVoucher(booking)}
                disabled={downloadingId === booking.id}
                className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
              >
                 {downloadingId === booking.id ? <Loader className="animate-spin" size={18}/> : <Download size={18}/>}
                 {downloadingId === booking.id ? 'Gerando...' : 'Voucher'}
              </button>
            )}
            <Link href={`/tours/${booking.productName?.toLowerCase().replace(/ /g, '-') || ''}`} className="text-primary text-sm font-bold text-center hover:underline mt-1">
               Ver Passeio
            </Link>
         </div>
      </div>
    ));
  };


  return (
    <PublicLayout>
      <div className="bg-gray-50 min-h-screen pb-12">
        <div className="bg-secondary text-white py-12 relative">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Minhas Reservas</h1>
              <p className="opacity-80">Gerencie seus passeios e baixe seus vouchers.</p>
            </div>
            {/* Botão de Sair */}
            {!loading && (
              <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 hover:text-red-300 font-bold bg-white/10 px-4 py-2 rounded-lg transition-colors">
                <LogOut size={18} /> Sair
              </button>
            )}
          </div>
        </div>
        <div className="container mx-auto px-4 -mt-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden min-h-[400px]">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="Buscar por passeio ou número..." 
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-gray-50"
                  />
               </div>
            </div>
            <div className="divide-y divide-gray-100">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
