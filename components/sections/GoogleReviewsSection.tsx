import { Star } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { getGoogleReviews, type GoogleReview } from "@/lib/google/reviews";
import type { PageSection, Theme } from "@/types";

interface GoogleReviewsConfig {
  title?: string;
  subtitle?: string;
}

const DELAYS = ["", "tf-delay-1", "tf-delay-2", "tf-delay-3", "tf-delay-4", "tf-delay-5"];

function GoogleG({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.29 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

export async function GoogleReviewsSection({ section, tenantId }: { section: PageSection; theme: Theme | null; tenantId: string }) {
  const cfg = (section.config ?? {}) as GoogleReviewsConfig;

  const service = createServiceClient();
  const { data: integ } = await service
    .from("tenant_integrations")
    .select("google_place_id")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const placeId = (integ?.google_place_id as string | null) ?? null;
  if (!placeId) return null;

  const data = await getGoogleReviews(placeId);
  if (!data || data.reviews.length === 0) return null;

  const reviews = data.reviews.slice(0, 6);
  const rating = data.rating ?? averageRating(reviews);

  return (
    <section className="w-full bg-[var(--color-background)] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="tf-reveal mb-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-primary)]">
              <GoogleG className="h-4 w-4" /> Avaliacoes no Google
            </p>
            <h2 className="text-3xl font-extrabold text-[var(--color-text)] md:text-4xl" style={{ fontFamily: "var(--font-heading)" }}>
              {cfg.title || "O que dizem sobre nos no Google"}
            </h2>
            {cfg.subtitle && <p className="mt-2 text-base text-[var(--color-text)]/60">{cfg.subtitle}</p>}
          </div>

          <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
            <div className="text-center">
              <p className="text-4xl font-extrabold leading-none text-[var(--color-text)]">{rating.toFixed(1)}</p>
              <Stars value={rating} className="mt-1.5" />
            </div>
            <div className="border-l border-gray-200 pl-4">
              <GoogleG className="mb-1 h-6 w-6" />
              {data.user_ratings_total ? (
                <p className="text-xs font-medium text-gray-500">{data.user_ratings_total} avaliacoes</p>
              ) : null}
              {data.url && (
                <a href={data.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[var(--color-primary)] hover:underline">
                  Ver no Google
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review, i) => (
            <ReviewCard key={`${review.author_name}-${i}`} review={review} delay={DELAYS[i] ?? ""} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ReviewCard({ review, delay }: { review: GoogleReview; delay: string }) {
  return (
    <article className={`tf-reveal ${delay} flex flex-col rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg`}>
      <div className="mb-3 flex items-center gap-3">
        {review.profile_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={review.profile_photo_url} alt="" className="h-10 w-10 rounded-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-sm font-bold text-[var(--color-primary)]">
            {review.author_name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-gray-900">{review.author_name}</p>
          {review.relative_time_description && <p className="text-xs text-gray-400">{review.relative_time_description}</p>}
        </div>
        <GoogleG className="ml-auto h-4 w-4 shrink-0" />
      </div>
      <Stars value={review.rating} />
      <p className="mt-3 line-clamp-5 text-sm leading-relaxed text-gray-600">{review.text}</p>
    </article>
  );
}

function Stars({ value, className = "" }: { value: number; className?: string }) {
  return (
    <div className={`flex gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-4 w-4 ${value >= i ? "fill-[#fbbc05] text-[#fbbc05]" : "text-gray-200"}`} />
      ))}
    </div>
  );
}

function averageRating(reviews: GoogleReview[]): number {
  if (!reviews.length) return 0;
  return reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;
}
