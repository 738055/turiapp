import type { NextConfig } from "next";

const PLATFORM_HOST = cleanHost(
  process.env.NEXT_PUBLIC_PLATFORM_HOST ??
    process.env.NEXT_PUBLIC_PLATFORM_DOMAIN ??
    "turiapp.com.br"
);
const ADMIN_HOST = cleanHost(process.env.NEXT_PUBLIC_ADMIN_HOST ?? `admin.${PLATFORM_HOST}`);
const APP_HOST = cleanHost(process.env.NEXT_PUBLIC_APP_HOST ?? `app.${PLATFORM_HOST}`);
const EXTRA_PREVIEW_FRAME_HOSTS = (
  process.env.PREVIEW_FRAME_HOSTS ??
  process.env.NEXT_PUBLIC_PREVIEW_FRAME_HOSTS ??
  ""
)
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);
const VERCEL_FRAME_HOSTS = [
  process.env.VERCEL_URL,
  process.env.VERCEL_BRANCH_URL,
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
  process.env.NEXT_PUBLIC_VERCEL_URL,
].filter((host): host is string => Boolean(host));
const LOCAL_FRAME_SOURCES =
  process.env.NODE_ENV === "production"
    ? []
    : ["http://localhost:3000", "http://127.0.0.1:3000"];

const PREVIEW_CHILD_FRAME_SOURCES = Array.from(
  new Set(
    [
      toHttpsSource(PLATFORM_HOST),
      toHttpsSource(`*.${PLATFORM_HOST}`),
      toHttpsSource(`www.${PLATFORM_HOST}`),
      toHttpsSource(ADMIN_HOST),
      toHttpsSource(APP_HOST),
      ...VERCEL_FRAME_HOSTS.map(toHttpsSource),
      ...EXTRA_PREVIEW_FRAME_HOSTS.map(toHttpsSource),
      ...LOCAL_FRAME_SOURCES,
    ].filter((source): source is string => Boolean(source))
  )
).join(" ");

const ALLOWED_FRAME_ANCESTORS = Array.from(
  new Set(
    [
      toHttpsSource(PLATFORM_HOST),
      toHttpsSource(`www.${PLATFORM_HOST}`),
      toHttpsSource(ADMIN_HOST),
      toHttpsSource(APP_HOST),
      ...VERCEL_FRAME_HOSTS.map(toHttpsSource),
      ...EXTRA_PREVIEW_FRAME_HOSTS.map(toHttpsSource),
      ...LOCAL_FRAME_SOURCES,
    ].filter((source): source is string => Boolean(source))
  )
).join(" ");

// 'unsafe-eval' is only needed by the dev bundler/React refresh. Production
// builds don't eval, so we drop it there to shrink the XSS surface. 'unsafe-inline'
// stays: Next injects inline bootstrap scripts and a full nonce migration is a
// larger change tracked separately.
const SCRIPT_EVAL = process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'";

const CSP = [
  "default-src 'self'",
  // Scripts: self + inline (needed for Next.js) + known CDNs
  `script-src 'self' 'unsafe-inline'${SCRIPT_EVAL} https://connect.facebook.net https://analytics.tiktok.com https://www.googletagmanager.com https://www.google-analytics.com https://js.stripe.com`,
  // Styles: self + inline (Tailwind/CSS-in-JS)
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Fonts
  "font-src 'self' https://fonts.gstatic.com",
  // Images
  "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://www.facebook.com https://www.google-analytics.com https://*.googleusercontent.com https://*.ggpht.com https://maps.gstatic.com",
  // Connect (API calls, Supabase realtime)
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://api.mercadopago.com https://www.google-analytics.com https://analytics.google.com",
  // Frames: tenants can preview verified custom domains. Embedding is still restricted by frame-ancestors.
  `frame-src 'self' https: ${PREVIEW_CHILD_FRAME_SOURCES}`,
  `frame-ancestors 'self' ${ALLOWED_FRAME_ANCESTORS}`,
  // Media
  "media-src 'self' https://*.supabase.co",
].join("; ");

const nextConfig: NextConfig = {
  serverExternalPackages: ["mercadopago", "sharp"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
      // Disable cache on API routes
      {
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
    ];
  },
};

export default nextConfig;

function cleanHost(host: string): string {
  return host.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
}

function toHttpsSource(host: string): string | null {
  const cleaned = cleanHost(host);
  if (!/^(?:\*\.)?[a-z0-9.-]+(?::\d+)?$/i.test(cleaned)) return null;
  return `https://${cleaned}`;
}
