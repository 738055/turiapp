const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;

function headers() {
  return {
    Authorization: `Bearer ${VERCEL_TOKEN}`,
    "Content-Type": "application/json",
  };
}

function projectUrl(path: string) {
  const base = `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains`;
  const team = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : "";
  return `${base}${path}${team}`;
}

export interface VercelDomain {
  name: string;
  verified: boolean;
  verification?: Array<{
    type: string;
    domain: string;
    value: string;
    reason: string;
  }>;
  error?: { code: string; message: string };
}

export async function addDomainToVercel(domain: string): Promise<VercelDomain> {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    throw new Error("Vercel API token or project ID not configured.");
  }

  const res = await fetch(projectUrl(""), {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ name: domain }),
  });

  if (!res.ok) {
    const body = await res.json() as { error?: { message?: string } };
    throw new Error(body.error?.message ?? `Vercel API error: ${res.status}`);
  }

  return res.json() as Promise<VercelDomain>;
}

export async function removeDomainFromVercel(domain: string): Promise<void> {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) return;

  await fetch(projectUrl(`/${domain}`), {
    method: "DELETE",
    headers: headers(),
  });
}

export async function getDomainConfig(domain: string): Promise<VercelDomain | null> {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) return null;

  const res = await fetch(projectUrl(`/${domain}`), { headers: headers() });
  if (!res.ok) return null;
  return res.json() as Promise<VercelDomain>;
}
