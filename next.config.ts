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

const PREVIEW_CHILD_FRAME_SOURCES = Array.from(
  new Set(
    [
      toHttpsSource(PLATFORM_HOST),
      toHttpsSource(`*.${PLATFORM_HOST}`),
      toHttpsSource(ADMIN_HOST),
      toHttpsSource(APP_HOST),
      ...EXTRA_PREVIEW_FRAME_HOSTS.map(toHttpsSource),
    ].filter((source): source is string => Boolean(source))
  )
).join(" ");

const ALLOWED_FRAME_ANCESTORS = Array.from(
  new Set(
    [
      toHttpsSource(PLATFORM_HOST),
      toHttpsSource(ADMIN_HOST),
      toHttpsSource(APP_HOST),
      ...EXTRA_PREVIEW_FRAME_HOSTS.map(toHttpsSource),
    ].filter((source): source is string => Boolean(source))
  )
).join(" ");

const CSP = [
  "default-src 'self'",
  // Scripts: self + inline (needed for Next.js) + known CDNs
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net https://analytics.tiktok.com https://www.googletagmanager.com https://www.google-analytics.com https://js.stripe.com",
  // Styles: self + inline (Tailwind/CSS-in-JS)
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Fonts
  "font-src 'self' https://fonts.gstatic.com",
  // Images
  "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://www.facebook.com https://www.google-analytics.com",
  // Connect (API calls, Supabase realtime)
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://api.mercadopago.com https://www.google-analytics.com https://analytics.google.com",
  // Frames: Stripe + tenant storefront previews. Embedding is still restricted by frame-ancestors.
  `frame-src 'self' https://js.stripe.com https://hooks.stripe.com ${PREVIEW_CHILD_FRAME_SOURCES}`,
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
