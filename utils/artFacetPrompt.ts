// /utils/artFacetPrompt.ts

export type ArtFacetPromptEntry = {
  id: number
  title: string
  taxonomy: string
  canonicalValue?: string | null
  artPrompt?: string | null
}

export function artFacetPromptValue(entry: ArtFacetPromptEntry): string {
  return String(entry.artPrompt || entry.canonicalValue || entry.title).trim()
}

export function buildArtFacetPromptAddon(
  entries: readonly ArtFacetPromptEntry[],
): string {
  const values = Array.from(
    new Set(entries.map(artFacetPromptValue).filter(Boolean)),
  )
  return values.length ? `Facet direction: ${values.join(', ')}` : ''
}

export function composeArtPromptWithFacets(
  basePrompt: string,
  entries: readonly ArtFacetPromptEntry[],
): string {
  const base = String(basePrompt || '').replace(/\s+/g, ' ').trim()
  const addon = buildArtFacetPromptAddon(entries)
  return [base, addon].filter(Boolean).join(', ')
}
