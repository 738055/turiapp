import { describe, it, expect } from "vitest";
import { renderVoucherHtml, renderBookingNotificationHtml } from "@/lib/email/resend";

const voucherData = {
  bookingId: "abc12345-def6-7890-ghij-klmnopqrstuv",
  productTitle: "Passeio de Barco Pôr do Sol",
  customerName: "Maria Silva",
  checkinDate: "2026-07-10",
  checkoutDate: "2026-07-12",
  guests: 2,
  totalPrice: 498.0,
  currency: "BRL",
  tenantName: "Bolinha Tur",
  primaryColor: "#0ea5e9",
};

describe("renderVoucherHtml", () => {
  it("contains customer name", () => {
    const html = renderVoucherHtml(voucherData);
    expect(html).toContain("Maria Silva");
  });

  it("contains booking code (first 8 chars uppercased)", () => {
    const html = renderVoucherHtml(voucherData);
    expect(html).toContain("ABC12345");
  });

  it("contains product title", () => {
    const html = renderVoucherHtml(voucherData);
    expect(html).toContain("Passeio de Barco Pôr do Sol");
  });

  it("contains formatted price", () => {
    const html = renderVoucherHtml(voucherData);
    expect(html).toContain("498");
  });

  it("uses primary color in header", () => {
    const html = renderVoucherHtml(voucherData);
    expect(html).toContain("#0ea5e9");
  });

  it("omits check-in/out rows when dates are null", () => {
    const html = renderVoucherHtml({ ...voucherData, checkinDate: null, checkoutDate: null });
    expect(html).not.toContain("Check-in");
  });
});

describe("renderBookingNotificationHtml", () => {
  const notifData = {
    bookingId: "abc12345-def6-7890-ghij-klmnopqrstuv",
    productTitle: "Passeio de Barco Pôr do Sol",
    customerName: "Maria Silva",
    customerEmail: "maria@email.com",
    customerPhone: "+5511999999999",
    checkinDate: "2026-07-10",
    checkoutDate: null,
    guests: 2,
    totalPrice: 498.0,
    currency: "BRL",
    tenantName: "Bolinha Tur",
    primaryColor: "#0ea5e9",
    adminUrl: "https://app.turiapp.com.br/reservas/abc12345",
  };

  it("contains customer email", () => {
    expect(renderBookingNotificationHtml(notifData)).toContain("maria@email.com");
  });

  it("contains admin URL link", () => {
    const html = renderBookingNotificationHtml(notifData);
    expect(html).toContain("https://app.turiapp.com.br/reservas/abc12345");
  });

  it("contains phone when provided", () => {
    expect(renderBookingNotificationHtml(notifData)).toContain("+5511999999999");
  });

  it("omits phone row when not provided", () => {
    const html = renderBookingNotificationHtml({ ...notifData, customerPhone: undefined });
    expect(html).not.toContain("Telefone");
  });
});
