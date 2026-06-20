"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { MessageCircle, Send, User, Phone, Clock, ExternalLink, Loader2, Check, CheckCheck, X, Tag, UserPlus, StickyNote, AlertCircle, Paperclip, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface Conversation {
  id: string; customer_id: string | null; lead_id: string | null; phone: string;
  contact_name: string | null; status: string; tags: string[]; assigned_to: string | null;
  last_message_at: string | null; last_message_preview: string | null; last_inbound_at: string | null; unread_count: number;
}
interface Message { id: string; direction: "inbound" | "outbound"; type: string; body: string | null; media_url: string | null; status: string | null; created_at: string; }
type ChatMediaType = "image" | "document" | "audio" | "video";
interface Booking { id: string; status: string; total_price: number; currency: string; created_at: string; productTitle: string; }
interface Note { id: string; body: string; author: string; created_at: string; }
interface TemplateDef { key: string; label: string; paramKeys: string[]; }
interface RemoteTemplate { name: string; language: string; bodyText: string; paramCount: number; }
interface TeamMember { id: string; name: string; }

interface ChatInboxProps {
  tenantId: string;
  currentUserId: string;
  whatsappConnected: boolean;
  templates: TemplateDef[];
  teamMembers: TeamMember[];
  initialConversationId: string | null;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
const STATUS_LABEL: Record<string, string> = { pending: "Pendente", confirmed: "Confirmada", cancelled: "Cancelada", refunded: "Reembolsada", completed: "Concluída" };
type Filter = "all" | "open" | "closed" | "mine";

const ATTACHMENT_ACCEPT = [
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "audio/aac", "audio/amr", "audio/mpeg", "audio/mp4", "audio/ogg", "audio/opus", "audio/webm",
  "video/mp4", "video/3gpp", "video/webm",
  "application/pdf", "text/plain",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
].join(",");

function mediaTypeFromFile(file: File): ChatMediaType {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("video/")) return "video";
  return "document";
}

function MediaBubble({ message }: { message: Message }) {
  if (!message.media_url) return null;
  if (message.type === "image" || message.type === "sticker") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <a href={message.media_url} target="_blank" rel="noopener noreferrer"><img src={message.media_url} alt={message.body ?? "imagem"} className="mb-1 max-h-60 rounded-lg object-contain" /></a>
    );
  }
  if (message.type === "video") {
    return <video src={message.media_url} controls className="mb-1 max-h-60 max-w-full rounded-lg" />;
  }
  if (message.type === "audio") {
    return <audio src={message.media_url} controls className="mb-1 w-64 max-w-full" />;
  }
  return (
    <a href={message.media_url} target="_blank" rel="noopener noreferrer" className="mb-1 flex items-center gap-1 underline">
      <FileText className="h-3.5 w-3.5" /> Abrir arquivo
    </a>
  );
}

function MsgStatus({ status }: { status: string | null }) {
  if (status === "failed") return <AlertCircle className="h-3 w-3 text-red-200" />;
  if (status === "read") return <CheckCheck className="h-3.5 w-3.5 text-white" />;
  if (status === "delivered") return <CheckCheck className="h-3.5 w-3.5 text-sky-200/80" />;
  return <Check className="h-3 w-3 text-sky-200/80" />; // sent / desconhecido
}

