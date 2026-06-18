"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function AffiliateLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-500 mb-2">Seu link de indicação</p>
      <div className="flex gap-2">
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 truncate rounded-md border border-gray-200 bg-gray-50 px-3 text-sm h-10"
        />
        <button
          onClick={copy}
          className="flex items-center gap-1.5 rounded-md px-4 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--color-primary, #0ea5e9)" }}
        >
          {copied ? <><Check className="h-4 w-4" /> Copiado</> : <><Copy className="h-4 w-4" /> Copiar</>}
        </button>
      </div>
    </div>
  );
}
