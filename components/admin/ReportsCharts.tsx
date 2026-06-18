import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RevenueTrendPoint } from "@/lib/reports/data";

interface ReportsChartsProps {
  trend: RevenueTrendPoint[];
  topProducts: { title: string; revenue: number; bookings: number }[];
  currency: string;
  primaryColor: string;
}

// Pure server-rendered charts (CSS bars, no chart library, no client JS) — keeps
// the bundle small and avoids SSR-blocking hydration. Bars are sized as a
// percentage of the largest value in each series.
export function ReportsCharts({ trend, topProducts, currency, primaryColor }: ReportsChartsProps) {
  const maxRevenue = Math.max(1, ...trend.map((t) => t.revenue));
  const maxProduct = Math.max(1, ...topProducts.map((p) => p.revenue));
  const hasTrend = trend.some((t) => t.revenue > 0 || t.bookings > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Revenue by month — vertical bars */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Receita por mês</CardTitle>
        </CardHeader>
        <CardContent>
          {hasTrend ? (
            <div className="flex items-end justify-between gap-2 h-44">
              {trend.map((t) => (
                <div key={t.month} className="flex flex-1 flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[10px] font-medium text-gray-500">
                    {t.revenue > 0 ? formatCurrency(t.revenue, currency).replace(/\s/g, "") : ""}
                  </span>
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{
                      height: `${Math.max(2, (t.revenue / maxRevenue) * 100)}%`,
                      backgroundColor: primaryColor,
                      opacity: t.revenue > 0 ? 1 : 0.15,
                    }}
                    title={formatCurrency(t.revenue, currency)}
                  />
                  <span className="text-[11px] text-gray-400">{t.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-12">Sem receita confirmada nos últimos meses ainda.</p>
          )}
        </CardContent>
      </Card>

      {/* Bookings by month — vertical bars */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reservas confirmadas por mês</CardTitle>
        </CardHeader>
        <CardContent>
          {hasTrend ? (
            <div className="flex items-end justify-between gap-2 h-44">
              {trend.map((t) => {
                const maxBookings = Math.max(1, ...trend.map((x) => x.bookings));
                return (
                  <div key={t.month} className="flex flex-1 flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] font-medium text-gray-500">{t.bookings > 0 ? t.bookings : ""}</span>
                    <div
                      className="w-full rounded-t-md bg-emerald-500 transition-all"
                      style={{
                        height: `${Math.max(2, (t.bookings / maxBookings) * 100)}%`,
                        opacity: t.bookings > 0 ? 1 : 0.15,
                      }}
                      title={`${t.bookings} reservas`}
                    />
                    <span className="text-[11px] text-gray-400">{t.label}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-12">Sem reservas confirmadas nos últimos meses ainda.</p>
          )}
        </CardContent>
      </Card>

      {/* Top products — horizontal bars */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Produtos com maior receita (este mês)</CardTitle>
        </CardHeader>
        <CardContent>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((p) => (
                <div key={p.title} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700 truncate pr-3">{p.title}</span>
                    <span className="text-gray-500 flex-shrink-0">
                      {formatCurrency(p.revenue, currency)} · {p.bookings} {p.bookings === 1 ? "reserva" : "reservas"}
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(p.revenue / maxProduct) * 100}%`, backgroundColor: primaryColor }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Nenhuma venda confirmada neste mês ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
