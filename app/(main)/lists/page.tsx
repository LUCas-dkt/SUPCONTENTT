import type { Metadata } from 'next'
import { ListsPageClient } from '@/components/pages/lists-page-client'

export const metadata: Metadata = {
  title: 'Mes listes',
  description: 'Vos listes musicales sur SUPCONTENT.',
}

export default function ListsPage() {
  return <ListsPageClient />
}
