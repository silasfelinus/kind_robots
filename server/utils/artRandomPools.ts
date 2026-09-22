// /server/utils/artRandomPools.ts
//
// Where a `{placeholder}` in an art prompt gets its values.
//
// Three kinds of pool feed the same roll:
//
//   LoRA      -- rolls actual weights. The substituted text is the LoRA's
//                trigger word, and the pick carries the Resource id so the
//                enqueue path can attach it. This is the pool that needed
//                Resource.loraCategory to exist at all.
//   Facet     -- the canonical creative vocabulary, already randomizable via
//                FacetProfile.isRandomizable. Text only.
//   Entity    -- Characters and Scenarios, so "a random character" can mean a
//                record Silas authored rather than a LoRA.
//
// Resolution order for a bare `{style}` is LoRA, then Facet, then entity: the
// most specific pool that can answer wins, because a LoRA roll changes the
// render and a Facet roll only changes the text. An explicit `{facet:style}`
// or `{lora:character}` skips the search.

import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import {
  viewerShowsMature,
  visibilityWhere,
  type MaturityUser,
} from '~/server/utils/contentAccess'
import {
  loadFacetCatalogEntries,
  FACET_TAXONOMIES,
  type FacetTaxonomy,
} from '~/server/utils/facetCatalog'
import {
  normalizeVariantKey,
  parseVariantKey,
  type VariantPick,
} from '~/server/utils/promptVariants'
import {
  LORA_CATEGORIES,
  LORA_CATEGORY_META,
  loraCategoryForPlaceholder,
  type LoraCategory,
} from '~/utils/loraCategory'
import {
  artLoraCompatibilityRank,
  loraTriggerTerms,
} from '~/utils/loraSelection'
import type {
  ArtGeneratorEngine,
  CheckpointFamily,
} from '~/utils/artGeneratorPresets'

export type ArtRandomPoolSource = 'lora' | 'facet' | 'character' | 'scenario'

export const ART_RANDOM_POOL_SOURCES: ArtRandomPoolSource[] = [
  'lora',
  'facet',
  'character',
  'scenario',
]

export type ArtRandomPoolViewer = {
  user?: MaturityUser | null
  isAdmin?: boolean
  /** The per-request maturity toggle. May only narrow, never widen. */
  showMature?: boolean
}

export type ArtRandomPoolOptions = ArtRandomPoolViewer & {
  /**
   * The lane the batch will render on. Null means a lane with no LoRA support
   * (OpenAI, a1111) -- the LoRA pools are skipped entirely rather than rolled
   * from and then silently dropped by the workflow builder.
   */
  engine: ArtGeneratorEngine | null
  checkpointFamily?: CheckpointFamily
  /** Which pools may answer. Defaults to all four. */
  sources?: ArtRandomPoolSource[]
  /** Default LoRA strength for a rolled pick. */
  loraStrength?: number
}

export type ArtRandomPoolReport = {
  /** Normalized placeholder key, as written in the prompt. */
  key: string
  source: ArtRandomPoolSource | null
  /** The LoRA category or Facet taxonomy the key resolved to, when it did. */
  bucket: string | null
  size: number
}

export type ArtRandomPools = {
  getPool: (key: string) => VariantPick[] | undefined
  reports: ArtRandomPoolReport[]
}

