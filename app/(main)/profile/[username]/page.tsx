import { notFound, redirect } from 'next/navigation'
import { isValidSlug } from '@/lib/routes'
import { createClient } from '@/lib/supabase/server'
import { ProfileView } from '@/components/profile/profile-view'
import {
  getProfileByUsername,
  getProfileLists,
  getProfileMusic,
  getProfileReviews,
  isFollowing,
  isMutualFollow,
} from '@/lib/profile-actions'
import type { Metadata } from 'next'

interface ProfilePageProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params
  return {
    title: `@${decodeURIComponent(username)}`,
    description: `Profil musical de @${decodeURIComponent(username)} sur SUPCONTENT.`,
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params
  const decoded = decodeURIComponent(username)

  if (!isValidSlug(decoded)) {
    redirect('/settings')
  }

  const result = await getProfileByUsername(decoded)
  if (result.error || !result.profile) notFound()

  const [favoritesResult, recentResult, listsResult, reviewsResult] = await Promise.all([
    getProfileMusic(result.profile.id, 'favorite'),
    getProfileMusic(result.profile.id, 'recent'),
    getProfileLists(result.profile.id),
    getProfileReviews(result.profile.id),
  ])

  const supabase = await createClient()
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } }

  const following =
    user && user.id !== result.profile.id
      ? await isFollowing(result.profile.id)
      : false

  const mutualFollow =
    user && user.id !== result.profile.id
      ? await isMutualFollow(result.profile.id)
      : false

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <ProfileView
        profile={result.profile}
        stats={result.stats!}
        favorites={favoritesResult.items ?? []}
        recent={recentResult.items ?? []}
        nowPlaying={result.nowPlaying}
        lists={listsResult.lists ?? []}
        reviews={reviewsResult.reviews ?? []}
        isOwnProfile={user?.id === result.profile.id}
        isFollowing={following}
        isMutualFollow={mutualFollow}
        currentUserId={user?.id ?? null}
      />
    </div>
  )
}
