'use client'

import Link from 'next/link'
import { useCallback } from 'react'
import { profilePath, safeInternalPath } from '@/lib/routes'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Bell, UserPlus, Heart, MessageCircle, AtSign } from 'lucide-react'
import { ProtectedDataPage } from '@/components/pages/protected-data-page'
import { requireUser } from '@/lib/authed-client'

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  follow: UserPlus,
  like_review: Heart,
  like_list: Heart,
  mention: AtSign,
  new_review: Bell,
  new_list: Bell,
}

type NotificationRow = {
  id: string
  type: string
  title: string
  message: string | null
  link: string | null
  is_read: boolean
  created_at: string
  actor: {
    username: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

async function loadNotifications(): Promise<{ data?: NotificationRow[]; error?: string }> {
  const auth = await requireUser()
  if ('error' in auth) return { error: auth.error }
  const { supabase, user } = auth

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select(`
      *,
      actor:profiles!notifications_actor_id_fkey (
        id, username, display_name, avatar_url
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return { error: error.message }

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return { data: (notifications ?? []) as NotificationRow[] }
}

function NotificationsList({ notifications }: { notifications: NotificationRow[] }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 flex items-center gap-2 text-3xl font-bold">
        <Bell className="size-8 text-primary" />
        Notifications
      </h1>
      {!notifications.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucune notification pour le moment.
            <p className="mt-2 text-sm">
              Vous serez notifie quand quelqu&apos;un vous suit, aime une critique ou vous envoie un message.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => {
            const Icon = TYPE_ICONS[n.type] ?? Bell
            const actor = n.actor

            return (
              <li key={n.id}>
                <Card className={!n.is_read ? 'border-primary/30 bg-primary/5' : undefined}>
                  <CardContent className="flex gap-3 p-4">
                    {actor ? (
                      <Link href={profilePath(actor.username)}>
                        <Avatar className="size-10">
                          <AvatarImage src={actor.avatar_url ?? undefined} />
                          <AvatarFallback>{actor.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </Link>
                    ) : (
                      <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                        <Icon className="size-5 text-primary" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{n.title}</p>
                      {n.message && <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(n.created_at).toLocaleString('fr-FR')}
                      </p>
                      {n.link && (
                        <Link
                          href={safeInternalPath(n.link, '/notifications')}
                          className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          {n.type === 'mention' && n.link.includes('/messages') ? (
                            <>
                              <MessageCircle className="size-3.5" />
                              Ouvrir la conversation
                            </>
                          ) : (
                            'Voir le profil'
                          )}
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export function NotificationsPageClient() {
  const load = useCallback(loadNotifications, [])

  return (
    <ProtectedDataPage redirectPath="/notifications" load={load}>
      {(notifications) => <NotificationsList notifications={notifications} />}
    </ProtectedDataPage>
  )
}
