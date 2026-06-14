import type { Metadata } from 'next'
import { NotificationsPageClient } from '@/components/pages/notifications-page-client'

export const metadata: Metadata = {
  title: 'Notifications',
}

export default function NotificationsPage() {
  return <NotificationsPageClient />
}
