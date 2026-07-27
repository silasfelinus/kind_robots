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

// Order facets so a composed prompt reads coherently: subject/identity first,
// then descriptive qualities, then stylistic direction, and enhancement/quality
// tags last (where diffusion models weight them best). Unlisted taxonomies keep
// their original relative position in the middle band.
const TAXONOMY_PROMPT_PRIORITY: Record<string, number> = {
  SPECIES: 10,
  ANIMAL: 10,
  ARCHETYPE: 11,
  OCCUPATION: 11,
  ROLE: 11,
  CORE: 12,
  GENDER: 13,
  ALIGNMENT: 14,
  PERSONALITY: 15,
  QUIRK: 16,
  BACKSTORY: 17,
  GENRE: 20,
  THEME: 21,
  SETTING: 22,
  MOOD: 23,
  COLOR: 24,
  MATERIAL: 25,
  STYLE: 30,
  ART_DIRECTION: 31,
  PROMPT_ENHANCEMENT: 90,
}
const DEFAULT_TAXONOMY_PRIORITY = 50

function taxonomyPriority(taxonomy: string): number {
  return (
    TAXONOMY_PROMPT_PRIORITY[String(taxonomy || '').toUpperCase()] ??
    DEFAULT_TAXONOMY_PRIORITY
  )
}

export function orderArtFacetEntries(
  entries: readonly ArtFacetPromptEntry[],
): ArtFacetPromptEntry[] {
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort(
      (a, b) =>
        taxonomyPriority(a.entry.taxonomy) - taxonomyPriority(b.entry.taxonomy) ||
        a.index - b.index,
    )
    .map((item) => item.entry)
}

export function buildArtFacetPromptAddon(
  entries: readonly ArtFacetPromptEntry[],
): string {
  const values = Array.from(
    new Set(orderArtFacetEntries(entries).map(artFacetPromptValue).filter(Boolean)),
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
