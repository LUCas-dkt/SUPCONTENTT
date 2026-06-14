import type { ReactNode } from 'react'

/** Formatage leger pour les critiques : **gras**, *italique*, retours ligne. */
export function formatReviewContent(text: string): ReactNode[] {
  const parts: ReactNode[] = []
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g
  let last = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index))
    }
    const token = match[0]
    if (token.startsWith('**')) {
      parts.push(<strong key={key++}>{token.slice(2, -2)}</strong>)
    } else {
      parts.push(<em key={key++}>{token.slice(1, -1)}</em>)
    }
    last = match.index + token.length
  }

  if (last < text.length) parts.push(text.slice(last))
  return parts.length ? parts : [text]
}
