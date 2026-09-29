// /server/api/tzaddik/discovery/replenish.post.ts
//
// Keeps the admin discovery pool fresh and comfortably above the requested
// minimum. Suggestions are PENDING, never canonical; a human editor still
// approves or archives them. Political actors are intentionally excluded from
// automatic model discovery because this lane is for human-interest discovery,
// not political endorsement.
import { defineEventHandler } from 'h3'
import { TzaddikEditorialTag } from '~/prisma/generated/prisma/client'
import { requireAdminApiUser } from '../../../utils/authGuard'
import { errorHandler } from '../../../utils/error'
import { logAdminAction } from '../../../utils/audit'
import prisma from '../../../utils/prisma'
import { slugify } from '../../../../utils/slugify'
import { completeStructured } from '../../../utils/structuredCompletion'
import {
  fetchTzaddikSource,
  TzaddikSourceFetchError,
} from '../../../utils/tzaddikSourceRefresh'

const DISCOVERY_SOURCE = 'daily-discovery'
const TARGET_POOL_SIZE = 120
const MIN_POOL_SIZE = 100
const MAX_GENERATED_PER_RUN = 20
const STALE_AFTER_DAYS = 45

const AUTO_TAGS = Object.values(TzaddikEditorialTag).filter(
  (tag) => tag !== TzaddikEditorialTag.POLITICS,
)

type DiscoveryCandidate = {
  displayName: string
  wikipediaUrl: string
  rationale: string
  tags: string[]
  countryCode: string
  region: string
}

type DiscoveryDocument = {
  candidates: DiscoveryCandidate[]
}

const DISCOVERY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['candidates'],
  properties: {
    candidates: {
      type: 'array',
      minItems: 12,
      maxItems: MAX_GENERATED_PER_RUN,
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'displayName',
          'wikipediaUrl',
          'rationale',
          'tags',
          'countryCode',
          'region',
        ],
        properties: {
          displayName: { type: 'string', minLength: 2, maxLength: 160 },
          wikipediaUrl: { type: 'string', minLength: 20, maxLength: 1000 },
          rationale: { type: 'string', minLength: 60, maxLength: 700 },
          tags: {
            type: 'array',
            minItems: 1,
            maxItems: 4,
            uniqueItems: true,
            items: { type: 'string', enum: AUTO_TAGS },
          },
          countryCode: {
            type: 'string',
            minLength: 2,
            maxLength: 2,
          },
          region: { type: 'string', minLength: 2, maxLength: 80 },
        },
      },
    },
  },
} as const

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function normalizedWikipediaUrl(value: unknown): string | null {
  const raw = clean(value, 2048)
  try {
    const url = new URL(raw)
    if (
      url.protocol !== 'https:' ||
      !/(^|\.)wikipedia\.org$/i.test(url.hostname) ||
      !url.pathname.startsWith('/wiki/')
    ) {
      return null
    }
    url.hash = ''
    return url.toString()
  } catch {
    return null
  }
}

function normalizedTags(value: unknown): TzaddikEditorialTag[] {
  if (!Array.isArray(value)) return []
  const allowed = new Set<string>(AUTO_TAGS)
  const result = new Set<TzaddikEditorialTag>()
  for (const raw of value) {
    if (
      typeof raw === 'string' &&
      allowed.has(raw as TzaddikEditorialTag)
    ) {
      result.add(raw as TzaddikEditorialTag)
    }
  }
  return [...result].slice(0, 4)
}

async function reserveUniqueSlug(base: string): Promise<string> {
  const seed = slugify(base) || 'candidate'
  let slug = seed.slice(0, 255)
  let suffix = 2
  while (
    await prisma.tzaddikCandidate.findUnique({
      where: { slug },
      select: { id: true },
    })
  ) {
    const tail = `-${suffix}`
    slug = `${seed.slice(0, 255 - tail.length)}${tail}`
    suffix += 1
  }
  return slug
}

async function discoveryPoolCount(): Promise<number> {
  return prisma.tzaddikCandidate.count({
    where: {
      curationState: 'PENDING',
      suggestedBy: DISCOVERY_SOURCE,
    },
  })
}

