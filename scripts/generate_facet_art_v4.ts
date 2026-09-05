// /scripts/generate_facet_art_v4.ts
//
// Audits the complete active Facet catalog and creates durable ArtJobs for
// uncovered Facets. Baseline mode intentionally queues ONE useful image per
// Facet; purpose-built card/hero/icon renders are optional enhancements and are
// only backfilled with --all-variants. Structural oddities are reported and
// skipped rather than rewarded with art.
//
// Krea 2 is intentionally treated as a caption-conditioned image model here,
// not as an instruction-following chat model. The prompt contains the visual
// subject, scene, medium, composition, light, and texture. It does NOT contain
// app nouns, taxonomy labels, prompt-writing instructions, or the words that
// describe what the image will be used for. Those wrappers were rendered as
// logos/title copy by the v2/v3 Facet producer.
//
// Usage:
//   npx tsx scripts/generate_facet_art.ts
//   npx tsx scripts/generate_facet_art.ts --write
//   npx tsx scripts/generate_facet_art.ts --write --all-variants
//   npx tsx scripts/generate_facet_art.ts --write --repair-tainted

import 'dotenv/config'
import { buildKrea2WorkflowFromRequest } from '../server/api/comfy/krea2/utils/workflow'
import { assertArtPromptContract } from '../server/utils/artPromptContract'
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
const ALL_VARIANTS = process.argv.includes('--all-variants')
const REPAIR_TAINTED = process.argv.includes('--repair-tainted')
const PROJECT_SLUG = 'facet-catalog'
const FACET_ART_VERSION = 'facet-coverage-krea2-v4'
const LEGACY_FACET_ART_VERSIONS = new Set([
  'facet-multi-art-krea2-v2',
  'facet-coverage-krea2-v3',
])

