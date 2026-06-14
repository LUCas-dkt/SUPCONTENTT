import { NextRequest, NextResponse } from 'next/server'
import { getTopArtists, getTopTracks, normalizeArtist, normalizeTrack, toLastFmArray } from '@/lib/lastfm'
import { fetchSupcontentJson } from '@/lib/supcontent-api'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type') || 'all'
  const limit = parseInt(searchParams.get('limit') || '20', 10)

  try {
    const proxied = await fetchSupcontentJson<{ artists?: unknown; tracks?: unknown }>(
      '/api/lastfm/charts',
      { type: type === 'artists' ? 'artists' : type, limit: String(limit) },
    )
    if (proxied) {
      return NextResponse.json({
        artists: toLastFmArray(proxied.artists as never).map(normalizeArtist),
        tracks: toLastFmArray(proxied.tracks as never).map(normalizeTrack),
      })
    }
    const results: {
      artists?: ReturnType<typeof normalizeArtist>[]
      tracks?: ReturnType<typeof normalizeTrack>[]
    } = {}

    if (type === 'all' || type === 'artists') {
      const artists = await getTopArtists(1, limit)
      results.artists = artists.map(normalizeArtist)
    }

    if (type === 'all' || type === 'tracks') {
      const tracks = await getTopTracks(1, limit)
      results.tracks = tracks.map(normalizeTrack)
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Last.fm charts error:', error)
    return NextResponse.json(
      { error: 'Failed to get charts' },
      { status: 500 }
    )
  }
}
