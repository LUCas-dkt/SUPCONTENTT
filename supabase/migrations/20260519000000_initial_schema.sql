-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  website text,
  is_admin boolean not null default false,
  is_banned boolean not null default false,
  theme_preference text not null default 'system',
  notification_email boolean not null default true,
  notification_push boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Collections
create table public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text,
  cover_url text,
  is_public boolean not null default false,
  item_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections (id) on delete cascade,
  item_type text not null check (item_type in ('artist', 'album', 'track')),
  item_mbid text,
  item_name text not null,
  item_artist text,
  item_image text,
  item_url text,
  position integer not null default 0,
  notes text,
  added_at timestamptz not null default now()
);

-- Lists
create table public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  cover_url text,
  is_public boolean not null default false,
  is_ranked boolean not null default false,
  item_count integer not null default 0,
  likes_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  item_type text not null check (item_type in ('artist', 'album', 'track')),
  item_mbid text,
  item_name text not null,
  item_artist text,
  item_image text,
  item_url text,
  position integer not null default 0,
  comment text,
  added_at timestamptz not null default now()
);

-- Reviews
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_type text not null check (item_type in ('artist', 'album', 'track')),
  item_mbid text,
  item_name text not null,
  item_artist text,
  item_image text,
  item_url text,
  rating integer check (rating >= 1 and rating <= 10),
  title text,
  content text,
  is_public boolean not null default true,
  likes_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Social
create table public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, following_id),
  check (follower_id <> following_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (
    type in ('follow', 'like_review', 'like_list', 'new_review', 'new_list', 'mention')
  ),
  title text not null,
  message text,
  link text,
  actor_id uuid references public.profiles (id) on delete set null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('review', 'list', 'collection', 'follow', 'like')),
  target_type text,
  target_id uuid,
  target_name text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  final_username text;
  suffix integer := 0;
begin
  base_username := lower(
    regexp_replace(
      coalesce(
        nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
        nullif(trim(split_part(new.email, '@', 1)), ''),
        'user'
      ),
      '[^a-z0-9_]',
      '',
      'g'
    )
  );

  if base_username = '' then
    base_username := 'user';
  end if;

  final_username := base_username;

  while exists (select 1 from public.profiles where username = final_username) loop
    suffix := suffix + 1;
    final_username := base_username || suffix::text;
  end loop;

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    final_username,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;
alter table public.lists enable row level security;
alter table public.list_items enable row level security;
alter table public.reviews enable row level security;
alter table public.follows enable row level security;
alter table public.notifications enable row level security;
alter table public.activities enable row level security;

-- Profiles policies
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Collections policies
create policy "Public collections are viewable"
  on public.collections for select using (is_public or auth.uid() = user_id);

create policy "Users manage own collections"
  on public.collections for all using (auth.uid() = user_id);

-- Collection items policies
create policy "Collection items viewable with collection"
  on public.collection_items for select using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and (c.is_public or c.user_id = auth.uid())
    )
  );

create policy "Users manage own collection items"
  on public.collection_items for all using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

-- Lists policies
create policy "Public lists are viewable"
  on public.lists for select using (is_public or auth.uid() = user_id);

create policy "Users manage own lists"
  on public.lists for all using (auth.uid() = user_id);

-- List items policies
create policy "List items viewable with list"
  on public.list_items for select using (
    exists (
      select 1 from public.lists l
      where l.id = list_id and (l.is_public or l.user_id = auth.uid())
    )
  );

create policy "Users manage own list items"
  on public.list_items for all using (
    exists (
      select 1 from public.lists l
      where l.id = list_id and l.user_id = auth.uid()
    )
  );

-- Reviews policies
create policy "Public reviews are viewable"
  on public.reviews for select using (is_public or auth.uid() = user_id);

create policy "Users manage own reviews"
  on public.reviews for all using (auth.uid() = user_id);

-- Follows policies
create policy "Follows are viewable by everyone"
  on public.follows for select using (true);

create policy "Users manage own follows"
  on public.follows for insert with check (auth.uid() = follower_id);

create policy "Users delete own follows"
  on public.follows for delete using (auth.uid() = follower_id);

-- Notifications policies
create policy "Users view own notifications"
  on public.notifications for select using (auth.uid() = user_id);

create policy "Users update own notifications"
  on public.notifications for update using (auth.uid() = user_id);

-- Activities policies
create policy "Activities are viewable by everyone"
  on public.activities for select using (true);

create policy "Users create own activities"
  on public.activities for insert with check (auth.uid() = user_id);

-- Indexes
create index profiles_username_idx on public.profiles (username);
create index collections_user_id_idx on public.collections (user_id);
create index lists_user_id_idx on public.lists (user_id);
create index lists_likes_count_idx on public.lists (likes_count desc);
create index reviews_created_at_idx on public.reviews (created_at desc);
create index reviews_is_public_idx on public.reviews (is_public) where is_public = true;
create index notifications_user_id_idx on public.notifications (user_id, is_read);
