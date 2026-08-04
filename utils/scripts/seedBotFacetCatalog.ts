// /utils/scripts/seedBotFacetCatalog.ts
import 'dotenv/config'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import { createDatabaseAdapter } from './../../server/utils/databaseAdapterConfig'
import {
  BOT_PERSONALITY_TRAITS,
  BOT_TYPES,
} from './../../stores/helpers/botCards'
import { BOT_TYPE_ARTWORK_TARGETS } from './../seeds/facetBotTypeArtwork'
import { imageSrcToMediaPath, mediaAssetExists } from './mediaContractSource'
import {
  normalizeFacetLookupKey,
  prepareUniqueFacetAliases,
} from './../facetAliases'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

const prisma = new PrismaClient({ adapter: createDatabaseAdapter(databaseUrl) })
const apply = process.argv.includes('--apply')

type Taxonomy = 'BOT_TYPE' | 'PERSONALITY'

type BotFacetCandidate = {
  title: string
  canonicalValue: string
  builderValue: string
  taxonomy: Taxonomy
  description?: string
  imagePath?: string
  requestedImagePath?: string
  groupKey: string
  groupLabel: string
  sortOrder: number
  sourceRank: number
  aliases: string[]
  metadata: Record<string, unknown>
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 220)
}

async function existingPublicImagePath(value: unknown): Promise<{
  imagePath?: string
  requestedImagePath?: string
}> {
  const requestedImagePath = clean(value)
  if (!requestedImagePath) return {}
  if (!requestedImagePath.startsWith('/images/')) return { requestedImagePath }
  // public/images/** is git-ignored and served from the media host, so a local
  // existsSync check reports live art as missing in CI/production. Treat the
  // asset as present if it exists locally OR on the media mount.
  const exists =
    existsSync(resolve(process.cwd(), 'public', requestedImagePath.slice(1))) ||
    (await mediaAssetExists(imageSrcToMediaPath(requestedImagePath)))
  return exists
    ? { imagePath: requestedImagePath, requestedImagePath }
    : { requestedImagePath }
}

async function collectCandidates(): Promise<BotFacetCandidate[]> {
  const candidates: BotFacetCandidate[] = []

  for (const [sortOrder, option] of BOT_TYPES.entries()) {
    const builderValue = clean(option.value)
    const title = clean(option.label) || builderValue
    if (!builderValue || !title) continue
    const artwork = await existingPublicImagePath(option.image)
    const artworkTarget = BOT_TYPE_ARTWORK_TARGETS.find(
      (target) => target.value === builderValue,
    )
    candidates.push({
      title,
      canonicalValue: `bot-type:${builderValue}`,
      builderValue,
      taxonomy: 'BOT_TYPE',
      description: clean(option.subtext) || undefined,
      imagePath: artwork.imagePath,
      requestedImagePath: artwork.requestedImagePath,
      groupKey: 'bot-type',
      groupLabel: 'Bot Types',
      sortOrder,
      sourceRank: 8,
      aliases: [`bot type ${builderValue}`, `bot-type-${builderValue}`],
      metadata: {
        source: 'bot-builder',
        fieldKey: 'BotType',
        builderValue,
        requestedImagePath: artwork.requestedImagePath,
        artworkPrompt: artworkTarget?.prompt,
        artworkStatus: artwork.imagePath ? 'available' : 'missing',
      },
    })
  }

  for (const [sortOrder, option] of BOT_PERSONALITY_TRAITS.entries()) {
    const builderValue = clean(option.value)
    const title = clean(option.label) || builderValue
    if (!builderValue || !title) continue
    candidates.push({
      title,
      canonicalValue: `personality:${builderValue}`,
      builderValue,
      taxonomy: 'PERSONALITY',
      groupKey: 'bot-personality',
      groupLabel: 'Bot Personalities',
      sortOrder,
      sourceRank: 25,
      aliases: [],
      metadata: {
        source: 'bot-builder',
        fieldKey: 'personality',
        builderValue,
        artworkStatus: 'missing',
      },
    })
  }

  return candidates
}

type CatalogState = {
  aliasOwner: Map<string, number>
  profiles: Map<
    number,
    { taxonomy: string; sourceRank: number; metadata: string | null }
  >
  facets: Map<
    number,
    {
      id: number
      slug: string | null
      title: string
      description: string | null
      imagePath: string | null
      designer: string | null
    }
  >
}

