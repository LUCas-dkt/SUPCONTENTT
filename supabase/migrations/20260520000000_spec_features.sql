-- Statuts bibliothèque (à écouter, en cours, terminé, abandonné)
create table public.library_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_type text not null check (item_type in ('artist', 'album', 'track')),
  item_mbid text,
  item_name text not null,
  item_artist text,
  item_image text,
  item_url text,
  status text not null check (
    status in ('to_listen', 'in_progress', 'completed', 'abandoned')
  ) default 'to_listen',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, item_type, item_name, item_artist)
);

-- Likes sur critiques
create table public.review_likes (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (review_id, user_id)
);

-- Commentaires sur critiques
create table public.review_comments (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Signalements
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('review', 'comment', 'profile')),
  target_id uuid not null,
  reason text not null check (reason in ('spoiler', 'insult', 'spam', 'other')),
  details text,
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  resolved_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Cache métadonnées API tierce
create table public.media_cache (
  cache_key text primary key,
  payload jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index library_items_user_status_idx on public.library_items (user_id, status);
create index review_comments_review_id_idx on public.review_comments (review_id);
create index reports_status_idx on public.reports (status);
create index media_cache_expires_idx on public.media_cache (expires_at);

alter table public.library_items enable row level security;
alter table public.review_likes enable row level security;
alter table public.review_comments enable row level security;
alter table public.reports enable row level security;
alter table public.media_cache enable row level security;

-- Library items
create policy "Users manage own library"
  on public.library_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Public library view for profiles"
  on public.library_items for select
  using (true);

-- Review likes
create policy "Review likes are public"
  on public.review_likes for select using (true);

create policy "Users manage own review likes"
  on public.review_likes for insert
  with check (auth.uid() = user_id);

create policy "Users delete own review likes"
  on public.review_likes for delete
  using (auth.uid() = user_id);

-- Review comments
create policy "Review comments are public"
  on public.review_comments for select using (true);

create policy "Users create comments"
  on public.review_comments for insert
  with check (auth.uid() = user_id);

create policy "Users update own comments"
  on public.review_comments for update
  using (auth.uid() = user_id);

create policy "Users delete own comments"
  on public.review_comments for delete
  using (auth.uid() = user_id);

-- Reports
create policy "Users create reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

create policy "Admins view reports"
  on public.reports for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
    or auth.uid() = reporter_id
  );

create policy "Admins update reports"
  on public.reports for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Media cache (service role / server only in practice)
create policy "Media cache readable by authenticated"
  on public.media_cache for select
  using (auth.role() = 'authenticated' or auth.role() = 'service_role');

create policy "Media cache writable by service"
  on public.media_cache for all
  using (auth.role() = 'service_role');

-- Messagerie : abonnement mutuel requis
create or replace function public.are_mutual_followers(user_a uuid, user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.follows f1
    join public.follows f2
      on f1.follower_id = f2.following_id
     and f1.following_id = f2.follower_id
    where f1.follower_id = user_a and f1.following_id = user_b
  );
$$;

create or replace function public.get_or_create_direct_conversation(participant_b uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  conversation_id uuid;
begin
  current_user_id := auth.uid();
  if current_user_id is null then
    raise exception 'Non authentifie';
  end if;
  if participant_b = current_user_id then
    raise exception 'Conversation avec soi-meme impossible';
  end if;
  if not exists (select 1 from public.profiles where id = participant_b) then
    raise exception 'Utilisateur introuvable';
  end if;
  if not public.are_mutual_followers(current_user_id, participant_b) then
    raise exception 'Abonnement mutuel requis pour envoyer un message';
  end if;

  select c.id into conversation_id
  from public.conversations c
  join public.conversation_participants cp1 on cp1.conversation_id = c.id and cp1.user_id = current_user_id
  join public.conversation_participants cp2 on cp2.conversation_id = c.id and cp2.user_id = participant_b
  where c.is_group = false
  limit 1;

  if conversation_id is not null then
    return conversation_id;
  end if;

  insert into public.conversations (is_group) values (false) returning id into conversation_id;
  insert into public.conversation_participants (conversation_id, user_id) values
    (conversation_id, current_user_id),
    (conversation_id, participant_b);

  return conversation_id;
end;
$$;

grant execute on function public.are_mutual_followers(uuid, uuid) to authenticated;
grant execute on function public.get_or_create_direct_conversation(uuid) to authenticated;
