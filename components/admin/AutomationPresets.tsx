"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Check } from "lucide-react";
import { AUTOMATION_PRESETS } from "@/lib/automations/templates";
import { automationActionAllowed, automationActionRequiresPro } from "@/lib/automations/access";
import type { PlanTier } from "@/types";

interface AutomationPresetsProps {
  tenantId: string;
  activePresetNames: string[];
  planTier: PlanTier | null;
}

export function AutomationPresets({ tenantId, activePresetNames, planTier }: AutomationPresetsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activatingKey, setActivatingKey] = useState<string | null>(null);

  function handleActivate(presetKey: string) {
    const preset = AUTOMATION_PRESETS.find((p) => p.key === presetKey);
    if (!preset) return;
    setActivatingKey(presetKey);
    startTransition(async () => {
      await fetch("/api/automations/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          name: preset.name,
          trigger_type: preset.trigger_type,
          trigger_config: preset.trigger_config,
          action_type: preset.action_type,
          action_config: preset.action_config,
          delay_hours: preset.delay_hours,
          active: true,
        }),
      });
      setActivatingKey(null);
      router.refresh();
    });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {AUTOMATION_PRESETS.map((preset) => {
        const alreadyActive = activePresetNames.includes(preset.name);
        const allowed = automationActionAllowed(preset.action_type, planTier);
        return (
          <Card key={preset.key}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sky-600">
                <Sparkles className="h-4 w-4" />
                <p className="font-medium text-gray-900 text-sm">{preset.name}</p>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{preset.description}</p>
              {automationActionRequiresPro(preset.action_type) && (
                <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                  Pro/Enterprise
                </span>
              )}
              <Button
                size="sm"
                variant={alreadyActive ? "outline" : "default"}
                className="w-full"
                disabled={!allowed || (isPending && activatingKey === preset.key)}
                onClick={() => handleActivate(preset.key)}
              >
                {!allowed ? (
                  "Disponivel no Pro"
                ) : alreadyActive ? (
                  <>
                    <Check className="h-4 w-4 mr-1" /> Adicionar novamente
                  </>
                ) : activatingKey === preset.key ? (
                  "Ativando..."
                ) : (
                  "Ativar"
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
