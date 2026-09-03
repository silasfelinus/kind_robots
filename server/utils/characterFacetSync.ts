// /server/utils/characterFacetSync.ts
import { normalizeFacetLookupKey } from '~/utils/facetAliases'
import type { FacetTaxonomy } from '~/server/utils/facetCatalog'

const CHARACTER_FIELD_TAXONOMIES: Record<string, readonly FacetTaxonomy[]> = {
  genre: ['GENRE'],
  species: ['ANIMAL', 'SPECIES'],
  class: ['OCCUPATION', 'ARCHETYPE', 'ROLE'],
  alignment: ['ALIGNMENT'],
  gender: ['GENDER'],
  personality: ['PERSONALITY'],
  backstory: ['BACKSTORY'],
  quirks: ['QUIRK'],
  role: ['ROLE'],
}

/**
 * The fieldKey a Facet of this taxonomy belongs under on a Character.
 *
 * Derived from CHARACTER_FIELD_TAXONOMIES above rather than restated, so the
 * two cannot drift: this is the same question that map already answers, asked
 * in the other direction.
 *
 * Anything outside the map -- MATERIAL on a character, say -- lands under
 * 'facet', matching rewardFacetFieldKey's fallback. It is a grouping label, not
 * a validity check, so an unusual taxonomy is stored rather than dropped.
 */
export function characterFacetFieldKey(taxonomy: FacetTaxonomy): string {
  // ROLE is listed under both `class` and `role`, and iteration order would
  // hand it to `class`. `role` is the field that holds ROLE and nothing else,
  // so it is the more specific answer and wins.
  if (taxonomy === 'ROLE') return 'role'

  for (const [fieldKey, taxonomies] of Object.entries(
    CHARACTER_FIELD_TAXONOMIES,
  )) {
    if (taxonomies.includes(taxonomy)) return fieldKey
  }

  return 'facet'
}

type CharacterFacetSource = Record<string, unknown> & { id: number }

type PendingAssignment = {
  fieldKey: string
  lookupKey: string
  sortOrder: number
}

type CharacterFacetRow = {
  characterId: number
  facetId: number
  fieldKey: string
  sortOrder: number
  weight: number
  source: string
}

// Prisma 7 extended transaction clients use generated exact delegate signatures
// that are intentionally not structurally assignable to the default client type.
// Accept the transaction as unknown at the public boundary, then narrow it to only
// the four delegates this helper actually calls. Both callers pass a real Prisma
// transaction client; this keeps generated-client drift out of unrelated routes.
type CharacterFacetSyncClient = {
  facetAlias: {
    findMany(
      args: unknown,
    ): PromiseLike<Array<{ lookupKey: string; facetId: number }>>
  }
  facetProfile: {
    findMany(
      args: unknown,
    ): PromiseLike<Array<{ facetId: number; taxonomy: string }>>
  }
  facet: {
    findMany(args: unknown): PromiseLike<Array<{ id: number }>>
  }
  characterFacet: {
    deleteMany(args: unknown): PromiseLike<unknown>
    createMany(args: unknown): PromiseLike<unknown>
  }
}

function splitCharacterField(fieldKey: string, value: unknown): string[] {
  if (typeof value !== 'string') return []
  const trimmed = value.trim()
  if (!trimmed) return []

  if (fieldKey === 'quirks' || fieldKey === 'personality') {
    return trimmed
      .split(/\n---\n|\||\n|;|,/)
      .map((entry) => entry.trim())
      .filter(Boolean)
  }

  return [trimmed]
}

function collectAssignments(
  character: CharacterFacetSource,
): PendingAssignment[] {
  const assignments: PendingAssignment[] = []

  for (const fieldKey of Object.keys(CHARACTER_FIELD_TAXONOMIES)) {
    for (const [sortOrder, value] of splitCharacterField(
      fieldKey,
      character[fieldKey],
    ).entries()) {
      const lookupKey = normalizeFacetLookupKey(value)
      if (!lookupKey) continue
      assignments.push({ fieldKey, lookupKey, sortOrder })
    }
  }

  return assignments
}

