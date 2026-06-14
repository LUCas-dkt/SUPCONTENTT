'use client'

import { createClient } from '@/lib/supabase/client'
import { requireUser, requireUserWithProfile } from '@/lib/authed-client'
import type { List, MusicItem, Profile, ProfileMusic, Review } from '@/lib/types'
import { coerceImageUrl } from '@/lib/lastfm'
import { profilePath } from '@/lib/routes'

export async function getProfileByUsername(username: string) {
  const supabase = createClient()
  if (!supabase) return { error: 'Supabase non configure' }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!profile) return { error: 'Profil introuvable' }

  const userId = profile.id

  const [
    { count: followersCount },
    { count: followingCount },
    { data: favorites },
    { data: nowPlaying },
    { count: listsCount },
  ] = await Promise.all([
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId),
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId),
    supabase
      .from('profile_music')
      .select('*')
      .eq('user_id', userId)
      .eq('category', 'favorite')
      .order('position', { ascending: true })
      .limit(12),
    supabase
      .from('profile_music')
      .select('*')
      .eq('user_id', userId)
      .eq('category', 'now_playing')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('lists')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_public', true),
  ])

  return {
    profile: profile as Profile,
    stats: {
      followers: followersCount ?? 0,
      following: followingCount ?? 0,
      lists: listsCount ?? 0,
    },
    favorites: (favorites as ProfileMusic[]) ?? [],
    nowPlaying: (nowPlaying as ProfileMusic | null) ?? null,
  }
}

export async function getProfileMusic(
  userId: string,
  category: 'favorite' | 'recent' | 'now_playing',
) {
  const supabase = createClient()
  if (!supabase) return { error: 'Supabase non configure' }

  let query = supabase
    .from('profile_music')
    .select('*')
    .eq('user_id', userId)
    .eq('category', category)

  query =
    category === 'favorite'
      ? query.order('position', { ascending: true })
      : query.order('played_at', { ascending: false })

  const { data, error } = await query

  if (error) return { error: error.message }
  return { items: (data as ProfileMusic[]) ?? [] }
}

export async function getProfileLists(userId: string) {
  const supabase = createClient()
  if (!supabase) return { error: 'Supabase non configure' }

  const { data, error } = await supabase
    .from('lists')
    .select(`
      *,
      list_items (
        id, item_type, item_name, item_artist, item_image, item_url, position
      )
    `)
    .eq('user_id', userId)
    .eq('is_public', true)
    .order('updated_at', { ascending: false })

  if (error) return { error: error.message }
  return { lists: (data as (List & { list_items: unknown[] })[]) ?? [] }
}

export async function getProfileReviews(userId: string) {
  const supabase = createClient()
  if (!supabase) return { error: 'Supabase non configure' }

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('user_id', userId)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return { error: error.message }
  return { reviews: (data as Review[]) ?? [] }
}

export async function getSuggestedUsers() {
  const supabase = createClient()
  if (!supabase) return { error: 'Supabase non configure' }

  const { data: { user } } = await supabase.auth.getUser()

  let q = supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(12)

  if (user) {
    q = q.neq('id', user.id)
  }

  const { data: profiles, error } = await q
  if (error) return { error: error.message }
  if (!profiles?.length) return { users: [] as Profile[] }

  const usersWithPreview = await Promise.all(
    (profiles as Profile[]).map(async (p) => {
      const { data: favorites } = await supabase
        .from('profile_music')
        .select('*')
        .eq('user_id', p.id)
        .eq('category', 'favorite')
        .order('position', { ascending: true })
        .limit(4)

      const { data: nowPlaying } = await supabase
        .from('profile_music')
        .select('*')
        .eq('user_id', p.id)
        .eq('category', 'now_playing')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      return {
        ...p,
        favorites_preview: (favorites as ProfileMusic[]) ?? [],
        now_playing: nowPlaying as ProfileMusic | null,
      }
    }),
  )

  return { users: usersWithPreview }
}

export async function searchUsers(query: string) {
  const supabase = createClient()
  if (!supabase) return { error: 'Supabase non configure' }

  const trimmed = query.trim()
  if (trimmed.length < 2) return { users: [] as Profile[] }

  const { data: { user } } = await supabase.auth.getUser()

  let q = supabase
    .from('profiles')
    .select('*')
    .or(`username.ilike.%${trimmed}%,display_name.ilike.%${trimmed}%`)
    .limit(20)

  if (user) {
    q = q.neq('id', user.id)
  }

  const { data: profiles, error } = await q
  if (error) return { error: error.message }

  const usersWithPreview = await Promise.all(
    (profiles as Profile[]).map(async (p) => {
      const { data: favorites } = await supabase
        .from('profile_music')
        .select('*')
        .eq('user_id', p.id)
        .eq('category', 'favorite')
        .order('position', { ascending: true })
        .limit(4)

      const { data: nowPlaying } = await supabase
        .from('profile_music')
        .select('*')
        .eq('user_id', p.id)
        .eq('category', 'now_playing')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      return {
        ...p,
        favorites_preview: (favorites as ProfileMusic[]) ?? [],
        now_playing: nowPlaying as ProfileMusic | null,
      }
    }),
  )

  return { users: usersWithPreview }
}

