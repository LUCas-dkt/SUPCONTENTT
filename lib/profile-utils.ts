import type { MusicItem, ProfileMusic } from '@/lib/types'

export function profileMusicToMusicItem(pm: ProfileMusic): MusicItem {
  return {
    type: pm.item_type,
    name: pm.item_name,
    artist: pm.item_artist ?? undefined,
    mbid: pm.item_mbid ?? undefined,
    url: pm.item_url ?? '#',
    image: pm.item_image ?? undefined,
  }
}
