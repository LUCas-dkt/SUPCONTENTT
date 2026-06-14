import type { Metadata } from 'next'
import { FavoritesPageClient } from '@/components/pages/favorites-page-client'

export const metadata: Metadata = {
  title: 'Mes favoris',
  description: 'Votre musique favorite sur SUPCONTENT.',
}

export default function FavoritesPage() {
  return <FavoritesPageClient />
}
