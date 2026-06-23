-- 032 - Enable pixel/tag integrations on the Basic plan
--
-- Paid traffic is core even for small operators, so Meta Pixel, TikTok Pixel,
-- Google Ads/Analytics and GTM are now available on every paid tier (not only
-- Pro/Premium). The gating in lib/plans/limits.ts reads this flag, so flipping
-- it here is all that's needed — no code change. Same pattern as migration 028,
-- which opened custom domains to Basic.
update plans
set limits = jsonb_set(coalesce(limits, '{}'::jsonb), '{pixel_integrations}', 'true'::jsonb, true),
    features = case
      when 'Pixels e tags (Meta, TikTok, Google, GTM)' = any(features) then features
      else array_append(features, 'Pixels e tags (Meta, TikTok, Google, GTM)')
    end
where tier = 'basico';
