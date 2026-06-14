'use server'

import { createClient } from '@/lib/supabase/server'
import { authLoginPath, sanitizeNextPath } from '@/lib/routes'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

const SUPABASE_NOT_CONFIGURED = 'Supabase nest pas configure. Ajoutez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local'

export async function signInWithGoogle(nextPath?: string) {
  const supabase = await createClient()
  if (!supabase) return { error: SUPABASE_NOT_CONFIGURED }

  const next = sanitizeNextPath(nextPath)
  
  const redirectUrl = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? 
    `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=${encodeURIComponent(next)}`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function requestPasswordReset(email: string) {
  const supabase = await createClient()
  if (!supabase) return { error: SUPABASE_NOT_CONFIGURED }

  const trimmed = email.trim()
  if (!trimmed) return { error: 'Email requis' }

  const redirectTo =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'

  const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
    redirectTo: `${redirectTo}/auth/callback?next=/settings`,
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function signInWithEmail(email: string, password: string, nextPath?: string) {
  const supabase = await createClient()
  if (!supabase) return { error: SUPABASE_NOT_CONFIGURED }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect(sanitizeNextPath(nextPath))
}

export async function signUpWithEmail(email: string, password: string, nextPath?: string) {
  const supabase = await createClient()
  if (!supabase) return { error: SUPABASE_NOT_CONFIGURED }

  const next = sanitizeNextPath(nextPath)

  const redirectUrl = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? 
    `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=${encodeURIComponent(next)}`

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
    },
  })

  if (error) {
    return { error: error.message }
  }

  // Compte actif immediatement (confirmation desactivee en local)
  if (data.session) {
    revalidatePath('/', 'layout')
    redirect(next)
  }

  // Confirmation email requise — l'email est dans Mailpit en dev local
  return { needsEmailConfirmation: true as const }
}

export async function signOut() {
  const supabase = await createClient()
  if (!supabase) return { error: SUPABASE_NOT_CONFIGURED }
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect(authLoginPath())
}

export async function getUser() {
  const supabase = await createClient()
  if (!supabase) return null
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getProfile() {
  const supabase = await createClient()
  if (!supabase) return null
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

export async function updateProfile(data: {
  display_name?: string
  bio?: string
  website?: string
  avatar_url?: string
}) {
  const supabase = await createClient()
  if (!supabase) return { error: SUPABASE_NOT_CONFIGURED }
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}
