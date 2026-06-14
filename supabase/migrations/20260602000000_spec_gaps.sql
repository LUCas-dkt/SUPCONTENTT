-- Langue interface + critiques mises en avant (coups de coeur admin)
alter table public.profiles
  add column if not exists locale text not null default 'fr'
    check (locale in ('fr', 'en'));

alter table public.reviews
  add column if not exists is_featured boolean not null default false;

create index if not exists reviews_is_featured_idx
  on public.reviews (is_featured desc, created_at desc)
  where is_featured = true;
