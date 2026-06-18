"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Trash2, CheckCircle2, Clock, Copy, ShieldCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

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

function derivePhase(d: DomainRecord | null): Phase {
  if (!d) return "none";
  if (d.verification_status === "verified" && d.ssl_status === "issued") return "ready";
  if (d.verification_status === "verified") return "issuing";
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

  // Poll while DNS is propagating or the certificate is being issued.
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
    // Poll a bit faster (15s) while issuing SSL, slower (30s) while waiting on DNS.
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
        body: JSON.stringify({ domain: domainInput.toLowerCase().trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao adicionar domínio.");
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
    if (!confirm(`Remover o domínio "${domain}"? O site voltará a usar o subdomínio padrão.`)) return;
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
      {/* Current subdomain info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-sky-500" />
            Endereço padrão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 font-mono text-sm bg-gray-50 rounded-lg px-4 py-3">
            <span className="text-gray-600">https://</span>
            <span className="font-semibold text-gray-900">{tenantSlug}.{platformDomain}</span>
            <Badge variant="secondary" className="ml-auto text-xs">Ativo</Badge>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Seu site já está disponível neste endereço. O domínio próprio é opcional.
          </p>
        </CardContent>
      </Card>

      {/* Custom domain */}
      {currentDomain ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Domínio personalizado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50">
              <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm font-semibold">{currentDomain.domain}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  <StatusBadge phase={phase} />
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                onClick={() => handleRemove(currentDomain.domain)}
                disabled={isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {phase === "ready" && (
              <p className="text-xs text-green-700 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Tudo certo! Seu site já está no ar em <span className="font-mono">{currentDomain.domain}</span> com SSL ativo.
              </p>
            )}

            {phase === "issuing" && (
              <div className="rounded-lg border border-sky-100 bg-sky-50/60 p-3">
                <p className="text-sm text-sky-800 flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  DNS verificado! Emitindo o certificado SSL — pode levar alguns minutos.
                </p>
                <p className="text-xs text-sky-600 mt-1">
                  Seu site já responde no domínio; o cadeado de segurança é ativado automaticamente. Não precisa fazer nada.
                </p>
              </div>
            )}

            {phase === "pending" && (
              <div className="space-y-2">
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Verificando o DNS automaticamente a cada 30s...
                </p>
                <DnsInstructions domain={currentDomain.domain} records={verificationRecords} copy={copy} copied={copied} />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Adicionar domínio próprio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              Conecte seu domínio (ex: <span className="font-mono">www.meusite.com.br</span>) para que seus clientes acessem diretamente pelo seu endereço.
            </p>

            <div className="flex gap-2">
              <Input
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                placeholder="www.meusite.com.br"
                className="font-mono text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
              <Button
                onClick={handleAdd}
                disabled={isPending || !domainInput.trim()}
                style={{ backgroundColor: "#0ea5e9" }}
              >
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
      <Badge className="text-xs bg-green-600">
        <ShieldCheck className="h-3 w-3 mr-1" /> Verificado e seguro
      </Badge>
    );
  }
  if (phase === "issuing") {
    return (
      <Badge variant="secondary" className="text-xs bg-sky-100 text-sky-700">
        <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Emitindo SSL
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-xs">
      <Clock className="h-3 w-3 mr-1" /> Aguardando DNS
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
  copy: (v: string) => void;
  copied: string | null;
}) {
  const apex = domain.replace(/^www\./, "");
  const cnameTarget = "cname.vercel-dns.com";
  const aRecord = "76.76.21.21";

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-3">
      <p className="text-sm font-medium text-blue-900">Configure o DNS no seu provedor de domínio</p>
      <p className="text-xs text-blue-700">
        Acesse o painel do seu registrador (Registro.br, GoDaddy, Cloudflare…) e adicione o registro que corresponde ao
        seu endereço. <strong>Use o tipo que o seu provedor permitir</strong> — alguns chamam o A da raiz de &ldquo;ALIAS&rdquo; ou &ldquo;ANAME&rdquo;.
      </p>

      <div className="space-y-2">
        <p className="text-xs text-blue-700 font-medium">Para o domínio raiz ({apex}):</p>
        <DnsRecord type="A" host="@" value={aRecord} copy={copy} copied={copied} />
        <p className="text-xs text-blue-700 font-medium pt-1">Para o www (www.{apex}):</p>
        <DnsRecord type="CNAME" host="www" value={cnameTarget} copy={copy} copied={copied} />
      </div>

      {records.length > 0 && (
        <>
          <p className="text-xs text-blue-700 font-medium mt-2">Registros adicionais de verificação (se solicitados):</p>
          {records.map((r, i) => (
            <DnsRecord key={i} type={r.type} host={r.domain} value={r.value} copy={copy} copied={copied} />
          ))}
        </>
      )}

      <p className="text-xs text-gray-500 mt-2">
        ⏱ A propagação do DNS pode levar até 24h (normalmente minutos). O SSL é emitido automaticamente após a verificação.
      </p>
    </div>
  );
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
  copy: (v: string) => void;
  copied: string | null;
}) {
  return (
    <div className="rounded-lg border bg-white p-3 font-mono text-xs space-y-1">
      <div className="flex justify-between items-center">
        <div className="space-y-0.5">
          <div className="flex gap-4">
            <span className="text-gray-400 w-14">Tipo</span>
            <span className="font-semibold">{type}</span>
          </div>
          <div className="flex gap-4">
            <span className="text-gray-400 w-14">Host</span>
            <span className="font-semibold">{host}</span>
          </div>
          <div className="flex gap-4">
            <span className="text-gray-400 w-14">Valor</span>
            <span className="font-semibold break-all">{value}</span>
          </div>
        </div>
        <button
          onClick={() => copy(value)}
          className="ml-2 p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex-shrink-0"
          title="Copiar valor"
        >
          {copied === value ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
