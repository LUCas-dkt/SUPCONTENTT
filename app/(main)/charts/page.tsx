import { ChartsTabs } from '@/components/charts/charts-tabs'
import { getTopArtists, getTopTracks, normalizeArtist, normalizeTrack } from '@/lib/lastfm'
import { TrendingUp } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tendances',
  description: 'Decouvrez les artistes et morceaux les plus populaires du moment.',
}

interface ChartsPageProps {
  searchParams: Promise<{ type?: string }>
}

export default async function ChartsPage({ searchParams }: ChartsPageProps) {
  const { type } = await searchParams
  const defaultTab = type === 'tracks' ? 'tracks' : 'artists'

  const [topArtists, topTracks] = await Promise.all([
    getTopArtists(1, 50),
    getTopTracks(1, 50)
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold">
          <TrendingUp className="size-8 text-primary" />
          Tendances
        </h1>
        <p className="text-muted-foreground">
          Decouvrez les artistes et morceaux les plus populaires du moment.
        </p>
      </div>

      <ChartsTabs
        defaultTab={defaultTab}
        artists={topArtists.map(normalizeArtist)}
        tracks={topTracks.map(normalizeTrack)}
      />
    </div>
  )
}
