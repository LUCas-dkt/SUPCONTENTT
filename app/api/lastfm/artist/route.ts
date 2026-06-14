import { NextRequest, NextResponse } from 'next/server'
import { getArtistInfo, getArtistTopTracks, getArtistTopAlbums, getSimilarArtists, normalizeArtist, normalizeAlbum, normalizeTrack, getBestImage, toLastFmArray } from '@/lib/lastfm'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const name = searchParams.get('name')
  const mbid = searchParams.get('mbid')

  if (!name && !mbid) {
    return NextResponse.json({ error: 'Artist name or mbid is required' }, { status: 400 })
  }

  try {
    const artist = await getArtistInfo(name || '', mbid || undefined)
    
    if (!artist) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 })
    }

    const [topTracks, topAlbums, similar] = await Promise.all([
      getArtistTopTracks(artist.name, 10),
      getArtistTopAlbums(artist.name, 10),
      getSimilarArtists(artist.name, 8)
    ])

    return NextResponse.json({
      artist: {
        ...normalizeArtist(artist),
        bio: artist.bio?.summary?.replace(/<[^>]*>/g, '') || null,
        tags: toLastFmArray(artist.tags?.tag).map(t => t.name),
        stats: {
          listeners: parseInt(artist.stats?.listeners || artist.listeners || '0', 10),
          playcount: parseInt(artist.stats?.playcount || artist.playcount || '0', 10)
        }
      },
      topTracks: topTracks.map(normalizeTrack),
      topAlbums: topAlbums.map(a => ({
        ...normalizeAlbum(a),
        image: getBestImage(a.image)
      })),
      similar: similar.map(normalizeArtist)
    })
  } catch (error) {
    console.error('Last.fm artist error:', error)
    return NextResponse.json(
      { error: 'Failed to get artist info' },
      { status: 500 }
    )
  }
}
