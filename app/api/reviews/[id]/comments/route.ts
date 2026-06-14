import { getReviewComments } from '@/lib/social-actions'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { comments } = await getReviewComments(id)
  return NextResponse.json({ comments })
}
