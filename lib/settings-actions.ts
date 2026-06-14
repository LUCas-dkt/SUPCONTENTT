'use server'

import { createClient } from '@/lib/supabase/server'
import { exportUserData } from '@/lib/social-actions'
import { revalidatePath } from 'next/cache'

export async function updateUserSettings(data: {
  display_name?: string
  bio?: string
  website?: string
  theme_preference?: string
  notification_email?: boolean
  notification_push?: boolean
}) {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase non configure' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non connecte' }

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: data.display_name?.trim() || null,
      bio: data.bio?.trim() || null,
      website: data.website?.trim() || null,
      theme_preference: data.theme_preference ?? 'system',
      notification_email: data.notification_email ?? true,
      notification_push: data.notification_push ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { success: true }
}

export async function exportUserDataAction() {
  return exportUserData()
}
