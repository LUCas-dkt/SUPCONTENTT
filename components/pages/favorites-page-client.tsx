'use client'

import Link from 'next/link'
import { useCallback } from 'react'
import { getProfileMusic } from '@/lib/profile-client'
import { profileMusicToMusicItem } from '@/lib/profile-utils'
import { MusicGrid } from '@/components/music-card'
import { Button } from '@/components/ui/button'
import { Heart, Search } from 'lucide-react'
import { ProtectedDataPage } from '@/components/pages/protected-data-page'
import { requireUser } from '@/lib/authed-client'
import { profilePath } from '@/lib/routes'

type FavoritesData = {
  username: string | null
  favoriteItems: ReturnType<typeof profileMusicToMusicItem>[]
}

async function loadFavorites(): Promise<{ data?: FavoritesData; error?: string }> {
  const auth = await requireUser()
  if ('error' in auth) return { error: auth.error }
  const { supabase, user } = auth

  const [{ data: profile }, musicResult] = await Promise.all([
    supabase.from('profiles').select('username, display_name').eq('id', user.id).single(),
    getProfileMusic(user.id, 'favorite'),
  ])

  if (musicResult.error) return { error: musicResult.error }

  return {
    data: {
      username: profile?.username ?? null,
      favoriteItems: (musicResult.items ?? []).map(profileMusicToMusicItem),
    },
  }
}

export function FavoritesPageClient() {
  const load = useCallback(loadFavorites, [])

  return (
    <ProtectedDataPage redirectPath="/favorites" load={load}>
      {({ username, favoriteItems }) => (
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-bold">
                <Heart className="size-8 text-primary" />
                Mes favoris
              </h1>
              <p className="mt-2 text-muted-foreground">
                Artistes, albums et morceaux que vous avez enregistres. Visible aussi sur votre{' '}
                {username ? (
                  <Link href={profilePath(username)} className="text-primary hover:underline">
                    profil
                  </Link>
                ) : (
                  'profil'
                )}
                .
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/search">
                <Search className="mr-2 size-4" />
                Decouvrir de la musique
              </Link>
            </Button>
          </div>

          {favoriteItems.length > 0 ? (
            <MusicGrid items={favoriteItems} showType={false} showActions columns={5} />
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
              <Heart className="mb-4 size-12 text-muted-foreground/50" />
              <p className="text-lg font-medium">Aucun favori pour le moment</p>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Sur une page artiste, album ou dans la recherche, ouvrez le menu ⋯ puis « Ajouter aux favoris ».
              </p>
              <Button className="mt-6" asChild>
                <Link href="/search">Parcourir la musique</Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </ProtectedDataPage>
  )
}
