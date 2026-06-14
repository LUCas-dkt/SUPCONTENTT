import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { MainShell } from '@/components/main-shell'
import { NotificationPoller } from '@/components/notifications/notification-poller'
import { ThemeSync } from '@/components/theme-sync'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  let user: { id: string; email?: string } | null = null
  let profile = null
  let unreadNotifications = 0

  if (supabase) {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    user = authUser
  }

  if (user && supabase) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    profile = profileData
    
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
    
    unreadNotifications = count || 0
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <ThemeSync preference={profile?.theme_preference} />
      <NotificationPoller serverUser={user ? { id: user.id, email: user.email } : null} />
      <Header 
        user={user} 
        profile={profile} 
        unreadNotifications={unreadNotifications}
      />
      <MainShell serverUser={user ? { id: user.id, email: user.email } : null}>
        <main className="flex-1">
          {children}
        </main>
      </MainShell>
      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} SUPCONTENT. Tous droits reserves.
            </p>
            <p className="text-sm text-muted-foreground">
              Donnees fournies par Last.fm
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
