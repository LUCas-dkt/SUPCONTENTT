'use client'

import { useEffect } from 'react'
import { useAuthUser, type AuthUser } from '@/lib/hooks/use-auth-user'

interface NotificationPollerProps {
  serverUser: AuthUser | null
}

/** No-op: router.refresh() cassait la WebView mobile. Le compteur est gere cote client dans le Header. */
export function NotificationPoller({ serverUser }: NotificationPollerProps) {
  const { isLoggedIn } = useAuthUser(serverUser)

  useEffect(() => {
    if (!isLoggedIn) return
  }, [isLoggedIn])

  return null
}
