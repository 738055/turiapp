import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest): Promise<Response> {
  // Strip any client-supplied tenant headers. x-tenant-id / x-tenant-slug must
  // only ever be set by the proxy's storefront branch (resolved from the Host).
  // Without this, a forged header on the app/platform host would be trusted by
  // the (public) layout — letting an attacker render an arbitrary (even
  // suspended) tenant's storefront. updateSession runs for every non-storefront
  // branch, so stripping here covers app host, platform root, SEO and /api.
  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.delete("x-tenant-id");
  forwardedHeaders.delete("x-tenant-slug");
  const forwarded = { headers: forwardedHeaders };

  let supabaseResponse = NextResponse.next({ request: forwarded });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request: forwarded });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();

  return supabaseResponse;
}
