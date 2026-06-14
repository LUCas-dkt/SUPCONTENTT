import { NextResponse } from 'next/server'
import { fetchSupcontentApi } from '@/lib/supcontent-api'

/** Delegue a l'API Express si SUPCONTENT_API_URL est configure, sinon null. */
export async function proxyLastFmRoute(
  apiPath: string,
  searchParams: Record<string, string | undefined>,
) {
  const response = await fetchSupcontentApi(apiPath, { searchParams })
  if (!response) return null
  if (!response.ok) {
    const text = await response.text()
    return NextResponse.json(
      { error: text || `API media error: ${response.status}` },
      { status: response.status },
    )
  }
  const data = await response.json()
  return NextResponse.json(data)
}
