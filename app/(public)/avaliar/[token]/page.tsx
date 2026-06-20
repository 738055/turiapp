import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { hashReviewToken } from "@/lib/reviews/token";
import { ReviewForm } from "@/components/public/ReviewForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AvaliarPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  const service = createServiceClient();
  const { data: review } = await service
    .from("reviews")
    .select("id, tenant_id, submitted_at, customer_name, products(title)")
    .eq("token_hash", hashReviewToken(token))
    .maybeSingle();

  // Bind to the host's tenant so a token only resolves on its own storefront.
  if (!review || (tenantId && review.tenant_id !== tenantId)) notFound();

  const productTitle = (review.products as unknown as { title: string } | null)?.title ?? "sua experiência";

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {review.submitted_at ? (
          <div className="rounded-2xl bg-white border p-8 text-center shadow-sm">
            <div className="text-5xl mb-3">🙏</div>
            <h1 className="text-xl font-bold text-gray-900">Avaliação já enviada</h1>
            <p className="text-sm text-gray-500 mt-2">Obrigado pelo seu feedback!</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white border p-8 shadow-sm">
            <h1 className="text-xl font-bold text-gray-900 text-center">Como foi sua experiência?</h1>
            <p className="text-sm text-gray-500 text-center mt-1 mb-6">{productTitle}</p>
            <ReviewForm token={token} />
          </div>
        )}
      </div>
    </main>
  );
}
