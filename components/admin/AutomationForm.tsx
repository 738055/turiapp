"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save } from "lucide-react";
import {
  TRIGGER_LABEL,
  ACTION_LABEL,
  TRIGGER_NUMBER_FIELD,
  type EmailActionConfig,
  type NotificationActionConfig,
  type MoveLeadActionConfig,
  type WhatsAppActionConfig,
} from "@/lib/automations/templates";
import { automationActionAllowed, automationActionGateMessage, automationActionRequiresPro } from "@/lib/automations/access";
import { WHATSAPP_TEMPLATES } from "@/lib/whatsapp/templates";
import type { Automation, TriggerType, ActionType, PlanTier } from "@/types";

interface AutomationFormProps {
  tenantId: string;
  automation?: Automation;
  planTier: PlanTier | null;
}

const TRIGGER_OPTIONS = Object.keys(TRIGGER_LABEL) as TriggerType[];
const ACTION_OPTIONS = Object.keys(ACTION_LABEL) as ActionType[];
const LEAD_STATUS_OPTIONS = [
  { value: "novo", label: "Novo" },
  { value: "cotacao_enviada", label: "Cotação enviada" },
  { value: "negociando", label: "Negociando" },
  { value: "reservado", label: "Reservado" },
  { value: "perdido", label: "Perdido" },
] as const;

