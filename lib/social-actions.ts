'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { MusicItem, Profile, Review } from '@/lib/types'
import { coerceImageUrl } from '@/lib/lastfm'
import { profilePath } from '@/lib/routes'

async function requireUser() {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase non configure' as const }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Connectez-vous pour effectuer cette action' as const }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, is_admin, is_banned')
    .eq('id', user.id)
    .single()

  if (profile?.is_banned) return { error: 'Compte suspendu' as const }

  return { supabase, user, profile }
}

export async function createNotification(input: {
  userId: string
  type: string
  title: string
  message?: string
  link?: string
  actorId?: string
}) {
  const supabase = await createClient()
  if (!supabase) return

  await supabase.from('notifications').insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    message: input.message ?? null,
    link: input.link ?? null,
    actor_id: input.actorId ?? null,
  })
}

export async function recordActivity(input: {
  userId: string
  type: string
  targetType?: string
  targetId?: string
  targetName?: string
  metadata?: Record<string, unknown>
}) {
  const supabase = await createClient()
  if (!supabase) return

  await supabase.from('activities').insert({
    user_id: input.userId,
    type: input.type,
    target_type: input.targetType ?? null,
    target_id: input.targetId ?? null,
    target_name: input.targetName ?? null,
    metadata: input.metadata ?? null,
  })
}

export async function setLibraryStatus(
  item: MusicItem,
  status: 'to_listen' | 'in_progress' | 'completed' | 'abandoned',
) {
  const auth = await requireUser()
  if ('error' in auth && auth.error) return { error: auth.error }
  const { supabase, user } = auth as {
    supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>
    user: { id: string }
  }

  const { error } = await supabase.from('library_items').upsert(
    {
      user_id: user.id,
      item_type: item.type,
      item_mbid: item.mbid ?? null,
      item_name: item.name,
      item_artist: item.artist ?? null,
      item_image: coerceImageUrl(item.image) ?? null,
      item_url: item.url,
      status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,item_type,item_name,item_artist' },
  )

  if (error) return { error: error.message }

  await recordActivity({
    userId: user.id,
    type: 'collection',
    targetType: item.type,
    targetName: item.name,
    metadata: { status, artist: item.artist },
  })

  revalidatePath('/library')
  return { success: true }
}

export async function getMyLibrary(status?: string) {
  const auth = await requireUser()
  if ('error' in auth && auth.error) return { error: auth.error }
  const { supabase, user } = auth as {
    supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>
    user: { id: string }
  }

  let query = supabase
    .from('library_items')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return { error: error.message }
  return { items: data ?? [] }
}

export async function getLibraryStats() {
  const auth = await requireUser()
  if ('error' in auth && auth.error) return { error: auth.error }
  const { supabase, user } = auth as {
    supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>
    user: { id: string }
  }

  const statuses = ['to_listen', 'in_progress', 'completed', 'abandoned'] as const
  const counts: Record<string, number> = {}

  await Promise.all(
    statuses.map(async (s) => {
      const { count } = await supabase
        .from('library_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', s)
      counts[s] = count ?? 0
    }),
  )

  return {
    stats: {
      to_listen: counts.to_listen,
      in_progress: counts.in_progress,
      completed: counts.completed,
      abandoned: counts.abandoned,
      total: Object.values(counts).reduce((a, b) => a + b, 0),
    },
  }
}

export async function getItemReviews(item: MusicItem) {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase non configure' }

  let query = supabase
    .from('reviews')
    .select('*, profiles(username, display_name, avatar_url)')
    .eq('is_public', true)
    .eq('item_type', item.type)
    .eq('item_name', item.name)
    .order('created_at', { ascending: false })

  query = item.artist
    ? query.eq('item_artist', item.artist)
    : query.is('item_artist', null)

  const { data, error } = await query.limit(20)
  if (error) return { error: error.message }

  const reviews = data ?? []
  const ratings = reviews.filter((r) => r.rating != null).map((r) => r.rating as number)
  const average =
    ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : null

  return { reviews: reviews as (Review & { profiles: Profile | null })[], average, count: reviews.length }
}

export async function toggleReviewLike(reviewId: string) {
  const auth = await requireUser()
  if ('error' in auth && auth.error) return { error: auth.error }
  const { supabase, user, profile } = auth as {
    supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>
    user: { id: string }
    profile: { username: string } | null
  }

  const { data: review } = await supabase
    .from('reviews')
    .select('id, user_id, item_name, likes_count')
    .eq('id', reviewId)
    .maybeSingle()

  if (!review) return { error: 'Critique introuvable' }

  const { data: existing } = await supabase
    .from('review_likes')
    .select('id')
    .eq('review_id', reviewId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    await supabase.from('review_likes').delete().eq('id', existing.id)
    await supabase
      .from('reviews')
      .update({ likes_count: Math.max(0, (review.likes_count ?? 1) - 1) })
      .eq('id', reviewId)
    return { liked: false }
  }

  await supabase.from('review_likes').insert({ review_id: reviewId, user_id: user.id })
  await supabase
    .from('reviews')
    .update({ likes_count: (review.likes_count ?? 0) + 1 })
    .eq('id', reviewId)

  if (review.user_id !== user.id) {
    await createNotification({
      userId: review.user_id,
      type: 'like_review',
      title: 'Nouveau j\'aime sur votre critique',
      message: `${profile?.username ?? 'Un utilisateur'} a aimé votre avis sur ${review.item_name}`,
      link: profile?.username ? profilePath(profile.username) : undefined,
      actorId: user.id,
    })
  }

  await recordActivity({
    userId: user.id,
    type: 'like',
    targetType: 'review',
    targetId: reviewId,
    targetName: review.item_name,
  })

  revalidatePath('/')
  return { liked: true }
}

export async function addReviewComment(reviewId: string, content: string) {
  const auth = await requireUser()
  if ('error' in auth && auth.error) return { error: auth.error }
  const { supabase, user, profile } = auth as {
    supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>
    user: { id: string }
    profile: { username: string } | null
  }

  const trimmed = content.trim()
  if (!trimmed) return { error: 'Commentaire vide' }

  const { data: review } = await supabase
    .from('reviews')
    .select('id, user_id, item_name')
    .eq('id', reviewId)
    .maybeSingle()

  if (!review) return { error: 'Critique introuvable' }

  const { data, error } = await supabase
    .from('review_comments')
    .insert({ review_id: reviewId, user_id: user.id, content: trimmed })
    .select('*, profiles(username, display_name, avatar_url)')
    .single()

  if (error) return { error: error.message }

  if (review.user_id !== user.id) {
    await createNotification({
      userId: review.user_id,
      type: 'mention',
      title: 'Nouveau commentaire',
      message: `${profile?.username ?? 'Un utilisateur'} a commenté votre critique`,
      actorId: user.id,
    })
  }

  return { comment: data }
}

export async function getReviewComments(reviewId: string) {
  const supabase = await createClient()
  if (!supabase) return { comments: [] }

  const { data } = await supabase
    .from('review_comments')
    .select('*, profiles(username, display_name, avatar_url)')
    .eq('review_id', reviewId)
    .order('created_at', { ascending: true })

  return { comments: data ?? [] }
}

export async function getActivityFeed() {
  const auth = await requireUser()
  if ('error' in auth && auth.error) return { error: auth.error }
  const { supabase, user } = auth as {
    supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>
    user: { id: string }
  }

  const { data: following } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id)

  const ids = (following ?? []).map((f) => f.following_id)
  if (!ids.length) return { activities: [] }

  const { data, error } = await supabase
    .from('activities')
    .select('*, profiles(username, display_name, avatar_url)')
    .in('user_id', ids)
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) return { error: error.message }
  return { activities: data ?? [] }
}

