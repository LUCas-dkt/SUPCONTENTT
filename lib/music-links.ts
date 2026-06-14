import { albumPath, artistPath, trackPath } from '@/lib/routes'

export function musicItemHref(item: {
  item_type: string
  item_name: string
  item_artist?: string | null
}) {
  if (item.item_type === 'artist') {
    return artistPath(item.item_name)
  }
  if (item.item_artist) {
    if (item.item_type === 'album') {
      return albumPath(item.item_artist, item.item_name)
    }
    if (item.item_type === 'track') {
      return trackPath(item.item_artist, item.item_name)
    }
  }
  return '/search'
}
