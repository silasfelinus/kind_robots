export type ProsePart = { text: string; em: boolean }

/**
 * Splits a section's text on its `*...*` spans (spoken or remembered words, such as the coiled thing's voice in
 * Act V) so the reader can set them in italics instead of printing the asterisks.
 */
export function emphasis(text: string): ProsePart[] {
  const parts: ProsePart[] = []
  text.split(/(\*[^*]+\*)/).forEach((chunk) => {
    if (!chunk) return
    const em = chunk.length > 2 && chunk.startsWith('*') && chunk.endsWith('*')
    parts.push({ text: em ? chunk.slice(1, -1) : chunk, em })
  })
  return parts
}
