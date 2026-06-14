import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MusicGrid } from '@/components/music-card'
import { getTopArtists, getTopTracks, normalizeArtist, normalizeTrack } from '@/lib/lastfm'
import { createClient } from '@/lib/supabase/server'
import { ActivityFeedSection } from '@/components/home/activity-feed-section'
import { FeaturedReviewsSection } from '@/components/home/featured-reviews-section'
import { RecommendationBoot } from '@/components/home/recommendation-boot'
import { musicItemHref } from '@/lib/music-links'
import { HomeFeaturesGrid } from '@/components/home/home-features-grid'
import { HomeHeroActions } from '@/components/home/home-hero-actions'
import { HomeSignupCta } from '@/components/home/home-signup-cta'
import { listPath } from '@/lib/routes'
import { 
  Music2, 
  ListMusic, 
  Star, 
  TrendingUp,
  ArrowRight,
} from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const authUser = supabase ? (await supabase.auth.getUser()).data.user : null
  const user = authUser
  const serverUser = authUser ? { id: authUser.id, email: authUser.email } : null

  // Fetch trending data
  const [topArtists, topTracks] = await Promise.all([
    getTopArtists(1, 10),
    getTopTracks(1, 10)
  ])

  // Fetch recent activity if logged in
  let recentReviews: {
    id: string
    item_type: string
    item_name: string
    item_artist: string | null
    rating: number | null
    profiles: { username: string; display_name: string | null } | null
  }[] = []
  let popularLists: {
    id: string
    title: string
    item_count: number
    likes_count: number
    profiles: { username: string; display_name: string | null } | null
  }[] = []
  if (supabase) {
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('id, item_type, item_name, item_artist, rating, profiles(username, display_name)')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(5)

    if (reviewsData) recentReviews = reviewsData as typeof recentReviews

    const { data: listsData } = await supabase
      .from('lists')
      .select('id, title, item_count, likes_count, profiles(username, display_name)')
      .eq('is_public', true)
      .order('likes_count', { ascending: false })
      .limit(5)

    if (listsData) popularLists = listsData as typeof popularLists
  }

  return (
    <div className="flex flex-col">
      <RecommendationBoot serverUser={serverUser} />
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
              <Music2 className="size-8" />
            </div>
            <h1 className="mb-4 text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Votre univers musical,{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                organise
              </span>
            </h1>
            <p className="mb-8 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
              Decouvrez, collectionnez et partagez votre passion pour la musique. 
              Creez des collections, des listes et des critiques avec SUPCONTENT.
            </p>
            <HomeHeroActions serverUser={serverUser} />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="border-b py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-10 text-center">
            <h2 className="mb-2 text-2xl font-bold sm:text-3xl">Tout pour les passionnes de musique</h2>
            <p className="text-muted-foreground">Des outils puissants pour gerer votre univers musical</p>
          </div>
          <HomeFeaturesGrid serverUser={serverUser} />
        </div>
      </section>

      <FeaturedReviewsSection />
      <ActivityFeedSection serverUser={serverUser} />

      {/* Trending Artists */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-bold">
                <TrendingUp className="size-6 text-primary" />
                Artistes tendance
              </h2>
              <p className="text-muted-foreground">Les artistes les plus populaires du moment</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/charts">
                Voir tout
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
          <MusicGrid 
            items={topArtists.map(normalizeArtist)} 
            showType={false}
            columns={5}
          />
        </div>
      </section>

      {/* Trending Tracks */}
      <section className="border-t bg-muted/30 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-bold">
                <Music2 className="size-6 text-primary" />
                Morceaux populaires
              </h2>
              <p className="text-muted-foreground">Les titres les plus ecoutes</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/charts?type=tracks">
                Voir tout
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
          <MusicGrid 
            items={topTracks.map(normalizeTrack)} 
            showType={false}
            variant="horizontal"
          />
        </div>
      </section>

      {/* Recent Activity */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Recent Reviews */}
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  <Star className="size-5 text-primary" />
                  Critiques recentes
                </h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/reviews">
                    Voir plus
                    <ArrowRight className="ml-1 size-4" />
                  </Link>
                </Button>
              </div>
              <div className="space-y-3">
                {recentReviews.length > 0 ? (
                  recentReviews.map((review) => (
                    <Link key={review.id} href={musicItemHref(review)}>
                      <Card className="transition-colors hover:bg-accent/50">
                        <CardContent className="flex items-center gap-4 p-4">
                          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
                            {review.rating || '-'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{review.item_name}</p>
                            <p className="truncate text-sm text-muted-foreground">
                              {review.item_artist} • par @{review.profiles?.username}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                      <Star className="mb-2 size-8 text-muted-foreground" />
                      <p className="text-muted-foreground">Aucune critique pour le moment</p>
                      {user && (
                        <Button variant="link" asChild className="mt-2">
                          <Link href="/search">Ecrire votre premiere critique</Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Popular Lists */}
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  <ListMusic className="size-5 text-primary" />
                  Listes populaires
                </h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/lists/explore">
                    Voir plus
                    <ArrowRight className="ml-1 size-4" />
                  </Link>
                </Button>
              </div>
              <div className="space-y-3">
                {popularLists.length > 0 ? (
                  popularLists.map((list) => (
                    <Link key={list.id} href={listPath(list.id)}>
                      <Card className="transition-colors hover:bg-accent/50">
                        <CardContent className="flex items-center gap-4 p-4">
                          <div className="flex size-10 items-center justify-center rounded-lg bg-accent/50">
                            <ListMusic className="size-5 text-accent-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{list.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {list.item_count} elements • {list.likes_count} likes • par @{list.profiles?.username}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                      <ListMusic className="mb-2 size-8 text-muted-foreground" />
                      <p className="text-muted-foreground">Aucune liste pour le moment</p>
                      {user && (
                        <Button variant="link" asChild className="mt-2">
                          <Link href="/lists">Creer votre premiere liste</Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <HomeSignupCta serverUser={serverUser} />
    </div>
  )
}

