-- 030 - Normalize booking status constraint used by the admin actions

alter table bookings drop constraint if exists bookings_status_check;

update bookings
set status = 'cancelled'
where status = 'canceled';

alter table bookings
  add constraint bookings_status_check
  check (status in ('pending', 'confirmed', 'cancelled', 'refunded', 'completed'));
