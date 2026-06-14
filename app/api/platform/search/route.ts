import { searchPublicLists } from '@/lib/social-actions'
import { searchUsers } from '@/lib/profile-actions'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''
  const type = searchParams.get('type') ?? 'users'

  if (type === 'lists') {
    const { lists } = await searchPublicLists(q)
    return NextResponse.json({ lists })
  }

  const { users, error } = await searchUsers(q)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ users: users ?? [] })
}
