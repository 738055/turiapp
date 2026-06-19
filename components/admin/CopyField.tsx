"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="flex gap-2">
      <input
        readOnly
        value={value}
        onFocus={(e) => e.currentTarget.select()}
        className="h-9 flex-1 truncate rounded-md border border-gray-200 bg-gray-50 px-3 text-xs"
      />
      <button onClick={copy} className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 text-xs font-medium text-gray-600 hover:bg-gray-50">
        {copied ? <><Check className="h-3.5 w-3.5" /> Copiado</> : <><Copy className="h-3.5 w-3.5" /> Copiar</>}
      </button>
    </div>
  );
}
