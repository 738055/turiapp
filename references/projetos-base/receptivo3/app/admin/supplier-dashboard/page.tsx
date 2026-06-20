'use client';

import { createClientComponentClient } from '@/lib/supabaseBrowser';
import { useEffect, useState } from 'react';

export default function SupplierDashboard() {
  const supabase = createClientComponentClient();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      // Ajustado para buscar os itens da reserva em vez de tentar um JOIN inexistente com customers/products
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          booking_items (
            product_title,
            quantity
          )
        `)
        .order('created_at', { ascending: false }); // Usando created_at para ordenação garantida

      if (error) {
        console.error('Erro ao buscar reservas:', error);
      } else {
        setBookings(data || []);
      }
      setLoading(false);
    };

    fetchBookings();
  }, [supabase]);

  if (loading) {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Painel do Fornecedor</h1>
            <p>Carregando as suas reservas...</p>
        </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Painel do Fornecedor</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b">
          <h2 className="font-bold">Minhas Próximas Reservas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Produto</th>
                <th scope="col" className="px-6 py-3">Data</th>
                <th scope="col" className="px-6 py-3">Cliente</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3 text-right">Qtd</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length > 0 ? bookings.map(booking => {
                // Calcula a quantidade total de itens desta reserva
                const totalQuantity = booking.booking_items?.reduce(
                    (acc: number, item: any) => acc + (item.quantity || 0), 0
                ) || 1;

                // Pega o nome do primeiro produto
                const productName = booking.booking_items?.[0]?.product_title || 'Reserva Padrão';

                return (
                  <tr key={booking.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      {productName}
                    </td>
                    <td className="px-6 py-4">
                        {booking.tour_date ? new Date(booking.tour_date).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-6 py-4">
                        {booking.customer_name || 'Sem nome'} <br/>
                        <span className="text-xs text-gray-400">{booking.customer_email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          booking.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {booking.status === 'paid' ? 'Confirmada' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold">{totalQuantity}</td>
                  </tr>
                );
              }) : (
                 <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                       Nenhuma reserva encontrada.
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
