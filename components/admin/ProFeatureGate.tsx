import Link from "next/link";
import { ArrowRight, Lock, MessageCircle, Target, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ProFeatureGateProps {
  title: string;
  description: string;
  kind: "crm" | "support";
}

export function ProFeatureGate({ title, description, kind }: ProFeatureGateProps) {
  const steps =
    kind === "support"
      ? ["Caixa de entrada WhatsApp", "Historico por cliente", "Notas e responsaveis"]
      : ["Leads em pipeline", "Cotacoes digitais", "Segmentacao de clientes"];
  const Icon = kind === "support" ? MessageCircle : Target;

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-dashed">
        <CardContent className="grid gap-6 p-0 lg:grid-cols-[1fr_1.1fr]">
          <div className="p-7">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Lock className="h-6 w-6" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">Pro / Enterprise</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-950">{title}</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-500">{description}</p>
            <Link
              href="/configuracoes/assinatura"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Ver planos e liberar recurso
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="border-t bg-gray-50 p-5 lg:border-l lg:border-t-0">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{kind === "support" ? "Atendimento" : "CRM comercial"}</p>
                    <p className="text-xs text-gray-400">Preview do recurso</p>
                  </div>
                </div>
                <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-700">Bloqueado</span>
              </div>

              <div className="grid gap-3">
                {steps.map((step, index) => (
                  <div key={step} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-gray-500">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-700">{step}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {[Users, MessageCircle, Target].map((ItemIcon, index) => (
                  <div key={index} className="flex h-16 items-center justify-center rounded-lg bg-gray-100 text-gray-300">
                    <ItemIcon className="h-5 w-5" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
