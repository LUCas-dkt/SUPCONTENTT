-- Fix infinite recursion in conversation_participants RLS policies.
-- Policies must not query the same table they protect; use a security definer helper.

create or replace function public.is_conversation_participant(p_conversation_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.conversation_participants
    where conversation_id = p_conversation_id
      and user_id = auth.uid()
  );
$$;

revoke all on function public.is_conversation_participant(uuid) from public;
grant execute on function public.is_conversation_participant(uuid) to authenticated;

drop policy if exists "Users view conversation participants" on public.conversation_participants;
drop policy if exists "Users view own conversations" on public.conversations;
drop policy if exists "Users view messages in their conversations" on public.messages;
drop policy if exists "Users send messages in their conversations" on public.messages;

create policy "Users view conversation participants"
  on public.conversation_participants for select
  using (public.is_conversation_participant(conversation_id));

create policy "Users view own conversations"
  on public.conversations for select
  using (public.is_conversation_participant(id));

create policy "Users view messages in their conversations"
  on public.messages for select
  using (public.is_conversation_participant(conversation_id));

create policy "Users send messages in their conversations"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and public.is_conversation_participant(conversation_id)
  );

grant execute on function public.get_or_create_direct_conversation(uuid) to authenticated;
