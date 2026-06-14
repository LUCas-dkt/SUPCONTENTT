import type { Metadata } from 'next'
import { AdminPageClient } from '@/components/pages/admin-page-client'

export const metadata: Metadata = { title: 'Moderation' }

export default function AdminPage() {
  return <AdminPageClient />
}
