'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MusicGrid } from '@/components/music-card'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { isFollowing, isMutualFollow, toggleFollow } from '@/lib/profile-client'
import { useAuthUser } from '@/lib/hooks/use-auth-user'
import { FollowListDialog } from '@/components/profile/follow-list-dialog'
import { messagesPath } from '@/lib/routes'
import { toast } from '@/hooks/use-toast'
import { profileMusicToMusicItem } from '@/lib/profile-utils'
import type { List, Profile, ProfileMusic, Review } from '@/lib/types'
import { coerceImageUrl } from '@/lib/lastfm'
import {
  Disc3,
  Heart,
  ListMusic,
  MessageCircle,
  Music,
  Star,
  UserPlus,
  UserMinus,
} from 'lucide-react'
interface ProfileViewProps {
  profile: Profile
  stats: { followers: number; following: number; lists: number }
  favorites: ProfileMusic[]
  recent: ProfileMusic[]
  nowPlaying: ProfileMusic | null
  lists: (List & { list_items?: { item_name: string; item_artist: string | null; item_image: string | null }[] })[]
  reviews: Review[]
  isOwnProfile: boolean
  isFollowing: boolean
  isMutualFollow: boolean
  currentUserId: string | null
}

export function ProfileView({
  profile,
  stats,
  favorites,
  recent,
  nowPlaying,
  lists,
  reviews,
  isOwnProfile,
  isFollowing: initialFollowing,
  isMutualFollow: initialMutualFollow,
  currentUserId: serverCurrentUserId,
}: ProfileViewProps) {
  const { user: authUser, isLoggedIn, authReady } = useAuthUser(
    serverCurrentUserId ? { id: serverCurrentUserId } : null,
  )
  const currentUserId = authUser?.id ?? null
  const isOwnProfileResolved = currentUserId === profile.id
  const ownProfile = authReady ? isOwnProfileResolved : isOwnProfile

  const [following, setFollowing] = useState(initialFollowing)
  const [mutualFollow, setMutualFollow] = useState(initialMutualFollow)
  const [followDialog, setFollowDialog] = useState<'followers' | 'following' | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!authReady || !isLoggedIn || !currentUserId || isOwnProfileResolved) return
    void (async () => {
      const [f, m] = await Promise.all([
        isFollowing(profile.id),
        isMutualFollow(profile.id),
      ])
      setFollowing(f)
      setMutualFollow(m)
    })()
  }, [authReady, isLoggedIn, currentUserId, isOwnProfileResolved, profile.id])

  const favoriteItems = favorites.map(profileMusicToMusicItem)
  const recentItems = recent.map(profileMusicToMusicItem)

  function handleFollow() {
    if (!currentUserId || isOwnProfileResolved) return
    startTransition(async () => {
      const result = await toggleFollow(profile.id)
      if (result.error) {
        toast({ title: 'Erreur', description: result.error, variant: 'destructive' })
        return
      }
      if (result.following !== undefined) {
        setFollowing(result.following)
        if (result.mutualFollow !== undefined) setMutualFollow(result.mutualFollow)
        toast({
          title: result.following ? 'Abonnement ajoute' : 'Abonnement retire',
          description: result.following
            ? `${profile.username} recevra une notification.`
            : undefined,
        })
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Header style Instagram */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-10">
        <Avatar className="mx-auto size-28 ring-4 ring-primary/10 md:mx-0 md:size-36">
          <AvatarImage src={profile.avatar_url ?? undefined} />
          <AvatarFallback className="text-3xl font-bold text-primary">
            {(profile.display_name || profile.username)[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col items-center gap-3 md:flex-row md:items-center">
            <h1 className="text-2xl font-bold">{profile.display_name || profile.username}</h1>
            <div className="flex flex-wrap justify-center gap-2">
              {!ownProfile && currentUserId && (
                <>
                  <Button
                    variant={following ? 'outline' : 'default'}
                    size="sm"
                    onClick={handleFollow}
                    disabled={pending}
                  >
                    {following ? (
                      <>
                        <UserMinus className="mr-1 size-4" />
                        Abonne
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-1 size-4" />
                        Suivre
                      </>
                    )}
                  </Button>
                  {mutualFollow ? (
                    <Button size="sm" variant="outline" asChild>
                      <Link href={messagesPath(profile.id)}>
                        <MessageCircle className="mr-1 size-4" />
                        Message
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled
                      title="Abonnement mutuel requis"
                    >
                      <MessageCircle className="mr-1 size-4" />
                      Message
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="mt-4 flex justify-center gap-6 md:justify-start">
            <Stat value={favoriteItems.length} label="favoris" />
            <Stat
              value={stats.followers}
              label="abonnes"
              onClick={() => setFollowDialog('followers')}
            />
            <Stat
              value={stats.following}
              label="abonnements"
              onClick={() => setFollowDialog('following')}
            />
            <Stat value={stats.lists} label="listes" />
          </div>
          {!ownProfile && currentUserId && following && !mutualFollow && (
            <p className="mt-2 text-xs text-muted-foreground">
              Suivez-vous mutuellement pour activer la messagerie.
            </p>
          )}

          <p className="mt-2 font-medium">@{profile.username}</p>
          {profile.bio && <p className="mt-2 text-muted-foreground">{profile.bio}</p>}
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-sm text-primary hover:underline"
            >
              {profile.website}
            </a>
          )}

          {nowPlaying && (
            <div className="mt-4 inline-flex items-center gap-3 rounded-xl border bg-primary/5 px-4 py-3">
              <div className="relative size-12 overflow-hidden rounded-lg bg-muted">
                {coerceImageUrl(nowPlaying.item_image) ? (
                  <Image
                    src={coerceImageUrl(nowPlaying.item_image)!}
                    alt={nowPlaying.item_name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <Music className="m-3 size-6 text-muted-foreground" />
                )}
              </div>
              <div className="text-left">
                <p className="text-xs font-medium text-primary">En ecoute maintenant</p>
                <p className="font-medium">{nowPlaying.item_name}</p>
                {nowPlaying.item_artist && (
                  <p className="text-sm text-muted-foreground">{nowPlaying.item_artist}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="favorites">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="favorites" className="gap-2">
            <Heart className="size-4" />
            Favoris
          </TabsTrigger>
          <TabsTrigger value="recent" className="gap-2">
            <Music className="size-4" />
            Ecoutes recentes
          </TabsTrigger>
          <TabsTrigger value="lists" className="gap-2">
            <ListMusic className="size-4" />
            Playlists
          </TabsTrigger>
          <TabsTrigger value="reviews" className="gap-2">
            <Star className="size-4" />
            Critiques
          </TabsTrigger>
        </TabsList>

        <TabsContent value="favorites" className="mt-6">
          {favoriteItems.length > 0 ? (
            <MusicGrid
              items={favoriteItems}
              showType={false}
              showActions={ownProfile}
              columns={5}
            />
          ) : (
            <EmptyState
              icon={Heart}
              text={
                ownProfile
                  ? 'Ajoutez des favoris depuis la recherche ou les pages artiste/album.'
                  : 'Aucun favori pour le moment.'
              }
            />
          )}
        </TabsContent>

        <TabsContent value="recent" className="mt-6">
          {recentItems.length > 0 ? (
            <MusicGrid items={recentItems} showType={false} showActions={false} variant="horizontal" />
          ) : (
            <EmptyState icon={Music} text="Aucune ecoute recente partagee." />
          )}
        </TabsContent>

        <TabsContent value="lists" className="mt-6 space-y-4">
          {lists.length > 0 ? (
            lists.map((list) => (
              <Card key={list.id}>
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold">{list.title}</h3>
                    <Badge variant="secondary">{list.item_count} morceaux</Badge>
                  </div>
                  {list.description && (
                    <p className="mb-3 text-sm text-muted-foreground">{list.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {(list.list_items ?? []).slice(0, 6).map((item, i) => (
                      <div
                        key={i}
                        className="relative size-14 overflow-hidden rounded-md bg-muted"
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
                          <Disc3 className="m-4 size-6 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <EmptyState icon={ListMusic} text="Aucune playlist publique." />
          )}
        </TabsContent>

        <TabsContent value="reviews" className="mt-6 space-y-3">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="flex gap-4 p-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xl font-bold text-primary">
                    {review.rating ?? '-'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium">{review.item_name}</p>
                    {review.item_artist && (
                      <p className="text-sm text-muted-foreground">{review.item_artist}</p>
                    )}
                    {review.title && <p className="mt-1 font-medium">{review.title}</p>}
                    {review.content && (
                      <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{review.content}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <EmptyState icon={Star} text="Aucune critique publique." />
          )}
        </TabsContent>
      </Tabs>

      {followDialog && (
        <FollowListDialog
          userId={profile.id}
          type={followDialog}
          open={Boolean(followDialog)}
          onOpenChange={(open) => !open && setFollowDialog(null)}
        />
      )}

      {ownProfile && (
        <p className="text-center text-sm text-muted-foreground">
          Astuce : sur une page artiste, album ou morceau, utilisez le menu ⋯ pour collection, liste, critique ou
          marquer en ecoute.
        </p>
      )}
    </div>
  )
}

function Stat({
  value,
  label,
  onClick,
}: {
  value: number
  label: string
  onClick?: () => void
}) {
  const content = (
    <>
      <span className="font-bold">{value}</span>{' '}
      <span className="text-muted-foreground">{label}</span>
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="text-center transition-colors hover:text-primary md:text-left"
      >
        {content}
      </button>
    )
  }

  return <div className="text-center md:text-left">{content}</div>
}

function EmptyState({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>
  text: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
      <Icon className="mb-3 size-10 text-muted-foreground opacity-50" />
      <p className="max-w-sm text-muted-foreground">{text}</p>
    </div>
  )
}
