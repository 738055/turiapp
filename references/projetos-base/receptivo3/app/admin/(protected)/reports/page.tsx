'use client';

import React, { useState } from 'react';
import { createClientComponentClient } from '@/lib/supabaseBrowser';
import { FileText, Download, Filter, BarChart2, PieChart, TrendingUp, Loader2 } from 'lucide-react';
import { pdf, Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

// Estilos para o gerador de PDF
const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica' },
  header: { fontSize: 16, marginBottom: 15, fontWeight: 'bold', color: '#0284c7', textTransform: 'uppercase' },
  subtitle: { fontSize: 10, marginBottom: 20, color: '#666' },
  table: { width: 'auto', borderStyle: 'solid', borderWidth: 1, borderColor: '#e5e7eb', borderRightWidth: 0, borderBottomWidth: 0 },
  tableRow: { margin: 'auto', flexDirection: 'row' },
  tableColHeader: { width: '25%', borderStyle: 'solid', borderWidth: 1, borderColor: '#e5e7eb', borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: '#f8fafc', padding: 5 },
  tableCol: { width: '25%', borderStyle: 'solid', borderWidth: 1, borderColor: '#e5e7eb', borderLeftWidth: 0, borderTopWidth: 0, padding: 5 },
  tableCellHeader: { margin: 'auto', fontSize: 10, fontWeight: 'bold', color: '#333' },
  tableCell: { margin: 'auto', fontSize: 9, color: '#444' }
});

