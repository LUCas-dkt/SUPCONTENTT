import type { Metadata } from 'next'
import { DiscoverPageClient } from '@/components/pages/discover-page-client'

export const metadata: Metadata = {
  title: 'Decouvrir',
  description: 'Trouvez des membres et explorez leur univers musical.',
}

export default function DiscoverPage() {
  return <DiscoverPageClient />
}