export async function addProfileMusic(item: MusicItem, category: 'favorite' | 'recent' | 'now_playing') {
  const supabase = createClient()
  if (!supabase) return { error: 'Supabase non configure' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non connecte' }

  if (category === 'now_playing') {
    await supabase.from('profile_music').delete().eq('user_id', user.id).eq('category', 'now_playing')
  }

  if (category === 'favorite') {
    let dupQuery = supabase
      .from('profile_music')
      .select('id')
      .eq('user_id', user.id)
      .eq('category', 'favorite')
      .eq('item_type', item.type)
      .eq('item_name', item.name)

    dupQuery = item.artist
      ? dupQuery.eq('item_artist', item.artist)
      : dupQuery.is('item_artist', null)

    const { data: existing } = await dupQuery.maybeSingle()
    if (existing) return { error: 'Deja dans vos favoris' }
  }

  const image = coerceImageUrl(item.image) ?? null

  let position = 0
  if (category === 'favorite') {
    const { count } = await supabase
      .from('profile_music')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('category', 'favorite')
    position = count ?? 0
  }

  const { error } = await supabase.from('profile_music').insert({
    user_id: user.id,
    category,
    item_type: item.type,
    item_mbid: item.mbid ?? null,
    item_name: item.name,
    item_artist: item.artist ?? null,
    item_image: image,
    item_url: item.url,
    position,
    played_at: category === 'recent' || category === 'now_playing' ? new Date().toISOString() : null,
  })

  if (error) return { error: error.message }

  return { success: true }
}

export async function toggleFollow(targetUserId: string) {
  const supabase = createClient()
  if (!supabase) return { error: 'Supabase non configure' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non connecte' }
  if (user.id === targetUserId) return { error: 'Action impossible' }

  const { data: existing } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId)
    .maybeSingle()

  if (existing) {
    await supabase.from('follows').delete().eq('id', existing.id)
    return { following: false, mutualFollow: false }
  }

  const { error } = await supabase.from('follows').insert({
    follower_id: user.id,
    following_id: targetUserId,
  })

  if (error) return { error: error.message }

  const { data: actorProfile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', targetUserId)
    .single()

  const { error: notifError } = await supabase.from('notifications').insert({
    user_id: targetUserId,
    type: 'follow',
    title: 'Nouvel abonne',
    message: `@${actorProfile?.username ?? 'utilisateur'} vous suit desormais`,
    link: actorProfile?.username ? profilePath(actorProfile.username) : null,
    actor_id: user.id,
  })

  if (notifError) {
    console.error('Notification follow:', notifError.message)
  }


  await supabase.from('activities').insert({
    user_id: user.id,
    type: 'follow',
    target_type: 'profile',
    target_id: targetUserId,
    target_name: targetProfile?.username ?? null,
  })

  const { data: reverseFollow } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', targetUserId)
    .eq('following_id', user.id)
    .maybeSingle()

  return { following: true, mutualFollow: Boolean(reverseFollow) }
}

export async function isFollowing(targetUserId: string) {
  const supabase = createClient()
  if (!supabase) return false

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId)
    .maybeSingle()

  return Boolean(data)
}

export async function isMutualFollow(targetUserId: string) {
  const supabase = createClient()
  if (!supabase) return false

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id === targetUserId) return false

  const [{ data: a }, { data: b }] = await Promise.all([
    supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .maybeSingle(),
    supabase
      .from('follows')
      .select('id')
      .eq('follower_id', targetUserId)
      .eq('following_id', user.id)
      .maybeSingle(),
  ])

  return Boolean(a && b)
}

export async function getFollowers(userId: string) {
  const supabase = createClient()
  if (!supabase) return { error: 'Supabase non configure' }

  const { data, error } = await supabase
    .from('follows')
    .select(`
      created_at,
      profile:profiles!follows_follower_id_fkey (
        id, username, display_name, avatar_url, bio
      )
    `)
    .eq('following_id', userId)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return {
    users: (data ?? [])
      .map((row) => row.profile as Profile | null)
      .filter((p): p is Profile => p != null),
  }
}

export async function getFollowing(userId: string) {
  const supabase = createClient()
  if (!supabase) return { error: 'Supabase non configure' }

  const { data, error } = await supabase
    .from('follows')
    .select(`
      created_at,
      profile:profiles!follows_following_id_fkey (
        id, username, display_name, avatar_url, bio
      )
    `)
    .eq('follower_id', userId)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return {
    users: (data ?? [])
      .map((row) => row.profile as Profile | null)
      .filter((p): p is Profile => p != null),
  }
}
