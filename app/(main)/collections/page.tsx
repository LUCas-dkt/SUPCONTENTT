import type { Metadata } from 'next'
import { CollectionsPageClient } from '@/components/pages/collections-page-client'

export const metadata: Metadata = {
  title: 'Collections',
  description: 'Vos collections et listes musicales sur SUPCONTENT.',
}

export default function CollectionsPage() {
  return <CollectionsPageClient />
}
