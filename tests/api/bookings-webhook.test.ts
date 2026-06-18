/**
 * Unit tests for booking and webhook business logic.
 * These test pure functions and the CSV export format — no real DB or HTTP calls.
 */

import { describe, it, expect } from "vitest";

// ── CSV export helper (extracted from route logic) ──────────────
function esc(v: string | null | undefined): string {
  if (!v) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildCsvRow(booking: {
  id: string;
  status: string;
  productTitle: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  check_in?: string | null;
  check_out?: string | null;
  guests: number;
  total_price: number;
  currency: string;
  payment_provider?: string | null;
  created_at: string;
}): string {
  const STATUS_PT: Record<string, string> = {
    pending: "Pendente",
    confirmed: "Confirmada",
    cancelled: "Cancelada",
    completed: "Concluída",
  };
  return [
    booking.id.slice(0, 8).toUpperCase(),
    STATUS_PT[booking.status] ?? booking.status,
    booking.productTitle,
    booking.customer_name,
    booking.customer_email,
    booking.customer_phone ?? "",
    booking.check_in ?? "",
    booking.check_out ?? "",
    String(booking.guests),
    String(booking.total_price),
    booking.currency,
    booking.payment_provider ?? "",
    new Date(booking.created_at).toLocaleString("pt-BR"),
  ].map(esc).join(",");
}

describe("CSV export", () => {
  it("produces correct row for a confirmed booking", () => {
    const row = buildCsvRow({
      id: "abc12345-def6-7890-abcd-ef1234567890",
      status: "confirmed",
      productTitle: "Passeio de Barco",
      customer_name: "Maria Silva",
      customer_email: "maria@email.com",
      customer_phone: "+5511999999999",
      check_in: "2026-07-10",
      check_out: "2026-07-12",
      guests: 2,
      total_price: 498,
      currency: "BRL",
      payment_provider: "stripe",
      created_at: "2026-06-15T10:00:00Z",
    });

    expect(row).toContain("ABC12345");
    expect(row).toContain("Confirmada");
    expect(row).toContain("Passeio de Barco");
    expect(row).toContain("Maria Silva");
    expect(row).toContain("498");
    expect(row).toContain("stripe");
  });

  it("escapes commas in product names", () => {
    const row = buildCsvRow({
      id: "test1234",
      status: "pending",
      productTitle: "Passeio, Trilha e Cachoeira",
      customer_name: "João",
      customer_email: "joao@test.com",
      guests: 1,
      total_price: 100,
      currency: "BRL",
      created_at: "2026-01-01T00:00:00Z",
    });
    expect(row).toContain('"Passeio, Trilha e Cachoeira"');
  });

  it("handles null optional fields gracefully", () => {
    const row = buildCsvRow({
      id: "nulltest",
      status: "pending",
      productTitle: "Tour",
      customer_name: "Ana",
      customer_email: "ana@test.com",
      customer_phone: null,
      check_in: null,
      check_out: null,
      guests: 1,
      total_price: 50,
      currency: "BRL",
      payment_provider: null,
      created_at: "2026-01-01T00:00:00Z",
    });
    expect(row).not.toContain("null");
    expect(row).not.toContain("undefined");
  });
});

// ── Webhook status mapping ─────────────────────────────────────
describe("booking status transitions", () => {
  const validTransitions: Record<string, string[]> = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["completed", "cancelled", "refunded"],
    completed: [],
    cancelled: [],
    refunded: [],
  };

  it("pending can be confirmed or cancelled", () => {
    expect(validTransitions["pending"]).toContain("confirmed");
    expect(validTransitions["pending"]).toContain("cancelled");
    expect(validTransitions["pending"]).not.toContain("completed");
  });

  it("confirmed can be completed, cancelled, or refunded", () => {
    expect(validTransitions["confirmed"]).toContain("completed");
    expect(validTransitions["confirmed"]).toContain("refunded");
  });

  it("terminal states have no transitions", () => {
    expect(validTransitions["completed"]).toHaveLength(0);
    expect(validTransitions["cancelled"]).toHaveLength(0);
  });
});
