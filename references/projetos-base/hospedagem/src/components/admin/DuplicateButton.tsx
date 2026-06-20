"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2 } from "lucide-react";

interface DuplicateButtonProps {
  entity: "hospedagens" | "servicos" | "transporte";
  id: number;
}

export default function DuplicateButton({ entity, id }: DuplicateButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDuplicate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/${entity}/${id}/duplicate`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro");
      router.push(`/admin/${entity}/${json.id}`);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao duplicar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDuplicate}
      disabled={loading}
      title="Duplicar"
      className="w-8 h-8 border border-[#1C3A2A]/20 flex items-center justify-center hover:border-[#B8963E] hover:text-[#B8963E] transition-colors text-[#1C3A2A]/50 disabled:opacity-40"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}
