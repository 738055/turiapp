"use client";

import { useEffect, useState, useCallback } from "react";
import { Download, Bell, BellOff } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export function PWARegister({ tenantId }: { tenantId: string }) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [pushState, setPushState] = useState<"unsupported" | "default" | "subscribed" | "denied">("unsupported");
  const [busy, setBusy] = useState(false);

  // Register the service worker and detect current push state.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});

    if (!("PushManager" in window) || !VAPID_PUBLIC_KEY) {
      setPushState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setPushState("denied");
      return;
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setPushState(sub ? "subscribed" : "default");
    });
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }

  const enablePush = useCallback(async () => {
    if (!VAPID_PUBLIC_KEY) return;
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushState(permission === "denied" ? "denied" : "default");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, subscription: sub.toJSON() }),
      });
      if (res.ok) setPushState("subscribed");
    } catch {
      // ignore — user can retry
    } finally {
      setBusy(false);
    }
  }, [tenantId]);

  async function disablePush() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(sub.endpoint)}`, { method: "DELETE" });
        await sub.unsubscribe();
      }
      setPushState("default");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      {installEvent && (
        <button
          onClick={install}
          className="hidden sm:flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
          title="Instalar o app no seu dispositivo"
        >
          <Download className="h-3.5 w-3.5" /> Instalar app
        </button>
      )}
      {pushState === "default" && (
        <button
          onClick={enablePush}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          title="Receber notificações de novas reservas"
        >
          <Bell className="h-3.5 w-3.5" /> Ativar notificações
        </button>
      )}
      {pushState === "subscribed" && (
        <button
          onClick={disablePush}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs text-green-700 hover:bg-gray-50 disabled:opacity-50"
          title="Notificações ativadas — clique para desativar"
        >
          <Bell className="h-3.5 w-3.5" /> Notificações on
        </button>
      )}
      {pushState === "denied" && (
        <span className="hidden sm:flex items-center gap-1 text-xs text-gray-400" title="Permita notificações nas configurações do navegador">
          <BellOff className="h-3.5 w-3.5" />
        </span>
      )}
    </div>
  );
}
