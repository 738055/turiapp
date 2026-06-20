import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import HospedagemForm from "@/components/admin/HospedagemForm";

export default async function NovaHospedagemPage() {
  const session = await auth();
  if (!session) redirect("/admin");

  return (
    <div>
      <div className="mb-10">
        <p className="text-[#C4623A] text-[11px] tracking-[0.3em] uppercase mb-1"
          style={{ fontFamily: "var(--font-body)" }}>
          Hospedagens
        </p>
        <h1 className="text-[#1C3A2A] text-4xl"
          style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
          Nova Hospedagem
        </h1>
      </div>
      <HospedagemForm />
    </div>
  );
}
