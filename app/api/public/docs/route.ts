export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

const paginationParams = [
  { name: "page", in: "query", schema: { type: "integer", default: 1 } },
  { name: "per_page", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
];

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "TuriApp Public API",
    version: "1.0.0",
    description:
      "API pública para integração com a loja da empresa. Autentique com `Authorization: Bearer {sua_chave}`. Limite: 500 requisições/hora por chave.",
  },
  servers: [{ url: "/api/public" }],
  components: {
    securitySchemes: {
      ApiKeyAuth: { type: "http", scheme: "bearer" },
    },
    schemas: {
      Product: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          module: { type: "string", enum: ["hospedagem", "receptivo", "emissivo"] },
          type: { type: "string" },
          title: { type: "string" },
          slug: { type: "string" },
          description: { type: "string" },
          images: { type: "array", items: { type: "string" } },
          sale_mode: { type: "string", enum: ["booking", "whatsapp"] },
          created_at: { type: "string", format: "date-time" },
        },
      },
      Customer: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          phone: { type: "string", nullable: true },
          created_at: { type: "string", format: "date-time" },
        },
      },
      Booking: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          product_id: { type: "string", format: "uuid" },
          customer_name: { type: "string" },
          customer_email: { type: "string", format: "email" },
          customer_phone: { type: "string", nullable: true },
          check_in: { type: "string", format: "date", nullable: true },
          check_out: { type: "string", format: "date", nullable: true },
          guests: { type: "integer" },
          total_price: { type: "number" },
          currency: { type: "string" },
          status: { type: "string", enum: ["pending", "confirmed", "cancelled", "refunded", "completed"] },
          created_at: { type: "string", format: "date-time" },
        },
      },
      BookingCreate: {
        type: "object",
        required: ["product_id", "rate_id", "customer_name", "customer_email", "total_amount"],
        properties: {
          product_id: { type: "string", format: "uuid" },
          rate_id: { type: "string", format: "uuid" },
          checkin: { type: "string", format: "date", nullable: true },
          checkout: { type: "string", format: "date", nullable: true },
          guests: { type: "integer", default: 1 },
          customer_name: { type: "string" },
          customer_email: { type: "string", format: "email" },
          customer_phone: { type: "string" },
          total_amount: { type: "number" },
          currency: { type: "string", default: "BRL" },
        },
      },
    },
  },
  security: [{ ApiKeyAuth: [] }],
  paths: {
    "/products": {
      get: {
        summary: "Listar produtos publicados",
        parameters: [
          ...paginationParams,
          { name: "module", in: "query", schema: { type: "string", enum: ["hospedagem", "receptivo", "emissivo"] } },
        ],
        responses: {
          "200": {
            description: "Lista de produtos",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/Product" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/customers": {
      get: {
        summary: "Listar clientes",
        parameters: paginationParams,
        responses: {
          "200": {
            description: "Lista de clientes",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/Customer" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/bookings": {
      get: {
        summary: "Listar reservas",
        parameters: [
          ...paginationParams,
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "from", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "to", in: "query", schema: { type: "string", format: "date-time" } },
        ],
        responses: {
          "200": {
            description: "Lista de reservas",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/Booking" } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Criar reserva programaticamente",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/BookingCreate" } } },
        },
        responses: {
          "201": { description: "Reserva criada" },
          "400": { description: "Dados inválidos" },
          "404": { description: "Produto não encontrado" },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(openApiSpec);
}
