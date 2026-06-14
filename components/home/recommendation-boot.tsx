'use client'

import { useEffect } from 'react'
import { sendTasteRecommendation } from '@/lib/social-client'
import { useAuthUser, type AuthUser } from '@/lib/hooks/use-auth-user'

export function RecommendationBoot({ serverUser }: { serverUser: AuthUser | null }) {
  const { isLoggedIn, authReady } = useAuthUser(serverUser)

  useEffect(() => {
    if (!authReady || !isLoggedIn) return
    void sendTasteRecommendation()
  }, [authReady, isLoggedIn])

  return null
}
