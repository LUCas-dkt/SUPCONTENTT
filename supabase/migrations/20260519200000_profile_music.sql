-- Profile music: favorites, recent listens, now playing

create table public.profile_music (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category text not null check (category in ('favorite', 'recent', 'now_playing')),
  item_type text not null check (item_type in ('artist', 'album', 'track')),
  item_mbid text,
  item_name text not null,
  item_artist text,
  item_image text,
  item_url text,
  position integer not null default 0,
  played_at timestamptz,
  created_at timestamptz not null default now()
);

create index profile_music_user_category_idx
  on public.profile_music (user_id, category, position);

alter table public.profile_music enable row level security;

create policy "Profile music is publicly readable"
  on public.profile_music for select using (true);

create policy "Users manage own profile music"
  on public.profile_music for all using (auth.uid() = user_id);
