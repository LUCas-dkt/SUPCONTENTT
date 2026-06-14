'use client'

import Link from 'next/link'
import { useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MusicArtwork } from '@/components/music-artwork'
import { Library, ListMusic } from 'lucide-react'
import { ProtectedDataPage } from '@/components/pages/protected-data-page'
import { requireUser } from '@/lib/authed-client'
import type { Collection, CollectionItem, List, ListItem } from '@/lib/types'
import { coerceImageUrl } from '@/lib/lastfm'

type CollectionsData = {
  cols: (Collection & { collection_items: CollectionItem[] })[]
  userLists: (List & { list_items: ListItem[] })[]
}

async function loadCollections(): Promise<{ data?: CollectionsData; error?: string }> {
  const auth = await requireUser()
  if ('error' in auth) return { error: auth.error }
  const { supabase, user } = auth

  const [{ data: collections }, { data: lists }] = await Promise.all([
    supabase
      .from('collections')
      .select(`*, collection_items (*)`)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),
    supabase
      .from('lists')
      .select(`*, list_items (*)`)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),
  ])

  return {
    data: {
      cols: (collections ?? []) as CollectionsData['cols'],
      userLists: (lists ?? []) as CollectionsData['userLists'],
    },
  }
}

export function CollectionsPageClient() {
  const load = useCallback(loadCollections, [])

  return (
    <ProtectedDataPage redirectPath="/collections" load={load}>
      {({ cols, userLists }) => (
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-8">
            <h1 className="flex items-center gap-2 text-3xl font-bold">
              <Library className="size-8 text-primary" />
              Ma bibliotheque
            </h1>
            <p className="mt-2 text-muted-foreground">
              Collections et listes enregistrees depuis les pages artistes, albums ou morceaux.
            </p>
          </div>

          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold">Collections</h2>
            {cols.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  Aucune collection. Utilisez le menu ⋯ sur un artiste ou album pour commencer.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {cols.map((collection) => (
                  <Card key={collection.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between gap-2">
                        <span>{collection.name}</span>
                        <Badge variant="secondary">{collection.item_count} elements</Badge>
                      </CardTitle>
                      {collection.description && (
                        <CardDescription>{collection.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {(collection.collection_items ?? []).slice(0, 6).map((ci) => (
                        <div key={ci.id} className="flex items-center gap-3 rounded-lg border p-2">
                          <div className="relative size-10 shrink-0 overflow-hidden rounded bg-muted">
                            <MusicArtwork
                              src={coerceImageUrl(ci.item_image)}
                              alt={ci.item_name}
                              itemType={ci.item_type}
                              sizes="40px"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{ci.item_name}</p>
                            {ci.item_artist && (
                              <p className="truncate text-xs text-muted-foreground">{ci.item_artist}</p>
                            )}
                          </div>
                          <Badge variant="outline" className="shrink-0 text-xs">
                            {ci.item_type}
                          </Badge>
                        </div>
                      ))}
                      {(collection.collection_items?.length ?? 0) === 0 && (
                        <p className="text-sm text-muted-foreground">Collection vide</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
              <ListMusic className="size-5" />
              Listes
            </h2>
            {userLists.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  Aucune liste. Ajoutez des morceaux via le menu ⋯ sur une page musique.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {userLists.map((list) => (
                  <Card key={list.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between gap-2">
                        <span>{list.title}</span>
                        <Badge variant="secondary">{list.item_count} elements</Badge>
                      </CardTitle>
                      {list.description && <CardDescription>{list.description}</CardDescription>}
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {(list.list_items ?? []).slice(0, 6).map((li) => (
                        <div key={li.id} className="flex items-center gap-3 rounded-lg border p-2">
                          <div className="relative size-10 shrink-0 overflow-hidden rounded bg-muted">
                            <MusicArtwork
                              src={coerceImageUrl(li.item_image)}
                              alt={li.item_name}
                              itemType={li.item_type}
                              sizes="40px"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{li.item_name}</p>
                            {li.item_artist && (
                              <p className="truncate text-xs text-muted-foreground">{li.item_artist}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            <Link href="/search" className="text-primary hover:underline">
              Rechercher de la musique
            </Link>{' '}
            pour enrichir votre bibliotheque.
          </p>
        </div>
      )}
    </ProtectedDataPage>
  )
}
