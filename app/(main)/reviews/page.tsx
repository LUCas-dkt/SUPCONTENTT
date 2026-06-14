import Link from 'next/link'
import { getRecentPublicReviews } from '@/lib/explore-actions'
import { musicItemHref } from '@/lib/music-links'
import { Card, CardContent } from '@/components/ui/card'
import { Star } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Critiques recentes',
  description: 'Les dernieres critiques publiees par la communaute SUPCONTENT.',
}

export default async function ReviewsPage() {
  const { reviews, error } = await getRecentPublicReviews()

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 flex items-center gap-2 text-3xl font-bold">
        <Star className="size-8 text-primary" />
        Critiques recentes
      </h1>
      <p className="mb-8 text-muted-foreground">
        Avis et notes de la communaute sur albums, artistes et morceaux.
      </p>

      {error && <p className="mb-4 text-destructive">{error}</p>}

      {!reviews?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucune critique publique pour le moment.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {reviews.map((review) => (
            <li key={review.id}>
              <Link href={musicItemHref(review)}>
                <Card className="transition-colors hover:bg-accent/50">
                  <CardContent className="flex gap-4 p-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg font-bold text-primary">
                      {review.rating ?? '-'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{review.item_name}</p>
                      {review.item_artist && (
                        <p className="text-sm text-muted-foreground">{review.item_artist}</p>
                      )}
                      {review.title && <p className="mt-1 font-medium">{review.title}</p>}
                      {review.content && (
                        <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{review.content}</p>
                      )}
                      <p className="mt-2 text-xs text-muted-foreground">
                        par @{review.profiles?.username ?? 'user'} —{' '}
                        {new Date(review.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
