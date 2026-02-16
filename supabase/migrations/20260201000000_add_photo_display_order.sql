begin;

alter table public.photos
  add column if not exists display_order integer;

create index if not exists idx_photos_event_display_order
  on public.photos(event_id, display_order);

with ranked as (
  select
    id,
    row_number() over (partition by event_id order by created_at asc) as rn
  from public.photos
)
update public.photos
set display_order = ranked.rn
from ranked
where public.photos.id = ranked.id
  and public.photos.display_order is null;

notify pgrst, 'reload schema';

commit;
