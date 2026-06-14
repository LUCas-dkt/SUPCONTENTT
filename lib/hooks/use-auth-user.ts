'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

import { createClient } from '@/lib/supabase/client'

export type AuthUser = { id: string; email?: string }

function toAuthUser(user: User | null): AuthUser | null {
  if (!user) return null
  return { id: user.id, email: user.email }
}

/** Combine la session serveur (SSR) et la session navigateur (WebView mobile). */
export function useAuthUser(serverUser: AuthUser | null) {
  const [clientUser, setClientUser] = useState<AuthUser | null>(null)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    if (!supabase) {
      setAuthReady(true)
      return
    }

    const sync = (user: User | null) => {
      setClientUser(toAuthUser(user))
      setAuthReady(true)
    }

    supabase.auth.getSession().then(({ data }) => {
      sync(data.session?.user ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      sync(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const user = serverUser ?? clientUser

  return {
    user,
    isLoggedIn: Boolean(user),
    authReady,
  }
}
