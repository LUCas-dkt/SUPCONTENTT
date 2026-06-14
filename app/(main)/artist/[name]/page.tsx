import Link from 'next/link'
import { MusicArtwork } from '@/components/music-artwork'
import { ArtistActions } from '@/components/artist/artist-actions'
import { notFound, redirect } from 'next/navigation'
import { isValidSlug } from '@/lib/routes'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MusicGrid, MusicCard } from '@/components/music-card'
import { getArtistInfo, getArtistTopTracks, getArtistTopAlbums, getSimilarArtists, normalizeArtist, normalizeAlbum, normalizeTrack, resolveArtistImage, formatNumber, toLastFmArray } from '@/lib/lastfm'
import { Mic2, Users, Play, Disc3, Music } from 'lucide-react'
import type { Metadata } from 'next'

interface ArtistPageProps {
  params: Promise<{ name: string }>
}

export async function generateMetadata({ params }: ArtistPageProps): Promise<Metadata> {
  const { name } = await params
  const artistName = decodeURIComponent(name)
  
  return {
    title: artistName,
    description: `Decouvrez ${artistName} sur SUPCONTENT - albums, morceaux populaires et artistes similaires.`,
  }
}

export default async function ArtistPage({ params }: ArtistPageProps) {
  const { name } = await params
  const artistName = decodeURIComponent(name)
  if (!isValidSlug(artistName)) redirect('/search')

  const [artist, topTracks, topAlbums, similar] = await Promise.all([
    getArtistInfo(artistName),
    getArtistTopTracks(artistName, 10),
    getArtistTopAlbums(artistName, 12),
    getSimilarArtists(artistName, 8)
  ])

  if (!artist) {
    notFound()
  }

  const image = resolveArtistImage(artist, topAlbums)
  const artistItem = normalizeArtist(artist, image)
  const listeners = parseInt(artist.stats?.listeners || artist.listeners || '0', 10)
  const playcount = parseInt(artist.stats?.playcount || artist.playcount || '0', 10)
  const bio = artist.bio?.summary?.replace(/<[^>]*>/g, '') || null
  const tags = toLastFmArray(artist.tags?.tag).map((t) => t.name)

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/10 to-background">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
            {/* Artist Image */}
            <div className="relative size-48 flex-shrink-0 overflow-hidden rounded-full bg-muted shadow-xl md:size-64">
              <MusicArtwork
                src={image}
                alt={artist.name}
                itemType="artist"
                sizes="256px"
              />
            </div>

            {/* Artist Info */}
            <div className="flex flex-1 flex-col items-center text-center md:items-start md:text-left">
              <Badge variant="secondary" className="mb-2">
                <Mic2 className="mr-1 size-3" />
                Artiste
              </Badge>
              <h1 className="mb-4 text-4xl font-bold md:text-5xl">{artist.name}</h1>
              
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

              <ArtistActions item={artistItem} lastFmUrl={artist.url} />
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto w-full max-w-7xl px-4 py-8">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
            <TabsTrigger value="albums">
              <Disc3 className="mr-2 size-4" />
              Albums
            </TabsTrigger>
            <TabsTrigger value="tracks">
              <Music className="mr-2 size-4" />
              Morceaux
            </TabsTrigger>
            <TabsTrigger value="similar">
              <Users className="mr-2 size-4" />
              Similaires
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Bio */}
            {bio && (
              <Card>
                <CardHeader>
                  <CardTitle>Biographie</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line text-muted-foreground">{bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Top Tracks */}
            {topTracks.length > 0 && (
              <div>
                <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                  <Music className="size-5 text-primary" />
                  Morceaux populaires
                </h2>
                <div className="space-y-2">
                  {topTracks.slice(0, 5).map((track, index) => (
                    <MusicCard 
                      key={`${track.name}-${index}`}
                      item={{
                        ...normalizeTrack(track),
                        artist: artist.name
                      }} 
                      variant="horizontal"
                      showType={false}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Top Albums */}
            {topAlbums.length > 0 && (
              <div>
                <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                  <Disc3 className="size-5 text-primary" />
                  Albums populaires
                </h2>
                <MusicGrid 
                  items={topAlbums.slice(0, 5).map(a => ({
                    ...normalizeAlbum(a),
                    artist: artist.name
                  }))} 
                  showType={false}
                  columns={5}
                />
              </div>
            )}

            {/* Similar Artists */}
            {similar.length > 0 && (
              <div>
                <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                  <Users className="size-5 text-primary" />
                  Artistes similaires
                </h2>
                <MusicGrid 
                  items={similar.slice(0, 4).map((a) => normalizeArtist(a))} 
                  showType={false}
                  columns={4}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="albums">
            {topAlbums.length > 0 ? (
              <MusicGrid 
                items={topAlbums.map(a => ({
                  ...normalizeAlbum(a),
                  artist: artist.name
                }))} 
                showType={false}
                columns={5}
              />
            ) : (
              <p className="py-10 text-center text-muted-foreground">Aucun album trouve</p>
            )}
          </TabsContent>

          <TabsContent value="tracks">
            {topTracks.length > 0 ? (
              <div className="space-y-2">
                {topTracks.map((track, index) => (
                  <MusicCard 
                    key={`${track.name}-${index}`}
                    item={{
                      ...normalizeTrack(track),
                      artist: artist.name
                    }} 
                    variant="horizontal"
                    showType={false}
                  />
                ))}
              </div>
            ) : (
              <p className="py-10 text-center text-muted-foreground">Aucun morceau trouve</p>
            )}
          </TabsContent>

          <TabsContent value="similar">
            {similar.length > 0 ? (
              <MusicGrid 
                items={similar.map(normalizeArtist)} 
                showType={false}
                columns={4}
              />
            ) : (
              <p className="py-10 text-center text-muted-foreground">Aucun artiste similaire trouve</p>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  )
}