// Placeholder words that name a Facet taxonomy. Shares the spirit of
// challenges/variants.post.ts's FACET_PLACEHOLDERS -- and deliberately not its
// table, because that one maps a few curated challenge words while this one
// has to answer any taxonomy a prompt names.
const FACET_PLACEHOLDER_ALIASES: Record<string, FacetTaxonomy[]> = {
  animal: ['ANIMAL'],
  species: ['SPECIES', 'ANIMAL'],
  creature: ['ANIMAL', 'SPECIES'],
  style: ['STYLE'],
  artstyle: ['STYLE'],
  artdirection: ['ART_DIRECTION', 'PROMPT_ENHANCEMENT'],
  setting: ['SETTING'],
  location: ['SETTING'],
  place: ['SETTING'],
  background: ['SETTING'],
  scene: ['SETTING'],
  genre: ['GENRE'],
  color: ['COLOR'],
  palette: ['COLOR'],
  theme: ['THEME'],
  mood: ['THEME'],
  material: ['MATERIAL'],
  personality: ['PERSONALITY'],
  quirk: ['QUIRK'],
  backstory: ['BACKSTORY'],
  alignment: ['ALIGNMENT'],
  archetype: ['ARCHETYPE'],
  occupation: ['OCCUPATION'],
  role: ['ROLE'],
  rarity: ['RARITY'],
  gender: ['GENDER'],
  age: ['AGE'],
  build: ['BUILD'],
  hair: ['HAIR'],
  origin: ['ORIGIN'],
  core: ['CORE'],
}

function facetTaxonomiesForKey(key: string): FacetTaxonomy[] {
  const aliased = FACET_PLACEHOLDER_ALIASES[key]
  if (aliased) return aliased

  const direct = FACET_TAXONOMIES.find(
    (taxonomy) => normalizeVariantKey(taxonomy) === key,
  )
  return direct ? [direct] : []
}

/**
 * The randomizer's extra maturity clause, on top of visibilityWhere's.
 *
 * visibilityWhere deliberately DELIVERS an owner's own mature rows while their
 * toggle is off, so the gallery can cover the card and offer an uncover. A
 * random roll has no card and nothing to uncover -- it would just quietly put
 * mature weights on a batch of ten the viewer asked to have curtained. Rolling
 * is not browsing, so the curtain is opaque here. Narrows only; it can never
 * admit a row visibilityWhere already refused.
 */
function randomizerMaturityWhere(options: ArtRandomPoolViewer): {
  isMature?: false
} {
  return viewerShowsMature(options.user, options.showMature)
    ? {}
    : { isMature: false }
}

type LoraRow = {
  id: number
  name: string
  customLabel: string | null
  loraCategory: LoraCategory | null
  generation: string | null
  supportedServer: string | null
  defaultTrigger: string | null
  triggerWords: string | null
  localPath: string | null
}

/**
 * The text a rolled LoRA contributes to the prompt.
 *
 * Its trigger word, when it has one -- that is the string the weights were
 * trained to answer to, and a LoRA whose trigger never reaches the prompt is
 * loaded but unused. Only when there is no trigger at all does the label stand
 * in, which is a weak substitute and the reason the catalog cares about
 * trainedWords during import.
 */
function loraPromptText(row: LoraRow): string {
  const [trigger] = loraTriggerTerms(row)
  return (trigger || row.customLabel || row.name || '').trim()
}

async function loadLoraPools(
  options: ArtRandomPoolOptions,
): Promise<Map<LoraCategory, VariantPick[]>> {
  if (!options.engine) return new Map()

  const where: Prisma.ResourceWhereInput = {
    isActive: true,
    resourceType: { in: ['LORA', 'LYCORIS'] },
    loraCategory: { not: null },
    // A LoRA the renderer cannot find on disk is not a candidate. The whole
    // t-001 path bug was a bare name reaching ComfyUI; rolling one at random
    // would reintroduce it on a batch of ten at a time.
    localPath: { not: null },
    ...(await visibilityWhere(
      options.user,
      { isPublic: true, isMature: true, grantSubject: 'RESOURCE' },
      options.isAdmin ?? false,
      options.showMature,
    )),
    ...randomizerMaturityWhere(options),
  }

  const rows = (await prisma.resource.findMany({
    where,
    select: {
      id: true,
      name: true,
      customLabel: true,
      loraCategory: true,
      generation: true,
      supportedServer: true,
      defaultTrigger: true,
      triggerWords: true,
      localPath: true,
    },
    orderBy: { id: 'asc' },
  })) as LoraRow[]

  const pools = new Map<LoraCategory, VariantPick[]>()

  for (const row of rows) {
    if (!row.loraCategory) continue

    const rank = artLoraCompatibilityRank(
      row,
      options.engine,
      options.checkpointFamily ?? 'unknown',
    )
    if (rank <= 0) continue

    const value = loraPromptText(row)
    if (!value) continue

    const pick: VariantPick = {
      value,
      kind: 'lora',
      sourceId: row.id,
      label: row.customLabel || row.name,
      loraResourceId: row.id,
      loraStrength: options.loraStrength ?? 1,
    }

    const existing = pools.get(row.loraCategory)
    if (existing) existing.push(pick)
    else pools.set(row.loraCategory, [pick])
  }

  return pools
}

