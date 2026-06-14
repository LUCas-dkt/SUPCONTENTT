'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Users } from 'lucide-react'
import { getActivityFeed } from '@/lib/social-client'
import { useAuthUser, type AuthUser } from '@/lib/hooks/use-auth-user'

type Activity = {
  id: string
  type: string
  target_name: string | null
  created_at: string
  profiles: { username: string; display_name: string | null } | null
  metadata?: Record<string, unknown>
}

export function ActivityFeedSection({ serverUser }: { serverUser: AuthUser | null }) {
  const { isLoggedIn, authReady } = useAuthUser(serverUser)
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    if (!authReady || !isLoggedIn) return
    void getActivityFeed().then((feed) => {
      if (feed.activities) setActivities(feed.activities as Activity[])
    })
  }, [authReady, isLoggedIn])

  if (!authReady || !isLoggedIn || activities.length === 0) return null

  return (
    <section className="border-b py-16">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
          <Users className="size-6 text-primary" />
          Fil d&apos;actualite
        </h2>
        <div className="space-y-3">
          {activities.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4 text-sm">
                <span className="font-medium">@{a.profiles?.username ?? 'user'}</span>
                {' — '}
                {a.type === 'review' && <>a note <strong>{a.target_name}</strong></>}
                {a.type === 'follow' && <>suit un nouveau profil</>}
                {a.type === 'collection' && <>a mis a jour sa bibliotheque ({a.target_name})</>}
                {a.type === 'like' && <>a aime une critique</>}
                <span className="ml-2 text-muted-foreground">
                  {new Date(a.created_at).toLocaleDateString('fr-FR')}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
