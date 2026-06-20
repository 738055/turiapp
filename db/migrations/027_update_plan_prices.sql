-- 027 - Update commercial plan prices
-- Keeps the internal premium tier for compatibility, but presents it as Enterprise.

update plans
set price_monthly = 110.00,
    price_yearly = 1100.00
where tier = 'basico';

update plans
set price_monthly = 250.00,
    price_yearly = 2500.00
where tier = 'pro';

update plans
set name = 'Enterprise',
    price_monthly = 600.00,
    price_yearly = 6000.00
where tier = 'premium';