// v2 and v3 persisted this exact generated wrapper into Facet.artPrompt. It is
// provenance, not curated prose. Recognize only the generator signature so a
// human-authored artPrompt is never rewritten just because it contains words
// such as "facet" or "illustrate" somewhere in its subject matter.
const LEGACY_GENERATED_IDENTITY =
  /^Illustrate the Facet concept [“"][^”"]+[”"]\.\s*/i

// Order matters. It is the same coverage fallback contract used by the UI and
// claim-time deduper: a general image is most reusable, then card, hero, icon.
const ART_VARIANTS = [
  {
    field: 'imagePath',
    label: 'square illustration',
    width: 1024,
    height: 1024,
    composition:
      'One decisive square composition with excellent thumbnail readability.',
  },
  {
    field: 'cardPath',
    label: 'vertical 2:3 illustration',
    width: 512,
    height: 768,
    composition:
      'A vertical 2:3 composition with clear foreground, middle ground, and breathing room around the focal subject.',
  },
  {
    field: 'heroPath',
    label: 'wide cinematic illustration',
    width: 1280,
    height: 720,
    composition:
      'A cinematic 16:9 composition with the focal subject safely inside the center region.',
  },
  {
    field: 'iconPath',
    label: 'compact emblem illustration',
    width: 256,
    height: 256,
    composition:
      'A bold square emblem with a clean silhouette and simple readable forms.',
  },
] as const

type FacetArtField = (typeof ART_VARIANTS)[number]['field']
type FacetArtVariant = (typeof ART_VARIANTS)[number]

// Krea 2 Turbo runs at cfg 1, where negative conditioning is effectively inert.
// Keep the negative prompt empty and describe the wanted visual result once in
// positive conditioning instead of feeding the model unwanted text nouns.
const NEGATIVE_PROMPT = ''

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
  cardArtImageId: number | null
  heroArtImageId: number | null
  iconArtImageId: number | null
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

type HistoryJob = {
  id: number
  status: string
  payload: string
  artImageId: number | null
}

type ArtTarget = {
  entityId: number
  field: FacetArtField
  version: string
}

type QueueEntry = {
  facet: FacetRow
  profile: ProfileRow
  identityPrompt: string
  variant: FacetArtVariant
  repairSourceJobId?: number
  repairSourceVersion?: string
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

function parsePayload(value: string): JsonObject {
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

function taxonomyVisualLanguage(taxonomy: string): string {
  switch (taxonomy) {
    case 'ANIMAL':
    case 'SPECIES':
      return 'One unmistakable full creature, recognizable anatomy, distinctive personality, habitat cues.'
    case 'GENRE':
    case 'THEME':
    case 'SETTING':
      return 'Iconic scene, concrete focal subject, environment, action, strong atmosphere.'
    case 'PERSONALITY':
    case 'ALIGNMENT':
    case 'QUIRK':
    case 'BACKSTORY':
      return 'Character-centered visual metaphor, clear emotion through pose, expression, costume, and environment.'
    case 'COLOR':
    case 'MATERIAL':
      return 'Unmistakable palette or material behavior through lighting, texture, and a strong central form.'
    case 'STYLE':
    case 'ART_DIRECTION':
    case 'PROMPT_ENHANCEMENT':
      return 'Polished sample of the visual treatment, coherent medium, linework, palette, lighting, and surface detail.'
    case 'OCCUPATION':
    case 'ARCHETYPE':
    case 'ROLE':
      return 'Single distinctive figure in action, readable tools, unmistakable silhouette, workplace cues.'
    case 'RARITY':
    case 'REWARD_TYPE':
      return 'Premium collectible object or emblem, rarity expressed through materials and lighting, clean silhouette.'
    default:
      return 'Single clear subject or emblem, immediately legible at thumbnail size.'
  }
}

export function isLegacyGeneratedFacetPrompt(value: unknown): boolean {
  return LEGACY_GENERATED_IDENTITY.test(clean(value))
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
  if (existing && !isLegacyGeneratedFacetPrompt(existing)) return existing

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

  // Deliberately caption-shaped. "Surreal Horror" is useful conditioning;
  // "Illustrate the Facet concept named Surreal Horror for Kind Robots" is a
  // pile of extra concrete words that Krea is perfectly capable of painting.
  return [
    `${facet.title}.`,
    scientificName ? `${scientificName}.` : '',
    category ? `${category}.` : '',
    ...prose,
    taxonomyVisualLanguage(profile.taxonomy),
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function buildFacetVariantPrompt(
  _facet: FacetRow,
  _profile: ProfileRow,
  identityPrompt: string,
  variant: FacetArtVariant,
): string {
  return [
    identityPrompt,
    variant.composition,
    'Polished fantasy illustration. Rich controlled lighting. Crisp subject separation. Clean unmarked surfaces.',
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

function repairRetry(sourceJobId: number): JsonObject {
  return {
    mode: 'NEW_OUTPUT',
    sourceJobId,
    rootJobId: sourceJobId,
    targetArtImageId: null,
    refreshSeed: true,
    requestedAt: new Date().toISOString(),
    reason: 'facet-krea-context-prompt-repair-v4',
  }
}

export function buildFacetArtPayload(
  facet: FacetRow,
  profile: ProfileRow,
  identityPrompt: string,
  variant: FacetArtVariant,
  repair?: { sourceJobId: number; sourceVersion: string },
) {
  const promptString = buildFacetVariantPrompt(
    facet,
    profile,
    identityPrompt,
    variant,
  )

  // This producer writes ArtJobs directly, so enforce the same model contract
  // used by the API before anything reaches the queue ledger.
  assertArtPromptContract({
    prompt: promptString,
    engine: 'krea2',
    steps: 8,
    cfg: 1,
  })

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
      ...(repair ? { retry: repairRetry(repair.sourceJobId) } : {}),
      facetArtworkVersion: FACET_ART_VERSION,
      facetCatalog: {
        taxonomy: profile.taxonomy,
        groupKey: profile.groupKey,
        sourceRank: profile.sourceRank,
        variant: variant.field,
        coverageMode: ALL_VARIANTS ? 'all-variants' : 'baseline',
        ...(repair
          ? {
              repairReason: 'krea-context-prompt-text',
              repairSourceJobId: repair.sourceJobId,
              repairSourceVersion: repair.sourceVersion,
            }
          : {}),
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

function repairPriority(profile: ProfileRow): number {
  return Math.max(50, priorityFor(profile))
}

function artTarget(payload: string): ArtTarget | null {
  const parsed = parsePayload(payload)
  const entityArt = asObject(parsed.entityArt)
  if (clean(entityArt.entityType).toLowerCase() !== 'facet') return null
  const entityId = Number(entityArt.entityId)
  const field = clean(entityArt.field)
  if (!Number.isInteger(entityId) || entityId <= 0) return null
  if (!ART_VARIANTS.some((variant) => variant.field === field)) return null
  return {
    entityId,
    field: field as FacetArtField,
    version: clean(parsed.facetArtworkVersion),
  }
}

function fieldVariant(field: FacetArtField): FacetArtVariant {
  return ART_VARIANTS.find((variant) => variant.field === field)!
}

function slotArtImageId(facet: FacetRow, field: FacetArtField): number | null {
  switch (field) {
    case 'imagePath':
      return facet.artImageId
    case 'cardPath':
      return facet.cardArtImageId
    case 'heroPath':
      return facet.heroArtImageId
    case 'iconPath':
      return facet.iconArtImageId
  }
}

function slotPath(facet: FacetRow, field: FacetArtField): string {
  return clean(facet[field])
}

function likelyStillCarriesLegacyOutput(
  facet: FacetRow,
  field: FacetArtField,
  jobArtImageId: number | null,
): boolean {
  const currentId = slotArtImageId(facet, field)
  if (jobArtImageId && currentId) return jobArtImageId === currentId
  if (currentId && !jobArtImageId) return false

  // Per-slot ArtImage ids have existed since before both tainted producer
  // versions. A populated path with no slot id is uncommon legacy data; because
  // this mode is explicitly a provenance repair and preserveOriginal is true,
  // treat it as likely tainted rather than leaving an unprovable bad render in
  // place forever. A current nonmatching ArtImage id, above, always wins.
  return Boolean(slotPath(facet, field)) || !currentId
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

export async function main(): Promise<void> {
  await withDatabaseRetry('Facet artwork queue', async () => {
    const prisma = createScriptPrismaClient()
    try {
      const [
        facets,
        profiles,
        aliases,
        artImageLinks,
        artCollectionLinks,
        activeJobs,
        historyJobs,
      ] = await Promise.all([
        prisma.facet.findMany({
          where: { isActive: true },
          orderBy: { id: 'asc' },
          select: {
            id: true,
            title: true,
            slug: true,
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
            cardArtImageId: true,
            heroArtImageId: true,
            iconArtImageId: true,
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
        // Reuse ANY active Facet ArtJob during ordinary coverage. Repair mode
        // separately cancels tainted pending jobs and marks replacements as
        // explicit retries so claim-time baseline cleanup cannot discard them.
        prisma.artJob.findMany({
          where: {
            projectSlug: PROJECT_SLUG,
            status: { in: ['PENDING', 'RUNNING'] },
            payload: { contains: '"entityType":"facet"' },
          },
          select: { id: true, status: true, payload: true },
        }),
        REPAIR_TAINTED
          ? prisma.artJob.findMany({
              where: {
                projectSlug: PROJECT_SLUG,
                payload: { contains: '"entityType":"facet"' },
              },
              orderBy: { id: 'desc' },
              select: {
                id: true,
                status: true,
                payload: true,
                artImageId: true,
              },
            })
          : Promise.resolve([] as HistoryJob[]),
      ])

      const facetRows = facets as FacetRow[]
      const facetById = new Map(facetRows.map((facet) => [facet.id, facet]))
      const profileByFacet = new Map(
        profiles.map((profile) => [profile.facetId, profile as ProfileRow]),
      )
      const aliasesByFacet = new Map<number, string[]>()
      for (const alias of aliases) {
        const entries = aliasesByFacet.get(alias.facetId) ?? []
        entries.push(alias.alias)
        aliasesByFacet.set(alias.facetId, entries)
      }
      const linkedPrimaryArt = new Set(
        artImageLinks.map((link) => link.facetId),
      )
      const linkedCollections = new Set(
        artCollectionLinks.map((link) => link.facetId),
      )
      const pendingFacetFields = new Set<string>()
      for (const job of activeJobs) {
        const target = artTarget(job.payload)
        if (target) pendingFacetFields.add(`${target.entityId}:${target.field}`)
      }

      const auditInputs: FacetAuditInput[] = facetRows.map((facet) => {
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
      })
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
      const blocked: Array<{ id: number; title: string; reasons: string[] }> =
        []
      const queue: QueueEntry[] = []

      for (const facet of facetRows) {
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
          }
        }

        if (!ALL_VARIANTS) {
          const hasDisplayArt = Boolean(
            clean(facet.imagePath) ||
              clean(facet.cardPath) ||
              clean(facet.heroPath) ||
              clean(facet.iconPath) ||
              facet.artImageId !== null ||
              linkedPrimaryArt.has(facet.id),
          )
          if (hasDisplayArt) continue

          const pendingVariant = ART_VARIANTS.find((variant) =>
            pendingFacetFields.has(`${facet.id}:${variant.field}`),
          )
          if (pendingVariant) {
            reused.push({ id: facet.id, field: pendingVariant.field })
            continue
          }

          queue.push({
            facet,
            profile,
            identityPrompt,
            variant: ART_VARIANTS[0],
          })
          continue
        }

        for (const variant of ART_VARIANTS) {
          const primaryLinked = Boolean(
            variant.field === 'imagePath' &&
              (facet.artImageId !== null || linkedPrimaryArt.has(facet.id)),
          )
          if (clean(facet[variant.field]) || primaryLinked) continue
          if (pendingFacetFields.has(`${facet.id}:${variant.field}`)) {
            reused.push({ id: facet.id, field: variant.field })
            continue
          }
          queue.push({ facet, profile, identityPrompt, variant })
        }
      }

      const history = historyJobs as HistoryJob[]
      const v4Keys = new Set<string>()
      const legacyPendingIds: number[] = []
      for (const job of history) {
        const target = artTarget(job.payload)
        if (!target) continue
        const key = `${target.entityId}:${target.field}`
        if (
          target.version === FACET_ART_VERSION &&
          ['PENDING', 'RUNNING', 'DONE'].includes(job.status)
        ) {
          v4Keys.add(key)
        }
        if (
          LEGACY_FACET_ART_VERSIONS.has(target.version) &&
          job.status === 'PENDING'
        ) {
          legacyPendingIds.push(job.id)
        }
      }

      const repairQueued = new Set<string>()
      const repairSkippedSuperseded: number[] = []
      const repairBlocked: number[] = []
      if (REPAIR_TAINTED) {
        for (const job of history) {
          const target = artTarget(job.payload)
          if (!target || !LEGACY_FACET_ART_VERSIONS.has(target.version)) continue
          if (!['PENDING', 'RUNNING', 'DONE'].includes(job.status)) continue

          const key = `${target.entityId}:${target.field}`
          if (v4Keys.has(key) || repairQueued.has(key)) continue

          const facet = facetById.get(target.entityId)
          const profile = profileByFacet.get(target.entityId)
          if (!facet || !profile || !profile.artRequired) continue
          if ((blockersByFacet.get(facet.id) ?? []).length) {
            repairBlocked.push(job.id)
            continue
          }

          if (
            job.status === 'DONE' &&
            !likelyStillCarriesLegacyOutput(
              facet,
              target.field,
              job.artImageId,
            )
          ) {
            repairSkippedSuperseded.push(job.id)
            continue
          }

          // A pending tainted job that no longer owns an empty slot is cancelled
          // below but does not need a replacement. Its current art was supplied
          // by another job and that DONE job's provenance decides whether *it*
          // needs repair.
          if (
            job.status === 'PENDING' &&
            (slotArtImageId(facet, target.field) || slotPath(facet, target.field))
          ) {
            continue
          }

          queue.push({
            facet,
            profile,
            identityPrompt: buildFacetIdentityPrompt(facet, profile),
            variant: fieldVariant(target.field),
            repairSourceJobId: job.id,
            repairSourceVersion: target.version,
          })
          repairQueued.add(key)
        }
      }

      if (WRITE) {
        if (REPAIR_TAINTED && legacyPendingIds.length) {
          await prisma.artJob.updateMany({
            where: {
              id: { in: legacyPendingIds },
              status: 'PENDING',
            },
            data: {
              status: 'CANCELLED',
              claimedAt: null,
              claimedBy: null,
              error:
                'Cancelled by Facet Krea prompt repair: v2/v3 contextual prompt is known to induce rendered text; superseded by semantic v4 prompt.',
            },
          })
        }

        const promptUpdates = Array.from(
          new Map(
            queue
              .filter(
                (entry) =>
                  !clean(entry.facet.artPrompt) ||
                  isLegacyGeneratedFacetPrompt(entry.facet.artPrompt),
              )
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
          priority: entry.repairSourceJobId
            ? repairPriority(entry.profile)
            : priorityFor(entry.profile),
          payload: JSON.stringify(
            buildFacetArtPayload(
              entry.facet,
              entry.profile,
              entry.identityPrompt,
              entry.variant,
              entry.repairSourceJobId && entry.repairSourceVersion
                ? {
                    sourceJobId: entry.repairSourceJobId,
                    sourceVersion: entry.repairSourceVersion,
                  }
                : undefined,
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
          `Facet art: ${inserted} job(s) queued, ${reused.length} active coverage job(s) reused, ${blocked.length} entry/entries held for catalog review.` +
            (REPAIR_TAINTED
              ? ` Repair scan: ${repairQueued.size} v2/v3 target(s) resubmitted, ${legacyPendingIds.length} tainted pending job(s) cancelled, ${repairSkippedSuperseded.length} superseded output(s) preserved, ${repairBlocked.length} blocked target(s) held.`
              : ''),
        )
      }

      console.log(
        JSON.stringify(
          {
            mode: WRITE ? 'write' : 'dry-run',
            coverageMode: ALL_VARIANTS ? 'all-variants' : 'baseline',
            repairTainted: REPAIR_TAINTED,
            projectSlug: PROJECT_SLUG,
            version: FACET_ART_VERSION,
            repairedVersions: [...LEGACY_FACET_ART_VERSIONS],
            fields: ART_VARIANTS.map((variant) => variant.field),
            totals: {
              active: facets.length,
              available: Object.fromEntries(available),
              notRequired: notRequired.length,
              pendingReused: reused.length,
              queued: queue.length,
              repairQueued: repairQueued.size,
              repairPendingCancelled: legacyPendingIds.length,
              repairSupersededPreserved: repairSkippedSuperseded.length,
              repairBlocked: repairBlocked.length,
              blocked: blocked.length,
            },
            audit: audit.totals,
            blocked: blocked.slice(0, 100),
            policy: {
              prompt:
                'Krea receives semantic image content only: subject, scene, medium, composition, lighting, and texture. App/taxonomy/context wrappers are excluded.',
              qualityGate:
                'Validate Krea 2 prompts before enqueue; do not generate art for duplicate, malformed, composite, taxonomy-leaking, cargo-cult, or unreviewed legacy Facets.',
              repair:
                'When --repair-tainted is set, cancel pending v2/v3 jobs and resubmit v2/v3 outputs that still own their Facet slot. Preserve outputs already superseded by a different ArtImage id.',
              scope: ALL_VARIANTS
                ? 'Explicit enhancement mode: queue every missing imagePath, cardPath, heroPath, and iconPath without replacing curated art.'
                : 'Coverage-first mode: queue at most one imagePath job for a Facet with no display art and no active Facet ArtJob.',
              dedupe:
                'Reuse PENDING/RUNNING coverage work normally; repair jobs carry retry provenance so claim-time baseline cleanup cannot discard an intentional replacement.',
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