async function loadEntityPool(
  source: 'character' | 'scenario',
  options: ArtRandomPoolOptions,
): Promise<VariantPick[]> {
  const where = await visibilityWhere(
    options.user,
    {
      isPublic: true,
      isMature: true,
      ...(source === 'character' ? { packGated: true } : {}),
    },
    options.isAdmin ?? false,
    options.showMature,
  )

  const maturity = randomizerMaturityWhere(options)

  if (source === 'character') {
    const rows = await prisma.character.findMany({
      where: { ...where, ...maturity, isActive: true },
      select: { id: true, name: true },
      orderBy: { id: 'asc' },
      take: 1000,
    })
    return rows
      .filter((row) => row.name?.trim())
      .map((row) => ({
        value: row.name.trim(),
        kind: 'character',
        sourceId: row.id,
        label: row.name.trim(),
      }))
  }

  const rows = await prisma.scenario.findMany({
    where: { ...where, ...maturity, isActive: true },
    select: { id: true, title: true },
    orderBy: { id: 'asc' },
    take: 1000,
  })
  return rows
    .filter((row) => row.title?.trim())
    .map((row) => ({
      value: row.title.trim(),
      kind: 'scenario',
      sourceId: row.id,
      label: row.title.trim(),
    }))
}

type ParsedPlaceholder = { raw: string; kind: string | null; key: string }

function entityKindFor(
  entry: ParsedPlaceholder,
): 'character' | 'scenario' | null {
  if (entry.kind === 'character') return 'character'
  if (entry.kind === 'scenario') return 'scenario'
  if (entry.kind !== null) return null
  if (entry.key === 'character') return 'character'
  if (entry.key === 'scenario' || entry.key === 'story') return 'scenario'
  return null
}

/**
 * Resolves every placeholder in `keys` to a pool, once, up front.
 *
 * Everything is loaded before the first roll rather than lazily per variant:
 * a batch of ten must deal from the SAME pool ten times to guarantee ten
 * different values, and a per-variant lookup cannot do that.
 */
