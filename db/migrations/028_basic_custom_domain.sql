-- 028 - Allow custom domain on the Basic plan

update plans
set limits = jsonb_set(coalesce(limits, '{}'::jsonb), '{custom_domain}', 'true'::jsonb, true),
    features = case
      when 'Domínio próprio' = any(features) then features
      else array_append(features, 'Domínio próprio')
    end
where tier = 'basico';
