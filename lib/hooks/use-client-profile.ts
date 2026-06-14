'use client'

import { useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

/** Charge le profil cote client si le serveur ne l a pas (WebView mobile). */
export function useClientProfile(
  userId: string | undefined,
  serverProfile: Profile | null,
): Profile | null {
  const [profile, setProfile] = useState<Profile | null>(serverProfile)

  useEffect(() => {
    if (serverProfile) {
      setProfile(serverProfile)
      return
    }
    if (!userId) {
      setProfile(null)
      return
    }

    const supabase = createClient()
    if (!supabase) return

    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProfile(data as Profile)
      })
  }, [userId, serverProfile])

  return profile
}
