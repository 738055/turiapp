/**
 * Minimal error reporting that doesn't pull in a heavy SDK. Always logs a
 * structured line to stderr (captured by Vercel logs / a future Log Drain). If
 * SENTRY_DSN is configured it also POSTs a lightweight event to Sentry's store
 * endpoint — best effort, never throws, never blocks the request path.
 *
 * This is purely additive observability; it does not change any control flow.
 */
export async function reportError(
  error: unknown,
  context: { scope: string; tenantId?: string | null; metadata?: Record<string, unknown> } = { scope: "unknown" }
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  // Structured log line — greppable, picked up by any log aggregator.
  console.error(
    JSON.stringify({
      level: "error",
      scope: context.scope,
      tenant_id: context.tenantId ?? null,
      message,
      ...context.metadata,
      ts: new Date().toISOString(),
    })
  );

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  try {
    // Parse the DSN: https://<key>@<host>/<project>
    const m = dsn.match(/^https:\/\/([^@]+)@([^/]+)\/(.+)$/);
    if (!m) return;
    const [, key, host, projectId] = m;
    const endpoint = `https://${host}/api/${projectId}/store/`;

    await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${key}, sentry_client=turiapp/1.0`,
      },
      body: JSON.stringify({
        message,
        level: "error",
        platform: "node",
        timestamp: Date.now() / 1000,
        tags: { scope: context.scope, tenant_id: context.tenantId ?? undefined },
        extra: { stack, ...context.metadata },
      }),
      signal: AbortSignal.timeout(2000),
    });
  } catch {
    // Observability must never break the caller.
  }
}
