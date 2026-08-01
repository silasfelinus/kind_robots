// /scripts/generate_facet_art.ts
//
// Audits the complete active Facet catalog and creates durable, deduplicated
// ArtJobs for every missing Facet image, icon, card, and hero slot.
// Structural oddities are reported and skipped rather than rewarded with art.
// Existing curated artwork is never replaced.
//
// Usage:
//   npx tsx scripts/generate_facet_art.ts
//   npx tsx scripts/generate_facet_art.ts --write

import 'dotenv/config'
import { fileURLToPath } from 'node:url'
import { buildKrea2WorkflowFromRequest } from '../server/api/comfy/krea2/utils/workflow'
import { enrichArtJobPayload } from '../server/utils/artJobProvenance'
import {
  auditFacetCatalog,
  type FacetAuditInput,
} from '../utils/facetCatalogAudit'
import {
  createScriptPrismaClient,
  withDatabaseRetry,
} from './lib/databaseRetry'

const WRITE = process.argv.includes('--write')
const PROJECT_SLUG = 'facet-catalog'
const FACET_ART_VERSION = 'facet-multi-art-krea2-v2'

const ART_VARIANTS = [
  {
    field: 'imagePath',
    label: 'primary square catalog artwork',
    width: 1024,
    height: 1024,
    composition:
      'One decisive square composition with excellent thumbnail readability.',
  },
  {
    field: 'iconPath',
    label: 'icon logo artwork',
    width: 256,
    height: 256,
    composition:
      'A bold logo-like emblem with a clean silhouette and no written text.',
  },
  {
    field: 'cardPath',
    label: 'portrait card artwork',
    width: 512,
    height: 768,
    composition:
      'A vertical 2:3 composition with clear foreground, middle ground, and room for card chrome.',
  },
  {
    field: 'heroPath',
    label: 'wide hero artwork',
    width: 1280,
    height: 720,
    composition:
      'A cinematic 16:9 composition with the focal subject safely inside the center region.',
  },
] as const

type FacetArtField = (typeof ART_VARIANTS)[number]['field']
type FacetArtVariant = (typeof ART_VARIANTS)[number]
const NEGATIVE_PROMPT =
  'readable text, caption, watermark, signature, logo, UI, frame, border, duplicate subject, cropped subject, illegible anatomy'

const BLOCKING_REASON_CODES = new Set([
  'missing-profile',
  'duplicate-title',
  'prompt-cargo-cult',
  'parenthetical-genre',
  'composite-genre',
  'setting-shaped-genre',
  'subject-shaped-genre',
  'occupation-shaped-personality',
  'worldview-shaped-personality',
  'quirk-shaped-backstory',
  'sentence-title',
  'underspecified-title',
  'unreviewed-legacy-record',
])

type JsonObject = Record<string, unknown>

type FacetRow = {
  id: number
  title: string
  slug: string | null
  kind: string
  description: string | null
  flavorText: string | null
  examples: string | null
  artPrompt: string | null
  imagePath: string | null
  cardPath: string | null
  heroPath: string | null
  iconPath: string | null
  icon: string | null
  artImageId: number | null
  artCollectionId: number | null
  userId: number
  isPublic: boolean
  isMature: boolean
}

type ProfileRow = {
  facetId: number
  taxonomy: string
  canonicalValue: string | null
  groupKey: string | null
  groupLabel: string | null
  isRandomizable: boolean
  randomWeight: number
  artRequired: boolean
  sourceRank: number
  metadata: string | null
}

type FacetSnapshot = {
  id: number
  title: string
  slug: string | null
  taxonomy: string
  canonicalValue: string | null
  artPrompt: string | null
  imagePath: string | null
  cardPath: string | null
  heroPath: string | null
  iconPath: string | null
}

function asObject(value: unknown): JsonObject {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonObject)
    : {}
}

