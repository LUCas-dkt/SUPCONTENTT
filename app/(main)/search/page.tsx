'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MusicGrid } from '@/components/music-card'
import Link from 'next/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Loader2, Mic2, Disc3, Music, TrendingUp, Users, ListMusic } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import type { MusicItem } from '@/lib/types'
import { listPath, profilePath } from '@/lib/routes'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const initialType = searchParams.get('type') || 'all'

  const [query, setQuery] = useState(initialQuery)
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [activeTab, setActiveTab] = useState(initialType)
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState('relevance')
  const [accumulated, setAccumulated] = useState<{
    artists: MusicItem[]
    albums: MusicItem[]
    tracks: MusicItem[]
  }>({ artists: [], albums: [], tracks: [] })

  const { data, error, isLoading } = useSWR(
    searchQuery
      ? `/api/lastfm/search?q=${encodeURIComponent(searchQuery)}&type=${activeTab}&page=${page}&limit=20&sort=${sort}`
      : null,
    fetcher,
  )

  useEffect(() => {
    if (!data || page === 1) {
      if (data) {
        setAccumulated({
          artists: data.artists ?? [],
          albums: data.albums ?? [],
          tracks: data.tracks ?? [],
        })
      }
      return
    }
    setAccumulated((prev) => ({
      artists: [...prev.artists, ...(data.artists ?? [])],
      albums: [...prev.albums, ...(data.albums ?? [])],
      tracks: [...prev.tracks, ...(data.tracks ?? [])],
    }))
  }, [data, page])

  const {
    data: discovery,
    error: discoveryError,
    isLoading: discoveryLoading,
  } = useSWR(
    searchQuery ? null : '/api/lastfm/charts?type=artists&limit=20',
    fetcher,
  )

  const { data: platformData, isLoading: platformLoading } = useSWR(
    searchQuery && (activeTab === 'users' || activeTab === 'lists')
      ? `/api/platform/search?q=${encodeURIComponent(searchQuery)}&type=${activeTab}`
      : null,
    fetcher,
  )

  const handleSearch = useCallback((e?: React.FormEvent) => {
    e?.preventDefault()
    if (query.trim()) {
      setPage(1)
      setSearchQuery(query.trim())
      router.push(`/search?q=${encodeURIComponent(query.trim())}&type=${activeTab}`, { scroll: false })
    }
  }, [query, activeTab, router])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (searchQuery) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}&type=${value}`, { scroll: false })
    }
  }

  // Update URL when tab changes with existing search
  useEffect(() => {
    if (searchQuery && activeTab !== initialType) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}&type=${activeTab}`, { scroll: false })
    }
  }, [activeTab, searchQuery, router, initialType])

  const artists: MusicItem[] = page === 1 ? data?.artists || accumulated.artists : accumulated.artists
  const albums: MusicItem[] = page === 1 ? data?.albums || accumulated.albums : accumulated.albums
  const tracks: MusicItem[] = page === 1 ? data?.tracks || accumulated.tracks : accumulated.tracks
  const trendingArtists: MusicItem[] = discovery?.artists || []
  const hasMore = Boolean(data?.hasMore)

  const hasResults = artists.length > 0 || albums.length > 0 || tracks.length > 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold">Rechercher</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher des artistes, albums ou morceaux..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-12 pl-10 text-lg"
              autoFocus
            />
          </div>
          <Button type="submit" size="lg" disabled={isLoading || !query.trim()}>
            {isLoading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Search className="size-5" />
            )}
            <span className="ml-2 hidden sm:inline">Rechercher</span>
          </Button>
        </form>
      </div>

      {/* Results */}
      {searchQuery && (
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setPage(1)
            handleTabChange(value)
          }}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {data?.total != null ? `${data.total} resultats potentiels` : 'Resultats'}
            </p>
            {(activeTab === 'artist' || activeTab === 'album' || activeTab === 'track' || activeTab === 'all') && (
              <Select
                value={sort}
                onValueChange={(value) => {
                  setSort(value)
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Tri" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Pertinence</SelectItem>
                  <SelectItem value="listeners">Popularite</SelectItem>
                  <SelectItem value="name">Nom (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <TabsList className="mb-6">
            <TabsTrigger value="all" className="gap-2">
              <Search className="size-4" />
              Tout
            </TabsTrigger>
            <TabsTrigger value="artist" className="gap-2">
              <Mic2 className="size-4" />
              Artistes
              {artists.length > 0 && <span className="ml-1 text-xs">({artists.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="album" className="gap-2">
              <Disc3 className="size-4" />
              Albums
              {albums.length > 0 && <span className="ml-1 text-xs">({albums.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="track" className="gap-2">
              <Music className="size-4" />
              Morceaux
              {tracks.length > 0 && <span className="ml-1 text-xs">({tracks.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="size-4" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="lists" className="gap-2">
              <ListMusic className="size-4" />
              Listes
            </TabsTrigger>
          </TabsList>

          {(activeTab === 'users' || activeTab === 'lists') && platformLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : activeTab === 'users' ? (
            <TabsContent value="users" className="space-y-2">
              {(platformData?.users ?? []).map((u: { id: string; username: string; display_name: string | null; avatar_url: string | null; bio: string | null }) => (
                <Link key={u.id} href={profilePath(u.username)}>
                  <Card className="transition-colors hover:bg-accent/50">
                    <CardContent className="flex items-center gap-4 p-4">
                      <Avatar>
                        <AvatarImage src={u.avatar_url ?? undefined} />
                        <AvatarFallback>{u.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">@{u.username}</p>
                        {u.display_name && <p className="text-sm text-muted-foreground">{u.display_name}</p>}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {!platformData?.users?.length && (
                <p className="py-10 text-center text-muted-foreground">Aucun utilisateur trouve</p>
              )}
            </TabsContent>
          ) : activeTab === 'lists' ? (
            <TabsContent value="lists" className="space-y-2">
              {(platformData?.lists ?? []).map((l: { id: string; title: string; item_count: number; profiles?: { username: string } | null }) => (
                <Link key={l.id} href={listPath(l.id)}>
                  <Card className="transition-colors hover:bg-accent/50">
                    <CardContent className="p-4">
                      <p className="font-medium">{l.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {l.item_count} elements — par @{l.profiles?.username ?? 'anonyme'}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {!platformData?.lists?.length && (
                <p className="py-10 text-center text-muted-foreground">Aucune liste publique trouvee</p>
              )}
            </TabsContent>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-lg font-medium text-destructive">Une erreur est survenue</p>
              <p className="text-muted-foreground">Veuillez reessayer plus tard</p>
            </div>
          ) : !hasResults ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Search className="mb-4 size-12 text-muted-foreground" />
              <p className="text-lg font-medium">Aucun resultat pour &quot;{searchQuery}&quot;</p>
              <p className="text-muted-foreground">Essayez avec d&apos;autres mots-cles</p>
            </div>
          ) : (
            <>
              <TabsContent value="all" className="space-y-10">
                {artists.length > 0 && (
                  <section>
                    <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                      <Mic2 className="size-5 text-primary" />
                      Artistes
                    </h2>
                    <MusicGrid items={artists.slice(0, 5)} showType={false} columns={5} />
                  </section>
                )}
                {albums.length > 0 && (
                  <section>
                    <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                      <Disc3 className="size-5 text-primary" />
                      Albums
                    </h2>
                    <MusicGrid items={albums.slice(0, 5)} showType={false} columns={5} />
                  </section>
                )}
                {tracks.length > 0 && (
                  <section>
                    <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                      <Music className="size-5 text-primary" />
                      Morceaux
                    </h2>
                    <MusicGrid items={tracks.slice(0, 10)} showType={false} variant="horizontal" />
                  </section>
                )}
              </TabsContent>

              <TabsContent value="artist">
                {artists.length > 0 ? (
                  <MusicGrid items={artists} showType={false} columns={5} />
                ) : (
                  <p className="py-10 text-center text-muted-foreground">Aucun artiste trouve</p>
                )}
              </TabsContent>

              <TabsContent value="album">
                {albums.length > 0 ? (
                  <MusicGrid items={albums} showType={false} columns={5} />
                ) : (
                  <p className="py-10 text-center text-muted-foreground">Aucun album trouve</p>
                )}
              </TabsContent>

              <TabsContent value="track">
                {tracks.length > 0 ? (
                  <MusicGrid items={tracks} showType={false} variant="horizontal" />
                ) : (
                  <p className="py-10 text-center text-muted-foreground">Aucun morceau trouve</p>
                )}
              </TabsContent>

              {hasMore && activeTab !== 'users' && activeTab !== 'lists' && (
                <div className="mt-8 flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                    Charger plus
                  </Button>
                </div>
              )}
            </>
          )}
        </Tabs>
      )}

      {!searchQuery && (
        <section className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <TrendingUp className="size-5 text-primary" />
                Artistes populaires
              </h2>
              <p className="text-sm text-muted-foreground">
                Parcourez les tendances du moment ou lancez une recherche ci-dessus.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/charts">Voir toutes les tendances</Link>
            </Button>
          </div>

          {discoveryLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : discoveryError ? (
            <p className="py-10 text-center text-muted-foreground">
              Impossible de charger les artistes. Reessayez plus tard.
            </p>
          ) : trendingArtists.length > 0 ? (
            <MusicGrid items={trendingArtists} showType={false} columns={5} />
          ) : (
            <p className="py-10 text-center text-muted-foreground">
              Aucun artiste a afficher pour le moment.
            </p>
          )}
        </section>
      )}
    </div>
  )
}
