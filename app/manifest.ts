import type { MetadataRoute } from "next";

// PWA manifest for the TuriApp panel (app.turiapp.com.br). The panel is shared
// across tenants (tenant is resolved by membership, not host), so a single
// branded manifest is correct here.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TuriApp — Painel",
    short_name: "TuriApp",
    description: "Gerencie reservas, clientes e produtos da sua loja de turismo.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0ea5e9",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
