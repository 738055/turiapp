"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Notification } from "@/types";

interface NotificationBellProps {
  tenantId: string;
}

export function NotificationBell({ tenantId }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    const res = await fetch(`/api/notifications/list?tenant_id=${tenantId}`);
    if (!res.ok) return;
    const body = await res.json();
    setNotifications(body.notifications ?? []);
    setUnreadCount(body.unreadCount ?? 0);
  }, [tenantId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [load]);

  async function handleOpen() {
    setOpen((v) => !v);
  }

  async function handleMarkAllRead() {
    await fetch("/api/notifications/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenant_id: tenantId, all: true }),
    });
    load();
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 relative" onClick={handleOpen}>
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg z-20">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
              <p className="text-sm font-medium text-gray-700">Notificações</p>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs text-sky-600 hover:underline">
                  Marcar todas como lidas
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-gray-400">Nenhuma notificação ainda.</p>
              )}
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-gray-50 text-sm ${n.read_at ? "" : "bg-sky-50/50"}`}
                >
                  <p className="font-medium text-gray-800">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 px-4 py-2 text-center">
              <Link href="/notificacoes" className="text-xs text-sky-600 hover:underline" onClick={() => setOpen(false)}>
                Ver todas
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
