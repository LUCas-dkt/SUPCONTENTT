import type { Metadata } from 'next'
import { LibraryPageClient } from '@/components/pages/library-page-client'

export const metadata: Metadata = { title: 'Ma bibliotheque' }

export default function LibraryPage() {
  return <LibraryPageClient />
}
