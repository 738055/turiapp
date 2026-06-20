export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import { getPlanLimits, featureAllowed } from "@/lib/plans/limits";

const rateSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  price: z.number().min(0),
  rate_type: z.enum(["fixed", "per_person", "per_night", "per_group"]),
  valid_from: z.string().optional(),
  valid_to: z.string().optional(),
  season_name: z.string().optional(),
  occupancy_min: z.number().min(1).default(1),
  occupancy_max: z.number().min(1).default(99),
});

const schema = z.object({
  tenant_id: z.string().uuid(),
  product_id: z.string().uuid().optional(),
  mode: z.enum(["create", "edit"]),
  module: z.enum(["hospedagem", "receptivo", "emissivo"]),
  type: z.string().min(1),
  title: z.string().min(2).max(200),
  slug: z.string().min(1).max(100),
  description: z.string().max(5000).default(""),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  sale_mode: z.enum(["booking", "whatsapp"]),
  whatsapp_number: z.string().optional(),
  seo_title: z.string().max(200).optional(),
  seo_description: z.string().max(500).optional(),
  images: z.array(z.string().url()).max(8).default([]),
  extra_data: z.record(z.string(), z.unknown()).default({}),
  rates: z.array(rateSchema).default([]),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos.", details: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const service = createServiceClient();

  if (d.sale_mode === "booking") {
    if (!d.rates.length) {
      return NextResponse.json({ error: "Adicione pelo menos uma tarifa para vender com reserva online." }, { status: 400 });
    }
    if (d.rates.some((rate) => rate.price <= 0)) {
      return NextResponse.json({ error: "Toda tarifa de reserva online precisa ter preco maior que zero." }, { status: 400 });
    }
  }

  // Verify user is member of this tenant
  const { data: membership } = await service
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", d.tenant_id)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  // Plan gate: the online booking engine (sale_mode "booking") requires a plan
  // that includes it. The Básico plan is WhatsApp-only — products still get
  // created, just in WhatsApp mode. A product already in booking mode (e.g.
  // created during the trial) may keep it after a downgrade; only NEW booking
  // activations are blocked.
  if (d.sale_mode === "booking") {
    const limits = await getPlanLimits(service, d.tenant_id);
    if (!featureAllowed(limits, "booking_engine")) {
      let alreadyBooking = false;
      if (d.mode === "edit" && d.product_id) {
        const { data: existing } = await service
          .from("products")
          .select("sale_mode")
          .eq("id", d.product_id)
          .eq("tenant_id", d.tenant_id)
          .maybeSingle();
        alreadyBooking = existing?.sale_mode === "booking";
      }
      if (!alreadyBooking) {
        return NextResponse.json(
          { error: "O motor de reservas online não está incluído no seu plano. Faça upgrade para o Pro para vender online, ou use o modo WhatsApp." },
          { status: 403 }
        );
      }
    }
  }

  // Check plan limits on create
  if (d.mode === "create") {
    const { count } = await service
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", d.tenant_id)
      .neq("status", "archived");

    // Get plan limits
    const { data: tenant } = await service
      .from("tenants")
      .select("plan_id, plans(limits)")
      .eq("id", d.tenant_id)
      .single();

    const limits = (tenant?.plans as unknown as { limits: { max_products: number } } | null)?.limits;
    if (limits?.max_products !== -1 && limits?.max_products && (count ?? 0) >= limits.max_products) {
      return NextResponse.json({
        error: `Seu plano permite até ${limits.max_products} produtos. Faça upgrade para adicionar mais.`,
      }, { status: 403 });
    }
  }

  const finalSlug = slugify(d.slug || d.title);

  let productId: string;

  if (d.mode === "create") {
    const { data: product, error } = await service
      .from("products")
      .insert({
        tenant_id: d.tenant_id,
        module: d.module,
        type: d.type,
        title: d.title,
        slug: finalSlug,
        description: d.description,
        status: d.status,
        sale_mode: d.sale_mode,
        whatsapp_number: d.whatsapp_number ?? null,
        images: d.images,
        extra_data: d.extra_data,
        seo_title: d.seo_title ?? null,
        seo_description: d.seo_description ?? null,
      })
      .select()
      .single();

    if (error || !product) {
      if (error?.code === "23505") {
        return NextResponse.json({ error: "Já existe um produto com esse slug. Altere o nome." }, { status: 409 });
      }
      return NextResponse.json({ error: "Erro ao criar produto." }, { status: 500 });
    }
    productId = product.id;
  } else {
    if (!d.product_id) {
      return NextResponse.json({ error: "ID do produto não fornecido." }, { status: 400 });
    }

    const { error } = await service
      .from("products")
      .update({
        module: d.module,
        type: d.type,
        title: d.title,
        slug: finalSlug,
        description: d.description,
        status: d.status,
        sale_mode: d.sale_mode,
        whatsapp_number: d.whatsapp_number ?? null,
        images: d.images,
        extra_data: d.extra_data,
        seo_title: d.seo_title ?? null,
        seo_description: d.seo_description ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", d.product_id)
      .eq("tenant_id", d.tenant_id);

    if (error) {
      return NextResponse.json({ error: "Erro ao atualizar produto." }, { status: 500 });
    }
    productId = d.product_id;
  }

  const ratesResult = await syncProductRates(service, productId, d.rates);
  if (ratesResult) return ratesResult;

  return NextResponse.json({ productId });
}

type ProductRateInput = z.infer<typeof rateSchema>;
type ServiceClient = ReturnType<typeof createServiceClient>;

async function syncProductRates(service: ServiceClient, productId: string, rates: ProductRateInput[]) {
  const { data: existingRates, error: existingError } = await service
    .from("product_rates")
    .select("id, available")
    .eq("product_id", productId);

  if (existingError) {
    return NextResponse.json({ error: "Erro ao carregar tarifas atuais." }, { status: 500 });
  }

  const existing = existingRates ?? [];
  const existingIds = new Set(existing.map((rate) => rate.id as string));
  const desiredExistingIds = new Set(rates.map((rate) => rate.id).filter((id) => existingIds.has(id)));
  const removedIds = existing
    .filter((rate) => rate.available !== false && !desiredExistingIds.has(rate.id as string))
    .map((rate) => rate.id as string);

  if (removedIds.length > 0) {
    const usedIds = await findUsedRateIds(service, removedIds);
    const softDeleteIds = removedIds.filter((id) => usedIds.has(id));
    const hardDeleteIds = removedIds.filter((id) => !usedIds.has(id));

    if (hardDeleteIds.length > 0) {
      const { error } = await service.from("product_rates").delete().in("id", hardDeleteIds).eq("product_id", productId);
      if (error) {
        const { error: softError } = await service
          .from("product_rates")
          .update({ available: false })
          .in("id", hardDeleteIds)
          .eq("product_id", productId);
        if (softError) {
          return NextResponse.json({ error: "Erro ao remover tarifas." }, { status: 500 });
        }
      }
    }

    if (softDeleteIds.length > 0) {
      const { error } = await service
        .from("product_rates")
        .update({ available: false })
        .in("id", softDeleteIds)
        .eq("product_id", productId);
      if (error) {
        return NextResponse.json({ error: "Erro ao ocultar tarifas com historico." }, { status: 500 });
      }
    }
  }

  if (rates.length === 0) return null;

  const rows = rates.map((rate) => ({
    ...(existingIds.has(rate.id) ? { id: rate.id } : {}),
    product_id: productId,
    name: rate.name,
    price: rate.price,
    currency: "BRL",
    rate_type: rate.rate_type,
    valid_from: rate.valid_from || null,
    valid_to: rate.valid_to || null,
    season_name: rate.season_name || null,
    occupancy_min: rate.occupancy_min,
    occupancy_max: rate.occupancy_max,
    available: true,
  }));

  const { error } = await service.from("product_rates").upsert(rows, { onConflict: "id" });
  if (error) {
    return NextResponse.json({ error: "Erro ao salvar tarifas." }, { status: 500 });
  }

  return null;
}

async function findUsedRateIds(service: ServiceClient, rateIds: string[]): Promise<Set<string>> {
  const usedIds = new Set<string>();
  const [bookings, quotes, orderItems] = await Promise.all([
    service.from("bookings").select("product_rate_id").in("product_rate_id", rateIds),
    service.from("quotes").select("rate_id").in("rate_id", rateIds),
    service.from("order_items").select("rate_id").in("rate_id", rateIds),
  ]);

  for (const row of bookings.data ?? []) {
    if (row.product_rate_id) usedIds.add(row.product_rate_id as string);
  }
  for (const row of quotes.data ?? []) {
    if (row.rate_id) usedIds.add(row.rate_id as string);
  }
  for (const row of orderItems.data ?? []) {
    if (row.rate_id) usedIds.add(row.rate_id as string);
  }

  return usedIds;
}
