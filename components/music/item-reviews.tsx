'use client'

import { useState, useTransition } from 'react'
import { useAuthUser } from '@/lib/hooks/use-auth-user'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Heart, MessageCircle, Flag, Star, Pencil, Trash2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { profilePath } from '@/lib/routes'
import { formatReviewContent } from '@/lib/text-format'
import {
  addReviewComment,
  deleteOwnReview,
  reportContent,
  toggleReviewLike,
  getReviewComments,
  updateOwnReview,
} from '@/lib/social-client'
import type { Profile, Review } from '@/lib/types'
import Link from 'next/link'

type ReviewWithProfile = Review & { profiles: Profile | null }

interface ItemReviewsProps {
  reviews: ReviewWithProfile[]
  average: number | null
  isLoggedIn: boolean
}

export function ItemReviews({ reviews, average, isLoggedIn: serverLoggedIn }: ItemReviewsProps) {
  const { user, isLoggedIn: clientLoggedIn } = useAuthUser(null)
  const isLoggedIn = serverLoggedIn || clientLoggedIn
  const currentUserId = user?.id ?? null

  const [items, setItems] = useState(reviews)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDrafts, setEditDrafts] = useState<Record<string, { title: string; content: string; rating: string }>>({})
  const [comments, setComments] = useState<Record<string, unknown[]>>({})
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [pending, startTransition] = useTransition()

  function startEdit(review: ReviewWithProfile) {
    setEditingId(review.id)
    setEditDrafts((d) => ({
      ...d,
      [review.id]: {
        title: review.title ?? '',
        content: review.content ?? '',
        rating: review.rating != null ? String(review.rating) : '',
      },
    }))
  }

  function saveEdit(reviewId: string) {
    const draft = editDrafts[reviewId]
    if (!draft) return
    startTransition(async () => {
      const result = await updateOwnReview(reviewId, {
        title: draft.title,
        content: draft.content,
        rating: draft.rating ? parseInt(draft.rating, 10) : undefined,
      })
      if (result.error) {
        toast({ title: 'Erreur', description: result.error, variant: 'destructive' })
        return
      }
      if (result.review) {
        setItems((prev) =>
          prev.map((r) =>
            r.id === reviewId ? { ...r, ...result.review, profiles: r.profiles } : r,
          ),
        )
      }
      setEditingId(null)
      toast({ title: 'Critique mise a jour' })
    })
  }

  function handleDelete(reviewId: string) {
    if (!confirm('Supprimer votre critique ?')) return
    startTransition(async () => {
      const result = await deleteOwnReview(reviewId)
      if (result.error) {
        toast({ title: 'Erreur', description: result.error, variant: 'destructive' })
        return
      }
      setItems((prev) => prev.filter((r) => r.id !== reviewId))
      toast({ title: 'Critique supprimee' })
    })
  }

  function handleLike(reviewId: string) {
    if (!isLoggedIn) {
      toast({ title: 'Connexion requise', variant: 'destructive' })
      return
    }
    startTransition(async () => {
      const result = await toggleReviewLike(reviewId)
      if (result.error) {
        toast({ title: 'Erreur', description: result.error, variant: 'destructive' })
        return
      }
      setItems((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                likes_count: result.liked
                  ? (r.likes_count ?? 0) + 1
                  : Math.max(0, (r.likes_count ?? 1) - 1),
              }
            : r,
        ),
      )
    })
  }

  function loadComments(reviewId: string) {
    setExpanded(reviewId)
    startTransition(async () => {
      const data = await getReviewComments(reviewId)
      setComments((c) => ({ ...c, [reviewId]: data.comments ?? [] }))
    })
  }

  function submitComment(reviewId: string) {
    const content = drafts[reviewId]?.trim()
    if (!content) return
    startTransition(async () => {
      const result = await addReviewComment(reviewId, content)
      if (result.error) {
        toast({ title: 'Erreur', description: result.error, variant: 'destructive' })
        return
      }
      setComments((c) => ({
        ...c,
        [reviewId]: [...(c[reviewId] ?? []), result.comment],
      }))
      setDrafts((d) => ({ ...d, [reviewId]: '' }))
    })
  }

  function handleReport(reviewId: string) {
    startTransition(async () => {
      const result = await reportContent('review', reviewId, 'other', 'Signalement utilisateur')
      if (result.error) {
        toast({ title: 'Erreur', description: result.error, variant: 'destructive' })
        return
      }
      toast({ title: 'Signalement envoye', description: 'Un moderateur examinera ce contenu.' })
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="size-5 text-primary" />
          Communaute
          {average != null && (
            <span className="ml-2 text-base font-normal text-muted-foreground">
              Note moyenne : {average}/10 ({items.length})
            </span>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Formatage : **gras**, *italique*
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune critique pour le moment.</p>
        ) : (
          items.map((review) => {
            const isOwn = currentUserId === review.user_id
            const editing = editingId === review.id
            const draft = editDrafts[review.id]

            return (
              <div key={review.id} className="rounded-lg border p-4">
                <div className="mb-2 flex items-start gap-3">
                  <Avatar className="size-9">
                    <AvatarImage src={review.profiles?.avatar_url ?? undefined} />
                    <AvatarFallback>
                      {(review.profiles?.username ?? '?').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {review.profiles?.username ? (
                        <Link href={profilePath(review.profiles.username)} className="hover:underline">
                          @{review.profiles.username}
                        </Link>
                      ) : (
                        'Utilisateur'
                      )}
                      {review.rating != null && !editing && (
                        <span className="ml-2 text-sm text-primary">{review.rating}/10</span>
                      )}
                      {review.is_featured && (
                        <span className="ml-2 rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                          Coup de coeur
                        </span>
                      )}
                    </p>
                    {editing && draft ? (
                      <div className="mt-2 space-y-2">
                        <Input
                          placeholder="Titre"
                          value={draft.title}
                          onChange={(e) =>
                            setEditDrafts((d) => ({
                              ...d,
                              [review.id]: { ...draft, title: e.target.value },
                            }))
                          }
                        />
                        <Input
                          type="number"
                          min={1}
                          max={10}
                          placeholder="Note /10"
                          value={draft.rating}
                          onChange={(e) =>
                            setEditDrafts((d) => ({
                              ...d,
                              [review.id]: { ...draft, rating: e.target.value },
                            }))
                          }
                        />
                        <Textarea
                          rows={4}
                          value={draft.content}
                          onChange={(e) =>
                            setEditDrafts((d) => ({
                              ...d,
                              [review.id]: { ...draft, content: e.target.value },
                            }))
                          }
                        />
                        <div className="flex gap-2">
                          <Button type="button" size="sm" onClick={() => saveEdit(review.id)} disabled={pending}>
                            Enregistrer
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => setEditingId(null)}>
                            Annuler
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {review.title && <p className="font-semibold">{review.title}</p>}
                        {review.content && (
                          <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                            {formatReviewContent(review.content)}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="ghost" onClick={() => handleLike(review.id)} disabled={pending}>
                    <Heart className="mr-1 size-4" />
                    {review.likes_count ?? 0}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => (expanded === review.id ? setExpanded(null) : loadComments(review.id))}
                  >
                    <MessageCircle className="mr-1 size-4" />
                    Commentaires
                  </Button>
                  {isOwn && !editing && (
                    <>
                      <Button type="button" size="sm" variant="ghost" onClick={() => startEdit(review)}>
                        <Pencil className="mr-1 size-4" />
                        Modifier
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => handleDelete(review.id)}>
                        <Trash2 className="mr-1 size-4" />
                        Supprimer
                      </Button>
                    </>
                  )}
                  {isLoggedIn && !isOwn && (
                    <Button type="button" size="sm" variant="ghost" onClick={() => handleReport(review.id)}>
                      <Flag className="mr-1 size-4" />
                      Signaler
                    </Button>
                  )}
                </div>
                {expanded === review.id && (
                  <div className="mt-3 space-y-2 border-t pt-3">
                    {(comments[review.id] ?? []).map((c: { id: string; content: string; profiles?: Profile | null }) => (
                      <p key={c.id} className="text-sm">
                        <span className="font-medium">@{c.profiles?.username ?? 'user'}</span> : {c.content}
                      </p>
                    ))}
                    {isLoggedIn && (
                      <div className="flex gap-2">
                        <Textarea
                          rows={2}
                          placeholder="Votre commentaire..."
                          value={drafts[review.id] ?? ''}
                          onChange={(e) => setDrafts((d) => ({ ...d, [review.id]: e.target.value }))}
                        />
                        <Button type="button" size="sm" onClick={() => submitComment(review.id)} disabled={pending}>
                          Envoyer
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
