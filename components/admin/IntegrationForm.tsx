"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save } from "lucide-react";
import { PlanLockCard } from "@/components/admin/PlanGate";

interface IntegrationFormProps {
  tenantId: string;
  initialValues: Record<string, unknown>;
  /** When false (plano Básico), pixels/analytics/scripts are locked behind Pro. */
  pixelsAllowed?: boolean;
}

export function IntegrationForm({ tenantId, initialValues: iv, pixelsAllowed = true }: IntegrationFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    google_analytics_id: String(iv.google_analytics_id ?? ""),
    google_tag_manager_id: String(iv.google_tag_manager_id ?? ""),
    facebook_pixel_id: String(iv.facebook_pixel_id ?? ""),
    tiktok_pixel_id: String(iv.tiktok_pixel_id ?? ""),
    google_ads_id: String(iv.google_ads_id ?? ""),
    whatsapp_number: String(iv.whatsapp_number ?? ""),
    cookie_consent_enabled: iv.cookie_consent_enabled !== false,
    cookie_consent_text: String(iv.cookie_consent_text ?? ""),
    privacy_policy_url: String(iv.privacy_policy_url ?? ""),
    head_scripts: String(iv.head_scripts ?? ""),
  });

  function update(key: keyof typeof form, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSave() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await fetch("/api/integrations/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, ...form }),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Erro ao salvar.");
        return;
      }
      setSaved(true);
    });
  }

  const field = (
    label: string,
    key: keyof typeof form,
    placeholder?: string,
    hint?: string
  ) => (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <Input
        value={form[key] as string}
        onChange={(e) => update(key, e.target.value)}
        placeholder={placeholder}
        className="font-mono text-sm"
      />
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );

  return (
    <div className="space-y-5">
      {pixelsAllowed ? (
        <>
          {/* Analytics */}
          <Card>
            <CardHeader><CardTitle className="text-base">Analytics</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {field("Google Analytics 4 (Measurement ID)", "google_analytics_id", "G-XXXXXXXXXX")}
              {field(
                "Google Tag Manager (Container ID)",
                "google_tag_manager_id",
                "GTM-XXXXXXX",
                "Se preenchido, o GTM gerencia o GA4 e outros scripts — não preencha GA4 separadamente."
              )}
            </CardContent>
          </Card>

          {/* Ad Pixels */}
          <Card>
            <CardHeader><CardTitle className="text-base">Pixels de anúncio</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {field("Meta Pixel (Facebook)", "facebook_pixel_id", "1234567890123456")}
              {field("TikTok Pixel", "tiktok_pixel_id", "C4XXXXXXXXXXXXXXXX")}
              {field("Google Ads (Conversion ID)", "google_ads_id", "AW-XXXXXXXXXX")}
            </CardContent>
          </Card>
        </>
      ) : (
        <PlanLockCard
          title="Pixels & Analytics"
          description="Google Analytics, Meta/TikTok Pixel e scripts de marketing fazem parte do plano Pro. Faça upgrade para rastrear seus anúncios e conversões."
        />
      )}

      {/* WhatsApp */}
      <Card>
        <CardHeader><CardTitle className="text-base">WhatsApp padrão</CardTitle></CardHeader>
        <CardContent>
          {field(
            "Número com código do país",
            "whatsapp_number",
            "+5511999999999",
            "Número padrão para produtos no modo WhatsApp."
          )}
        </CardContent>
      </Card>

      {/* LGPD */}
      <Card>
        <CardHeader><CardTitle className="text-base">LGPD & Privacidade</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="cookie_consent_enabled"
              checked={form.cookie_consent_enabled}
              onChange={(e) => update("cookie_consent_enabled", e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="cookie_consent_enabled" className="text-sm font-normal cursor-pointer">
              Mostrar banner de consentimento de cookies (recomendado pela LGPD)
            </Label>
          </div>
          {field(
            "Texto do banner",
            "cookie_consent_text",
            "Usamos cookies para melhorar sua experiência...",
          )}
          {field(
            "Link para política de privacidade",
            "privacy_policy_url",
            "https://seusite.com/privacidade",
          )}
        </CardContent>
      </Card>

      {/* Custom scripts (gated together with pixels) */}
      {pixelsAllowed && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scripts personalizados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label className="text-sm">Scripts para o &lt;head&gt; (HTML)</Label>
              <textarea
                value={form.head_scripts}
                onChange={(e) => update("head_scripts", e.target.value)}
                className="w-full rounded border border-gray-200 px-3 py-2 text-xs font-mono resize-none h-28"
                placeholder={'<script>/* seu script aqui */</script>'}
              />
              <p className="text-xs text-gray-400">
                Scripts de chat, remarketing ou outros pixels não listados acima.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      {saved && (
        <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          Configurações salvas com sucesso.
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isPending} style={{ backgroundColor: "#0ea5e9" }}>
          <Save className="h-4 w-4 mr-1" />
          {isPending ? "Salvando..." : "Salvar integrações"}
        </Button>
      </div>
    </div>
  );
}
