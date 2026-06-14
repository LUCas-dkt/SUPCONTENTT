import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { artistPath, isValidSlug, trackPath } from '@/lib/routes'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MusicArtwork } from '@/components/music-artwork'
import { MusicItemActions } from '@/components/music/music-item-actions'
import { LibraryStatusButtons } from '@/components/music/library-status-buttons'
import { ItemReviews } from '@/components/music/item-reviews'
import { getAlbumInfo, normalizeAlbum, formatNumber, toLastFmArray } from '@/lib/lastfm'
import { getItemReviews } from '@/lib/social-actions'
import { createClient } from '@/lib/supabase/server'
import { Disc3, Users, Play, Music, Clock } from 'lucide-react'
import type { Metadata } from 'next'

interface AlbumPageProps {
  params: Promise<{ artist: string; name: string }>
}

export async function generateMetadata({ params }: AlbumPageProps): Promise<Metadata> {
  const { artist, name } = await params
  const artistName = decodeURIComponent(artist)
  const albumName = decodeURIComponent(name)
  
  return {
    title: `${albumName} - ${artistName}`,
    description: `Decouvrez l'album ${albumName} de ${artistName} sur SUPCONTENT.`,
  }
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { artist, name } = await params
  const artistName = decodeURIComponent(artist)
  const albumName = decodeURIComponent(name)
  if (!isValidSlug(artistName) || !isValidSlug(albumName)) redirect('/search')

  const supabase = await createClient()
  const user = supabase ? (await supabase.auth.getUser()).data.user : null

  const album = await getAlbumInfo(artistName, albumName)

  if (!album) {
    notFound()
  }

  const albumItem = normalizeAlbum({ ...album, artist: artistName })
  const { reviews = [], average = null } = await getItemReviews(albumItem)
  const listeners = parseInt(album.listeners || '0', 10)
  const playcount = parseInt(album.playcount || '0', 10)
  const wiki = album.wiki?.summary?.replace(/<[^>]*>/g, '') || null
  const tags = toLastFmArray(album.tags?.tag).map((t) => t.name)
  const tracks = toLastFmArray(album.tracks?.track)

  const totalDuration = tracks.reduce((acc, track) => {
    const duration = parseInt(track.duration || '0', 10)
    return acc + duration
  }, 0)

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/10 to-background">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
            {/* Album Image */}
            <div className="relative aspect-square w-64 flex-shrink-0 overflow-hidden rounded-lg bg-muted shadow-xl md:w-72">
              <MusicArtwork
                src={albumItem.image}
                alt={album.name}
                itemType="album"
                sizes="(max-width: 768px) 256px, 288px"
              />
            </div>

            {/* Album Info */}
            <div className="flex flex-1 flex-col items-center text-center md:items-start md:text-left">
              <Badge variant="secondary" className="mb-2">
                <Disc3 className="mr-1 size-3" />
                Album
              </Badge>
              <h1 className="mb-2 text-4xl font-bold md:text-5xl">{album.name}</h1>
              <Link 
                href={artistPath(artistName)}
                className="mb-4 text-xl text-muted-foreground hover:text-primary"
              >
                {artistName}
              </Link>
              
              {/* Stats */}
              <div className="mb-6 flex flex-wrap items-center justify-center gap-6 text-muted-foreground md:justify-start">
                <div className="flex items-center gap-2">
                  <Users className="size-5" />
                  <span><strong className="text-foreground">{formatNumber(listeners)}</strong> auditeurs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Play className="size-5" />
                  <span><strong className="text-foreground">{formatNumber(playcount)}</strong> ecoutes</span>
                </div>
                {tracks.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Music className="size-5" />
                    <span><strong className="text-foreground">{tracks.length}</strong> titres</span>
                  </div>
                )}
                {totalDuration > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock className="size-5" />
                    <span><strong className="text-foreground">{Math.floor(totalDuration / 60)}</strong> min</span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-2">
                  {tags.slice(0, 5).map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <MusicItemActions item={albumItem} lastFmUrl={album.url} layout="buttons" />
              {user && (
                <div className="mt-4 w-full">
                  <p className="mb-2 text-sm font-medium text-muted-foreground">Statut bibliotheque</p>
                  <LibraryStatusButtons item={albumItem} />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto w-full max-w-7xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Tracklist */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="size-5 text-primary" />
                  Liste des titres
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tracks.length > 0 ? (
                  <div className="space-y-1">
                    {tracks.map((track, index) => {
                      const duration = parseInt(track.duration || '0', 10)
                      return (
                        <Link
                          key={`${track.name}-${index}`}
                          href={trackPath(artistName, track.name)}
                          className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-accent"
                        >
                          <span className="w-6 text-center text-sm text-muted-foreground">
                            {track['@attr']?.rank || index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{track.name}</p>
                          </div>
                          {duration > 0 && (
                            <span className="text-sm text-muted-foreground">
                              {formatDuration(duration)}
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">Aucun titre disponible</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* About */}
            {wiki && (
              <Card>
                <CardHeader>
                  <CardTitle>A propos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-6 text-sm text-muted-foreground">{wiki}</p>
                </CardContent>
              </Card>
            )}

            <ItemReviews reviews={reviews} average={average} isLoggedIn={Boolean(user)} />

            {/* Artist Link */}
            <Card>
              <CardHeader>
                <CardTitle>Artiste</CardTitle>
              </CardHeader>
              <CardContent>
                <Link 
                  href={artistPath(artistName)}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent"
                >
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                    <Users className="size-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{artistName}</p>
                    <p className="text-sm text-muted-foreground">Voir le profil</p>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
