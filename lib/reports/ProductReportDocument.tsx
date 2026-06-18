import { Document, Page, Text, View, StyleSheet, Image, Svg, Rect } from "@react-pdf/renderer";
import type { ProductReportData } from "./data";
import { STATUS_LABEL } from "./data";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#111827" },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 24, gap: 12 },
  logo: { width: 40, height: 40, borderRadius: 6 },
  tenantName: { fontSize: 11, color: "#6b7280" },
  title: { fontSize: 18, fontWeight: 700, marginTop: 2 },
  sectionTitle: { fontSize: 14, fontWeight: 700, marginBottom: 12, marginTop: 20 },
  statsGrid: { flexDirection: "row", gap: 10, marginBottom: 8 },
  statBox: { flex: 1, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 6, padding: 12 },
  statLabel: { fontSize: 8, color: "#6b7280", marginBottom: 4 },
  statValue: { fontSize: 14, fontWeight: 700 },
  chartLabel: { fontSize: 7, color: "#6b7280", textAlign: "center" },
  table: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 4 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  tableRowHeader: { flexDirection: "row", backgroundColor: "#f9fafb" },
  th: { fontSize: 8, fontWeight: 700, color: "#6b7280", padding: 6 },
  td: { fontSize: 8, color: "#111827", padding: 6 },
  colDate: { width: "20%" },
  colCustomer: { width: "40%" },
  colStatus: { width: "20%" },
  colValue: { width: "20%", textAlign: "right" },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#cbd5e1",
  },
  emptyState: { fontSize: 9, color: "#9ca3af", textAlign: "center", padding: 16 },
});

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(value);
}

function MonthlyBarChart({ data, color }: { data: { label: string; revenue: number }[]; color: string }) {
  const width = 500;
  const height = 140;
  const max = Math.max(1, ...data.map((d) => d.revenue));
  const slot = width / Math.max(1, data.length);
  const barWidth = slot - 20;

  return (
    <View>
      <Svg width={width} height={height}>
        {data.map((d, i) => {
          const barHeight = (d.revenue / max) * (height - 10);
          const x = i * slot + 10;
          const y = height - 10 - barHeight;
          return <Rect key={d.label} x={x} y={y} width={barWidth} height={Math.max(2, barHeight)} fill={color} rx={2} />;
        })}
      </Svg>
      <View style={{ flexDirection: "row", marginTop: 4 }}>
        {data.map((d) => (
          <Text key={d.label} style={[styles.chartLabel, { width: slot }]}>
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function ProductReportDocument({ data }: { data: ProductReportData }) {
  return (
    <Document title={`Relatório de produto — ${data.productTitle}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {data.logoUrl && <Image src={data.logoUrl} style={styles.logo} />}
          <View>
            <Text style={styles.tenantName}>{data.tenantName}</Text>
            <Text style={styles.title}>{data.productTitle}</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>RECEITA TOTAL</Text>
            <Text style={styles.statValue}>{formatMoney(data.totalRevenue, data.currency)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>RESERVAS CONFIRMADAS</Text>
            <Text style={styles.statValue}>{data.totalBookings}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>TICKET MÉDIO</Text>
            <Text style={styles.statValue}>{formatMoney(data.avgTicket, data.currency)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Receita por mês (últimos 6 meses)</Text>
        {data.monthlyRevenue.length === 0 ? (
          <Text style={styles.emptyState}>Sem dados suficientes para o gráfico.</Text>
        ) : (
          <MonthlyBarChart data={data.monthlyRevenue} color={data.primaryColor} />
        )}

        <Text style={styles.sectionTitle}>Histórico de reservas</Text>
        {data.bookings.length === 0 ? (
          <Text style={styles.emptyState}>Nenhuma reserva registrada para este produto.</Text>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableRowHeader}>
              <Text style={[styles.th, styles.colDate]}>Data</Text>
              <Text style={[styles.th, styles.colCustomer]}>Cliente</Text>
              <Text style={[styles.th, styles.colStatus]}>Status</Text>
              <Text style={[styles.th, styles.colValue]}>Valor</Text>
            </View>
            {data.bookings.map((b) => (
              <View key={b.id} style={styles.tableRow}>
                <Text style={[styles.td, styles.colDate]}>
                  {new Date(b.createdAt).toLocaleDateString("pt-BR")}
                </Text>
                <Text style={[styles.td, styles.colCustomer]}>{b.customerName}</Text>
                <Text style={[styles.td, styles.colStatus]}>{STATUS_LABEL[b.status] ?? b.status}</Text>
                <Text style={[styles.td, styles.colValue]}>{formatMoney(b.totalPrice, data.currency)}</Text>
              </View>
            ))}
          </View>
        )}
        <Text style={styles.footer}>Powered by TuriApp</Text>
      </Page>
    </Document>
  );
}
