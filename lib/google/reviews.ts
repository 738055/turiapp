import { unstable_cache } from "next/cache";

export interface GoogleReview {
  author_name: string;
  profile_photo_url?: string;
  rating: number;
  text: string;
  relative_time_description?: string;
}

export interface GooglePlaceReviews {
  name?: string;
  rating?: number;
  user_ratings_total?: number;
  url?: string;
  reviews: GoogleReview[];
}

const REVALIDATE_SECONDS = 6 * 60 * 60; // 6h — fresh enough, well within API quota

async function fetchPlaceReviews(placeId: string): Promise<GooglePlaceReviews | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key || !placeId) return null;

  const params = new URLSearchParams({
    place_id: placeId,
    fields: "name,rating,user_ratings_total,reviews,url",
    language: "pt-BR",
    reviews_sort: "newest",
    key,
  });

  try {
    const res = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`, {
      // unstable_cache handles cross-request caching; don't double-cache the fetch.
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { status?: string; result?: Record<string, unknown> };
    if (data.status !== "OK" || !data.result) return null;

    const r = data.result;
    const rawReviews = Array.isArray(r.reviews) ? (r.reviews as Record<string, unknown>[]) : [];
    return {
      name: typeof r.name === "string" ? r.name : undefined,
      rating: typeof r.rating === "number" ? r.rating : undefined,
      user_ratings_total: typeof r.user_ratings_total === "number" ? r.user_ratings_total : undefined,
      url: typeof r.url === "string" ? r.url : undefined,
      reviews: rawReviews
        .map((rv) => ({
          author_name: String(rv.author_name ?? "Cliente Google"),
          profile_photo_url: typeof rv.profile_photo_url === "string" ? rv.profile_photo_url : undefined,
          rating: typeof rv.rating === "number" ? rv.rating : 5,
          text: String(rv.text ?? ""),
          relative_time_description: typeof rv.relative_time_description === "string" ? rv.relative_time_description : undefined,
        }))
        .filter((rv) => rv.text.trim().length > 0),
    };
  } catch {
    return null;
  }
}

/** Cached per Place ID so a busy storefront doesn't burn Places API quota. */
export async function getGoogleReviews(placeId: string): Promise<GooglePlaceReviews | null> {
  if (!placeId) return null;
  return unstable_cache(() => fetchPlaceReviews(placeId), ["google-reviews", placeId], {
    revalidate: REVALIDATE_SECONDS,
  })();
}