function parseMetadata(value: string | null | undefined): JsonObject {
  if (!value) return {}
  try {
    return asObject(JSON.parse(value))
  } catch {
    return {}
  }
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function compactLines(values: unknown[]): string[] {
  return values.map(clean).filter(Boolean)
}

function metadataArtworkPrompt(metadata: JsonObject): string {
  const direct = clean(metadata.artworkPrompt)
  if (direct) return direct

  const artBuilder = asObject(metadata.artBuilder)
  const hints: string[] = []
  for (const value of Object.values(artBuilder)) {
    const hint = clean(asObject(value).promptHint)
    if (hint) hints.push(hint)
  }
  return [...new Set(hints)].join(', ')
}

function taxonomyGuidance(taxonomy: string): string {
  switch (taxonomy) {
    case 'ANIMAL':
    case 'SPECIES':
      return 'Show one unmistakable full creature with recognizable anatomy, personality, and habitat cues.'
    case 'GENRE':
    case 'THEME':
    case 'SETTING':
      return 'Build one iconic scene that communicates the concept through subject, environment, action, and atmosphere.'
    case 'PERSONALITY':
    case 'ALIGNMENT':
    case 'QUIRK':
    case 'BACKSTORY':
      return 'Use a character-centered visual metaphor with a clear emotional read and no written explanation.'
    case 'COLOR':
    case 'MATERIAL':
      return 'Make the palette or material behavior unmistakable through lighting, texture, and a strong central form.'
    case 'STYLE':
    case 'ART_DIRECTION':
    case 'PROMPT_ENHANCEMENT':
      return 'Demonstrate the visual treatment directly in a polished sample image rather than depicting a label for it.'
    case 'OCCUPATION':
    case 'ARCHETYPE':
    case 'ROLE':
      return 'Show a single distinctive figure performing or embodying the role, with readable tools and silhouette.'
    case 'RARITY':
    case 'REWARD_TYPE':
      return 'Create a premium collectible emblem or object with a strong rarity read and clean silhouette.'
    default:
      return 'Use a single clear subject or emblem that makes the concept understandable at thumbnail size.'
  }
}

export function facetEntityMarker(
  facetId: number,
  field?: FacetArtField,
): string {
  const entity = `"entityType":"facet","entityId":${facetId},`
  return field ? `${entity}"field":"${field}",` : entity
}

export function facetArtVersionMarker(): string {
  return `\"facetArtworkVersion\":\"${FACET_ART_VERSION}\"`
}

export function buildFacetIdentityPrompt(
  facet: FacetRow,
  profile: ProfileRow,
): string {
  const existing = clean(facet.artPrompt)
  if (existing) return existing

  const metadata = parseMetadata(profile.metadata)
  const metadataPrompt = metadataArtworkPrompt(metadata)
  const scientificName = clean(metadata.scientificName)
  const category = clean(metadata.category)
  const prose = compactLines([
    facet.description,
    facet.flavorText,
    facet.examples,
    metadataPrompt,
  ])

  return [
    `Illustrate the Facet concept “${facet.title}”.`,
    scientificName ? `Scientific identity: ${scientificName}.` : '',
    category ? `Catalog category: ${category}.` : '',
    ...prose,
    taxonomyGuidance(profile.taxonomy),
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function buildFacetVariantPrompt(
  facet: FacetRow,
  profile: ProfileRow,
  identityPrompt: string,
  variant: FacetArtVariant,
): string {
  const label = profile.groupLabel || profile.taxonomy.replaceAll('_', ' ')
  return [
    identityPrompt,
    `Create this as ${variant.label} for Kind Robots ${label}: ${facet.title}.`,
    variant.composition,
    'Polished fantasy-software illustration, rich controlled lighting, crisp subject separation, no text, no watermark.',
  ].join('\n\n')
}

function facetSnapshot(
  facet: FacetRow,
  profile: ProfileRow,
  artPrompt: string,
): FacetSnapshot {
  return {
    id: facet.id,
    title: facet.title,
    slug: facet.slug,
    taxonomy: profile.taxonomy,
    canonicalValue: profile.canonicalValue,
    artPrompt,
    imagePath: facet.imagePath,
    cardPath: facet.cardPath,
    heroPath: facet.heroPath,
    iconPath: facet.iconPath,
  }
}

export function buildFacetArtPayload(
  facet: FacetRow,
  profile: ProfileRow,
  identityPrompt: string,
  variant: FacetArtVariant,
) {
  const promptString = buildFacetVariantPrompt(
    facet,
    profile,
    identityPrompt,
    variant,
  )
  const { workflow, seed } = buildKrea2WorkflowFromRequest({
    prompt: promptString,
    negativePrompt: NEGATIVE_PROMPT,
    width: variant.width,
    height: variant.height,
    steps: 8,
    cfg: 1,
  })

  return enrichArtJobPayload(
    'COMFY',
    {
      promptString,
      basePromptString: identityPrompt,
      negativePrompt: NEGATIVE_PROMPT,
      width: variant.width,
      height: variant.height,
      steps: 8,
      cfg: 1,
      seed,
      workflow,
      save: {
        isPublic: facet.isPublic,
        isMature: facet.isMature,
        designer: 'facet-catalog',
      },
      facets: [facetSnapshot(facet, profile, identityPrompt)],
      entityArt: {
        entityType: 'facet',
        entityId: facet.id,
        field: variant.field,
        preserveOriginal: true,
        mode: 'recreate',
      },
      facetArtworkVersion: FACET_ART_VERSION,
      facetCatalog: {
        taxonomy: profile.taxonomy,
        groupKey: profile.groupKey,
        sourceRank: profile.sourceRank,
        variant: variant.field,
      },
    },
    {
      projectSlug: PROJECT_SLUG,
      idempotencyKey: `facet:${facet.id}:${variant.field}:${FACET_ART_VERSION}`,
      requireCompletionProof: true,
    },
  ).payload
}

function priorityFor(profile: ProfileRow): number {
  if (profile.sourceRank <= 10) return -10
  if (profile.sourceRank <= 30) return -15
  return -20
}

async function runWithConcurrency<T>(
  items: readonly T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let cursor = 0
  async function lane(): Promise<void> {
    while (cursor < items.length) {
      const item = items[cursor]
      cursor += 1
      if (item !== undefined) await worker(item)
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => lane()),
  )
}

async function main(): Promise<void> {
  await withDatabaseRetry('Facet artwork queue', async () => {
    const prisma = createScriptPrismaClient()
    try {
      const [facets, profiles, aliases, artImageLinks, artCollectionLinks, jobs] =
        await Promise.all([
          prisma.facet.findMany({
            where: { isActive: true },
            orderBy: { id: 'asc' },
            select: {
              id: true,
              title: true,
              slug: true,
              kind: true,
              description: true,
              flavorText: true,
              examples: true,
              artPrompt: true,
              imagePath: true,
              cardPath: true,
              heroPath: true,
              iconPath: true,
              icon: true,
              artImageId: true,
              artCollectionId: true,
              userId: true,
              isPublic: true,
              isMature: true,
            },
          }),
          prisma.facetProfile.findMany({
            select: {
              facetId: true,
              taxonomy: true,
              canonicalValue: true,
              groupKey: true,
              groupLabel: true,
              isRandomizable: true,
              randomWeight: true,
              artRequired: true,
              sourceRank: true,
              metadata: true,
            },
          }),
          prisma.facetAlias.findMany({
            where: { isActive: true },
            select: { facetId: true, alias: true },
          }),
          prisma.facetArtImage.findMany({ select: { facetId: true } }),
          prisma.facetArtCollection.findMany({ select: { facetId: true } }),
          prisma.artJob.findMany({
            where: {
              projectSlug: PROJECT_SLUG,
              status: { in: ['PENDING', 'RUNNING'] },
              payload: { contains: facetArtVersionMarker() },
            },
            select: { id: true, status: true, payload: true },
          }),
        ])

      const profileByFacet = new Map(
        profiles.map((profile) => [profile.facetId, profile as ProfileRow]),
      )
      const aliasesByFacet = new Map<number, string[]>()
      for (const alias of aliases) {
        const entries = aliasesByFacet.get(alias.facetId) ?? []
        entries.push(alias.alias)
        aliasesByFacet.set(alias.facetId, entries)
      }
      const linkedPrimaryArt = new Set(artImageLinks.map((link) => link.facetId))
      const linkedCollections = new Set(
        artCollectionLinks.map((link) => link.facetId),
      )
      const pendingFacetFields = new Set<string>()
      for (const job of jobs) {
        const match = job.payload.match(
          /"entityType":"facet","entityId":(\d+),"field":"([^"]+)",/,
        )
        const id = Number(match?.[1])
        const field = match?.[2]
        if (Number.isInteger(id) && id > 0 && field) {
          pendingFacetFields.add(`${id}:${field}`)
        }
      }

      const auditInputs: FacetAuditInput[] = (facets as FacetRow[]).map(
        (facet) => {
          const profile = profileByFacet.get(facet.id)
          return {
            id: facet.id,
            title: facet.title,
            slug: facet.slug,
            taxonomy: (profile?.taxonomy as FacetAuditInput['taxonomy']) ?? null,
            groupKey: profile?.groupKey ?? null,
            groupLabel: profile?.groupLabel ?? null,
            isRandomizable: profile?.isRandomizable ?? false,
            randomWeight: profile?.randomWeight ?? 0,
            sourceRank: profile?.sourceRank ?? null,
            description: facet.description,
            flavorText: facet.flavorText,
            examples: facet.examples,
            artPrompt: facet.artPrompt,
            aliases: aliasesByFacet.get(facet.id) ?? [],
            artBacked: Boolean(
              facet.imagePath ||
                facet.cardPath ||
                facet.heroPath ||
                facet.iconPath ||
                facet.icon ||
                facet.artImageId !== null ||
                facet.artCollectionId !== null ||
                linkedPrimaryArt.has(facet.id) ||
                linkedCollections.has(facet.id),
            ),
          }
        },
      )
      const audit = auditFacetCatalog(auditInputs)
      const blockersByFacet = new Map<number, string[]>()
      for (const candidate of audit.candidates) {
        const blockers = candidate.reasons
          .map((reason) => reason.code)
          .filter((code) => BLOCKING_REASON_CODES.has(code))
        if (blockers.length) blockersByFacet.set(candidate.id, blockers)
      }

      const available = new Map<FacetArtField, number>(
        ART_VARIANTS.map((variant) => [variant.field, 0]),
      )
      const notRequired: number[] = []
      const reused: Array<{ id: number; field: FacetArtField }> = []
      const blocked: Array<{ id: number; title: string; reasons: string[] }> = []
      const queue: Array<{
        facet: FacetRow
        profile: ProfileRow
        identityPrompt: string
        variant: FacetArtVariant
      }> = []

      for (const facet of facets as FacetRow[]) {
        const profile = profileByFacet.get(facet.id)
        if (!profile) {
          blocked.push({
            id: facet.id,
            title: facet.title,
            reasons: ['missing-profile'],
          })
          continue
        }
        if (!profile.artRequired) {
          notRequired.push(facet.id)
          continue
        }

        const blockers = blockersByFacet.get(facet.id) ?? []
        if (blockers.length) {
          blocked.push({ id: facet.id, title: facet.title, reasons: blockers })
          continue
        }

        const identityPrompt = buildFacetIdentityPrompt(facet, profile)
        for (const variant of ART_VARIANTS) {
          const primaryLinked = Boolean(
            variant.field === 'imagePath' &&
              (facet.artImageId !== null || linkedPrimaryArt.has(facet.id)),
          )
          if (clean(facet[variant.field]) || primaryLinked) {
            available.set(
              variant.field,
              (available.get(variant.field) ?? 0) + 1,
            )
            continue
          }
          if (pendingFacetFields.has(`${facet.id}:${variant.field}`)) {
            reused.push({ id: facet.id, field: variant.field })
            continue
          }
          queue.push({ facet, profile, identityPrompt, variant })
        }
      }

      if (WRITE) {
        const promptUpdates = Array.from(
          new Map(
            queue
              .filter((entry) => !clean(entry.facet.artPrompt))
              .map((entry) => [entry.facet.id, entry]),
          ).values(),
        )
        await runWithConcurrency(promptUpdates, 8, async (entry) => {
          await prisma.facet.update({
            where: { id: entry.facet.id },
            data: { artPrompt: entry.identityPrompt },
          })
        })

        const jobRows = queue.map((entry) => ({
          engine: 'COMFY' as const,
          userId: entry.facet.userId,
          projectSlug: PROJECT_SLUG,
          priority: priorityFor(entry.profile),
          payload: JSON.stringify(
            buildFacetArtPayload(
              entry.facet,
              entry.profile,
              entry.identityPrompt,
              entry.variant,
            ),
          ),
        }))

        let inserted = 0
        for (let index = 0; index < jobRows.length; index += 25) {
          const chunk = jobRows.slice(index, index + 25)
          if (!chunk.length) continue
          const result = await prisma.artJob.createMany({ data: chunk })
          inserted += result.count
        }

        console.log(
          `Facet art: ${inserted} variant job(s) queued, ${reused.length} pending job(s) reused, ${blocked.length} entry/entries held for catalog review.`,
        )
      }

      console.log(
        JSON.stringify(
          {
            mode: WRITE ? 'write' : 'dry-run',
            projectSlug: PROJECT_SLUG,
            version: FACET_ART_VERSION,
            fields: ART_VARIANTS.map((variant) => variant.field),
            totals: {
              active: facets.length,
              available: Object.fromEntries(available),
              notRequired: notRequired.length,
              pendingReused: reused.length,
              queued: queue.length,
              blocked: blocked.length,
            },
            audit: audit.totals,
            blocked: blocked.slice(0, 100),
            policy: {
              qualityGate:
                'Do not generate art for duplicate, malformed, composite, taxonomy-leaking, cargo-cult, or unreviewed legacy Facets.',
              scope:
                'Queue every missing imagePath, iconPath, cardPath, and heroPath independently without replacing curated art.',
              dedupe:
                'Reuse current-version PENDING or RUNNING jobs per Facet and field; a missing image after a completed job may be repaired by a new job.',
            },
          },
          null,
          2,
        ),
      )
    } finally {
      await prisma.$disconnect()
    }
  })
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