export async function buildArtRandomPools(
  keys: string[],
  options: ArtRandomPoolOptions,
): Promise<ArtRandomPools> {
  const allowed = new Set(options.sources ?? ART_RANDOM_POOL_SOURCES)
  const normalizedKeys = [...new Set(keys.map(normalizeVariantKey))]

  const parsed = normalizedKeys.map((raw) => ({
    raw,
    ...parseVariantKey(raw),
  }))

  const wantsLora = parsed.some(
    (entry) =>
      allowed.has('lora') &&
      options.engine !== null &&
      (entry.kind === null || entry.kind === 'lora') &&
      loraCategoryForPlaceholder(entry.key) !== null,
  )

  const loraPools = wantsLora
    ? await loadLoraPools(options)
    : new Map<LoraCategory, VariantPick[]>()

  const facetTaxonomies = [
    ...new Set(
      parsed
        .filter(
          (entry) =>
            allowed.has('facet') &&
            (entry.kind === null || entry.kind === 'facet'),
        )
        .flatMap((entry) => facetTaxonomiesForKey(entry.key)),
    ),
  ]

  const facets = facetTaxonomies.length
    ? await loadFacetCatalogEntries({
        taxonomies: facetTaxonomies,
        randomizableOnly: true,
        includeMature: viewerShowsMature(options.user, options.showMature),
        userId: options.user?.id ?? undefined,
        isAdmin: options.isAdmin ?? false,
      })
    : []

  const entityPools = new Map<'character' | 'scenario', VariantPick[]>()
  for (const source of ['character', 'scenario'] as const) {
    const wanted = parsed.some(
      (entry) => allowed.has(source) && entityKindFor(entry) === source,
    )
    if (wanted) entityPools.set(source, await loadEntityPool(source, options))
  }

  const resolved = new Map<string, VariantPick[]>()
  const reports: ArtRandomPoolReport[] = []

  for (const entry of parsed) {
    const category =
      allowed.has('lora') &&
      options.engine !== null &&
      (entry.kind === null || entry.kind === 'lora')
        ? loraCategoryForPlaceholder(entry.key)
        : null
    const loraPool = category ? loraPools.get(category) : undefined

    if (loraPool?.length) {
      resolved.set(entry.raw, loraPool)
      reports.push({
        key: entry.raw,
        source: 'lora',
        bucket: LORA_CATEGORY_META[category!].label,
        size: loraPool.length,
      })
      continue
    }

    const taxonomies =
      allowed.has('facet') && (entry.kind === null || entry.kind === 'facet')
        ? facetTaxonomiesForKey(entry.key)
        : []
    const facetPool = taxonomies.length
      ? facets
          .filter((facet) => taxonomies.includes(facet.taxonomy))
          .map<VariantPick>((facet) => ({
            value: (facet.canonicalValue || facet.title).trim(),
            kind: 'facet',
            sourceId: facet.id,
            label: facet.title,
          }))
          .filter((pick) => pick.value)
      : []

    if (facetPool.length) {
      resolved.set(entry.raw, facetPool)
      reports.push({
        key: entry.raw,
        source: 'facet',
        bucket: taxonomies.join('/'),
        size: facetPool.length,
      })
      continue
    }

    /*
     * An explicit `kind:` prefix is a refusal as much as a request. Without
     * this check, `{lora:character}` with an empty LoRA pool fell through to
     * the Character records -- which is a reasonable default for a bare
     * `{character}` and exactly the wrong answer for someone who named the
     * pool they wanted and would rather see it come back empty.
     */
    const entitySource = entityKindFor(entry)
    const entityPool = entitySource ? entityPools.get(entitySource) : undefined

    if (entityPool?.length) {
      resolved.set(entry.raw, entityPool)
      reports.push({
        key: entry.raw,
        source: entitySource,
        bucket: entitySource,
        size: entityPool.length,
      })
      continue
    }

    reports.push({ key: entry.raw, source: null, bucket: null, size: 0 })
  }

  return {
    getPool: (key: string) => resolved.get(normalizeVariantKey(key)),
    reports,
  }
}

/** Every placeholder word a prompt can use, for the editor's help text. */
export function knownArtPlaceholders(): Array<{
  placeholder: string
  source: ArtRandomPoolSource
  hint: string
}> {
  const loraEntries = LORA_CATEGORIES.flatMap((category) =>
    LORA_CATEGORY_META[category].placeholders.map((placeholder) => ({
      placeholder,
      source: 'lora' as const,
      hint: LORA_CATEGORY_META[category].hint,
    })),
  )

  const facetEntries = Object.keys(FACET_PLACEHOLDER_ALIASES).map(
    (placeholder) => ({
      placeholder,
      source: 'facet' as const,
      hint: `Facet taxonomy ${FACET_PLACEHOLDER_ALIASES[placeholder]!.join('/')}.`,
    }),
  )

  const entityEntries = [
    {
      placeholder: 'character',
      source: 'character' as const,
      hint: 'A Character record you can see.',
    },
    {
      placeholder: 'scenario',
      source: 'scenario' as const,
      hint: 'A Scenario record you can see.',
    },
  ]

  return [...loraEntries, ...facetEntries, ...entityEntries]
}
