// /server/utils/botFacetSync.ts
import { normalizeFacetLookupKey } from '~/utils/facetAliases'

type BotFacetSource = {
  id: number
  BotType?: string | null
  personality?: string | null
}

type BotFacetSyncClient = {
  facetProfile: {
    findMany(args: unknown): PromiseLike<
      Array<{
        facetId: number
        taxonomy: string
        canonicalValue: string | null
        metadata: string | null
      }>
    >
  }
  facet: {
    findMany(args: unknown): PromiseLike<Array<{ id: number; title: string }>>
  }
  facetAlias: {
    findMany(args: unknown): PromiseLike<Array<{ facetId: number; alias: string }>>
  }
  botFacet: {
    deleteMany(args: unknown): PromiseLike<unknown>
    createMany(args: unknown): PromiseLike<unknown>
  }
}

function parseMetadata(value: string | null): Record<string, unknown> {
  if (!value) return {}
  try {
    const parsed: unknown = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

function splitPersonality(value: unknown): string[] {
  if (typeof value !== 'string') return []
  return value
    .split(/\||\n|;|,/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export async function syncBotFacetsInTransaction(
  txClient: unknown,
  bot: BotFacetSource,
  options: { userId: number; isAdmin: boolean },
): Promise<number> {
  const tx = txClient as BotFacetSyncClient
  const profiles = await tx.facetProfile.findMany({
    where: { taxonomy: { in: ['BOT_TYPE', 'PERSONALITY'] } },
    select: {
      facetId: true,
      taxonomy: true,
      canonicalValue: true,
      metadata: true,
    },
  })
  const profileById = new Map(profiles.map((profile) => [profile.facetId, profile]))
  const facetIds = profiles.map((profile) => profile.facetId)

  await tx.botFacet.deleteMany({
    where: {
      botId: bot.id,
      fieldKey: { in: ['BotType', 'personality'] },
    },
  })
  if (!facetIds.length) return 0

  const [facets, aliases] = await Promise.all([
    tx.facet.findMany({
      where: {
        id: { in: facetIds },
        isActive: true,
        ...(options.isAdmin
          ? {}
          : { OR: [{ isPublic: true }, { userId: options.userId }] }),
      },
      select: { id: true, title: true },
    }),
    tx.facetAlias.findMany({
      where: { facetId: { in: facetIds }, isActive: true },
      select: { facetId: true, alias: true },
    }),
  ])

  const aliasesById = new Map<number, string[]>()
  for (const alias of aliases) {
    const values = aliasesById.get(alias.facetId) ?? []
    values.push(alias.alias)
    aliasesById.set(alias.facetId, values)
  }
  const lookupByTaxonomy = {
    BOT_TYPE: new Map<string, number>(),
    PERSONALITY: new Map<string, number>(),
  }
  for (const facet of facets) {
    const profile = profileById.get(facet.id)
    if (!profile) continue
    const metadata = parseMetadata(profile.metadata)
    const keys = [
      facet.title,
      profile.canonicalValue ?? '',
      typeof metadata.builderValue === 'string' ? metadata.builderValue : '',
      ...(Array.isArray(metadata.legacyValues)
        ? metadata.legacyValues.filter(
            (entry): entry is string => typeof entry === 'string',
          )
        : []),
      ...(aliasesById.get(facet.id) ?? []),
    ]
    const taxonomy = profile.taxonomy as 'BOT_TYPE' | 'PERSONALITY'
    const map = lookupByTaxonomy[taxonomy]
    if (!map) continue
    for (const value of keys) {
      const key = normalizeFacetLookupKey(value)
      if (key && !map.has(key)) map.set(key, facet.id)
    }
  }

  const rows: Array<{
    botId: number
    facetId: number
    fieldKey: string
    sortOrder: number
    weight: number
    source: string
  }> = []
  const typeId = lookupByTaxonomy.BOT_TYPE.get(
    normalizeFacetLookupKey(bot.BotType || ''),
  )
  if (typeId) {
    rows.push({
      botId: bot.id,
      facetId: typeId,
      fieldKey: 'BotType',
      sortOrder: 0,
      weight: 1,
      source: 'BOT_MUTATION',
    })
  }
  for (const [sortOrder, value] of splitPersonality(bot.personality).entries()) {
    const facetId = lookupByTaxonomy.PERSONALITY.get(
      normalizeFacetLookupKey(value),
    )
    if (!facetId) continue
    rows.push({
      botId: bot.id,
      facetId,
      fieldKey: 'personality',
      sortOrder,
      weight: 1,
      source: 'BOT_MUTATION',
    })
  }

  if (rows.length) {
    await tx.botFacet.createMany({ data: rows, skipDuplicates: true })
  }
  return rows.length
}
