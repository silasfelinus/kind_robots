// /utils/comments/fitnessInventory.ts
//
// The shared read model for the fitness pass: who is connected to whom, and
// which free-text values do or do not resolve to a Facet.
//
// This lives beside the casting module rather than inside a script because
// three things need to agree on it -- the audit that finds gaps, the proposal
// that fills them, and the contract that pins the rules. A second copy of
// "what counts as connected" is how an audit ends up reporting a gap the
// proposal has already filled.
//
// Everything here is derived from the PUBLIC API. There is no database access
// in this lane, and there does not need to be: the link tables are all readable
// from one side or the other.
//   Character -> Scenario   from /api/scenarios (uncapped Characters)
//   Character -> Dream      from /api/dreams/{id} (uncapped; the LIST caps at 3)
//   Character -> Facet      from /api/characters/{id}/facets
//   Scenario  -> Dream      from /api/scenarios
//   Scenario  -> Facet      from /api/scenarios
// The list-endpoint cap is the trap worth naming: /api/dreams returns at most
// three Characters per Dream, which reads exactly like a Dream with a small
// cast. Counting from there under-reports every well-populated Dream.

export type FacetTaxonomy = string

export type FacetRow = {
  id: number
  title: string
  slug?: string | null
  taxonomy?: FacetTaxonomy | null
  canonicalValue?: string | null
  groupKey?: string | null
  groupLabel?: string | null
  isActive?: boolean
  isPublic?: boolean
  aliases?: string[] | null
}

export type CharacterRow = {
  id: number
  name: string
  genre?: string | null
  species?: string | null
  class?: string | null
  alignment?: string | null
  personality?: string | null
  backstory?: string | null
  drive?: string | null
  quirks?: string | null
  role?: string | null
  title?: string | null
  honorific?: string | null
  isPublic?: boolean
  isActive?: boolean
}

export type ScenarioRow = {
  id: number
  title: string
  description?: string | null
  genres?: string | null
  locations?: string | null
  inspirations?: string | null
  group?: string | null
  isPublic?: boolean
  isActive?: boolean
  Dreams?: Array<{ id: number; title: string; dreamType?: string | null }>
  Characters?: Array<{ id: number; name: string }>
  Facets?: Array<{ id: number; title: string }>
}

export type DreamRow = {
  id: number
  title: string
  dreamType?: string | null
  pitch?: string | null
  description?: string | null
  flavorText?: string | null
  isPublic?: boolean
  isActive?: boolean
  Characters?: Array<{ id: number; name: string }>
  Scenarios?: Array<{ id: number; title: string }>
  Bots?: Array<{ id: number; name: string; BotType?: string | null }>
}

export type CharacterFacetLink = {
  characterId: number
  facetId: number
  fieldKey: string
}

/**
 * Formatting-insensitive key, matching FacetAlias.lookupKey semantics:
 * "cowCore", "cow-core" and "cow core" all collapse to "cowcore".
 *
 * Deliberately NOT stemmed. The alias table keeps "cow" and "cows" as separate
 * rows on purpose, so that folding singular into plural stays an explicit
 * curation decision rather than something this function does silently.
 */
export function lookupKey(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]/g, '')
}

/** Free-text genre fields hold lists: "action western, revenge drama". */
export function splitFreeText(value: unknown): string[] {
  return String(value ?? '')
    .split(/[,;/|]|\band\b|\bwith\b/gi)
    .map((part) => part.trim())
    .filter((part) => part.length > 1)
}

export type FacetIndex = {
  byId: Map<number, FacetRow>
  /** lookupKey -> facet. Titles, slugs, canonical values and aliases all land here. */
  byKey: Map<string, FacetRow>
}

export function buildFacetIndex(facets: readonly FacetRow[]): FacetIndex {
  const byId = new Map<number, FacetRow>()
  const byKey = new Map<string, FacetRow>()

  for (const facet of facets) {
    byId.set(facet.id, facet)
    const names = [
      facet.title,
      facet.slug,
      facet.canonicalValue,
      ...(facet.aliases || []),
    ]
    for (const name of names) {
      const key = lookupKey(name)
      if (!key) continue
      // First writer wins. Sorting the catalog by id before indexing makes this
      // deterministic, and an alias collision is a curation finding in its own
      // right rather than something to resolve by overwriting.
      if (!byKey.has(key)) byKey.set(key, facet)
    }
  }

  return { byId, byKey }
}

