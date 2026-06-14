import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { isValidSlug, profilePath } from '@/lib/routes'
import { getPublicListById } from '@/lib/explore-actions'
import { musicItemHref } from '@/lib/music-links'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MusicArtwork } from '@/components/music-artwork'
import { ListMusic } from 'lucide-react'
import type { Metadata } from 'next'
import { coerceImageUrl } from '@/lib/lastfm'

interface ListPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ListPageProps): Promise<Metadata> {
  const { id } = await params
  const { list } = await getPublicListById(id)
  return { title: list?.title ?? 'Liste' }
}

export default async function PublicListPage({ params }: ListPageProps) {
  const { id } = await params
  if (!isValidSlug(id)) redirect('/lists/explore')

  const { list, error } = await getPublicListById(id)

  if (error || !list) notFound()

  const profile = list.profiles as { username: string; display_name: string | null } | null
  const items = (list.list_items ?? []) as {
    id: string
    item_type: string
    item_name: string
    item_artist: string | null
    item_image: string | null
    comment: string | null
  }[]

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <Badge variant="secondary" className="mb-2">
          <ListMusic className="mr-1 size-3" />
          Liste {list.is_public ? 'publique' : 'privee'}
        </Badge>
        <h1 className="text-3xl font-bold">{list.title}</h1>
        {list.description && <p className="mt-2 text-muted-foreground">{list.description}</p>}
        {profile && (
          <p className="mt-2 text-sm">
            Par{' '}
            <Link href={profilePath(profile.username)} className="text-primary hover:underline">
              @{profile.username}
            </Link>
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{items.length} element{items.length !== 1 ? 's' : ''}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.length === 0 ? (
            <p className="text-muted-foreground">Liste vide.</p>
          ) : (
            items.map((item) => (
              <Link
                key={item.id}
                href={musicItemHref(item)}
                className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
              >
                <div className="size-12 shrink-0 overflow-hidden rounded-md">
                  <MusicArtwork
                    src={coerceImageUrl(item.item_image)}
                    alt={item.item_name}
                    itemType={item.item_type as 'artist' | 'album' | 'track'}
                    className="size-12"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.item_name}</p>
                  {item.item_artist && (
                    <p className="truncate text-sm text-muted-foreground">{item.item_artist}</p>
                  )}
                  {item.comment && (
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{item.comment}</p>
                  )}
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
