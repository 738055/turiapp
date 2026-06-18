import { createClient } from "@/lib/supabase/server";
import { LeadsKanban } from "@/components/admin/LeadsKanban";

export default async function LeadsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user!.id)
    .single();

  const { data: leads } = await supabase
    .from("leads")
    .select("id, name, email, phone, message, status, product_id, created_at, products(title)")
    .eq("tenant_id", membership!.tenant_id)
    .order("created_at", { ascending: false })
    .limit(300);

  const items = (leads ?? []).map((l) => ({
    ...l,
    product_title: (l.products as unknown as { title: string } | null)?.title ?? null,
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Leads</h1>
        <p className="text-gray-500 text-sm mt-1">
          Funil de vendas — arraste mentalmente pelos status ou use o seletor em cada cartão.
        </p>
      </div>
      <LeadsKanban initialLeads={items} />
    </div>
  );
}
