"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Clock, Copy, Globe, Loader2, ShieldCheck, Trash2 } from "lucide-react";

interface VerificationRecord {
  type: string;
  domain: string;
  value: string;
  reason: string;
}

interface DomainRecord {
  domain: string;
  verification_status: string;
  ssl_status: string;
}

interface DomainManagerProps {
  currentDomain: DomainRecord | null;
  savedRecords?: VerificationRecord[];
  tenantSlug: string;
  platformDomain: string;
}

type Phase = "none" | "pending" | "issuing" | "ready";

function derivePhase(domain: DomainRecord | null): Phase {
  if (!domain) return "none";
  if (domain.verification_status === "verified" && domain.ssl_status === "issued") return "ready";
  if (domain.verification_status === "verified") return "issuing";
  return "pending";
}

export function DomainManager({ currentDomain, savedRecords = [], tenantSlug, platformDomain }: DomainManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [domainInput, setDomainInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verificationRecords, setVerificationRecords] = useState<VerificationRecord[]>(savedRecords);
  const [addedDomain, setAddedDomain] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>(derivePhase(currentDomain));

  const checkDomain = useCallback(async () => {
    const res = await fetch("/api/tenants/domain/check", { method: "POST" });
    if (!res.ok) return;
    const data = await res.json();
    if (data.status && ["pending", "issuing", "ready"].includes(data.status)) {
      setPhase(data.status);
      if (data.status === "ready") router.refresh();
    }
  }, [router]);

  useEffect(() => {
    if (phase !== "pending" && phase !== "issuing") return;
    const id = setInterval(checkDomain, phase === "issuing" ? 15_000 : 30_000);
    return () => clearInterval(id);
  }, [phase, checkDomain]);

  function copy(value: string) {
    navigator.clipboard.writeText(value);
    setCopied(value);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleAdd() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/tenants/domain/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domainInput }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao adicionar dominio.");
        return;
      }

      setAddedDomain(data.domain);
      setVerificationRecords(data.verification ?? []);
      setPhase(data.verified ? "issuing" : "pending");
      setDomainInput("");
      router.refresh();
    });
  }

  function handleRemove(domain: string) {
    if (!confirm(`Remover o dominio "${domain}"? O site voltara a usar o subdominio padrao.`)) return;
    startTransition(async () => {
      await fetch("/api/tenants/domain/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      setPhase("none");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4 text-sky-500" />
            Endereco padrao
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-3 font-mono text-sm">
            <span className="text-gray-600">https://</span>
            <span className="font-semibold text-gray-900">{tenantSlug}.{platformDomain}</span>
            <Badge variant="secondary" className="ml-auto text-xs">Ativo</Badge>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Seu site ja esta disponivel neste endereco. O dominio proprio e opcional.
          </p>
        </CardContent>
      </Card>

      {currentDomain ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dominio personalizado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg border bg-gray-50 p-3">
              <Globe className="h-4 w-4 flex-shrink-0 text-gray-400" />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-semibold">{currentDomain.domain}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <StatusBadge phase={phase} />
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="flex-shrink-0 text-red-500 hover:bg-red-50 hover:text-red-700"
                onClick={() => handleRemove(currentDomain.domain)}
                disabled={isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {phase === "ready" && (
              <p className="flex items-center gap-1.5 text-xs text-green-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Tudo certo. Seu site ja esta no ar em <span className="font-mono">{currentDomain.domain}</span> com SSL ativo.
              </p>
            )}

            {phase === "issuing" && (
              <div className="rounded-lg border border-sky-100 bg-sky-50/60 p-3">
                <p className="flex items-center gap-1.5 text-sm text-sky-800">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  DNS verificado. Emitindo o certificado SSL.
                </p>
                <p className="mt-1 text-xs text-sky-600">
                  Pode levar alguns minutos. Nao precisa fazer mais nada.
                </p>
              </div>
            )}

            {phase === "pending" && (
              <div className="space-y-2">
                <p className="flex items-center gap-1 text-xs text-amber-600">
                  <Clock className="h-3 w-3" />
                  Verificando o DNS automaticamente a cada 30s.
                </p>
                <DnsInstructions domain={currentDomain.domain} records={verificationRecords} copy={copy} copied={copied} />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Adicionar dominio proprio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              Conecte seu dominio ou subdominio para que clientes acessem diretamente pelo seu endereco.
            </p>

            <div className="flex gap-2">
              <Input
                value={domainInput}
                onChange={(event) => setDomainInput(event.target.value)}
                placeholder="www.meusite.com.br"
                className="font-mono text-sm"
                onKeyDown={(event) => event.key === "Enter" && handleAdd()}
              />
              <Button onClick={handleAdd} disabled={isPending || !domainInput.trim()} style={{ backgroundColor: "#0ea5e9" }}>
                {isPending ? "Adicionando..." : "Adicionar"}
              </Button>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            {addedDomain && (
              <DnsInstructions domain={addedDomain} records={verificationRecords} copy={copy} copied={copied} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatusBadge({ phase }: { phase: Phase }) {
  if (phase === "ready") {
    return (
      <Badge className="bg-green-600 text-xs">
        <ShieldCheck className="mr-1 h-3 w-3" /> Verificado e seguro
      </Badge>
    );
  }
  if (phase === "issuing") {
    return (
      <Badge variant="secondary" className="bg-sky-100 text-xs text-sky-700">
        <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Emitindo SSL
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-xs">
      <Clock className="mr-1 h-3 w-3" /> Aguardando DNS
    </Badge>
  );
}

function DnsInstructions({
  domain,
  records,
  copy,
  copied,
}: {
  domain: string;
  records: VerificationRecord[];
  copy: (value: string) => void;
  copied: string | null;
}) {
  const dnsRecords = dnsRecordsForDomain(domain);

  return (
    <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
      <p className="text-sm font-medium text-blue-900">Configure o DNS no seu provedor de dominio</p>
      <p className="text-xs text-blue-700">
        Adicione o registro abaixo no painel do dominio. Para subdominios, use CNAME. Para dominio raiz,
        use A record.
      </p>

      <div className="space-y-2">
        <p className="text-xs font-medium text-blue-700">{dnsRecords.title}</p>
        {dnsRecords.records.map((record) => (
          <DnsRecord
            key={`${record.type}-${record.host}`}
            type={record.type}
            host={record.host}
            value={record.value}
            copy={copy}
            copied={copied}
          />
        ))}
      </div>

      {records.length > 0 && (
        <>
          <p className="mt-2 text-xs font-medium text-blue-700">Registros adicionais de verificacao, se solicitados:</p>
          {records.map((record, index) => (
            <DnsRecord key={index} type={record.type} host={record.domain} value={record.value} copy={copy} copied={copied} />
          ))}
        </>
      )}

      <p className="mt-2 text-xs text-gray-500">
        A propagacao do DNS pode levar ate 24h, normalmente alguns minutos. O SSL e emitido automaticamente apos a verificacao.
      </p>
    </div>
  );
}

function dnsRecordsForDomain(domain: string): {
  title: string;
  records: Array<{ type: string; host: string; value: string }>;
} {
  const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/\.$/, "");
  const parts = cleanDomain.split(".").filter(Boolean);
  const rootLabelCount = registrableRootLabelCount(parts);
  const isApex = parts.length <= rootLabelCount;
  const isWww = parts[0] === "www" && parts.length === rootLabelCount + 1;

  if (isApex) {
    return {
      title: `Para o dominio raiz (${cleanDomain}):`,
      records: [
        { type: "A", host: "@", value: "76.76.21.21" },
        { type: "CNAME", host: "www", value: "cname.vercel-dns.com" },
      ],
    };
  }

  return {
    title: `Para este subdominio (${cleanDomain}):`,
    records: [
      {
        type: "CNAME",
        host: isWww ? "www" : parts.slice(0, parts.length - rootLabelCount).join("."),
        value: "cname.vercel-dns.com",
      },
    ],
  };
}

function registrableRootLabelCount(parts: string[]): number {
  if (parts.length < 3) return 2;
  const lastTwo = parts.slice(-2).join(".");
  const commonSecondLevelTlds = new Set([
    "com.br",
    "net.br",
    "org.br",
    "tur.br",
    "eco.br",
    "app.br",
    "dev.br",
    "co.uk",
    "com.au",
  ]);
  return commonSecondLevelTlds.has(lastTwo) ? 3 : 2;
}

function DnsRecord({
  type,
  host,
  value,
  copy,
  copied,
}: {
  type: string;
  host: string;
  value: string;
  copy: (value: string) => void;
  copied: string | null;
}) {
  return (
    <div className="space-y-1 rounded-lg border bg-white p-3 font-mono text-xs">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex gap-4">
            <span className="w-14 text-gray-400">Tipo</span>
            <span className="font-semibold">{type}</span>
          </div>
          <div className="flex gap-4">
            <span className="w-14 text-gray-400">Host</span>
            <span className="font-semibold">{host}</span>
          </div>
          <div className="flex gap-4">
            <span className="w-14 text-gray-400">Valor</span>
            <span className="break-all font-semibold">{value}</span>
          </div>
        </div>
        <button
          onClick={() => copy(value)}
          className="ml-2 flex-shrink-0 rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          title="Copiar valor"
        >
          {copied === value ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}