export default defineEventHandler(async (event) => {
  try {
    const { user: admin } = await requireAdminApiUser(event)

    // Rotate out stale *machine* suggestions only. Community submissions and
    // anything an editor has already approved are never touched here.
    const staleBefore = new Date(
      Date.now() - STALE_AFTER_DAYS * 24 * 60 * 60 * 1000,
    )
    const stale = await prisma.tzaddikCandidate.findMany({
      where: {
        curationState: 'PENDING',
        suggestedBy: DISCOVERY_SOURCE,
        createdAt: { lt: staleBefore },
      },
      orderBy: { createdAt: 'asc' },
      take: 12,
      select: { id: true },
    })
    if (stale.length) {
      await prisma.tzaddikCandidate.updateMany({
        where: { id: { in: stale.map((entry) => entry.id) } },
        data: { curationState: 'ARCHIVED' },
      })
    }

    const beforeCount = await discoveryPoolCount()
    const needed = Math.max(0, TARGET_POOL_SIZE - beforeCount)
    if (needed === 0) {
      return {
        success: true,
        message: `Discovery pool already has ${beforeCount} pending suggestions.`,
        data: {
          poolSize: beforeCount,
          createdCount: 0,
          archivedStaleCount: stale.length,
          minimum: MIN_POOL_SIZE,
          target: TARGET_POOL_SIZE,
        },
        statusCode: 200,
      }
    }

    const existing = await prisma.tzaddikCandidate.findMany({
      select: { displayName: true, wikipediaUrl: true },
      orderBy: { updatedAt: 'desc' },
      take: 400,
    })
    const existingNames = existing.map((entry) => entry.displayName).slice(0, 220)
    const requested = Math.min(MAX_GENERATED_PER_RUN, Math.max(12, needed))

    const system = [
      'You curate a human-review discovery pool for Tzaddik Gallery, a playful sourced gallery of people known for unusually constructive public service, courage, care, education, science, humanitarian work, culture, conservation, journalism, or community building.',
      'This is not canonization and not a ranking. Every suggestion will be reviewed by a human.',
      'Return only real people with a genuine Wikipedia biography URL you are confident exists.',
      'Favor international breadth and people outside the familiar US/UK celebrity orbit.',
      'Mix living and deceased people.',
      'Do not suggest current or former politicians, elected or appointed officials, political candidates, party leaders, or campaign figures. Political figures are curated manually elsewhere.',
      'Do not repeat names from the supplied exclusion list.',
      'Rationales should describe documented work, not praise personality or speculate about motives.',
      'Use only the supplied tag enum values.',
    ].join('\n')

    const user = [
      `Return ${requested} fresh candidates.`,
      `Existing/recent names to avoid: ${existingNames.join('; ')}`,
      `Allowed tags: ${AUTO_TAGS.join(', ')}`,
      'countryCode must be a two-letter ISO-style country code; region should be a useful broad region such as East Africa, South Asia, Latin America, Western Europe, Oceania, or North America.',
    ].join('\n\n')

    const document = await completeStructured<DiscoveryDocument>({
      system,
      user,
      schemaName: 'tzaddik_discovery_candidates',
      schema: DISCOVERY_SCHEMA as unknown as Record<string, unknown>,
      temperature: 0.85,
      maxTokens: 6000,
      timeoutMs: 45_000,
      label: 'Tzaddik discovery replenishment',
    })

    const seenUrls = new Set(existing.map((entry) => entry.wikipediaUrl))
    const seenNames = new Set(existing.map((entry) => entry.displayName.toLowerCase()))
    let createdCount = 0
    const failures: Array<{ displayName: string; reason: string }> = []

    for (const raw of document.candidates ?? []) {
      if (createdCount >= needed || createdCount >= MAX_GENERATED_PER_RUN) break

      const displayName = clean(raw.displayName, 255)
      const wikipediaUrl = normalizedWikipediaUrl(raw.wikipediaUrl)
      const rationale = clean(raw.rationale, 65535)
      const tags = normalizedTags(raw.tags)
      const countryCode = clean(raw.countryCode, 2).toUpperCase()
      const region = clean(raw.region, 128)

      if (!displayName || !wikipediaUrl || !rationale || !tags.length) continue
      if (seenUrls.has(wikipediaUrl) || seenNames.has(displayName.toLowerCase())) continue

      let source
      try {
        source = await fetchTzaddikSource(wikipediaUrl)
      } catch (error) {
        failures.push({
          displayName,
          reason:
            error instanceof TzaddikSourceFetchError
              ? error.message
              : 'Live Wikipedia verification failed.',
        })
        continue
      }

      const slug = await reserveUniqueSlug(displayName)
      await prisma.tzaddikCandidate.create({
        data: {
          displayName,
          slug,
          lifeState: source.lifeState,
          deathDate: source.deathDate,
          rationale,
          biography: source.biography,
          wikipediaUrl,
          wikipediaPageId: source.wikipediaPageId,
          wikipediaRevisionId: source.wikipediaRevisionId,
          sourceSnapshotJson: source.sourceSnapshotJson,
          sourceCheckedAt: source.sourceCheckedAt,
          imageSourceUrl: source.imageSourceUrl,
          imageFileUrl: source.imageFileUrl,
          imageLicense: source.imageLicense,
          imageAttribution: source.imageAttribution,
          imageRevisionId: source.imageRevisionId,
          countryCode: countryCode || null,
          region: region || null,
          curationState: 'PENDING',
          suggestedBy: DISCOVERY_SOURCE,
          Tags: { create: tags.map((tag) => ({ tag })) },
        },
      })

      createdCount += 1
      seenUrls.add(wikipediaUrl)
      seenNames.add(displayName.toLowerCase())
    }

    const poolSize = await discoveryPoolCount()
    await logAdminAction(
      admin,
      `Replenished Tzaddik discovery pool: +${createdCount}, ${poolSize} pending, ${stale.length} stale archived.`,
    )

    return {
      success: true,
      message: `Added ${createdCount} discovery candidate${createdCount === 1 ? '' : 's'}; pool now has ${poolSize}.`,
      data: {
        poolSize,
        createdCount,
        archivedStaleCount: stale.length,
        failedVerificationCount: failures.length,
        failures: failures.slice(0, 8),
        minimum: MIN_POOL_SIZE,
        target: TARGET_POOL_SIZE,
      },
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to replenish Tzaddik discovery pool.',
      statusCode: event.node.res.statusCode,
    }
  }
})