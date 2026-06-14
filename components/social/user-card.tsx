'use client'

import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Music, Disc3, Mic2, MessageCircle } from 'lucide-react'
import type { Profile, ProfileMusic } from '@/lib/types'
import { messagesPath, profilePath } from '@/lib/routes'
import { coerceImageUrl } from '@/lib/lastfm'
import Image from 'next/image'

interface UserCardProps {
  user: Profile & {
    favorites_preview?: ProfileMusic[]
    now_playing?: ProfileMusic | null
  }
  showMessage?: boolean
}

const typeIcons = { artist: Mic2, album: Disc3, track: Music }

export function UserCard({ user, showMessage = true }: UserCardProps) {
  const preview = user.favorites_preview?.slice(0, 4) ?? []
  const nowPlaying = user.now_playing

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <Link href={profilePath(user.username)} className="flex items-center gap-3">
          <Avatar className="size-14 ring-2 ring-primary/20">
            <AvatarImage src={user.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
              {(user.display_name || user.username)[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{user.display_name || user.username}</p>
            <p className="truncate text-sm text-muted-foreground">@{user.username}</p>
            {user.bio && (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{user.bio}</p>
            )}
          </div>
        </Link>

        {nowPlaying && (
          <div className="mt-3 rounded-lg bg-primary/5 px-3 py-2">
            <p className="mb-1 text-xs font-medium text-primary">En ecoute</p>
            <p className="truncate text-sm font-medium">{nowPlaying.item_name}</p>
            {nowPlaying.item_artist && (
              <p className="truncate text-xs text-muted-foreground">{nowPlaying.item_artist}</p>
            )}
          </div>
        )}

        {preview.length > 0 && (
          <div className="mt-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Favoris</p>
            <div className="flex gap-1">
              {preview.map((item) => {
                const Icon = typeIcons[item.item_type]
                return (
                  <div
                    key={item.id}
                    className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted"
                    title={item.item_name}
                  >
                    {coerceImageUrl(item.item_image) ? (
                      <Image
                        src={coerceImageUrl(item.item_image)!}
                        alt={item.item_name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <Icon className="size-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={profilePath(user.username)}>Voir le profil</Link>
          </Button>
          {showMessage && (
            <Button size="sm" className="flex-1" asChild>
              <Link href={messagesPath(user.id)}>
                <MessageCircle className="mr-1 size-4" />
                Message
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
