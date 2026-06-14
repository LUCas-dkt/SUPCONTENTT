'use client'

import { MusicActionsProvider } from '@/components/music/music-actions-provider'
import { Toaster } from '@/components/ui/toaster'
import { useAuthUser, type AuthUser } from '@/lib/hooks/use-auth-user'

interface MainShellProps {
  children: React.ReactNode
  serverUser: AuthUser | null
}

export function MainShell({ children, serverUser }: MainShellProps) {
  const { isLoggedIn } = useAuthUser(serverUser)

  return (
    <MusicActionsProvider isLoggedIn={isLoggedIn}>
      {children}
      <Toaster />
    </MusicActionsProvider>
  )
}
