import { Document, Page, Text, View, StyleSheet, Image, Svg, Rect } from "@react-pdf/renderer";
import type { MonthlyReportData } from "./data";
import { STATUS_LABEL } from "./data";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#111827" },
  coverPage: { padding: 0, fontFamily: "Helvetica" },
  coverBand: { height: 240, alignItems: "center", justifyContent: "center" },
  coverLogo: { width: 64, height: 64, marginBottom: 16, borderRadius: 8 },
  coverTitle: { fontSize: 24, color: "#ffffff", fontWeight: 700 },
  coverSubtitle: { fontSize: 13, color: "#ffffff", opacity: 0.85, marginTop: 6 },
  coverMonth: { fontSize: 18, marginTop: 80, textAlign: "center", color: "#111827", fontWeight: 700 },
  sectionTitle: { fontSize: 14, fontWeight: 700, marginBottom: 12 },
  statsGrid: { flexDirection: "row", gap: 10, marginBottom: 24 },
  statBox: { flex: 1, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 6, padding: 12 },
  statLabel: { fontSize: 8, color: "#6b7280", marginBottom: 4 },
  statValue: { fontSize: 14, fontWeight: 700 },
  chartLabel: { fontSize: 7, color: "#6b7280", textAlign: "center" },
  table: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 4 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  tableRowHeader: { flexDirection: "row", backgroundColor: "#f9fafb" },
  th: { fontSize: 8, fontWeight: 700, color: "#6b7280", padding: 6 },
  td: { fontSize: 8, color: "#111827", padding: 6 },
  colDate: { width: "16%" },
  colProduct: { width: "28%" },
  colCustomer: { width: "26%" },
  colStatus: { width: "16%" },
  colValue: { width: "14%", textAlign: "right" },
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

function formatMonthLabel(month: string) {
  const [year, mon] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, mon - 1, 1));
  const label = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function Footer() {
  return <Text style={styles.footer}>Powered by TuriApp</Text>;
}

function WeeklyBarChart({ data, color }: { data: { label: string; revenue: number }[]; color: string }) {
  const width = 500;
  const height = 140;
  const max = Math.max(1, ...data.map((d) => d.revenue));
  const slot = width / data.length;
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

export function MonthlyReportDocument({ data }: { data: MonthlyReportData }) {
  const monthLabel = formatMonthLabel(data.month);

  return (
    <Document title={`Relatório Mensal — ${data.tenantName} — ${monthLabel}`}>
      <Page size="A4" style={styles.coverPage}>
        <View style={[styles.coverBand, { backgroundColor: data.primaryColor }]}>
          {data.logoUrl && <Image src={data.logoUrl} style={styles.coverLogo} />}
          <Text style={styles.coverTitle}>{data.tenantName}</Text>
          <Text style={styles.coverSubtitle}>Relatório mensal de desempenho</Text>
        </View>
        <Text style={styles.coverMonth}>{monthLabel}</Text>
        <Footer />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Resumo executivo</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>RECEITA DO MÊS</Text>
            <Text style={styles.statValue}>{formatMoney(data.revenue, data.currency)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>RESERVAS CONFIRMADAS</Text>
            <Text style={styles.statValue}>{data.bookingsCount}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>NOVOS CLIENTES</Text>
            <Text style={styles.statValue}>{data.newCustomers}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>TICKET MÉDIO</Text>
            <Text style={styles.statValue}>{formatMoney(data.avgTicket, data.currency)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Receita por semana</Text>
        <WeeklyBarChart data={data.weeklyRevenue} color={data.primaryColor} />

        <View style={{ marginTop: 32 }}>
          <Text style={styles.sectionTitle}>Top 5 produtos por receita</Text>
          {data.topProducts.length === 0 ? (
            <Text style={styles.emptyState}>Nenhuma venda registrada no período.</Text>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableRowHeader}>
                <Text style={[styles.th, { width: "50%" }]}>Produto</Text>
                <Text style={[styles.th, { width: "25%", textAlign: "right" }]}>Reservas</Text>
                <Text style={[styles.th, { width: "25%", textAlign: "right" }]}>Receita</Text>
              </View>
              {data.topProducts.map((p) => (
                <View key={p.title} style={styles.tableRow}>
                  <Text style={[styles.td, { width: "50%" }]}>{p.title}</Text>
                  <Text style={[styles.td, { width: "25%", textAlign: "right" }]}>{p.bookings}</Text>
                  <Text style={[styles.td, { width: "25%", textAlign: "right" }]}>
                    {formatMoney(p.revenue, data.currency)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <Footer />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Reservas do período</Text>
        {data.bookings.length === 0 ? (
          <Text style={styles.emptyState}>Nenhuma reserva registrada no período.</Text>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableRowHeader}>
              <Text style={[styles.th, styles.colDate]}>Data</Text>
              <Text style={[styles.th, styles.colProduct]}>Produto</Text>
              <Text style={[styles.th, styles.colCustomer]}>Cliente</Text>
              <Text style={[styles.th, styles.colStatus]}>Status</Text>
              <Text style={[styles.th, styles.colValue]}>Valor</Text>
            </View>
            {data.bookings.map((b) => (
              <View key={b.id} style={styles.tableRow}>
                <Text style={[styles.td, styles.colDate]}>
                  {new Date(b.createdAt).toLocaleDateString("pt-BR")}
                </Text>
                <Text style={[styles.td, styles.colProduct]}>{b.productTitle}</Text>
                <Text style={[styles.td, styles.colCustomer]}>{b.customerName}</Text>
                <Text style={[styles.td, styles.colStatus]}>{STATUS_LABEL[b.status] ?? b.status}</Text>
                <Text style={[styles.td, styles.colValue]}>{formatMoney(b.totalPrice, data.currency)}</Text>
              </View>
            ))}
          </View>
        )}
        <Footer />
      </Page>
    </Document>
  );
}