export async function syncCharacterFacetsInTransaction(
  txClient: unknown,
  character: CharacterFacetSource,
  options: { userId: number; isAdmin: boolean },
): Promise<number> {
  const tx = txClient as CharacterFacetSyncClient
  const pending = collectAssignments(character)
  const lookupKeys = Array.from(
    new Set(pending.map((assignment) => assignment.lookupKey)),
  )

  if (!lookupKeys.length) {
    // Scoped to this function's own rows only -- see the note on the second
    // deleteMany below for why an unscoped delete here is the bug.
    await tx.characterFacet.deleteMany({
      where: { characterId: character.id, source: 'CHARACTER_MUTATION' },
    })
    return 0
  }

  const aliases = await tx.facetAlias.findMany({
    where: {
      lookupKey: { in: lookupKeys },
      isActive: true,
    },
    select: { lookupKey: true, facetId: true },
  })
  const facetIds = Array.from(new Set(aliases.map((alias) => alias.facetId)))

  const [profiles, facets] = await Promise.all([
    tx.facetProfile.findMany({
      where: { facetId: { in: facetIds } },
      select: { facetId: true, taxonomy: true },
    }),
    tx.facet.findMany({
      where: {
        id: { in: facetIds },
        isActive: true,
        ...(options.isAdmin
          ? {}
          : {
              OR: [{ isPublic: true }, { userId: options.userId }],
            }),
      },
      select: { id: true },
    }),
  ])

  const visibleFacetIds = new Set(facets.map((facet) => facet.id))
  const taxonomyByFacetId = new Map(
    profiles.map((profile) => [
      profile.facetId,
      profile.taxonomy as FacetTaxonomy,
    ]),
  )
  const facetIdByLookupKey = new Map(
    aliases
      .filter((alias) => visibleFacetIds.has(alias.facetId))
      .map((alias) => [alias.lookupKey, alias.facetId]),
  )

  const rows = new Map<string, CharacterFacetRow>()

  for (const assignment of pending) {
    const facetId = facetIdByLookupKey.get(assignment.lookupKey)
    if (!facetId) continue

    const taxonomy = taxonomyByFacetId.get(facetId)
    const allowed = CHARACTER_FIELD_TAXONOMIES[assignment.fieldKey] ?? []
    if (!taxonomy || !allowed.includes(taxonomy)) continue

    rows.set(`${assignment.fieldKey}:${facetId}`, {
      characterId: character.id,
      facetId,
      fieldKey: assignment.fieldKey,
      sortOrder: assignment.sortOrder,
      weight: 1,
      source: 'CHARACTER_MUTATION',
    })
  }

  // Scoped to `source: 'CHARACTER_MUTATION'` -- this function's own rows --
  // not every row the Character has. An unscoped delete here silently erased
  // Facets attached through PUT /api/characters/:id/facets (source CURATED /
  // MANUAL, the Daily Dream pipeline's path) on the next unrelated PATCH,
  // because CHARACTER_FIELD_TAXONOMIES only recognizes Facet vocabulary
  // written literally into genre/species/class/alignment/gender/personality/
  // backstory/quirks/role -- ordinary prose in those fields (a character's
  // `backstory`, say) matches nothing, so `pending` comes back empty and the
  // deleteMany ran with zero replacements. Observed live 2026-09-03: a prose
  // repair that PATCHed only `backstory` on Character #3294 (a field this
  // sync already tracks, but whose sentence contained no literal Facet alias)
  // wiped its six Daily Dream Facets, though it never touched Facets at all.
  // `fieldKey` cannot be the scope instead -- `characterFacetFieldKey()`
  // assigns the *same* fieldKey names to pipeline-sourced Facets, so a
  // fieldKey-scoped delete (the pattern `syncBotFacetsInTransaction` uses,
  // safely, only because Bot's fieldKeys are disjoint from any other source)
  // would still catch pipeline rows here. `source` is the one column that
  // actually distinguishes what this function wrote from what did not.
  await tx.characterFacet.deleteMany({
    where: { characterId: character.id, source: 'CHARACTER_MUTATION' },
  })
  if (rows.size) {
    await tx.characterFacet.createMany({
      data: Array.from(rows.values()),
      skipDuplicates: true,
    })
  }

  return rows.size
}