// Componente do PDF Real
const ReportPDF = ({ title, period, columns, data }: any) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>{title}</Text>
      <Text style={styles.subtitle}>Período: {period}</Text>
      
      <View style={styles.table}>
        {/* Cabeçalho da Tabela */}
        <View style={styles.tableRow}>
          {columns.map((col: any, i: number) => (
            <View key={i} style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>{col.label}</Text>
            </View>
          ))}
        </View>
        {/* Linhas de Dados */}
        {data.map((row: any, rowIndex: number) => (
          <View key={rowIndex} style={styles.tableRow}>
            {columns.map((col: any, colIndex: number) => (
              <View key={colIndex} style={styles.tableCol}>
                <Text style={styles.tableCell}>{row[col.key]}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

export default function ReportsPage() {
  const supabase = createClientComponentClient();
  const [dateFilter, setDateFilter] = useState('7days');
  const [loadingReport, setLoadingReport] = useState<number | null>(null);

  const reports = [
    { id: 1, title: 'Vendas por Período', desc: 'Relatório detalhado de faturamento diário, semanal e mensal.', icon: TrendingUp, type: 'finance' },
    { id: 2, title: 'Lista de Passageiros (Rooming List)', desc: 'Lista operacional de clientes e passeios agendados no período.', icon: FileText, type: 'ops' },
    { id: 3, title: 'Cancelamentos e Reembolsos', desc: 'Relação de reservas canceladas no período filtrado.', icon: BarChart2, type: 'ops' },
  ];

  // Helper para definir intervalo de datas do banco de dados
  const getDateRange = () => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (dateFilter === '7days') {
      start.setDate(now.getDate() - 7);
    } else if (dateFilter === 'thisMonth') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (dateFilter === 'lastMonth') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    }
    return { start: start.toISOString(), end: end.toISOString() };
  };

  // Função central para buscar os dados de acordo com o relatório clicado
  const fetchReportData = async (reportId: number) => {
    const { start, end } = getDateRange();
    let data: any[] = [];
    let columns: any[] = [];

    if (reportId === 1) { // VENDAS
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, created_at, customer_name, total, status, payment_method')
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: false });
        
      if (bookings) {
        data = bookings.map(b => ({
          id: b.id.slice(0, 6).toUpperCase(),
          data: new Date(b.created_at).toLocaleDateString('pt-BR'),
          cliente: b.customer_name,
          valor: `R$ ${b.total.toFixed(2)}`,
          status: b.status.toUpperCase(),
          metodo: b.payment_method.toUpperCase()
        }));
        columns = [
          { key: 'data', label: 'Data Venda' },
          { key: 'cliente', label: 'Cliente' },
          { key: 'valor', label: 'Valor Total' },
          { key: 'status', label: 'Status' }
        ];
      }
    } 
    else if (reportId === 2) { // ROOMING LIST / PASSAGEIROS
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, tour_date, customer_name, customer_whatsapp, booking_items(product_title, quantity)')
        .not('tour_date', 'is', null)
        .gte('tour_date', start)
        .lte('tour_date', end)
        .neq('status', 'cancelled')
        .order('tour_date', { ascending: true });

      if (bookings) {
        data = bookings.map(b => ({
          data_passeio: new Date(b.tour_date).toLocaleDateString('pt-BR'),
          cliente: b.customer_name,
          passeio: b.booking_items?.[0]?.product_title || 'Passeio',
          pax: b.booking_items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 1,
          telefone: b.customer_whatsapp || 'N/A'
        }));
        columns = [
          { key: 'data_passeio', label: 'Data Passeio' },
          { key: 'cliente', label: 'Cliente' },
          { key: 'passeio', label: 'Passeio' },
          { key: 'pax', label: 'Qtd (PAX)' }
        ];
      }
    }
    else if (reportId === 3) { // CANCELAMENTOS
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, created_at, customer_name, total')
        .eq('status', 'cancelled')
        .gte('created_at', start)
        .lte('created_at', end);

      if (bookings) {
        data = bookings.map(b => ({
          id: b.id.slice(0, 6).toUpperCase(),
          data: new Date(b.created_at).toLocaleDateString('pt-BR'),
          cliente: b.customer_name,
          valor: `R$ ${b.total.toFixed(2)}`
        }));
        columns = [
          { key: 'id', label: 'Ref' },
          { key: 'data', label: 'Data Canc.' },
          { key: 'cliente', label: 'Cliente' },
          { key: 'valor', label: 'Valor Estorno' }
        ];
      }
    }

    return { data, columns };
  };

  // Gerador de PDF
  const handleDownloadPDF = async (report: any) => {
    setLoadingReport(report.id);
    try {
      const { data, columns } = await fetchReportData(report.id);
      
      if (data.length === 0) {
         alert('Nenhum dado encontrado para o período selecionado.');
         setLoadingReport(null);
         return;
      }

      // Constrói o componente PDF e converte para Blob
      const blob = await pdf(<ReportPDF title={report.title} period={dateFilter} columns={columns} data={data} />).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Relatorio_${report.title.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert('Erro ao gerar PDF.');
    } finally {
      setLoadingReport(null);
    }
  };

  // Gerador de CSV (Excel)
  const handleDownloadExcel = async (report: any) => {
    setLoadingReport(report.id);
    try {
      const { data, columns } = await fetchReportData(report.id);
      
      if (data.length === 0) {
         alert('Nenhum dado encontrado para o período selecionado.');
         setLoadingReport(null);
         return;
      }

      // Monta cabeçalho CSV
      let csvContent = '\uFEFF'; // BOM para o Excel ler acentos em UTF-8 corretamente
      csvContent += columns.map(c => c.label).join(';') + '\n';
      
      // Monta linhas CSV
      data.forEach(row => {
         const rowData = columns.map(c => `"${row[c.key] || ''}"`).join(';');
         csvContent += rowData + '\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Relatorio_${report.title.replace(/\s+/g, '_')}_${new Date().getTime()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert('Erro ao gerar Excel.');
    } finally {
      setLoadingReport(null);
    }
  };

  return (
    <>
      <div className="mb-8">
         <h1 className="text-2xl font-bold text-gray-800">Central de Relatórios</h1>
         <p className="text-gray-500">Exporte dados estratégicos reais para análise contábil e operacional.</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row gap-4 items-center">
         <div className="flex items-center gap-2 text-gray-600 font-bold">
            <Filter size={20}/> Filtros do Banco de Dados:
         </div>
         <div className="flex gap-2 w-full md:w-auto">
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 bg-gray-50 text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
            >
               <option value="7days">Últimos 7 dias</option>
               <option value="thisMonth">Este Mês</option>
               <option value="lastMonth">Mês Passado</option>
            </select>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {reports.map((report) => (
            <div key={report.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow group flex flex-col h-full relative">
               
               {loadingReport === report.id && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-xl">
                     <Loader2 className="animate-spin text-primary mb-2" size={32}/>
                     <span className="text-sm font-bold text-gray-600">Buscando dados...</span>
                  </div>
               )}

               <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${report.type === 'finance' ? 'bg-green-100 text-green-600' : 'bg-primary-100 text-primary-600'}`}>
                  <report.icon size={24} />
               </div>
               <h3 className="font-bold text-lg text-gray-800 mb-2 group-hover:text-primary transition-colors">{report.title}</h3>
               <p className="text-sm text-gray-500 mb-6 flex-1">{report.desc}</p>
               
               <div className="flex gap-2 border-t border-gray-100 pt-4 mt-auto">
                  <button 
                    onClick={() => handleDownloadPDF(report)} 
                    disabled={loadingReport !== null}
                    className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors border border-gray-200"
                  >
                     <FileText size={16}/> PDF
                  </button>
                  <button 
                    onClick={() => handleDownloadExcel(report)}
                    disabled={loadingReport !== null}
                    className="flex-1 bg-primary-50 hover:bg-primary-100 text-primary-700 font-bold py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors border border-primary-200"
                  >
                     <Download size={16}/> Excel CSV
                  </button>
               </div>
            </div>
         ))}
      </div>
    </>
  );
}
