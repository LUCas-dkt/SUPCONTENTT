import Link from 'next/link'
import { getPopularPublicLists } from '@/lib/explore-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ListMusic } from 'lucide-react'
import type { Metadata } from 'next'
import { listPath } from '@/lib/routes'

export const metadata: Metadata = {
  title: 'Listes publiques',
  description: 'Explorez les listes musicales partagees par la communaute.',
}

export default async function ListsExplorePage() {
  const { lists, error } = await getPopularPublicLists()

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-2 flex items-center gap-2 text-3xl font-bold">
        <ListMusic className="size-8 text-primary" />
        Listes publiques
      </h1>
      <p className="mb-8 text-muted-foreground">
        Decouvrez les playlists et listes thematiques creees par la communaute.
      </p>

      {error && <p className="mb-4 text-destructive">{error}</p>}

      {!lists?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucune liste publique pour le moment.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {lists.map((list) => (
            <Link key={list.id} href={listPath(list.id)}>
              <Card className="h-full transition-colors hover:bg-accent/50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2 text-lg">
                    <span className="truncate">{list.title}</span>
                    <Badge variant="secondary">{list.item_count} titres</Badge>
                  </CardTitle>
                  {list.description && <CardDescription className="line-clamp-2">{list.description}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    par @{list.profiles?.username ?? 'anonyme'} — {list.likes_count} likes
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
