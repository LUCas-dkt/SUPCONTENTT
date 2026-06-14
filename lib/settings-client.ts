'use client'

import { requireUser } from '@/lib/authed-client'
import { exportUserData } from '@/lib/social-client'

export async function updateUserSettings(data: {
  display_name?: string
  bio?: string
  website?: string
  theme_preference?: string
  locale?: string
  notification_email?: boolean
  notification_push?: boolean
}) {
  const auth = await requireUser()
  if ('error' in auth) return { error: auth.error }
  const { supabase, user } = auth

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: data.display_name?.trim() || null,
      bio: data.bio?.trim() || null,
      website: data.website?.trim() || null,
      theme_preference: data.theme_preference ?? 'system',
      locale: data.locale ?? 'fr',
      notification_email: data.notification_email ?? true,
      notification_push: data.notification_push ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function exportUserDataAction() {
  return exportUserData()
}

export async function exportUserDataCsvAction() {
  const result = await exportUserData()
  if (result.error || !result.data) return { error: result.error ?? 'Export impossible' }

  const payload = JSON.parse(result.data) as {
    library: { item_type: string; item_name: string; item_artist: string | null; status: string }[]
    reviews: { item_name: string; item_artist: string | null; rating: number | null; title: string | null }[]
  }

  const lines = ['type,name,artist,extra']
  for (const item of payload.library ?? []) {
    lines.push(
      `library,${csvCell(item.item_name)},${csvCell(item.item_artist)},${csvCell(item.status)}`,
    )
  }
  for (const review of payload.reviews ?? []) {
    lines.push(
      `review,${csvCell(review.item_name)},${csvCell(review.item_artist)},${csvCell(String(review.rating ?? ''))}`,
    )
  }

  return {
    data: lines.join('\n'),
    filename: result.filename?.replace('.json', '.csv') ?? 'supcontent-export.csv',
  }
}

function csvCell(value: string | null | undefined) {
  const raw = value ?? ''
  return `"${raw.replace(/"/g, '""')}"`
}
