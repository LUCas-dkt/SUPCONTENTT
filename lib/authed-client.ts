'use client'

import { createClient } from '@/lib/supabase/client'

export async function requireUser() {
  const supabase = createClient()
  if (!supabase) return { error: 'Supabase non configure' as const }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return { error: 'Non connecte' as const }

  return { supabase, user }
}

export async function requireUserWithProfile() {
  const auth = await requireUser()
  if ('error' in auth) return auth
  const { supabase, user } = auth

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, is_admin, is_banned')
    .eq('id', user.id)
    .single()

  if (profile?.is_banned) return { error: 'Compte suspendu' as const }

  return { supabase, user, profile }
}
