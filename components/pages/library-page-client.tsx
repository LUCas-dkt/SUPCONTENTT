'use client'

import Link from 'next/link'
import { useCallback } from 'react'
import { getLibraryStats, getMyLibrary } from '@/lib/social-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MusicArtwork } from '@/components/music-artwork'
import { Library, BarChart3 } from 'lucide-react'
import { ProtectedDataPage } from '@/components/pages/protected-data-page'

const STATUS_LABELS: Record<string, string> = {
  to_listen: 'A ecouter',
  in_progress: 'En cours',
  completed: 'Termine',
  abandoned: 'Abandonne',
}

type LibraryData = {
  stats: {
    to_listen: number
    in_progress: number
    completed: number
    abandoned: number
    total: number
  }
  items: {
    id: string
    item_type: string
    item_name: string
    item_artist: string | null
    item_image: string | null
    status: string
  }[]
}

async function loadLibrary(): Promise<{ data?: LibraryData; error?: string }> {
  const [statsResult, itemsResult] = await Promise.all([getLibraryStats(), getMyLibrary()])
  const error = statsResult.error ?? itemsResult.error
  if (error) return { error }
  if (!statsResult.stats) return { error: 'Donnees indisponibles' }
  return { data: { stats: statsResult.stats, items: itemsResult.items ?? [] } }
}

export function LibraryPageClient() {
  const load = useCallback(loadLibrary, [])

  return (
    <ProtectedDataPage redirectPath="/library" load={load}>
      {({ stats, items }) => {
        const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
          const key = item.status
          acc[key] = acc[key] ?? []
          acc[key].push(item)
          return acc
        }, {})

        return (
          <div className="mx-auto max-w-5xl px-4 py-8">
            <h1 className="mb-6 flex items-center gap-2 text-3xl font-bold">
              <Library className="size-8 text-primary" />
              Ma bibliotheque
            </h1>

            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <BarChart3 className="size-4" />
                    Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </CardContent>
              </Card>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <Card key={key}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{stats[key as keyof typeof stats] ?? 0}</p>
                  </CardContent>
                </Card>
              ))}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Temps estime</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {Math.round(
                      stats.completed * 40 + stats.in_progress * 20 + stats.to_listen * 3,
                    )}
                    <span className="ml-1 text-base font-normal text-muted-foreground">min</span>
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">Tout</TabsTrigger>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <TabsTrigger key={key} value={key}>
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value="all" className="mt-6 space-y-2">
                {items.map((item) => (
                  <LibraryRow key={item.id} item={item} />
                ))}
                {!items.length && (
                  <p className="text-muted-foreground">
                    Bibliotheque vide. Ajoutez des statuts depuis une fiche album.
                  </p>
                )}
              </TabsContent>
              {Object.keys(STATUS_LABELS).map((status) => (
                <TabsContent key={status} value={status} className="mt-6 space-y-2">
                  {(grouped[status] ?? []).map((item) => (
                    <LibraryRow key={item.id} item={item} />
                  ))}
                  {!grouped[status]?.length && (
                    <p className="text-muted-foreground">Aucune oeuvre dans cette categorie.</p>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )
      }}
    </ProtectedDataPage>
  )
}

function LibraryRow({
  item,
}: {
  item: {
    id: string
    item_type: string
    item_name: string
    item_artist: string | null
    item_image: string | null
    status: string
  }
}) {
  const href =
    item.item_type === 'album' && item.item_artist
      ? `/album/${encodeURIComponent(item.item_artist)}/${encodeURIComponent(item.item_name)}`
      : item.item_type === 'artist'
        ? `/artist/${encodeURIComponent(item.item_name)}`
        : item.item_artist
          ? `/track/${encodeURIComponent(item.item_artist)}/${encodeURIComponent(item.item_name)}`
          : '#'

  return (
    <Link href={href} className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-accent">
      <div className="size-12 shrink-0 overflow-hidden rounded-md">
        <MusicArtwork
          src={item.item_image}
          alt={item.item_name}
          itemType={item.item_type as 'artist' | 'album' | 'track'}
          className="size-12"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{item.item_name}</p>
        {item.item_artist && <p className="truncate text-sm text-muted-foreground">{item.item_artist}</p>}
      </div>
      <span className="text-xs text-muted-foreground">{STATUS_LABELS[item.status] ?? item.status}</span>
    </Link>
  )
}
