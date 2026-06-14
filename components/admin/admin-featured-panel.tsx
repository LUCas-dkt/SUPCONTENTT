'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toggleFeaturedReview } from '@/lib/social-client'
import { toast } from '@/hooks/use-toast'
import type { Review } from '@/lib/types'
import { Star } from 'lucide-react'

export function AdminFeaturedPanel({ initialReviews }: { initialReviews: Review[] }) {
  const [reviews, setReviews] = useState(initialReviews)
  const [reviewId, setReviewId] = useState('')
  const [pending, startTransition] = useTransition()

  function handleToggle(id: string, featured: boolean) {
    startTransition(async () => {
      const result = await toggleFeaturedReview(id, featured)
      if (result.error) {
        toast({ title: 'Erreur', description: result.error, variant: 'destructive' })
        return
      }
      setReviews((prev) =>
        featured
          ? prev
          : prev.filter((r) => r.id !== id),
      )
      toast({ title: featured ? 'Coup de coeur retire' : 'Coup de coeur ajoute' })
    })
  }

  function handleAdd() {
    const id = reviewId.trim()
    if (!id) return
    startTransition(async () => {
      const result = await toggleFeaturedReview(id, true)
      if (result.error) {
        toast({ title: 'Erreur', description: result.error, variant: 'destructive' })
        return
      }
      setReviewId('')
      toast({ title: 'Critique mise en avant' })
    })
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="size-5 text-primary" />
          Coups de coeur
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="ID de critique a mettre en avant"
            value={reviewId}
            onChange={(e) => setReviewId(e.target.value)}
          />
          <Button type="button" onClick={handleAdd} disabled={pending}>
            Ajouter
          </Button>
        </div>
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun coup de coeur actif.</p>
        ) : (
          <ul className="space-y-2">
            {reviews.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <span>
                  {r.item_name}
                  {r.item_artist ? ` — ${r.item_artist}` : ''} ({r.rating ?? '-'}/10)
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => handleToggle(r.id, false)}
                >
                  Retirer
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