export async function searchPublicLists(query: string) {
  const supabase = await createClient()
  if (!supabase) return { lists: [] }

  const trimmed = query.trim()
  if (trimmed.length < 2) return { lists: [] }

  const { data } = await supabase
    .from('lists')
    .select('*, profiles(username, display_name)')
    .eq('is_public', true)
    .ilike('title', `%${trimmed}%`)
    .order('likes_count', { ascending: false })
    .limit(20)

  return { lists: data ?? [] }
}

export async function reportContent(
  targetType: 'review' | 'comment' | 'profile',
  targetId: string,
  reason: 'spoiler' | 'insult' | 'spam' | 'other',
  details?: string,
) {
  const auth = await requireUser()
  if ('error' in auth && auth.error) return { error: auth.error }
  const { supabase, user } = auth as {
    supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>
    user: { id: string }
  }

  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    target_type: targetType,
    target_id: targetId,
    reason,
    details: details?.trim() || null,
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function getPendingReports() {
  const auth = await requireUser()
  if ('error' in auth && auth.error) return { error: auth.error }
  const { supabase, profile } = auth as {
    supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>
    profile: { is_admin: boolean } | null
  }

  if (!profile?.is_admin) return { error: 'Acces refuse' }

  const { data } = await supabase
    .from('reports')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  return { reports: data ?? [] }
}

export async function resolveReport(reportId: string, action: 'resolved' | 'dismissed') {
  const auth = await requireUser()
  if ('error' in auth && auth.error) return { error: auth.error }
  const { supabase, user, profile } = auth as {
    supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>
    user: { id: string }
    profile: { is_admin: boolean } | null
  }

  if (!profile?.is_admin) return { error: 'Acces refuse' }

  const { error } = await supabase
    .from('reports')
    .update({ status: action, resolved_by: user.id })
    .eq('id', reportId)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function deleteReviewAsAdmin(reviewId: string) {
  const auth = await requireUser()
  if ('error' in auth && auth.error) return { error: auth.error }
  const { supabase, profile } = auth as {
    supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>
    profile: { is_admin: boolean } | null
  }

  if (!profile?.is_admin) return { error: 'Acces refuse' }

  const { error } = await supabase.from('reviews').delete().eq('id', reviewId)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function exportUserData() {
  const auth = await requireUser()
  if ('error' in auth && auth.error) return { error: auth.error }
  const { supabase, user } = auth as {
    supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>
    user: { id: string; email?: string }
  }

  const [profile, library, reviews, lists, favorites] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('library_items').select('*').eq('user_id', user.id),
    supabase.from('reviews').select('*').eq('user_id', user.id),
    supabase.from('lists').select('*, list_items(*)').eq('user_id', user.id),
    supabase.from('profile_music').select('*').eq('user_id', user.id),
  ])

  const payload = {
    exported_at: new Date().toISOString(),
    email: user.email,
    profile: profile.data,
    library: library.data ?? [],
    reviews: reviews.data ?? [],
    lists: lists.data ?? [],
    favorites: favorites.data ?? [],
  }

  return { data: JSON.stringify(payload, null, 2), filename: `supcontent-export-${user.id}.json` }
}
