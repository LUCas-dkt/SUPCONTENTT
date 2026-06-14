-- Messaging: direct conversations between users

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversation_participants (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0 and char_length(content) <= 2000),
  created_at timestamptz not null default now()
);

create index messages_conversation_created_idx
  on public.messages (conversation_id, created_at desc);

create index conversation_participants_user_idx
  on public.conversation_participants (user_id);

-- Update conversation timestamp on new message
create or replace function public.update_conversation_timestamp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger on_message_created
  after insert on public.messages
  for each row
  execute function public.update_conversation_timestamp();

-- Find or create a 1:1 conversation
create or replace function public.get_or_create_direct_conversation(participant_b uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  conv_id uuid;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if participant_b = current_user_id then
    raise exception 'Cannot message yourself';
  end if;

  if not exists (select 1 from public.profiles where id = participant_b) then
    raise exception 'User not found';
  end if;

  select cp1.conversation_id into conv_id
  from public.conversation_participants cp1
  inner join public.conversation_participants cp2
    on cp1.conversation_id = cp2.conversation_id
  where cp1.user_id = current_user_id
    and cp2.user_id = participant_b
    and (
      select count(*)::int
      from public.conversation_participants cp3
      where cp3.conversation_id = cp1.conversation_id
    ) = 2
  limit 1;

  if conv_id is not null then
    return conv_id;
  end if;

  insert into public.conversations default values returning id into conv_id;

  insert into public.conversation_participants (conversation_id, user_id)
  values (conv_id, current_user_id), (conv_id, participant_b);

  return conv_id;
end;
$$;

-- RLS
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

create policy "Users view own conversations"
  on public.conversations for select
  using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = id and cp.user_id = auth.uid()
    )
  );

create policy "Users view conversation participants"
  on public.conversation_participants for select
  using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversation_participants.conversation_id
        and cp.user_id = auth.uid()
    )
  );

create policy "Users view messages in their conversations"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = messages.conversation_id
        and cp.user_id = auth.uid()
    )
  );

create policy "Users send messages in their conversations"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = messages.conversation_id
        and cp.user_id = auth.uid()
    )
  );

create policy "Users update own read status"
  on public.conversation_participants for update
  using (user_id = auth.uid());

-- Realtime for live chat
alter table public.messages replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
end;
$$;
