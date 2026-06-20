import type { ActionType, PlanTier } from "@/types";

export const STANDARD_AUTOMATION_ACTIONS: ActionType[] = ["internal_notification"];
export const PRO_AUTOMATION_ACTIONS: ActionType[] = ["send_email", "send_whatsapp", "move_lead_status"];

export function automationActionRequiresPro(action: ActionType): boolean {
  return PRO_AUTOMATION_ACTIONS.includes(action);
}

export function automationActionAllowed(action: ActionType, tier: PlanTier | null): boolean {
  if (!automationActionRequiresPro(action)) return true;
  if (!tier) return true;
  return tier === "pro" || tier === "premium";
}

export function automationActionGateMessage(action: ActionType): string | null {
  if (!automationActionRequiresPro(action)) return null;
  return "Esta acao faz parte dos planos Pro e Enterprise.";
}
