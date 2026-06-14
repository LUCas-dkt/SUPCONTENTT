'use server'

import { createClient } from '@/lib/supabase/server'
import { coerceImageUrl } from '@/lib/lastfm'
import { revalidatePath } from 'next/cache'
import type { Collection, List, MusicItem, Review } from '@/lib/types'

function itemPayload(item: MusicItem) {
  return {
    item_type: item.type,
    item_mbid: item.mbid ?? null,
    item_name: item.name,
    item_artist: item.artist ?? null,
    item_image: coerceImageUrl(item.image) ?? null,
    item_url: item.url,
  }
}

async function requireUser() {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase non configure' as const }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Connectez-vous pour effectuer cette action' as const }

  return { supabase, user }
}

export async function getMyCollections(): Promise<{ collections?: Collection[]; error?: string }> {
  const auth = await requireUser()
  if ('error' in auth && auth.error) return { error: auth.error }
  const { supabase, user } = auth as { supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>; user: { id: string } }

  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) return { error: error.message }
  return { collections: (data as Collection[]) ?? [] }
}

export async function getMyLists(): Promise<{ lists?: List[]; error?: string }> {
  const auth = await requireUser()
  if ('error' in auth && auth.error) return { error: auth.error }
  const { supabase, user } = auth as { supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>; user: { id: string } }

  const { data, error } = await supabase
    .from('lists')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) return { error: error.message }
  return { lists: (data as List[]) ?? [] }
}

export async function createCollection(name: string, description?: string) {
  const auth = await requireUser()
  if ('error' in auth && auth.error) return { error: auth.error }
  const { supabase, user } = auth as { supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>; user: { id: string } }

  const trimmed = name.trim()
  if (!trimmed) return { error: 'Nom requis' }

  const { data, error } = await supabase
    .from('collections')
    .insert({
      user_id: user.id,
      name: trimmed,
      description: description?.trim() || null,
      is_public: false,
    })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/collections')
  return { collection: data as Collection }
}

export async function createList(title: string, description?: string) {
  const auth = await requireUser()
  if ('error' in auth && auth.error) return { error: auth.error }
  const { supabase, user } = auth as { supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>; user: { id: string } }

  const trimmed = title.trim()
  if (!trimmed) return { error: 'Titre requis' }

  const { data, error } = await supabase
    .from('lists')
    .insert({
      user_id: user.id,
      title: trimmed,
      description: description?.trim() || null,
      is_public: true,
    })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/collections')
  return { list: data as List }
}

async function ensureDefaultCollection(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  userId: string,
) {
  const { data: existing } = await supabase
    .from('collections')
    .select('id')
    .eq('user_id', userId)
    .limit(1)

  if (existing?.length) return existing[0].id

  const { data, error } = await supabase
    .from('collections')
    .insert({
      user_id: userId,
      name: 'Ma collection',
      description: 'Collection principale',
      is_public: false,
    })
    .select('id')
    .single()

  if (error || !data) return null
  return data.id as string
}

export async function addItemToCollection(collectionId: string | null, item: MusicItem) {
  const auth = await requireUser()
  if ('error' in auth && auth.error) return { error: auth.error }
  const { supabase, user } = auth as { supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>; user: { id: string } }

  let targetId = collectionId
  if (!targetId) {
    targetId = await ensureDefaultCollection(supabase, user.id)
    if (!targetId) return { error: 'Impossible de creer la collection' }
  }

  const { data: collection } = await supabase
    .from('collections')
    .select('id')
    .eq('id', targetId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!collection) return { error: 'Collection introuvable' }

  let dupQuery = supabase
    .from('collection_items')
    .select('id')
    .eq('collection_id', targetId)
    .eq('item_type', item.type)
    .eq('item_name', item.name)

  dupQuery = item.artist
    ? dupQuery.eq('item_artist', item.artist)
    : dupQuery.is('item_artist', null)

  const { data: dup } = await dupQuery.maybeSingle()

  if (dup) return { error: 'Deja dans cette collection' }

  const { count } = await supabase
    .from('collection_items')
    .select('*', { count: 'exact', head: true })
    .eq('collection_id', targetId)

  const { error } = await supabase.from('collection_items').insert({
    collection_id: targetId,
    ...itemPayload(item),
    position: count ?? 0,
  })

  if (error) return { error: error.message }

  await supabase
    .from('collections')
    .update({
      item_count: (count ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', targetId)

  revalidatePath('/collections')
  return { success: true, collectionId: targetId }
}

export async function addItemToList(listId: string | null, item: MusicItem) {
  const auth = await requireUser()
  if ('error' in auth && auth.error) return { error: auth.error }
  const { supabase, user } = auth as { supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>; user: { id: string } }

  let targetId = listId
  if (!targetId) {
    const created = await createList('Ma liste')
    if (created.error || !created.list) return { error: created.error ?? 'Impossible de creer la liste' }
    targetId = created.list.id
  }

  const { data: list } = await supabase
    .from('lists')
    .select('id')
    .eq('id', targetId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!list) return { error: 'Liste introuvable' }

  const { count } = await supabase
    .from('list_items')
    .select('*', { count: 'exact', head: true })
    .eq('list_id', targetId)

  const { error } = await supabase.from('list_items').insert({
    list_id: targetId,
    ...itemPayload(item),
    position: count ?? 0,
  })

  if (error) return { error: error.message }

  await supabase
    .from('lists')
    .update({
      item_count: (count ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', targetId)

  revalidatePath('/collections')
  return { success: true, listId: targetId }
}

export async function createReview(
  item: MusicItem,
  input: { rating?: number; title?: string; content?: string },
) {
  const auth = await requireUser()
  if ('error' in auth && auth.error) return { error: auth.error }
  const { supabase, user } = auth as { supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>; user: { id: string } }

  const rating = input.rating
  if (rating != null && (rating < 1 || rating > 10)) {
    return { error: 'La note doit etre entre 1 et 10' }
  }

  const content = input.content?.trim()
  const title = input.title?.trim()
  if (!content && rating == null) {
    return { error: 'Ajoutez une note ou un texte' }
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      user_id: user.id,
      ...itemPayload(item),
      rating: rating ?? null,
      title: title || null,
      content: content || null,
      is_public: true,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  await supabase.from('activities').insert({
    user_id: user.id,
    type: 'review',
    target_type: item.type,
    target_name: item.name,
    metadata: { rating: rating ?? null, review_id: data.id },
  })

  const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single()
  if (profile?.username) revalidatePath(`/profile/${profile.username}`)
  revalidatePath('/')
  return { review: data as Review }
}

export async function getCollectionWithItems(collectionId: string) {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase non configure' }

  const { data: { user } } = await supabase.auth.getUser()

  const { data: collection, error } = await supabase
    .from('collections')
    .select(`
      *,
      collection_items (*)
    `)
    .eq('id', collectionId)
    .maybeSingle()

  if (error || !collection) return { error: error?.message ?? 'Collection introuvable' }
  if (!collection.is_public && collection.user_id !== user?.id) {
    return { error: 'Collection privee' }
  }

  return { collection }
}