async function loadCatalogState(): Promise<CatalogState> {
  const [aliases, profiles, facets] = await Promise.all([
    prisma.facetAlias.findMany({ select: { lookupKey: true, facetId: true } }),
    prisma.facetProfile.findMany({
      select: {
        facetId: true,
        taxonomy: true,
        sourceRank: true,
        metadata: true,
      },
    }),
    prisma.facet.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        imagePath: true,
        designer: true,
      },
    }),
  ])
  return {
    aliasOwner: new Map(
      aliases.map((alias) => [alias.lookupKey, alias.facetId]),
    ),
    profiles: new Map(profiles.map((profile) => [profile.facetId, profile])),
    facets: new Map(facets.map((facet) => [facet.id, facet])),
  }
}

function metadataObject(value: string | null): Record<string, unknown> {
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

async function saveCandidate(
  candidate: BotFacetCandidate,
  state: CatalogState,
): Promise<number> {
  const builderKey = normalizeFacetLookupKey(candidate.builderValue)
  const existingAliasId = state.aliasOwner.get(builderKey)
  const aliasProfile = existingAliasId
    ? state.profiles.get(existingAliasId)
    : undefined
  const reusableExistingId =
    aliasProfile?.taxonomy === candidate.taxonomy ? existingAliasId : undefined
  const slug = reusableExistingId
    ? state.facets.get(reusableExistingId)?.slug || slugify(candidate.title)
    : `${candidate.taxonomy === 'BOT_TYPE' ? 'bot-type' : 'personality'}-${slugify(candidate.builderValue)}`
  const existing = reusableExistingId
    ? state.facets.get(reusableExistingId)
    : await prisma.facet.findUnique({ where: { slug } })

  const facet = existing
    ? await prisma.facet.update({
        where: { id: existing.id },
        data: {
          description: existing.description || candidate.description,
          imagePath: existing.imagePath || candidate.imagePath,
          designer: existing.designer || 'facet-catalog',
          isActive: true,
        },
      })
    : await prisma.facet.create({
        data: {
          title: candidate.title,
          slug,
          description: candidate.description,
          imagePath: candidate.imagePath,
          designer: 'facet-catalog',
          creationSource: 'HUMAN',
          userId: 1,
          isPublic: true,
          isMature: false,
          isActive: true,
        },
      })

  const previousProfile = state.profiles.get(facet.id)
  const previousMetadata = metadataObject(previousProfile?.metadata ?? null)
  const incomingWins =
    candidate.sourceRank <= (previousProfile?.sourceRank ?? 100)
  const metadata = {
    ...previousMetadata,
    ...(incomingWins ? candidate.metadata : {}),
    builderValue: candidate.builderValue,
  }
  await prisma.facetProfile.upsert({
    where: { facetId: facet.id },
    create: {
      facetId: facet.id,
      taxonomy: candidate.taxonomy,
      canonicalValue: candidate.canonicalValue,
      groupKey: candidate.groupKey,
      groupLabel: candidate.groupLabel,
      sortOrder: candidate.sortOrder,
      isRandomizable: true,
      randomWeight: 1,
      artRequired: true,
      sourceRank: candidate.sourceRank,
      metadata: JSON.stringify(metadata),
    },
    update: incomingWins
      ? {
          taxonomy: candidate.taxonomy,
          canonicalValue: candidate.canonicalValue,
          groupKey: candidate.groupKey,
          groupLabel: candidate.groupLabel,
          sortOrder: candidate.sortOrder,
          isRandomizable: true,
          artRequired: true,
          sourceRank: candidate.sourceRank,
          metadata: JSON.stringify(metadata),
        }
      : { metadata: JSON.stringify(metadata) },
  })

  const safeAliases = [slug, ...candidate.aliases]
  if (!existingAliasId || existingAliasId === facet.id) {
    safeAliases.push(candidate.builderValue, candidate.title)
  }
  for (const alias of prepareUniqueFacetAliases(safeAliases)) {
    const ownerId = state.aliasOwner.get(alias.lookupKey)
    if (ownerId && ownerId !== facet.id) continue
    await prisma.facetAlias.upsert({
      where: { lookupKey: alias.lookupKey },
      create: {
        facetId: facet.id,
        alias: alias.alias,
        lookupKey: alias.lookupKey,
        isCanonical: alias.lookupKey === normalizeFacetLookupKey(slug),
        isActive: true,
      },
      update: {
        facetId: facet.id,
        alias: alias.alias,
        isCanonical: alias.lookupKey === normalizeFacetLookupKey(slug),
        isActive: true,
      },
    })
    state.aliasOwner.set(alias.lookupKey, facet.id)
  }

  state.facets.set(facet.id, facet)
  state.profiles.set(facet.id, {
    taxonomy: candidate.taxonomy,
    sourceRank: incomingWins
      ? candidate.sourceRank
      : (previousProfile?.sourceRank ?? candidate.sourceRank),
    metadata: JSON.stringify(metadata),
  })
  return facet.id
}

function splitPersonality(value: string | null): string[] {
  return String(value ?? '')
    .split(/\||\n|;|,/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function profileMatchKeys(
  facet: { title: string },
  profile: { canonicalValue: string | null; metadata: string | null },
  aliases: string[],
): string[] {
  const metadata = metadataObject(profile.metadata)
  return [
    facet.title,
    profile.canonicalValue ?? '',
    typeof metadata.builderValue === 'string' ? metadata.builderValue : '',
    ...aliases,
  ]
    .map(normalizeFacetLookupKey)
    .filter(Boolean)
}

async function backfillBots(): Promise<number> {
  const [bots, profiles, facets, aliases] = await Promise.all([
    prisma.bot.findMany({
      select: { id: true, BotType: true, personality: true },
    }),
    prisma.facetProfile.findMany({
      where: { taxonomy: { in: ['BOT_TYPE', 'PERSONALITY'] } },
      select: {
        facetId: true,
        taxonomy: true,
        canonicalValue: true,
        metadata: true,
      },
    }),
    prisma.facet.findMany({
      select: { id: true, title: true, isActive: true },
    }),
    prisma.facetAlias.findMany({
      where: { isActive: true },
      select: { facetId: true, alias: true },
    }),
  ])
  const facetById = new Map(facets.map((facet) => [facet.id, facet]))
  const aliasesById = new Map<number, string[]>()
  for (const alias of aliases) {
    const values = aliasesById.get(alias.facetId) ?? []
    values.push(alias.alias)
    aliasesById.set(alias.facetId, values)
  }
  const maps = {
    BOT_TYPE: new Map<string, number>(),
    PERSONALITY: new Map<string, number>(),
  }
  for (const profile of profiles) {
    const facet = facetById.get(profile.facetId)
    if (!facet?.isActive) continue
    for (const key of profileMatchKeys(
      facet,
      profile,
      aliasesById.get(profile.facetId) ?? [],
    )) {
      maps[profile.taxonomy as Taxonomy].set(key, profile.facetId)
    }
  }

  let linked = 0
  for (const bot of bots) {
    const rows: Array<{
      botId: number
      facetId: number
      fieldKey: string
      sortOrder: number
    }> = []
    const typeId = maps.BOT_TYPE.get(normalizeFacetLookupKey(bot.BotType))
    if (typeId)
      rows.push({
        botId: bot.id,
        facetId: typeId,
        fieldKey: 'BotType',
        sortOrder: 0,
      })
    for (const [sortOrder, value] of splitPersonality(
      bot.personality,
    ).entries()) {
      const facetId = maps.PERSONALITY.get(normalizeFacetLookupKey(value))
      if (facetId)
        rows.push({
          botId: bot.id,
          facetId,
          fieldKey: 'personality',
          sortOrder,
        })
    }
    await prisma.botFacet.deleteMany({ where: { botId: bot.id } })
    if (rows.length) {
      await prisma.botFacet.createMany({
        data: rows.map((row) => ({ ...row, source: 'MIGRATED' })),
        skipDuplicates: true,
      })
      linked += rows.length
    }
  }
  return linked
}

async function main(): Promise<void> {
  const candidates = await collectCandidates()
  const byTaxonomy = candidates.reduce<Record<string, number>>(
    (counts, candidate) => {
      counts[candidate.taxonomy] = (counts[candidate.taxonomy] ?? 0) + 1
      return counts
    },
    {},
  )
  const missingSourceArtwork = candidates
    .filter((candidate) => candidate.requestedImagePath && !candidate.imagePath)
    .map((candidate) => candidate.requestedImagePath)

  if (!apply) {
    process.stdout.write(
      `${JSON.stringify(
        {
          mode: 'dry-run',
          candidates: candidates.length,
          byTaxonomy,
          missingRequiredArt: candidates.filter(
            (candidate) => !candidate.imagePath,
          ).length,
          missingSourceArtwork,
          note: 'Run with --apply after prisma migrate deploy.',
        },
        null,
        2,
      )}\n`,
    )
    return
  }

  const state = await loadCatalogState()
  for (const candidate of candidates) await saveCandidate(candidate, state)
  const botLinks = await backfillBots()
  process.stdout.write(
    `${JSON.stringify(
      {
        mode: 'apply',
        candidates: candidates.length,
        saved: candidates.length,
        byTaxonomy,
        botLinks,
        missingSourceArtwork,
      },
      null,
      2,
    )}\n`,
  )
}

await main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
