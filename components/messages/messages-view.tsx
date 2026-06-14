'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  getConversationsClient,
  getMessagesClient,
  sendMessageClient,
  startConversationClient,
  searchUsersForMessagingClient,
} from '@/lib/messages-client'
import type { ConversationPreview, Message, Profile } from '@/lib/types'
import { profilePath } from '@/lib/routes'
import Link from 'next/link'
import { ArrowLeft, Loader2, MessageCircle, Plus, Search, Send, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface MessagesViewProps {
  currentUserId: string
  initialConversationId?: string
  initialUserId?: string
}

export function MessagesView({
  currentUserId,
  initialConversationId,
  initialUserId,
}: MessagesViewProps) {
  const [conversations, setConversations] = useState<ConversationPreview[]>([])
  const [activeId, setActiveId] = useState<string | null>(initialConversationId ?? null)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [loadingList, setLoadingList] = useState(true)
  const [loadingChat, setLoadingChat] = useState(false)
  const [sending, setSending] = useState(false)
  const [showNewChat, setShowNewChat] = useState(false)
  const [userQuery, setUserQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeConversation = conversations.find((c) => c.id === activeId)

  const loadConversations = useCallback(async () => {
    setLoadingList(true)
    const { conversations: list, error } = await getConversationsClient()
    if (error) setError(error)
    else if (list) setConversations(list)
    setLoadingList(false)
  }, [])

  const loadMessages = useCallback(async (conversationId: string) => {
    setLoadingChat(true)
    const { messages: list, error } = await getMessagesClient(conversationId)
    if (error) setError(error)
    else if (list) setMessages(list)
    setLoadingChat(false)
    await loadConversations()
  }, [loadConversations])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    if (!initialUserId) return
    startConversationClient(initialUserId).then(({ conversationId, error }) => {
      if (error) {
        setError(
          error.includes('mutuel')
            ? 'Abonnement mutuel requis : suivez cette personne et demandez-lui de vous suivre en retour.'
            : error,
        )
        return
      }
      if (conversationId) {
        setActiveId(conversationId)
        setError(null)
        loadConversations()
      }
    })
  }, [initialUserId, loadConversations])

  useEffect(() => {
    if (activeId) loadMessages(activeId)
    else setMessages([])
  }, [activeId, loadMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!activeId) return

    const supabase = createClient()
    if (!supabase) return

    const channel = supabase
      .channel(`messages:${activeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message
          if (newMsg.sender_id === currentUserId) return

          const { data } = await supabase
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
            .eq('id', newMsg.id)
            .single()

          if (data) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === data.id)) return prev
              return [...prev, data as Message]
            })
            await supabase
              .from('conversation_participants')
              .update({ last_read_at: new Date().toISOString() })
              .eq('conversation_id', activeId)
              .eq('user_id', currentUserId)
            loadConversations()
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeId, currentUserId, loadConversations])

  useEffect(() => {
    if (!showNewChat || userQuery.trim().length < 2) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      const { users } = await searchUsersForMessagingClient(userQuery)
      if (users) setSearchResults(users)
      setSearching(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [userQuery, showNewChat])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!activeId || !draft.trim() || sending) return

    setSending(true)
    const content = draft.trim()
    setDraft('')

    const { message, error: sendErr } = await sendMessageClient(activeId, content)
    if (message && !sendErr) {
      setMessages((prev) => [...prev, message])
      setError(null)
      loadConversations()
    } else {
      setDraft(content)
      if (sendErr) setError(sendErr)
    }
    setSending(false)
  }

  async function handleStartChat(userId: string) {
    const { conversationId, error: startErr } = await startConversationClient(userId)
    if (startErr) {
      setError(
        startErr.includes('mutuel')
          ? 'Abonnement mutuel requis : suivez cette personne et demandez-lui de vous suivre en retour.'
          : startErr,
      )
      return
    }
    if (conversationId) {
      setShowNewChat(false)
      setUserQuery('')
      setSearchResults([])
      setError(null)
      await loadConversations()
      setActiveId(conversationId)
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[500px] overflow-hidden rounded-xl border bg-card shadow-sm">
      <aside
        className={cn(
          'flex w-full flex-col border-r md:w-80 lg:w-96',
          activeId && 'hidden md:flex',
        )}
      >
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <MessageCircle className="size-5 text-primary" />
            Messages
          </h2>
          <Button
            size="icon"
            variant="outline"
            onClick={() => setShowNewChat(!showNewChat)}
            title="Nouvelle conversation"
          >
            <Plus className="size-4" />
          </Button>
        </div>

        {showNewChat && (
          <div className="border-b p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Chercher un utilisateur..."
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
            {searching && (
              <div className="flex justify-center py-3">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {searchResults.length > 0 && (
              <ScrollArea className="mt-2 max-h-40">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 hover:bg-accent"
                  >
                  <button
                    type="button"
                    onClick={() => handleStartChat(user.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <Avatar className="size-8">
                      <AvatarImage src={user.avatar_url ?? undefined} />
                      <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {user.display_name || user.username}
                      </p>
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    </div>
                  </button>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={profilePath(user.username)} title="Voir le profil">
                        <User className="size-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </ScrollArea>
            )}
          </div>
        )}

        <ScrollArea className="flex-1">
          {loadingList ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-muted-foreground">
              Aucune conversation. Cliquez sur + pour demarrer.
            </p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                type="button"
                onClick={() => setActiveId(conv.id)}
                className={cn(
                  'flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-accent/50',
                  activeId === conv.id && 'bg-accent',
                )}
              >
                <Avatar className="size-10 shrink-0">
                  <AvatarImage src={conv.other_user.avatar_url ?? undefined} />
                  <AvatarFallback>
                    {(conv.other_user.display_name || conv.other_user.username)[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">
                      {conv.other_user.display_name || conv.other_user.username}
                    </span>
                    {conv.last_message && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(conv.last_message.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm text-muted-foreground">
                      {conv.last_message
                        ? conv.last_message.sender_id === currentUserId
                          ? `Vous: ${conv.last_message.content}`
                          : conv.last_message.content
                        : 'Nouvelle conversation'}
                    </p>
                    {conv.unread_count > 0 && (
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {conv.unread_count > 9 ? '9+' : conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </ScrollArea>
      </aside>

      <div className={cn('flex flex-1 flex-col', !activeId && 'hidden md:flex')}>
        {!activeId ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
            <MessageCircle className="size-12 opacity-40" />
            <p>Selectionnez une conversation ou demarrez-en une nouvelle</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setActiveId(null)}
              >
                <ArrowLeft className="size-4" />
              </Button>
              {activeConversation && (
                <>
                  <Avatar className="size-9">
                    <AvatarImage src={activeConversation.other_user.avatar_url ?? undefined} />
                    <AvatarFallback>
                      {(activeConversation.other_user.display_name ||
                        activeConversation.other_user.username)[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {activeConversation.other_user.display_name ||
                        activeConversation.other_user.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{activeConversation.other_user.username}
                    </p>
                  </div>
                </>
              )}
            </div>

            <ScrollArea className="flex-1 p-4">
              {loadingChat ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  Envoyez le premier message !
                </p>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const isMine = msg.sender_id === currentUserId
                    return (
                      <div
                        key={msg.id}
                        className={cn('flex', isMine ? 'justify-end' : 'justify-start')}
                      >
                        <div
                          className={cn(
                            'max-w-[75%] rounded-2xl px-4 py-2 text-sm',
                            isMine
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-foreground',
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          <p
                            className={cn(
                              'mt-1 text-[10px]',
                              isMine ? 'text-primary-foreground/70' : 'text-muted-foreground',
                            )}
                          >
                            {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {error && (
              <p className="border-t bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <form onSubmit={handleSend} className="flex gap-2 border-t p-4">
              <Input
                placeholder="Ecrire un message..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={sending}
                maxLength={2000}
              />
              <Button type="submit" size="icon" disabled={sending || !draft.trim()}>
                {sending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
