'use client'

import { createClient } from '@/lib/supabase/client'
import type { ConversationPreview, Message, Profile } from '@/lib/types'

async function requireUser() {
  const supabase = createClient()
  if (!supabase) return { error: 'Supabase non configure' as const }

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { error: 'Non connecte' as const }

  return { supabase, user }
}

export async function getConversationsClient(): Promise<{
  conversations?: ConversationPreview[]
  error?: string
}> {
  const auth = await requireUser()
  if ('error' in auth) return { error: auth.error }
  const { supabase, user } = auth

  const { data: participations, error } = await supabase
    .from('conversation_participants')
    .select(`
      conversation_id,
      last_read_at,
      conversations (
        id,
        updated_at
      )
    `)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  if (!participations?.length) return { conversations: [] }

  const previews: ConversationPreview[] = []

  for (const p of participations) {
    const conv = p.conversations as { id: string; updated_at: string } | null
    if (!conv) continue

    const { data: others } = await supabase
      .from('conversation_participants')
      .select(`
        user_id,
        profiles (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('conversation_id', conv.id)
      .neq('user_id', user.id)
      .limit(1)

    const otherProfile = (others?.[0]?.profiles as Profile | null) ?? null
    if (!otherProfile) continue

    const { data: lastMessages } = await supabase
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        created_at,
        profiles (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: false })
      .limit(1)

    const lastMessage = (lastMessages?.[0] as Message | undefined) ?? null

    let unreadQuery = supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conv.id)
      .neq('sender_id', user.id)

    if (p.last_read_at) {
      unreadQuery = unreadQuery.gt('created_at', p.last_read_at)
    }

    const { count: unreadCount } = await unreadQuery

    previews.push({
      id: conv.id,
      updated_at: conv.updated_at,
      other_user: otherProfile,
      last_message: lastMessage,
      unread_count: unreadCount ?? 0,
    })
  }

  previews.sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  )

  return { conversations: previews }
}

export async function getMessagesClient(conversationId: string): Promise<{
  messages?: Message[]
  error?: string
}> {
  const auth = await requireUser()
  if ('error' in auth) return { error: auth.error }
  const { supabase, user } = auth

  const { data: membership } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) return { error: 'Conversation introuvable' }

  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      id,
      conversation_id,
      sender_id,
      content,
      created_at,
      profiles (
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) return { error: error.message }

  await supabase
    .from('conversation_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)

  return { messages: (messages as Message[]) ?? [] }
}

export async function sendMessageClient(
  conversationId: string,
  content: string,
): Promise<{ message?: Message; error?: string }> {
  const auth = await requireUser()
  if ('error' in auth) return { error: auth.error }
  const { supabase, user } = auth

  const trimmed = content.trim()
  if (!trimmed) return { error: 'Message vide' }
  if (trimmed.length > 2000) return { error: 'Message trop long (max 2000 caracteres)' }

  const { data: membership } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) return { error: 'Conversation introuvable' }

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: trimmed,
    })
    .select(`
      id,
      conversation_id,
      sender_id,
      content,
      created_at,
      profiles (
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .single()

  if (error) return { error: error.message }

  const { data: participants } = await supabase
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .neq('user_id', user.id)

  const recipientId = participants?.[0]?.user_id
  if (recipientId) {
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()

    await supabase.from('notifications').insert({
      user_id: recipientId,
      type: 'mention',
      title: 'Nouveau message',
      message: `@${senderProfile?.username ?? 'utilisateur'} vous a envoye un message`,
      link: `/messages?conversation=${conversationId}`,
      actor_id: user.id,
    })
  }

  return { message: message as Message }
}

export async function startConversationClient(otherUserId: string): Promise<{
  conversationId?: string
  error?: string
}> {
  const auth = await requireUser()
  if ('error' in auth) return { error: auth.error }
  const { supabase, user } = auth

  if (otherUserId === user.id) {
    return { error: 'Vous ne pouvez pas vous envoyer un message' }
  }

  const { data: conversationId, error } = await supabase.rpc(
    'get_or_create_direct_conversation',
    { participant_b: otherUserId },
  )

  if (error) return { error: error.message }

  return { conversationId: conversationId as string }
}

export async function searchUsersForMessagingClient(query: string): Promise<{
  users?: Profile[]
  error?: string
}> {
  const auth = await requireUser()
  if ('error' in auth) return { error: auth.error }
  const { supabase, user } = auth

  const trimmed = query.trim()
  if (trimmed.length < 2) return { users: [] }

  const { data: users, error } = await supabase
    .from('profiles')
    .select(
      'id, username, display_name, avatar_url, bio, website, is_admin, is_banned, theme_preference, notification_email, notification_push, created_at, updated_at',
    )
    .neq('id', user.id)
    .or(`username.ilike.%${trimmed}%,display_name.ilike.%${trimmed}%`)
    .limit(10)

  if (error) return { error: error.message }
  return { users: (users as Profile[]) ?? [] }
}
