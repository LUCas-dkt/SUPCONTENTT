-- Notifications : autoriser la creation quand l'utilisateur connecte est l'acteur
create policy "Users create notifications as actor"
  on public.notifications for insert
  with check (actor_id = auth.uid());

-- Messagerie : corriger RPC (colonne is_group absente)
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

  select cp1.conversation_id into conversation_id
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

  if conversation_id is not null then
    return conversation_id;
  end if;

  insert into public.conversations default values returning id into conversation_id;

  insert into public.conversation_participants (conversation_id, user_id) values
    (conversation_id, current_user_id),
    (conversation_id, participant_b);

  return conversation_id;
end;
$$;

grant execute on function public.get_or_create_direct_conversation(uuid) to authenticated;

-- Realtime sur les notifications
alter table public.notifications replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
end;
$$;
