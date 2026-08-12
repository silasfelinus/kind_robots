// /utils/comments/facetAttributeMatch.ts
//
// Which Facets a speaker actually IS.
//
// WHY
// ---
// kind_robots#1769. `relationshipScore` has a top tier for "the target Facet is
// one of this speaker's own facets" — 100, the strongest signal there is. It
// reads `speaker.facetIds`, which comes from CharacterFacet / BotFacet join
// rows in the database.
//
// The offline casting path has no database. It builds speaker profiles from the
// public API, where those join rows are not exposed, so `facetIds` is always
// empty and the tier never fires: every speaker scored relationship 0 on every
// facet, and facet casting ran on vocabulary overlap alone.
//
// That is a real loss, not a technicality. Facet titles and character attribute
// fields are the same vocabulary by design — the catalog's groups are Species,
// Personality, Class, Alignment, Quirks, Backstory, Genres, Gender, and every
// Character row carries exactly those fields. Brine's `alignment` is literally
// "Chaotic Good". For facet #219, "Chaotic Good", Brine placed third on
// accidental word overlap rather than first on being the thing.
//
// So: recover the relationship the join table would have given us, from the
// attributes the object already publishes.
//
// WHY IT IS SCOPED BY GROUP
// -------------------------
// Matching a facet title against a speaker's whole description would be much
// cheaper and much worse. "Blunt" is a Personality facet; it also appears in
// plenty of backstories as a description of a weapon. "Bard" is a Class; it
// turns up in prose about taverns. An unscoped match would hand out the
// strongest signal in the system for a coincidence, and a 100 from a false
// positive outranks a 90 from a real one.
//
// Each facet group therefore reads exactly one field. A Species facet is
// checked against `species` and nothing else. A speaker who merely mentions
// axolotls does not become one.
import type { SignalSpeakerProfile } from './commentSignals'

/** The catalog fields this needs. A live Facet row satisfies it. */
export type FacetAttributeRow = {
  id: number
  title?: string | null
  groupKey?: string | null
  groupLabel?: string | null
  /** The API returns an array; older exports carry a delimited string. */
  aliases?: string[] | string | null
}

/**
 * Facet group -> the single speaker field it is allowed to match.
 *
 * Keyed by lowercased `groupKey`, with `groupLabel` accepted as a fallback
 * because the catalog carries both and they do not always agree in case or
 * plurality. Groups absent from this map (color, material, palette, style,
 * theme, art subject types...) describe objects rather than people and are
 * deliberately unmatched — a character is not the colour teal.
 *
 * Gender is absent for a different reason: `SignalSpeakerProfile` does not
 * carry it, and widening a shared signal type to reach six facets with a single
 * live match is not worth the surface. Add the field first if that changes.
 */
const GROUP_FIELDS: Record<string, keyof SignalSpeakerProfile> = {
  species: 'species',
  animal: 'species',
  personality: 'personality',
  'bot-personality': 'personality',
  'bot personalities': 'personality',
  class: 'characterClass',
  archetype: 'characterClass',
  alignment: 'alignment',
  quirks: 'quirks',
  backstory: 'backstory',
  genre: 'genre',
  genres: 'genre',
  'scenario-genre': 'genre',
  'scenario genres': 'genre',
  'curated-genre': 'genre',
  'curated genres': 'genre',
  'house genres': 'genre',
  'cultural genres': 'genre',
  'bot-type': 'botType',
  'bot types': 'botType',
  role: 'role',
  occupations: 'role',
}

function normalize(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Whole-phrase containment, not substring.
 *
 * `includes()` on the raw strings would match "Elf" inside "Self-Taught" and
 * "Bard" inside "Bardic College". Normalizing both sides to space-delimited
 * tokens and requiring the needle to sit on token boundaries costs nothing and
 * removes that whole class of false positive.
 */
function containsPhrase(haystack: string, needle: string): boolean {
  if (!haystack || !needle) return false
  return ` ${haystack} `.includes(` ${needle} `)
}

/**
 * Every name a facet answers to: its title plus its aliases.
 *
 * `/api/facets` returns `aliases` as an array. Coercing that with String()
 * happens to produce a comma-joined list that splits back correctly, but only
 * by accident, and it would quietly mangle any alias containing a comma. Handle
 * the two shapes on purpose instead.
 */
function facetNames(facet: FacetAttributeRow): string[] {
  const aliases = Array.isArray(facet.aliases)
    ? facet.aliases
    : String(facet.aliases ?? '').split(/[|,]/)

  return [facet.title, ...aliases]
    .map((name) => normalize(name))
    // One- and two-character names are noise, not identity.
    .filter((name) => name.length > 2)
}

/**
 * Facet ids this speaker carries as an attribute.
 *
 * The result is exactly what `speaker.facetIds` would hold if the join rows
 * were readable, so callers assign it there and `relationshipScore` needs no
 * change at all.
 */
export function facetIdsForSpeaker(
  speaker: SignalSpeakerProfile,
  facets: FacetAttributeRow[],
): number[] {
  const matched = new Set<number>()

  for (const facet of facets) {
    const field =
      GROUP_FIELDS[normalize(facet.groupKey)] ||
      GROUP_FIELDS[normalize(facet.groupLabel)]
    if (!field) continue

    const value = normalize(speaker[field] as unknown)
    if (!value) continue

    if (facetNames(facet).some((name) => containsPhrase(value, name))) {
      matched.add(facet.id)
    }
  }

  return [...matched].sort((left, right) => left - right)
}

/** As above, across a pool, returning profiles with `facetIds` populated. */
export function withFacetAttributes<T extends SignalSpeakerProfile>(
  speakers: T[],
  facets: FacetAttributeRow[],
): T[] {
  return speakers.map((speaker) => ({
    ...speaker,
    facetIds: [...(speaker.facetIds || []), ...facetIdsForSpeaker(speaker, facets)],
  }))
}
