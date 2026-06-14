'use server'

import { createClient } from '@/lib/supabase/server'
import type { List, Review } from '@/lib/types'

export async function getPopularPublicLists(limit = 30) {
  const supabase = await createClient()
  if (!supabase) return { lists: [] as (List & { profiles: { username: string; display_name: string | null } | null })[] }

  const { data, error } = await supabase
    .from('lists')
    .select('*, profiles(username, display_name)')
    .eq('is_public', true)
    .order('likes_count', { ascending: false })
    .limit(limit)

  if (error) return { error: error.message, lists: [] }
  return { lists: (data ?? []) as (List & { profiles: { username: string; display_name: string | null } | null })[] }
}

export async function getRecentPublicReviews(limit = 40) {
  const supabase = await createClient()
  if (!supabase) return { reviews: [] as (Review & { profiles: { username: string; display_name: string | null } | null })[] }

  const { data, error } = await supabase
    .from('reviews')
    .select('*, profiles(username, display_name)')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { error: error.message, reviews: [] }
  return { reviews: (data ?? []) as (Review & { profiles: { username: string; display_name: string | null } | null })[] }
}

export async function getPublicListById(listId: string) {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase non configure' }

  const { data: { user } } = await supabase.auth.getUser()

  const { data: list, error } = await supabase
    .from('lists')
    .select(`
      *,
      profiles (username, display_name, avatar_url),
      list_items (*)
    `)
    .eq('id', listId)
    .maybeSingle()

  if (error || !list) return { error: error?.message ?? 'Liste introuvable' }
  if (!list.is_public && list.user_id !== user?.id) {
    return { error: 'Cette liste est privee' }
  }

  return { list }
}