export function ChatInbox({ tenantId, currentUserId, whatsappConnected, templates, teamMembers, initialConversationId }: ChatInboxProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [activeId, setActiveId] = useState<string | null>(initialConversationId);

  const [messages, setMessages] = useState<Message[]>([]);
  const [withinWindow, setWithinWindow] = useState(true);
  const [customer, setCustomer] = useState<{ id: string; name: string; email: string } | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [conv, setConv] = useState<Conversation | null>(null);
  const [lead, setLead] = useState<{ id: string; status: string } | null>(null);

  const [text, setText] = useState("");
  const [templateKey, setTemplateKey] = useState("");
  const [templateParams, setTemplateParams] = useState<Record<string, string>>({});
  const [remoteTemplates, setRemoteTemplates] = useState<RemoteTemplate[]>([]);
  const [remoteName, setRemoteName] = useState("");
  const [remoteParams, setRemoteParams] = useState<string[]>([]);
  const [noteText, setNoteText] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [convertForm, setConvertForm] = useState<{ target: "customer" | "lead"; name: string; email: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function sendAttachment(file: File) {
    if (!activeId) return;
    setError(null);
    if (!withinWindow) {
      setError("Midia so pode ser enviada dentro da janela de 24h. Use um modelo aprovado.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setUploading(true);
    try {
      const mediaType = mediaTypeFromFile(file);
      const fd = new FormData();
      fd.append("file", file);
      fd.append("tenant_id", tenantId);
      fd.append("folder", "whatsapp");
      const up = await fetch("/api/upload", { method: "POST", body: fd });
      const upData = await up.json().catch(() => ({}));
      if (!up.ok || !upData.url) { setError(upData.error ?? "Erro ao enviar o arquivo."); return; }
      const res = await fetch("/api/conversations/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, conversation_id: activeId, media_url: upData.url, media_type: mediaType, filename: file.name, body: text.trim() || undefined }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setError(d.error ?? "Erro ao enviar o arquivo."); return; }
      setText(""); loadThread(activeId); loadConversations();
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const loadConversations = useCallback(async () => {
    const res = await fetch(`/api/conversations/list?tenant_id=${tenantId}`);
    if (res.ok) setConversations((await res.json()).conversations ?? []);
  }, [tenantId]);

  const loadThread = useCallback(async (id: string) => {
    const res = await fetch(`/api/conversations/messages?tenant_id=${tenantId}&conversation_id=${id}`);
    if (!res.ok) return;
    const d = await res.json();
    setMessages(d.messages ?? []); setWithinWindow(d.withinWindow); setCustomer(d.customer ?? null);
    setBookings(d.bookings ?? []); setNotes(d.notes ?? []); setConv(d.conversation ?? null); setLead(d.lead ?? null);
  }, [tenantId]);

  // Puxa os modelos aprovados do tenant no 360dialog (uma vez).
  useEffect(() => {
    fetch(`/api/integrations/whatsapp/templates?tenant_id=${tenantId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.templates) setRemoteTemplates(d.templates); })
      .catch(() => {});
  }, [tenantId]);

  // Polling de segurança (lento) — o Realtime abaixo cobre o tempo real.
  useEffect(() => { loadConversations(); const i = setInterval(loadConversations, 25000); return () => clearInterval(i); }, [loadConversations]);
  useEffect(() => { if (!activeId) return; loadThread(activeId); const i = setInterval(() => loadThread(activeId), 25000); return () => clearInterval(i); }, [activeId, loadThread]);

  // Realtime (websocket): mensagens/conversas novas chegam na hora, sem polling
  // pesado. Respeita o RLS — cada usuário só recebe eventos do próprio tenant.
  const activeRef = useRef<string | null>(activeId);
  useEffect(() => { activeRef.current = activeId; }, [activeId]);
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`inbox-${tenantId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `tenant_id=eq.${tenantId}` }, () => {
        loadConversations();
        if (activeRef.current) loadThread(activeRef.current);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations", filter: `tenant_id=eq.${tenantId}` }, () => {
        loadConversations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tenantId, loadConversations, loadThread]);
  useEffect(() => { threadEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  async function patch(fields: Record<string, unknown>) {
    if (!activeId) return;
    await fetch("/api/conversations/update", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenant_id: tenantId, conversation_id: activeId, ...fields }) });
    loadThread(activeId); loadConversations();
  }

  async function send() {
    if (sending || !activeId) return;
    setError(null);
    const payload: Record<string, unknown> = { tenant_id: tenantId, conversation_id: activeId };
    if (withinWindow) {
      if (!text.trim()) return;
      payload.body = text.trim();
    } else if (remoteTemplates.length > 0) {
      if (!remoteName) { setError("Escolha um modelo aprovado."); return; }
      const t = remoteTemplates.find((x) => x.name === remoteName);
      payload.template_name = remoteName;
      payload.template_language = t?.language ?? "pt_BR";
      payload.template_params = remoteParams;
    } else {
      if (!templateKey) { setError("Escolha um modelo."); return; }
      payload.template_key = templateKey;
      payload.params = templateParams;
    }
    setSending(true);
    const res = await fetch("/api/conversations/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const d = await res.json().catch(() => ({})); setSending(false);
    if (!res.ok) { setError(d.error ?? "Erro ao enviar."); return; }
    setText(""); setTemplateKey(""); setTemplateParams({}); setRemoteName(""); setRemoteParams([]); loadThread(activeId); loadConversations();
  }

  async function addNote() {
    if (!noteText.trim() || !activeId) return;
    await fetch("/api/conversations/note", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenant_id: tenantId, conversation_id: activeId, body: noteText.trim() }) });
    setNoteText(""); loadThread(activeId);
  }

  async function convert() {
    if (!convertForm || !activeId) return;
    setError(null);
    const res = await fetch("/api/conversations/convert", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenant_id: tenantId, conversation_id: activeId, target: convertForm.target, name: convertForm.name, email: convertForm.email, phone: conv?.phone }) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { setError(d.error ?? "Erro."); return; }
    setConvertForm(null); loadThread(activeId);
  }

  function addTag() {
    const t = tagInput.trim(); if (!t || !conv) return;
    if (!conv.tags.includes(t)) patch({ tags: [...conv.tags, t] });
    setTagInput("");
  }

  const activeTemplate = templates.find((t) => t.key === templateKey);
  const activeRemote = remoteTemplates.find((t) => t.name === remoteName);
  const visible = conversations.filter((c) =>
    filter === "all" ? true : filter === "mine" ? c.assigned_to === currentUserId : c.status === filter
  );
  return (
    <div className="flex h-full overflow-hidden rounded-xl border border-gray-200 bg-white">
      {/* ── Lista ── */}
      <aside className="flex w-72 flex-shrink-0 flex-col border-r border-gray-100">
        <div className="border-b border-gray-100 px-4 py-3">
          <h1 className="flex items-center gap-2 font-semibold text-gray-800"><MessageCircle className="h-4 w-4 text-[var(--color-primary)]" /> Atendimento</h1>
          <div className="mt-2 flex gap-1">
            {(["all", "open", "closed", "mine"] as Filter[]).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${filter === f ? "bg-sky-500 text-white" : "bg-gray-100 text-gray-600"}`}>
                {f === "all" ? "Todas" : f === "open" ? "Abertas" : f === "closed" ? "Resolvidas" : "Minhas"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {visible.length === 0 && <p className="px-4 py-10 text-center text-sm text-gray-400">Nenhuma conversa aqui.</p>}
          {visible.map((c) => (
            <button key={c.id} onClick={() => setActiveId(c.id)} className={`flex w-full items-start gap-3 border-b border-gray-50 px-4 py-3 text-left hover:bg-gray-50 ${activeId === c.id ? "bg-sky-50/60" : ""}`}>
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500"><User className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-gray-800">{c.contact_name || c.phone}</span>
                  <span className="flex-shrink-0 text-[10px] text-gray-400">{timeAgo(c.last_message_at)}</span>
                </span>
                <span className="mt-0.5 flex items-center justify-between gap-2">
                  <span className="truncate text-xs text-gray-500">{c.last_message_preview ?? ""}</span>
                  {c.unread_count > 0 && <span className="flex h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-500 px-1.5 text-[10px] font-bold text-white">{c.unread_count}</span>}
                </span>
                {c.status === "closed" && <span className="mt-1 inline-block rounded bg-gray-100 px-1.5 text-[10px] text-gray-500">Resolvida</span>}
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* ── Thread ── */}
      <section className="flex flex-1 flex-col bg-gray-50">
        {!activeId || !conv ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center text-gray-400">
            <MessageCircle className="h-10 w-10 mb-3" />
            <p className="text-sm">Selecione uma conversa.</p>
            {!whatsappConnected && <p className="mt-2 max-w-sm text-xs">Conecte o WhatsApp em <Link href="/whatsapp" className="text-sky-600 underline">WhatsApp</Link> e cole a URL do webhook.</p>}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-gray-100 bg-white px-5 py-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-gray-800">{conv.contact_name || conv.phone}</p>
                <p className="flex items-center gap-1 text-xs text-gray-400"><Phone className="h-3 w-3" /> {conv.phone}</p>
              </div>
              <button onClick={() => patch({ status: conv.status === "open" ? "closed" : "open" })} className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${conv.status === "open" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                {conv.status === "open" ? "Marcar como resolvida" : "Reabrir"}
              </button>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto px-5 py-4">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${m.direction === "outbound" ? "bg-sky-500 text-white" : "bg-white text-gray-800"}`}>
                    <MediaBubble message={m} />
                    {m.body ? <span>{m.body}</span> : !m.media_url ? <span className="italic opacity-70">[{m.type}]</span> : null}
                    <span className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] ${m.direction === "outbound" ? "text-sky-100" : "text-gray-400"}`}>
                      {timeAgo(m.created_at)}
                      {m.direction === "outbound" && <MsgStatus status={m.status} />}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={threadEndRef} />
            </div>

            <div className="border-t border-gray-100 bg-white px-4 py-3">
              {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
              {withinWindow ? (
                <div className="flex items-end gap-2">
                  <input ref={fileRef} type="file" accept={ATTACHMENT_ACCEPT} className="hidden" onChange={(e) => { const file = e.currentTarget.files?.[0]; if (file) void sendAttachment(file); }} />
                  <button onClick={() => fileRef.current?.click()} disabled={uploading || sending} title="Anexar midia" aria-label="Anexar midia" className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                  </button>
                  <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} rows={1} placeholder="Escreva uma mensagem..." className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
                  <button onClick={send} disabled={sending || !text.trim()} className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-sky-500 text-white disabled:opacity-50">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="flex items-center gap-1.5 text-xs text-amber-600"><Clock className="h-3.5 w-3.5" /> Passou de 24h — só modelo aprovado.</p>
                  {remoteTemplates.length > 0 ? (
                    <>
                      <div className="flex flex-wrap items-end gap-2">
                        <select value={remoteName} onChange={(e) => { setRemoteName(e.target.value); setRemoteParams([]); }} className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm">
                          <option value="">Escolha um modelo aprovado...</option>
                          {remoteTemplates.map((t) => <option key={t.name} value={t.name}>{t.name} ({t.language})</option>)}
                        </select>
                        {Array.from({ length: activeRemote?.paramCount ?? 0 }).map((_, i) => (
                          <input key={i} value={remoteParams[i] ?? ""} onChange={(e) => setRemoteParams((p) => { const n = [...p]; n[i] = e.target.value; return n; })} placeholder={`Variável ${i + 1}`} className="h-10 w-32 rounded-xl border border-gray-200 px-3 text-sm" />
                        ))}
                        <button onClick={send} disabled={sending || !remoteName} className="flex h-10 items-center gap-1.5 rounded-xl bg-sky-500 px-4 text-sm font-semibold text-white disabled:opacity-50">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Enviar</button>
                      </div>
                      {activeRemote?.bodyText && <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">{activeRemote.bodyText}</p>}
                    </>
                  ) : (
                    <div className="flex flex-wrap items-end gap-2">
                      <select value={templateKey} onChange={(e) => { setTemplateKey(e.target.value); setTemplateParams({}); }} className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm">
                        <option value="">Escolha um modelo...</option>
                        {templates.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                      </select>
                      {activeTemplate?.paramKeys.map((pk) => <input key={pk} value={templateParams[pk] ?? ""} onChange={(e) => setTemplateParams((p) => ({ ...p, [pk]: e.target.value }))} placeholder={pk} className="h-10 w-32 rounded-xl border border-gray-200 px-3 text-sm" />)}
                      <button onClick={send} disabled={sending || !templateKey} className="flex h-10 items-center gap-1.5 rounded-xl bg-sky-500 px-4 text-sm font-semibold text-white disabled:opacity-50">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Enviar</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {/* ── Painel de detalhes (CRM) ── */}
      {activeId && conv && (
        <aside className="hidden w-72 flex-shrink-0 flex-col gap-4 overflow-y-auto border-l border-gray-100 bg-white p-4 lg:flex">
          {/* Atribuição */}
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Atendente</p>
            <select value={conv.assigned_to ?? ""} onChange={(e) => patch({ assigned_to: e.target.value || null })} className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm">
              <option value="">Sem atendente</option>
              {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          {/* Etiquetas */}
          <div>
            <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-400"><Tag className="h-3 w-3" /> Etiquetas</p>
            <div className="flex flex-wrap gap-1.5">
              {conv.tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-700">
                  {t}<button onClick={() => patch({ tags: conv.tags.filter((x) => x !== t) })}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
            <div className="mt-1.5 flex gap-1">
              <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTag()} placeholder="nova etiqueta" className="h-8 flex-1 rounded-lg border border-gray-200 px-2 text-xs" />
              <button onClick={addTag} className="rounded-lg border border-gray-200 px-2 text-xs">+</button>
            </div>
          </div>

          {/* Cliente / Lead */}
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">CRM</p>
            <div className="space-y-1.5">
              {customer ? (
                <Link href={`/clientes/${customer.id}`} className="flex items-center justify-between rounded-lg border border-gray-100 px-2.5 py-2 text-xs hover:bg-gray-50">
                  <span className="truncate">👤 {customer.name}</span><ExternalLink className="h-3 w-3 text-gray-400" />
                </Link>
              ) : (
                <button onClick={() => setConvertForm({ target: "customer", name: conv.contact_name ?? "", email: "" })} className="flex w-full items-center gap-1.5 rounded-lg border border-dashed border-gray-200 px-2.5 py-2 text-xs text-gray-600 hover:bg-gray-50"><UserPlus className="h-3.5 w-3.5" /> Virar cliente</button>
              )}
              {lead ? (
                <Link href="/leads" className="flex items-center justify-between rounded-lg border border-gray-100 px-2.5 py-2 text-xs hover:bg-gray-50">
                  <span className="truncate">🎯 Lead vinculado</span><ExternalLink className="h-3 w-3 text-gray-400" />
                </Link>
              ) : (
                <button onClick={() => setConvertForm({ target: "lead", name: conv.contact_name ?? "", email: "" })} className="flex w-full items-center gap-1.5 rounded-lg border border-dashed border-gray-200 px-2.5 py-2 text-xs text-gray-600 hover:bg-gray-50"><UserPlus className="h-3.5 w-3.5" /> Criar lead</button>
              )}
            </div>
            {convertForm && (
              <div className="mt-2 space-y-1.5 rounded-lg border border-gray-200 p-2">
                <p className="text-xs font-medium">{convertForm.target === "customer" ? "Novo cliente" : "Novo lead"}</p>
                <input value={convertForm.name} onChange={(e) => setConvertForm({ ...convertForm, name: e.target.value })} placeholder="Nome" className="h-8 w-full rounded border border-gray-200 px-2 text-xs" />
                <input value={convertForm.email} onChange={(e) => setConvertForm({ ...convertForm, email: e.target.value })} placeholder="E-mail (obrigatório)" className="h-8 w-full rounded border border-gray-200 px-2 text-xs" />
                <div className="flex gap-1.5">
                  <button onClick={convert} className="flex-1 rounded bg-sky-500 px-2 py-1 text-xs font-semibold text-white">Salvar</button>
                  <button onClick={() => setConvertForm(null)} className="rounded border border-gray-200 px-2 py-1 text-xs">Cancelar</button>
                </div>
              </div>
            )}
          </div>

          {/* Reservas do cliente */}
          {bookings.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Reservas</p>
              <div className="space-y-1">
                {bookings.map((b) => <div key={b.id} className="rounded-lg bg-gray-50 px-2.5 py-1.5 text-[11px] text-gray-600">{b.productTitle} · {STATUS_LABEL[b.status] ?? b.status} · {formatCurrency(b.total_price, b.currency)}</div>)}
              </div>
            </div>
          )}

          {/* Notas internas */}
          <div>
            <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-400"><StickyNote className="h-3 w-3" /> Notas internas</p>
            <div className="space-y-1.5">
              {notes.map((n) => (
                <div key={n.id} className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-gray-700">
                  <p className="whitespace-pre-line">{n.body}</p>
                  <p className="mt-0.5 text-[10px] text-gray-400">{n.author} · {timeAgo(n.created_at)}</p>
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex gap-1">
              <input value={noteText} onChange={(e) => setNoteText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addNote()} placeholder="Anotar (só a equipe vê)" className="h-8 flex-1 rounded-lg border border-gray-200 px-2 text-xs" />
              <button onClick={addNote} className="rounded-lg border border-gray-200 px-2 text-xs"><Check className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
