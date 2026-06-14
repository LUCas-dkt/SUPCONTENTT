import { NextRequest, NextResponse } from 'next/server'
import {
  searchArtists,
  searchAlbums,
  searchTracks,
  normalizeArtist,
  normalizeAlbum,
  normalizeTrack,
  toLastFmArray,
} from '@/lib/lastfm'
import { fetchSupcontentJson } from '@/lib/supcontent-api'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  const type = searchParams.get('type') || 'all'
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '20', 10)
  const sort = searchParams.get('sort') || 'relevance'

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  try {
    const proxied = await fetchSupcontentJson<{
      artists?: unknown
      albums?: unknown
      tracks?: unknown
      total?: number
    }>('/api/lastfm/search', {
      q: query,
      type,
      page: String(page),
      limit: String(limit),
      sort,
    })

    if (proxied) {
      const results: {
        artists?: ReturnType<typeof normalizeArtist>[]
        albums?: ReturnType<typeof normalizeAlbum>[]
        tracks?: ReturnType<typeof normalizeTrack>[]
        total?: number
        page?: number
        hasMore?: boolean
      } = { total: proxied.total, page, hasMore: (proxied.total ?? 0) > page * limit }

      if (type === 'all' || type === 'artist') {
        results.artists = toLastFmArray(proxied.artists as never).map(normalizeArtist)
      }
      if (type === 'all' || type === 'album') {
        results.albums = toLastFmArray(proxied.albums as never).map(normalizeAlbum)
      }
      if (type === 'all' || type === 'track') {
        results.tracks = toLastFmArray(proxied.tracks as never).map(normalizeTrack)
      }
      return NextResponse.json(results)
    }
    const results: {
      artists?: ReturnType<typeof normalizeArtist>[]
      albums?: ReturnType<typeof normalizeAlbum>[]
      tracks?: ReturnType<typeof normalizeTrack>[]
      total?: number
      page?: number
      hasMore?: boolean
    } = { page }

    let maxTotal = 0

    if (type === 'all' || type === 'artist') {
      const { artists, total } = await searchArtists(query, page, limit)
      results.artists = artists.map(normalizeArtist)
      maxTotal = Math.max(maxTotal, total)
    }

    if (type === 'all' || type === 'album') {
      const { albums, total } = await searchAlbums(query, page, limit)
      results.albums = albums.map(normalizeAlbum)
      maxTotal = Math.max(maxTotal, total)
    }

    if (type === 'all' || type === 'track') {
      const { tracks, total } = await searchTracks(query, page, limit)
      results.tracks = tracks.map(normalizeTrack)
      maxTotal = Math.max(maxTotal, total)
    }

    results.total = maxTotal
    results.hasMore = maxTotal > page * limit
    return NextResponse.json(results)
  } catch (error) {
    console.error('Last.fm search error:', error)
    return NextResponse.json(
      { error: 'Failed to search Last.fm' },
      { status: 500 }
    )
  }
}
