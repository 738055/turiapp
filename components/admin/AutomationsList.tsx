"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Pause, Play } from "lucide-react";
import { TRIGGER_LABEL, ACTION_LABEL } from "@/lib/automations/templates";
import type { Automation } from "@/types";

interface AutomationsListProps {
  automations: Automation[];
}

export function AutomationsList({ automations }: AutomationsListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  function handleToggle(automation: Automation) {
    setBusyId(automation.id);
    startTransition(async () => {
      await fetch("/api/automations/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ automation_id: automation.id, active: !automation.active }),
      });
      setBusyId(null);
      router.refresh();
    });
  }

  function handleDelete(automation: Automation) {
    if (!window.confirm(`Excluir a automação "${automation.name}"? Essa ação não pode ser desfeita.`)) return;
    setBusyId(automation.id);
    startTransition(async () => {
      await fetch("/api/automations/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ automation_id: automation.id }),
      });
      setBusyId(null);
      router.refresh();
    });
  }

  if (!automations.length) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm">
        Nenhuma automação configurada ainda. Use um modelo pronto acima ou crie uma personalizada.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {automations.map((automation) => (
        <Card key={automation.id}>
          <CardContent className="flex items-center justify-between py-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900">{automation.name}</p>
                <Badge variant={automation.active ? "success" : "secondary"}>
                  {automation.active ? "Ativa" : "Pausada"}
                </Badge>
              </div>
              <p className="text-xs text-gray-500">
                {TRIGGER_LABEL[automation.trigger_type]} → {ACTION_LABEL[automation.action_type]}
                {automation.delay_hours > 0 && ` (após ${automation.delay_hours}h)`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={isPending && busyId === automation.id}
                onClick={() => handleToggle(automation)}
                title={automation.active ? "Pausar" : "Ativar"}
              >
                {automation.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/automacoes/${automation.id}`}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Editar
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={isPending && busyId === automation.id}
                onClick={() => handleDelete(automation)}
                className="text-red-500 hover:text-red-700"
                title="Excluir"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
