import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { albumPath, artistPath, isValidSlug } from '@/lib/routes'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MusicArtwork } from '@/components/music-artwork'
import { MusicItemActions } from '@/components/music/music-item-actions'
import { getTrackInfo, normalizeTrack, formatNumber, toLastFmArray } from '@/lib/lastfm'
import { Music, Users, Play, Clock } from 'lucide-react'
import type { Metadata } from 'next'

interface TrackPageProps {
  params: Promise<{ artist: string; name: string }>
}

export async function generateMetadata({ params }: TrackPageProps): Promise<Metadata> {
  const { artist, name } = await params
  return {
    title: `${decodeURIComponent(name)} - ${decodeURIComponent(artist)}`,
    description: `Morceau sur SUPCONTENT.`,
  }
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default async function TrackPage({ params }: TrackPageProps) {
  const { artist, name } = await params
  const artistName = decodeURIComponent(artist)
  const trackName = decodeURIComponent(name)
  if (!isValidSlug(artistName) || !isValidSlug(trackName)) redirect('/search')

  const track = await getTrackInfo(artistName, trackName)
  if (!track) notFound()

  const trackItem = normalizeTrack({ ...track, artist: artistName })
  const duration = parseInt(track.duration || '0', 10)
  const listeners = parseInt(track.listeners || '0', 10)
  const playcount = parseInt(track.playcount || '0', 10)
  const wiki = track.wiki?.summary?.replace(/<[^>]*>/g, '') || null
  const tags = toLastFmArray(track.toptags?.tag).map((t) => t.name)
  const albumTitle =
    track.album && typeof track.album === 'object' && 'title' in track.album
      ? track.album.title
      : null

  return (
    <div className="flex flex-col">
      <section className="border-b bg-gradient-to-b from-primary/10 to-background">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
            <div className="relative aspect-square w-48 shrink-0 overflow-hidden rounded-lg bg-muted shadow-xl md:w-56">
              <MusicArtwork src={trackItem.image} alt={track.name} itemType="track" sizes="224px" />
            </div>
            <div className="flex flex-1 flex-col items-center text-center md:items-start md:text-left">
              <Badge variant="secondary" className="mb-2">
                <Music className="mr-1 size-3" />
                Morceau
              </Badge>
              <h1 className="mb-2 text-4xl font-bold md:text-5xl">{track.name}</h1>
              <Link
                href={artistPath(artistName)}
                className="mb-4 text-xl text-muted-foreground hover:text-primary"
              >
                {artistName}
              </Link>
              {albumTitle && (
                <Link
                  href={albumPath(artistName, albumTitle)}
                  className="mb-4 text-muted-foreground hover:text-primary"
                >
                  Album : {albumTitle}
                </Link>
              )}
              <div className="mb-6 flex flex-wrap justify-center gap-6 text-muted-foreground md:justify-start">
                {duration > 0 && (
                  <span className="flex items-center gap-2">
                    <Clock className="size-5" />
                    <strong className="text-foreground">{formatDuration(duration)}</strong>
                  </span>
                )}
                <span className="flex items-center gap-2">
                  <Users className="size-5" />
                  <strong className="text-foreground">{formatNumber(listeners)}</strong> auditeurs
                </span>
                <span className="flex items-center gap-2">
                  <Play className="size-5" />
                  <strong className="text-foreground">{formatNumber(playcount)}</strong> ecoutes
                </span>
              </div>
              {tags.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-2">
                  {tags.slice(0, 5).map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <MusicItemActions item={trackItem} lastFmUrl={track.url} layout="buttons" />
            </div>
          </div>
        </div>
      </section>
      {wiki && (
        <section className="mx-auto max-w-3xl px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>A propos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm text-muted-foreground">{wiki}</p>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  )
}
