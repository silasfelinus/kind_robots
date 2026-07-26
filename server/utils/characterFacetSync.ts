// /server/utils/characterFacetSync.ts
import { normalizeFacetLookupKey } from '~/utils/facetAliases'
import type { FacetTaxonomy } from '~/server/utils/facetCatalog'

const CHARACTER_FIELD_TAXONOMIES: Record<string, readonly FacetTaxonomy[]> = {
  genre: ['GENRE'],
  species: ['ANIMAL', 'SPECIES'],
  class: ['OCCUPATION', 'ARCHETYPE', 'ROLE'],
  alignment: ['ALIGNMENT'],
  personality: ['PERSONALITY'],
  backstory: ['BACKSTORY'],
  quirks: ['QUIRK'],
  role: ['ROLE'],
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
    findMany(args: unknown): PromiseLike<Array<{ lookupKey: string; facetId: number }>>
  }
  facetProfile: {
    findMany(args: unknown): PromiseLike<Array<{ facetId: number; taxonomy: string }>>
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

function collectAssignments(character: CharacterFacetSource): PendingAssignment[] {
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
    await tx.characterFacet.deleteMany({
      where: { characterId: character.id },
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

  await tx.characterFacet.deleteMany({ where: { characterId: character.id } })
  if (rows.size) {
    await tx.characterFacet.createMany({
      data: Array.from(rows.values()),
      skipDuplicates: true,
    })
  }

  return rows.size
}