export function resolveFacet(
  index: FacetIndex,
  value: unknown,
): FacetRow | null {
  return index.byKey.get(lookupKey(value)) || null
}

/**
 * Every facet a free-text field resolves to, plus the parts that resolved to
 * nothing. The unresolved list is the actual product here: it is the vocabulary
 * the catalog cannot see, which is what the curation pass exists to fix.
 */
export function resolveFreeText(
  index: FacetIndex,
  value: unknown,
): { resolved: FacetRow[]; unresolved: string[] } {
  const resolved: FacetRow[] = []
  const unresolved: string[] = []
  const seen = new Set<number>()

  for (const part of splitFreeText(value)) {
    const facet = resolveFacet(index, part)
    if (facet) {
      if (!seen.has(facet.id)) {
        seen.add(facet.id)
        resolved.push(facet)
      }
    } else {
      unresolved.push(part)
    }
  }

  return { resolved, unresolved }
}

export type Inventory = {
  characters: CharacterRow[]
  dreams: DreamRow[]
  scenarios: ScenarioRow[]
  facets: FacetRow[]
  characterFacets: CharacterFacetLink[]
  facetIndex: FacetIndex
  /** characterId -> dreamIds, built from the uncapped per-Dream reads. */
  characterDreams: Map<number, number[]>
  /** characterId -> scenarioIds. */
  characterScenarios: Map<number, number[]>
  /** characterId -> facetIds. */
  characterFacetIds: Map<number, number[]>
}

function push<K>(map: Map<K, number[]>, key: K, value: number) {
  const list = map.get(key)
  if (list) {
    if (!list.includes(value)) list.push(value)
  } else map.set(key, [value])
}

export function buildInventory(input: {
  characters: readonly CharacterRow[]
  dreams: readonly DreamRow[]
  scenarios: readonly ScenarioRow[]
  facets: readonly FacetRow[]
  characterFacets: readonly CharacterFacetLink[]
}): Inventory {
  const facets = [...input.facets].sort((a, b) => a.id - b.id)
  const characterDreams = new Map<number, number[]>()
  const characterScenarios = new Map<number, number[]>()
  const characterFacetIds = new Map<number, number[]>()

  for (const dream of input.dreams) {
    for (const character of dream.Characters || []) {
      push(characterDreams, character.id, dream.id)
    }
  }
  for (const scenario of input.scenarios) {
    for (const character of scenario.Characters || []) {
      push(characterScenarios, character.id, scenario.id)
    }
  }
  for (const link of input.characterFacets) {
    push(characterFacetIds, link.characterId, link.facetId)
  }

  return {
    characters: [...input.characters],
    dreams: [...input.dreams],
    scenarios: [...input.scenarios],
    facets,
    characterFacets: [...input.characterFacets],
    facetIndex: buildFacetIndex(facets),
    characterDreams,
    characterScenarios,
    characterFacetIds,
  }
}

/** Usage counts per facet id across every surface that can carry one. */
export function facetUsage(inventory: Inventory): Map<number, number> {
  const usage = new Map<number, number>()
  const bump = (id: number) => usage.set(id, (usage.get(id) || 0) + 1)

  for (const link of inventory.characterFacets) bump(link.facetId)
  for (const scenario of inventory.scenarios) {
    for (const facet of scenario.Facets || []) bump(facet.id)
  }
  // Free-text genre counts as usage: a Facet a Character's genre string names is
  // being used by that Character, whether or not a link row exists yet. Counting
  // only link rows would mark half the genre catalog orphaned and propose
  // folding away exactly the vocabulary the authors reach for most.
  for (const character of inventory.characters) {
    for (const facet of resolveFreeText(inventory.facetIndex, character.genre)
      .resolved) {
      bump(facet.id)
    }
  }
  for (const scenario of inventory.scenarios) {
    for (const facet of resolveFreeText(inventory.facetIndex, scenario.genres)
      .resolved) {
      bump(facet.id)
    }
  }

  return usage
}
