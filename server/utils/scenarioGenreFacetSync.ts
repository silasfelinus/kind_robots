// /server/utils/scenarioGenreFacetSync.ts
import { normalizeFacetLookupKey } from '~/utils/facetAliases'

type ScenarioGenreSource = {
  id: number
  genres?: string | null
}

type ScenarioGenreFacetSyncClient = {
  facetAlias: {
    findMany(args: unknown): PromiseLike<Array<{ lookupKey: string; facetId: number }>>
  }
  facetProfile: {
    findMany(args: unknown): PromiseLike<Array<{ facetId: number; taxonomy: string }>>
  }
  facet: {
    findMany(args: unknown): PromiseLike<Array<{ id: number }>>
  }
  scenarioFacet: {
    deleteMany(args: unknown): PromiseLike<unknown>
    createMany(args: unknown): PromiseLike<unknown>
  }
}

function splitScenarioGenres(value: unknown): string[] {
  if (typeof value !== 'string') return []
  return value
    .split(/\||\n|;|,/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export async function syncScenarioGenreFacetsInTransaction(
  txClient: unknown,
  scenario: ScenarioGenreSource,
  options: { userId: number; isAdmin: boolean },
): Promise<number> {
  const tx = txClient as ScenarioGenreFacetSyncClient
  const genreProfiles = await tx.facetProfile.findMany({
    where: { taxonomy: 'GENRE' },
    select: { facetId: true, taxonomy: true },
  })
  const genreFacetIds = genreProfiles.map((profile) => profile.facetId)

  await tx.scenarioFacet.deleteMany({
    where: {
      scenarioId: scenario.id,
      ...(genreFacetIds.length ? { facetId: { in: genreFacetIds } } : {}),
    },
  })

  const values = splitScenarioGenres(scenario.genres)
  const lookupKeys = Array.from(
    new Set(values.map(normalizeFacetLookupKey).filter(Boolean)),
  )
  if (!lookupKeys.length) return 0

  const aliases = await tx.facetAlias.findMany({
    where: {
      lookupKey: { in: lookupKeys },
      isActive: true,
    },
    select: { lookupKey: true, facetId: true },
  })
  const candidateFacetIds = Array.from(
    new Set(
      aliases
        .map((alias) => alias.facetId)
        .filter((facetId) => genreFacetIds.includes(facetId)),
    ),
  )
  if (!candidateFacetIds.length) return 0

  const visibleFacets = await tx.facet.findMany({
    where: {
      id: { in: candidateFacetIds },
      isActive: true,
      ...(options.isAdmin
        ? {}
        : { OR: [{ isPublic: true }, { userId: options.userId }] }),
    },
    select: { id: true },
  })
  const visibleIds = new Set(visibleFacets.map((facet) => facet.id))
  const facetIdByLookupKey = new Map(
    aliases
      .filter((alias) => visibleIds.has(alias.facetId))
      .map((alias) => [alias.lookupKey, alias.facetId]),
  )
  const facetIds = Array.from(
    new Set(lookupKeys.map((key) => facetIdByLookupKey.get(key)).filter(Boolean)),
  ) as number[]

  if (!facetIds.length) return 0
  await tx.scenarioFacet.createMany({
    data: facetIds.map((facetId) => ({
      scenarioId: scenario.id,
      facetId,
    })),
    skipDuplicates: true,
  })
  return facetIds.length
}
