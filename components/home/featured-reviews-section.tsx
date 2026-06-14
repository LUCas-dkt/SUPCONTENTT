'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Star } from 'lucide-react'
import { getFeaturedReviews } from '@/lib/social-client'
import { musicItemHref } from '@/lib/music-links'
import type { Review } from '@/lib/types'

export function FeaturedReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([])

  useEffect(() => {
    void getFeaturedReviews().then((r) => setReviews(r.reviews ?? []))
  }, [])

  if (!reviews.length) return null

  return (
    <section className="border-b py-16">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
          <Star className="size-6 text-primary" />
          Coups de coeur de la communaute
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {reviews.map((review) => (
            <Link key={review.id} href={musicItemHref(review)}>
              <Card className="transition-colors hover:bg-accent/50">
                <CardContent className="p-4">
                  <p className="font-medium">{review.item_name}</p>
                  {review.item_artist && (
                    <p className="text-sm text-muted-foreground">{review.item_artist}</p>
                  )}
                  <p className="mt-2 text-sm text-primary">Note : {review.rating ?? '-'}/10</p>
                  {review.title && <p className="mt-1 font-semibold">{review.title}</p>}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
