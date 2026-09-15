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
// Scaled by 10 relative to the original spacing (2026-09-15) purely to make
// room inside the identity band for the four embodiment axes. Every existing
// taxonomy keeps its exact relative position; nothing reorders.
const TAXONOMY_PROMPT_PRIORITY: Record<string, number> = {
  SPECIES: 100,
  ANIMAL: 100,
  ARCHETYPE: 110,
  OCCUPATION: 110,
  ROLE: 110,
  CORE: 120,
  GENDER: 130,
  // Embodiment sits with the subject, immediately after gender and before
  // disposition. This placement is load-bearing, not cosmetic: a diffusion
  // model weights the head of the prompt most, so "silver-locked, broad
  // through the shoulders, late sixties" has to arrive while it is still
  // deciding what body to paint. Left at DEFAULT_TAXONOMY_PRIORITY these
  // would land AFTER style and art direction, where they read as afterthoughts
  // and get overridden by the style tail -- the same failure that once turned
  // a reward's `look` into a crowd of people.
  AGE: 132,
  BUILD: 134,
  HAIR: 136,
  // ORIGIN is culture, so it trails the physical axes and informs dress,
  // ornament and craft rather than face or frame.
  ORIGIN: 138,
  ALIGNMENT: 140,
  PERSONALITY: 150,
  QUIRK: 160,
  BACKSTORY: 170,
  GENRE: 200,
  THEME: 210,
  SETTING: 220,
  MOOD: 230,
  COLOR: 240,
  MATERIAL: 250,
  STYLE: 300,
  ART_DIRECTION: 310,
  PROMPT_ENHANCEMENT: 900,
}
const DEFAULT_TAXONOMY_PRIORITY = 500

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

/** Comparable form for "is this direction already in the prompt?". */
function normalizedForDedupe(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase()
}

export function buildArtFacetPromptAddon(
  entries: readonly ArtFacetPromptEntry[],
  basePrompt = '',
): string {
  const base = normalizedForDedupe(basePrompt)
  const values = Array.from(
    new Set(orderArtFacetEntries(entries).map(artFacetPromptValue).filter(Boolean)),
    // A Facet whose direction the base prompt already states adds nothing by
    // being restated. Several catalog prompts are BUILT from their Facet's
    // artPrompt, so appending it again duplicated the whole thing — including
    // its "no text, no logo, no watermark" tail, which then appeared three
    // times in one prompt. At cfg 1 the negative prompt is inert, so those
    // repeats land in positive conditioning on a text-specialist model: the
    // prompt ends up asking for text by naming it eight times.
  ).filter((value) => !base.includes(normalizedForDedupe(value)))
  return values.length ? `Facet direction: ${values.join(', ')}` : ''
}

export function composeArtPromptWithFacets(
  basePrompt: string,
  entries: readonly ArtFacetPromptEntry[],
): string {
  const base = String(basePrompt || '').replace(/\s+/g, ' ').trim()
  const addon = buildArtFacetPromptAddon(entries, base)
  return [base, addon].filter(Boolean).join(', ')
}
