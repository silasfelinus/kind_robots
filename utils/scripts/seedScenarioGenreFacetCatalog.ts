// /utils/scripts/seedScenarioGenreFacetCatalog.ts
import 'dotenv/config'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import { createDatabaseAdapter } from './../../server/utils/databaseAdapterConfig'
import { SCENARIO_CARDS } from './../../stores/helpers/scenarioCards'
import { imageSrcToMediaPath, mediaAssetExists } from './mediaContractSource'
import {
  normalizeFacetLookupKey,
  prepareUniqueFacetAliases,
} from './../facetAliases'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

const prisma = new PrismaClient({
  adapter: createDatabaseAdapter(databaseUrl),
})
const apply = process.argv.includes('--apply')

type ScenarioGenreCandidate = {
  title: string
  canonicalValue: string
  builderLabel: string
  description?: string
  imagePath?: string
  requestedImagePath?: string
  sortOrder: number
  sourceRank: number
  aliases: Set<string>
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
    .slice(0, 255)
}

async function existingPublicImagePath(value: unknown): Promise<{
  imagePath?: string
  requestedImagePath?: string
}> {
  const requestedImagePath = clean(value)
  if (!requestedImagePath) return {}
  if (!requestedImagePath.startsWith('/images/')) {
    return { requestedImagePath }
  }
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

async function collectScenarioGenreCandidates(): Promise<ScenarioGenreCandidate[]> {
  const candidates = new Map<string, ScenarioGenreCandidate>()
  const genreCard = SCENARIO_CARDS.find((card) => card.key === 'genre')
  let order = 0

  for (const step of genreCard?.steps ?? []) {
    const fieldKey = clean(step.field) || clean(step.key)
    if (fieldKey !== 'genres') continue

    for (const choice of step.choices ?? []) {
      if (choice.opensCustom) continue

      if (choice.opensList) {
        for (const rawOption of choice.listOptions ?? []) {
          const canonicalValue = clean(rawOption)
          const key = normalizeFacetLookupKey(canonicalValue)
          if (!canonicalValue || !key || candidates.has(key)) continue
          candidates.set(key, {
            title: canonicalValue,
            canonicalValue,
            builderLabel: canonicalValue,
            sortOrder: order++,
            sourceRank: 30,
            aliases: new Set([canonicalValue]),
            metadata: {
              source: 'scenario-builder-extended-list',
              fieldKey: 'genres',
              cardKey: genreCard?.key ?? 'genre',
              stepKey: step.key,
              artworkStatus: 'missing',
            },
          })
        }
        continue
      }

      const canonicalValue = clean(choice.value)
      const builderLabel = clean(choice.label) || canonicalValue
      const key = normalizeFacetLookupKey(canonicalValue)
      if (!canonicalValue || !builderLabel || !key) continue
      const artwork = await existingPublicImagePath(choice.image)
      candidates.set(key, {
        title: canonicalValue,
        canonicalValue,
        builderLabel,
        description: clean(choice.subtext) || undefined,
        imagePath: artwork.imagePath,
        requestedImagePath: artwork.requestedImagePath,
        sortOrder: order++,
        sourceRank: 8,
        aliases: new Set([canonicalValue, builderLabel]),
        metadata: {
          source: 'scenario-builder',
          fieldKey: 'genres',
          cardKey: genreCard?.key ?? 'genre',
          stepKey: step.key,
          builderLabel,
          requestedImagePath: artwork.requestedImagePath,
          artworkStatus: artwork.imagePath ? 'available' : 'missing',
        },
      })
    }
  }

  return Array.from(candidates.values()).sort(
    (a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title),
  )
}

type CatalogState = {
  aliasOwner: Map<string, number>
  facetById: Map<
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
  profileByFacetId: Map<number, { sourceRank: number }>
}

async function loadCatalogState(): Promise<CatalogState> {
  const [aliases, facets, profiles] = await Promise.all([
    prisma.facetAlias.findMany({ select: { lookupKey: true, facetId: true } }),
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
    prisma.facetProfile.findMany({ select: { facetId: true, sourceRank: true } }),
  ])
  return {
    aliasOwner: new Map(aliases.map((alias) => [alias.lookupKey, alias.facetId])),
    facetById: new Map(facets.map((facet) => [facet.id, facet])),
    profileByFacetId: new Map(
      profiles.map((profile) => [profile.facetId, profile]),
    ),
  }
}

async function saveCandidate(
  candidate: ScenarioGenreCandidate,
  state: CatalogState,
): Promise<number> {
  const lookupKey = normalizeFacetLookupKey(candidate.canonicalValue)
  const existingId = state.aliasOwner.get(lookupKey)
  const existing = existingId ? state.facetById.get(existingId) : undefined
  const slug = existing?.slug || slugify(candidate.canonicalValue)
  const incomingWins =
    candidate.sourceRank <=
    (existingId ? state.profileByFacetId.get(existingId)?.sourceRank ?? 100 : 100)

  const facet = existing
    ? await prisma.facet.update({
        where: { id: existing.id },
        data: {
          title: existing.title || candidate.title,
          description:
            incomingWins && candidate.description
              ? candidate.description
              : existing.description || candidate.description,
          imagePath:
            incomingWins && candidate.imagePath
              ? candidate.imagePath
              : existing.imagePath || candidate.imagePath,
          designer: existing.designer || 'facet-catalog',
          isActive: true,
        },
      })
    : await prisma.facet.create({
        data: {
          title: candidate.title,
          slug,
          kind: 'GENRE',
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

  state.facetById.set(facet.id, facet)
  await prisma.facetProfile.upsert({
    where: { facetId: facet.id },
    create: {
      facetId: facet.id,
      taxonomy: 'GENRE',
      canonicalValue: candidate.canonicalValue,
      groupKey: 'scenario-genre',
      groupLabel: 'Scenario Genres',
      sortOrder: candidate.sortOrder,
      isRandomizable: true,
      randomWeight: 1,
      artRequired: true,
      sourceRank: candidate.sourceRank,
      metadata: JSON.stringify(candidate.metadata),
    },
    update: incomingWins
      ? {
          taxonomy: 'GENRE',
          canonicalValue: candidate.canonicalValue,
          groupKey: 'scenario-genre',
          groupLabel: 'Scenario Genres',
          sortOrder: candidate.sortOrder,
          isRandomizable: true,
          artRequired: true,
          sourceRank: candidate.sourceRank,
          metadata: JSON.stringify(candidate.metadata),
        }
      : { taxonomy: 'GENRE' },
  })
  state.profileByFacetId.set(facet.id, {
    sourceRank: incomingWins
      ? candidate.sourceRank
      : state.profileByFacetId.get(facet.id)?.sourceRank ?? candidate.sourceRank,
  })

  for (const alias of prepareUniqueFacetAliases([
    slug,
    candidate.title,
    candidate.canonicalValue,
    candidate.builderLabel,
    ...candidate.aliases,
  ])) {
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

  return facet.id
}

function splitGenres(value: string | null): string[] {
  return String(value ?? '')
    .split(/\||\n|;|,/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

async function backfillScenarioGenres(state: CatalogState): Promise<number> {
  const scenarios = await prisma.scenario.findMany({
    select: { id: true, genres: true },
  })
  let linked = 0
  for (const scenario of scenarios) {
    for (const value of splitGenres(scenario.genres)) {
      const facetId = state.aliasOwner.get(normalizeFacetLookupKey(value))
      if (!facetId) continue
      await prisma.scenarioFacet.upsert({
        where: {
          scenarioId_facetId: {
            scenarioId: scenario.id,
            facetId,
          },
        },
        create: { scenarioId: scenario.id, facetId },
        update: {},
      })
      linked++
    }
  }
  return linked
}

async function main(): Promise<void> {
  const candidates = await collectScenarioGenreCandidates()
  const missingSourceArtwork = candidates
    .filter((candidate) => candidate.requestedImagePath && !candidate.imagePath)
    .map((candidate) => candidate.requestedImagePath)

  if (!apply) {
    process.stdout.write(
      `${JSON.stringify(
        {
          mode: 'dry-run',
          taxonomy: 'GENRE',
          source: 'scenario-builder',
          candidates: candidates.length,
          illustrated: candidates.filter((candidate) => candidate.requestedImagePath)
            .length,
          missingSourceArtwork,
          note: 'Run with --apply after the canonical Facet seed.',
        },
        null,
        2,
      )}\n`,
    )
    return
  }

  const state = await loadCatalogState()
  for (const candidate of candidates) await saveCandidate(candidate, state)
  const scenarioLinks = await backfillScenarioGenres(state)
  process.stdout.write(
    `${JSON.stringify(
      {
        mode: 'apply',
        taxonomy: 'GENRE',
        source: 'scenario-builder',
        candidates: candidates.length,
        saved: candidates.length,
        scenarioLinks,
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
