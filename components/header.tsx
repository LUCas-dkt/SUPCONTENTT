'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Music2, 
  Search, 
  Bell, 
  User, 
  LogOut, 
  Settings, 
  ListMusic, 
  Library, 
  Home,
  TrendingUp,
  Heart,
  MessageCircle,
  Users,
  Menu,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOutClient } from '@/lib/auth-client'
import { profilePath } from '@/lib/routes'
import { useAuthUser } from '@/lib/hooks/use-auth-user'
import { useClientProfile } from '@/lib/hooks/use-client-profile'
import type { Profile } from '@/lib/types'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  user: { id: string; email?: string } | null
  profile: Profile | null
  unreadNotifications?: number
}

const baseNavigation = [
  { name: 'Accueil', href: '/', icon: Home },
  { name: 'Recherche', href: '/search', icon: Search },
  { name: 'Tendances', href: '/charts', icon: TrendingUp },
  { name: 'Collections', href: '/collections', icon: Library },
  { name: 'Listes', href: '/lists', icon: ListMusic },
]

const loggedInNavItems = [
  { name: 'Bibliotheque', href: '/library', icon: Library },
  { name: 'Favoris', href: '/favorites', icon: Heart },
  { name: 'Decouvrir', href: '/discover', icon: Users },
  { name: 'Messages', href: '/messages', icon: MessageCircle },
]

export function Header({ user: serverUser, profile, unreadNotifications = 0 }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, isLoggedIn } = useAuthUser(serverUser)
  const activeProfile = useClientProfile(user?.id, profile)
  const profileHref = profilePath(activeProfile?.username)
  const [unreadCount, setUnreadCount] = useState(unreadNotifications)

  useEffect(() => {
    setUnreadCount(unreadNotifications)
  }, [unreadNotifications])

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return
    const supabase = createClient()
    if (!supabase) return

    const refresh = () => {
      void supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
        .then(({ count }) => setUnreadCount(count ?? 0))
    }

    refresh()
    const id = setInterval(refresh, 30000)
    return () => clearInterval(id)
  }, [isLoggedIn, user?.id])

  const navigation = isLoggedIn ? [...baseNavigation, ...loggedInNavItems] : baseNavigation

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4">
        {/* Ligne 1 : logo, recherche large, actions */}
        <div className="flex h-14 items-center gap-3 sm:gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Music2 className="size-5" />
            </div>
            <span className="hidden text-xl font-bold sm:inline-block">SUPCONTENT</span>
          </Link>

          <form onSubmit={handleSearch} className="min-w-0 flex-1">
            <div className="relative mx-auto w-full max-w-2xl">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher artistes, albums, morceaux..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-full border-muted-foreground/20 bg-muted/40 pl-11 pr-4 text-base shadow-sm placeholder:text-muted-foreground/80 focus-visible:bg-background"
                aria-label="Rechercher"
              />
            </div>
          </form>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {isLoggedIn ? (
              <>
                <Button variant="ghost" size="icon" asChild className="relative hidden sm:inline-flex">
                  <Link href="/messages">
                    <MessageCircle className="size-5" />
                    <span className="sr-only">Messages</span>
                  </Link>
                </Button>

                <Button variant="ghost" size="icon" asChild className="relative">
                  <Link href="/notifications">
                    <Bell className="size-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                    <span className="sr-only">Notifications</span>
                  </Link>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative size-9 rounded-full p-0">
                      <Avatar className="size-9">
                        <AvatarImage
                          src={activeProfile?.avatar_url || undefined}
                          alt={activeProfile?.display_name || activeProfile?.username || 'User'}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {(activeProfile?.display_name || activeProfile?.username || 'U')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center gap-2 p-2">
                      <Avatar className="size-8">
                        <AvatarImage src={activeProfile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {(activeProfile?.display_name || activeProfile?.username || 'U')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {activeProfile?.display_name || activeProfile?.username || 'Mon compte'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {activeProfile?.username ? `@${activeProfile.username}` : 'Completer le profil'}
                        </span>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={profileHref} className="flex items-center gap-2">
                        <User className="size-4" />
                        Mon profil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/favorites" className="flex items-center gap-2">
                        <Heart className="size-4" />
                        Mes favoris
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/collections" className="flex items-center gap-2">
                        <Library className="size-4" />
                        Mes collections
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/lists" className="flex items-center gap-2">
                        <ListMusic className="size-4" />
                        Mes listes
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex items-center gap-2">
                        <Settings className="size-4" />
                        Parametres
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => signOutClient()}
                      className="flex items-center gap-2 text-destructive focus:text-destructive"
                    >
                      <LogOut className="size-4" />
                      Deconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Button variant="ghost" asChild size="sm">
                  <Link href="/auth/login">Connexion</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/auth/sign-up">Inscription</Link>
                </Button>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              <span className="sr-only">Menu</span>
            </Button>
          </div>
        </div>

        {/* Ligne 2 : navigation (desktop) */}
        <nav className="hidden h-11 items-center gap-1 overflow-x-auto border-t md:flex">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <Icon className="size-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Menu mobile */}
      {mobileMenuOpen && (
        <div className="border-t md:hidden">
          <div className="space-y-1 p-4">
            {!isLoggedIn && (
              <div className="mb-4 flex gap-2">
                <Button variant="outline" asChild className="flex-1">
                  <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                    Connexion
                  </Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link href="/auth/sign-up" onClick={() => setMobileMenuOpen(false)}>
                    Inscription
                  </Link>
                </Button>
              </div>
            )}

            {isLoggedIn && (
              <Link
                href="/messages"
                onClick={() => setMobileMenuOpen(false)}
                className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
              >
                <MessageCircle className="size-5" />
                Messages
              </Link>
            )}

            {navigation.map((item) => {
              const Icon = item.icon
              const isActive =
                pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  <Icon className="size-5" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </header>
  )
}