export function AutomationForm({ tenantId, automation, planTier }: AutomationFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const triggerCfg = (automation?.trigger_config ?? {}) as Record<string, unknown>;
  const emailCfg = (automation?.action_type === "send_email" ? automation.action_config : {}) as Partial<EmailActionConfig>;
  const notifCfg = (automation?.action_type === "internal_notification" ? automation.action_config : {}) as Partial<NotificationActionConfig>;
  const moveCfg = (automation?.action_type === "move_lead_status" ? automation.action_config : {}) as Partial<MoveLeadActionConfig>;
  const whatsappCfg = (automation?.action_type === "send_whatsapp" ? automation.action_config : {}) as Partial<WhatsAppActionConfig>;

  const initialTriggerKey = automation ? TRIGGER_NUMBER_FIELD[automation.trigger_type]?.key : undefined;

  const initialActionType = (automation?.action_type ??
    (automationActionAllowed("send_email", planTier) ? "send_email" : "internal_notification")) as ActionType;

  const [form, setForm] = useState({
    name: automation?.name ?? "",
    trigger_type: (automation?.trigger_type ?? "booking_confirmed") as TriggerType,
    trigger_number: initialTriggerKey ? String(triggerCfg[initialTriggerKey] ?? "") : "",
    action_type: initialActionType,
    delay_hours: automation?.delay_hours ?? 0,
    active: automation?.active ?? true,
    email_subject: emailCfg.subject ?? "",
    email_heading: emailCfg.heading ?? "",
    email_body: emailCfg.body ?? "",
    email_cta_label: emailCfg.cta_label ?? "",
    email_cta_url: emailCfg.cta_url ?? "",
    notification_title: notifCfg.title ?? "",
    notification_message: notifCfg.message ?? "",
    move_next_status: moveCfg.next_status ?? "negociando",
    whatsapp_template_key: whatsappCfg.template_key ?? WHATSAPP_TEMPLATES[0].key,
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const numberField = TRIGGER_NUMBER_FIELD[form.trigger_type];
  const selectedActionAllowed = automationActionAllowed(form.action_type, planTier);

  function buildActionConfig(): Record<string, unknown> {
    switch (form.action_type) {
      case "send_email":
        return {
          subject: form.email_subject,
          heading: form.email_heading,
          body: form.email_body,
          ...(form.email_cta_label ? { cta_label: form.email_cta_label } : {}),
          ...(form.email_cta_url ? { cta_url: form.email_cta_url } : {}),
        };
      case "internal_notification":
        return { title: form.notification_title, message: form.notification_message };
      case "move_lead_status":
        return { next_status: form.move_next_status };
      case "send_whatsapp":
        return { template_key: form.whatsapp_template_key };
      default:
        return {};
    }
  }

  function handleSave() {
    setError(null);
    if (!form.name.trim()) {
      setError("Dê um nome para a automação.");
      return;
    }

    if (!selectedActionAllowed) {
      setError(automationActionGateMessage(form.action_type) ?? "Esta acao nao esta incluida no seu plano.");
      return;
    }

    const trigger_config: Record<string, unknown> = numberField
      ? { [numberField.key]: Number(form.trigger_number || 0) }
      : {};

    startTransition(async () => {
      const res = await fetch("/api/automations/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          automation_id: automation?.id,
          tenant_id: tenantId,
          name: form.name,
          trigger_type: form.trigger_type,
          trigger_config,
          action_type: form.action_type,
          action_config: buildActionConfig(),
          delay_hours: form.delay_hours,
          active: form.active,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Erro ao salvar.");
        return;
      }
      router.push("/automacoes");
    });
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <Card>
        <CardHeader><CardTitle className="text-base">Identificação</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm">Nome da automação</Label>
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Ex.: Lembrete de viagem" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Gatilho</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm">Quando disparar</Label>
            <select
              value={form.trigger_type}
              onChange={(e) => update("trigger_type", e.target.value as TriggerType)}
              className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
            >
              {TRIGGER_OPTIONS.map((t) => (
                <option key={t} value={t}>{TRIGGER_LABEL[t]}</option>
              ))}
            </select>
          </div>
          {numberField && (
            <div className="space-y-1.5">
              <Label className="text-sm">{numberField.label}</Label>
              <Input
                type="number"
                min={0}
                value={form.trigger_number}
                onChange={(e) => update("trigger_number", e.target.value)}
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-sm">Atraso após o gatilho (horas)</Label>
            <Input
              type="number"
              min={0}
              value={form.delay_hours}
              onChange={(e) => update("delay_hours", Number(e.target.value))}
            />
            <p className="text-xs text-gray-400">Use 0 para disparar imediatamente quando a condição for atendida.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Ação</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm">O que fazer</Label>
            <select
              value={form.action_type}
              onChange={(e) => update("action_type", e.target.value as ActionType)}
              className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
            >
              {ACTION_OPTIONS.map((a) => (
                <option key={a} value={a} disabled={!automationActionAllowed(a, planTier)}>
                  {ACTION_LABEL[a]}{automationActionRequiresPro(a) ? " - Pro/Enterprise" : ""}
                </option>
              ))}
            </select>
            {!selectedActionAllowed && (
              <p className="text-xs text-amber-600">{automationActionGateMessage(form.action_type)}</p>
            )}
          </div>

          {form.action_type === "send_email" && (
            <>
              <div className="space-y-1.5">
                <Label className="text-sm">Assunto do e-mail</Label>
                <Input value={form.email_subject} onChange={(e) => update("email_subject", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Título</Label>
                <Input value={form.email_heading} onChange={(e) => update("email_heading", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Mensagem</Label>
                <textarea
                  value={form.email_body}
                  onChange={(e) => update("email_body", e.target.value)}
                  className="w-full rounded border border-gray-200 px-3 py-2 text-sm resize-none h-28"
                />
                <p className="text-xs text-gray-400">
                  Variáveis disponíveis: {"{{customer_name}}"}, {"{{product_title}}"}, {"{{check_in}}"}, {"{{check_out}}"}, {"{{quote_url}}"}, {"{{days}}"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Texto do botão (opcional)</Label>
                  <Input value={form.email_cta_label} onChange={(e) => update("email_cta_label", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Link do botão (opcional)</Label>
                  <Input value={form.email_cta_url} onChange={(e) => update("email_cta_url", e.target.value)} placeholder="{{quote_url}}" />
                </div>
              </div>
            </>
          )}

          {form.action_type === "internal_notification" && (
            <>
              <div className="space-y-1.5">
                <Label className="text-sm">Título da notificação</Label>
                <Input value={form.notification_title} onChange={(e) => update("notification_title", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Mensagem</Label>
                <textarea
                  value={form.notification_message}
                  onChange={(e) => update("notification_message", e.target.value)}
                  className="w-full rounded border border-gray-200 px-3 py-2 text-sm resize-none h-24"
                />
              </div>
            </>
          )}

          {form.action_type === "move_lead_status" && (
            <div className="space-y-1.5">
              <Label className="text-sm">Novo status do lead</Label>
              <select
                value={form.move_next_status}
                onChange={(e) => update("move_next_status", e.target.value as typeof form.move_next_status)}
                className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
              >
                {LEAD_STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400">Só funciona em automações com gatilho baseado em lead.</p>
            </div>
          )}

          {form.action_type === "send_whatsapp" && (
            <div className="space-y-1.5">
              <Label className="text-sm">Modelo aprovado (Meta)</Label>
              <select
                value={form.whatsapp_template_key}
                onChange={(e) => update("whatsapp_template_key", e.target.value)}
                className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
              >
                {WHATSAPP_TEMPLATES.map((t) => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400">
                {WHATSAPP_TEMPLATES.find((t) => t.key === form.whatsapp_template_key)?.bodyPreview}
              </p>
              <p className="text-xs text-amber-600">
                O conteúdo da mensagem é fixo (exigência do WhatsApp/Meta para templates aprovados). Conecte o WhatsApp Business em Integrações para que os disparos sejam enviados.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="active"
          checked={form.active}
          onChange={(e) => update("active", e.target.checked)}
          className="h-4 w-4"
        />
        <Label htmlFor="active" className="text-sm font-normal cursor-pointer">Automação ativa</Label>
      </div>

      {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.push("/automacoes")}>Cancelar</Button>
        <Button onClick={handleSave} disabled={isPending || !selectedActionAllowed}>
          <Save className="h-4 w-4 mr-1" />
          {isPending ? "Salvando..." : "Salvar automação"}
        </Button>
      </div>
    </div>
  );
}
