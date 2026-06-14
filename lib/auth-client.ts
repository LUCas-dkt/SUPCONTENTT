'use client'

import { createClient } from '@/lib/supabase/client'
import { authLoginPath, sanitizeNextPath } from '@/lib/routes'

function authRedirectUrl(nextPath: string): string {
  const next = sanitizeNextPath(nextPath)
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
  }
  return (
    process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
    `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=${encodeURIComponent(next)}`
  )
}

export async function signInWithEmailClient(
  email: string,
  password: string,
  nextPath?: string,
): Promise<{ error?: string }> {
  const supabase = createClient()
  if (!supabase) {
    return {
      error:
        'Supabase nest pas configure. Verifiez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })

  if (error) {
    return { error: error.message }
  }

  window.location.href = sanitizeNextPath(nextPath)
  return {}
}

export async function signUpWithEmailClient(
  email: string,
  password: string,
  nextPath?: string,
): Promise<{ error?: string; needsEmailConfirmation?: true }> {
  const supabase = createClient()
  if (!supabase) {
    return {
      error:
        'Supabase nest pas configure. Verifiez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    }
  }

  const next = sanitizeNextPath(nextPath)
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      emailRedirectTo: authRedirectUrl(next),
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.session) {
    window.location.href = next
    return {}
  }

  return { needsEmailConfirmation: true }
}

export async function signInWithGoogleClient(nextPath?: string): Promise<{ error?: string }> {
  const supabase = createClient()
  if (!supabase) {
    return {
      error:
        'Supabase nest pas configure. Verifiez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    }
  }

  const next = sanitizeNextPath(nextPath)
  const redirectTo = authRedirectUrl(next)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    if (error.message.includes('provider') || error.message.includes('enabled')) {
      return {
        error:
          'Google OAuth nest pas configure. Ajoutez GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans .env.local puis redemarrez Supabase (npm run db:stop && npm run db:start).',
      }
    }
    return { error: error.message }
  }

  if (data.url) {
    window.location.href = data.url
    return {}
  }

  return { error: 'Impossible de demarrer la connexion Google.' }
}

export async function signOutClient(): Promise<void> {
  const supabase = createClient()
  if (supabase) {
    await supabase.auth.signOut()
  }
  window.location.href = authLoginPath()
}
