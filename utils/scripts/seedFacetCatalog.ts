// /utils/scripts/seedFacetCatalog.ts
import 'dotenv/config'
import {
  PrismaClient,
  type FacetKind,
} from './../../prisma/generated/prisma/client'
import { createDatabaseAdapter } from './../../server/utils/databaseAdapterConfig'
import { ADVENTURE_CARDS } from './../../stores/helpers/adventureCards'
import { animalDataList } from './../../stores/utils/animalData'
import { artListPresets } from './../../stores/seeds/artList'
import { backstoryList } from './../../stores/utils/randomBackstory'
import { classList } from './../../stores/utils/randomClass'
import { colorList as legacyColorList } from './../../stores/utils/randomColor'
import { genreList } from './../../stores/utils/randomGenre'
import { materialList } from './../../stores/utils/randomMaterial'
import { personalityList } from './../../stores/utils/randomPersonality'
import { quirkList } from './../../stores/utils/randomQuirks'
import {
  normalizeFacetLookupKey,
  prepareUniqueFacetAliases,
} from './../facetAliases'
import { runWithKeyedConcurrency } from './facetSeedConcurrency'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

// Standalone scripts must share the application's ProxySQL/TLS configuration.
// A bare PrismaMariaDb(DATABASE_URL) is rejected by production because SSL is
// required and also misses the app's no-pipelining protocol setting.
const prisma = new PrismaClient({
  adapter: createDatabaseAdapter(databaseUrl),
})
const apply = process.argv.includes('--apply')

type Taxonomy =
  | 'GENRE'
  | 'ANIMAL'
  | 'COLOR'
  | 'THEME'
  | 'CORE'
  | 'MOOD'
  | 'STYLE'
  | 'SETTING'
  | 'ART_DIRECTION'
  | 'SPECIES'
  | 'OCCUPATION'
  | 'ARCHETYPE'
  | 'ROLE'
  | 'ALIGNMENT'
  | 'PERSONALITY'
  | 'BACKSTORY'
  | 'QUIRK'
  | 'MATERIAL'
  | 'PROMPT_ENHANCEMENT'
  | 'OTHER'

type Candidate = {
  title: string
  canonicalValue: string
  taxonomy: Taxonomy
  description?: string
  imagePath?: string
  icon?: string
  groupKey?: string
  groupLabel?: string
  sortOrder: number
  sourceRank: number
  aliases: Set<string>
  metadata: Record<string, unknown>
}

const candidates = new Map<string, Candidate>()
const animalKeys = new Set(
  animalDataList.map((animal) => normalizeFacetLookupKey(animal.name)),
)

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

function legacyKind(taxonomy: Taxonomy): FacetKind {
  const direct: Partial<Record<Taxonomy, FacetKind>> = {
    GENRE: 'GENRE',
    ANIMAL: 'ANIMAL',
    COLOR: 'COLOR',
    THEME: 'THEME',
    CORE: 'CORE',
    MOOD: 'MOOD',
    STYLE: 'STYLE',
    SETTING: 'SETTING',
    ART_DIRECTION: 'ART_DIRECTION',
    PROMPT_ENHANCEMENT: 'ART_DIRECTION',
  }
  return direct[taxonomy] ?? 'OTHER'
}

function classTaxonomy(value: string): Taxonomy {
  const normalized = value.toLowerCase()
  const rolePatterns = [
    /^the\b/,
    /chosen one/,
    /protagonist/,
    /last survivor/,
    /dark parallel/,
    /mentor/,
    /apex predator/,
    /load-bearing wall/,
    /ambient threat/,
    /passive hazard/,
    /decorative element/,
    /unknown function/,
    /ecosystem keystone/,
    /invasive species/,
    /decommissioned weapon/,
    /ship ai/,
  ]
  if (rolePatterns.some((pattern) => pattern.test(normalized))) return 'ROLE'

  const occupationPatterns = [
    /accountant/,
    /doctor/,
    /lawyer/,
    /notary/,
    /baker/,
    /consultant/,
    /collector/,
    /cartographer/,
    /diplomat/,
    /pilot/,
    /engineer/,
    /hacker/,
    /biologist/,
    /scout/,
    /operative/,
    /analyst/,
    /wrangler/,
    /intelligence/,
    /investigator/,
    /specialist/,
    /student/,
    /manager/,
    /officer/,
    /facilitator/,
    /chronicler/,
    /exorcist/,
  ]
  return occupationPatterns.some((pattern) => pattern.test(normalized))
    ? 'OCCUPATION'
    : 'ARCHETYPE'
}

function taxonomyForField(fieldKey: string, value: string): Taxonomy | null {
  const key = fieldKey.toLowerCase()
  if (key === 'species') {
    return animalKeys.has(normalizeFacetLookupKey(value)) ? 'ANIMAL' : 'SPECIES'
  }
  if (key === 'class') return classTaxonomy(value)
  if (key === 'alignment') return 'ALIGNMENT'
  if (key === 'personality') return 'PERSONALITY'
  if (key === 'backstory') return 'BACKSTORY'
  if (key === 'quirks' || key === 'quirk') return 'QUIRK'
  if (key === 'genre' || key === 'genres') return 'GENRE'
  if (key === 'role') return 'ROLE'
  return null
}

function addCandidate(
  input: Omit<Candidate, 'aliases' | 'metadata'> & {
    aliases?: Iterable<string>
    metadata?: Record<string, unknown>
  },
): void {
  const title = clean(input.title)
  const canonicalValue = clean(input.canonicalValue) || title
  const key = normalizeFacetLookupKey(title)
  if (!title || !canonicalValue || !key) return

  const incoming: Candidate = {
    ...input,
    title,
    canonicalValue,
    aliases: new Set([title, canonicalValue, ...(input.aliases ?? [])]),
    metadata: { ...(input.metadata ?? {}) },
  }
  const existing = candidates.get(key)
  if (!existing) {
    candidates.set(key, incoming)
    return
  }

  const incomingWins = incoming.sourceRank < existing.sourceRank
  if (existing.taxonomy === 'ANIMAL' || incoming.taxonomy === 'ANIMAL') {
    existing.taxonomy = 'ANIMAL'
  } else if (incomingWins) {
    existing.taxonomy = incoming.taxonomy
  }

  if (incomingWins) {
    existing.title = incoming.title
    existing.canonicalValue = incoming.canonicalValue
    existing.groupKey = incoming.groupKey
    existing.groupLabel = incoming.groupLabel
    existing.sortOrder = incoming.sortOrder
    existing.sourceRank = incoming.sourceRank
  }

  if (!existing.description || incomingWins) {
    existing.description = incoming.description || existing.description
  }
  if (!existing.imagePath || incomingWins) {
    existing.imagePath = incoming.imagePath || existing.imagePath
  }
  if (!existing.icon || incomingWins) {
    existing.icon = incoming.icon || existing.icon
  }

  for (const alias of incoming.aliases) existing.aliases.add(alias)
  existing.metadata = { ...existing.metadata, ...incoming.metadata }
}

function collectAdventureBuilder(): void {
  for (const card of ADVENTURE_CARDS) {
    let order = 0
    for (const step of card.steps) {
      const fieldKey = clean(step.field) || clean(step.key) || clean(card.key)
      const values: Array<{
        value: string
        label: string
        description?: string
        imagePath?: string
        icon?: string
      }> = []

      for (const choice of step.choices ?? []) {
        if (choice.opensCustom || choice.opensList) continue
        const value = clean(choice.value)
        const label = clean(choice.label) || value
        if (!value || !label) continue
        values.push({
          value,
          label,
          description: clean(choice.subtext) || undefined,
          imagePath: clean(choice.image) || undefined,
          icon: clean(choice.icon) || undefined,
        })
        for (const option of choice.listOptions ?? []) {
          const cleaned = clean(option)
          if (cleaned) values.push({ value: cleaned, label: cleaned })
        }
      }

      for (const option of step.listOptions ?? []) {
        const cleaned = clean(option)
        if (cleaned) values.push({ value: cleaned, label: cleaned })
      }

      for (const item of values) {
        const taxonomy = taxonomyForField(fieldKey, item.value)
        if (!taxonomy) continue
        addCandidate({
          title: item.label,
          canonicalValue: item.value,
          taxonomy,
          description: item.description,
          imagePath: item.imagePath,
          icon: item.icon,
          groupKey: card.key,
          groupLabel: card.label,
          sortOrder: order++,
          sourceRank: 10,
          metadata: {
            source: 'adventure-builder',
            fieldKey,
            cardKey: card.key,
            stepKey: step.key,
          },
        })
      }
    }
  }
}

function collectAnimals(): void {
  for (const [index, animal] of animalDataList.entries()) {
    const isWaterBear = normalizeFacetLookupKey(animal.name) === 'water bear'
    const title = isWaterBear ? 'Tardigrade' : animal.name
    addCandidate({
      title,
      canonicalValue: title,
      taxonomy: 'ANIMAL',
      description: animal.description,
      icon: animal.icon,
      groupKey: animal.category ?? 'animal',
      groupLabel: animal.category ? `${animal.category} animals` : 'Animals',
      sortOrder: index,
      sourceRank: 20,
      aliases: isWaterBear ? ['Water Bear'] : [],
      metadata: {
        source: 'animal-data',
        scientificName: animal.scientificName,
        category: animal.category,
        wikiUrl: animal.wikiUrl,
        referenceImageUrl: animal.imageUrl,
        traits: animal.traits,
      },
    })
  }
}

function collectArtPresets(): void {
  const taxonomyByPreset: Record<string, Taxonomy | undefined> = {
    style: 'STYLE',
    theme: 'THEME',
    palette: 'COLOR',
    __pretty__: 'PROMPT_ENHANCEMENT',
  }

  for (const preset of artListPresets) {
    const taxonomy = taxonomyByPreset[preset.id]
    if (!taxonomy) continue // negative prompts remain generation configuration
    for (const [index, value] of preset.content.entries()) {
      const title = clean(value)
      if (!title) continue
      addCandidate({
        title,
        canonicalValue: title,
        taxonomy,
        groupKey: preset.id,
        groupLabel: preset.title,
        sortOrder: index,
        sourceRank: 30,
        metadata: { source: 'art-list', presetType: preset.presetType },
      })
    }
  }
}

function collectLegacyLists(): void {
  const lists: Array<{
    values: readonly string[]
    taxonomy: Taxonomy | ((value: string) => Taxonomy)
    groupKey: string
    groupLabel: string
  }> = [
    {
      values: genreList,
      taxonomy: 'GENRE',
      groupKey: 'genre',
      groupLabel: 'Genres',
    },
    {
      values: classList,
      taxonomy: classTaxonomy,
      groupKey: 'class',
      groupLabel: 'Classes and Roles',
    },
    {
      values: personalityList,
      taxonomy: 'PERSONALITY',
      groupKey: 'personality',
      groupLabel: 'Personalities',
    },
    {
      values: backstoryList,
      taxonomy: 'BACKSTORY',
      groupKey: 'backstory',
      groupLabel: 'Backstories',
    },
    {
      values: quirkList,
      taxonomy: 'QUIRK',
      groupKey: 'quirks',
      groupLabel: 'Quirks',
    },
    {
      values: materialList,
      taxonomy: 'MATERIAL',
      groupKey: 'material',
      groupLabel: 'Materials',
    },
    {
      values: legacyColorList,
      taxonomy: 'COLOR',
      groupKey: 'color',
      groupLabel: 'Colors',
    },
  ]

  for (const list of lists) {
    for (const [index, raw] of list.values.entries()) {
      const title = clean(raw)
      if (!title) continue
      addCandidate({
        title,
        canonicalValue: title,
        taxonomy:
          typeof list.taxonomy === 'function'
            ? list.taxonomy(title)
            : list.taxonomy,
        groupKey: list.groupKey,
        groupLabel: list.groupLabel,
        sortOrder: index,
        sourceRank: 90,
        metadata: { source: 'legacy-random-list' },
      })
    }
  }
}

// ProxySQL rejects command pipelining on a single connection (see
// createDatabaseAdapter's header comment), so a serial "read, then write,
// per record" loop can't be sped up by batching statements into one
// transaction. It CAN be sped up by spreading independent records across the
// connection pool (DEFAULT_CONNECTION_LIMIT, see databasePoolDefaults.ts) so
// several single-statement round trips are in flight at once. Keep this at
// or below that pool size minus a little headroom.
const WRITE_CONCURRENCY = 8

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let cursor = 0
  const errors: unknown[] = []
  async function lane(): Promise<void> {
    while (cursor < items.length) {
      const item = items[cursor]
      cursor++
      if (item === undefined) continue
      // Catch per-item rather than letting a throw escape the lane: main()'s
      // `finally` disconnects the shared Prisma client the instant this
      // function's returned promise settles. Promise.all below settles (and
      // rejects) the moment the FIRST lane throws, but the other lanes keep
      // running in the background against a client that's about to be torn
      // down -- their in-flight queries then hang forever waiting on a
      // closed connection instead of erroring, which silently reintroduced
      // BUILD_EXCEEDED_MAXIMUM_TIME on 2026-07-25 (two production builds
      // race-seeding the same slug: the loser's create() threw, the other 7
      // lanes were still mid-query when $disconnect() fired). Every lane
      // must fully drain before this function settles either way.
      try {
        await worker(item)
      } catch (error) {
        errors.push(error)
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => lane()),
  )
  if (errors.length > 0) {
    throw new AggregateError(
      errors,
      `${errors.length} of ${items.length} item(s) failed`,
    )
  }
}

type ExistingFacetRow = {
  id: number
  slug: string | null
  description: string | null
  imagePath: string | null
  icon: string | null
  designer: string | null
}

type CatalogState = {
  facetsBySlug: Map<string, ExistingFacetRow>
  facetsById: Map<number, ExistingFacetRow>
  // lookupKey -> owning facet id. Updated as aliases are written this run so
  // later candidates in the same run see earlier ones, matching the
  // read-your-own-writes behavior the old per-candidate findUnique had.
  aliasOwner: Map<string, number>
}

// The seed previously re-read the DB per candidate/alias/character (a
// couple thousand serial round trips against a remote ProxySQL host with
// pipelining disabled), which is what pushed production builds past
// Vercel's max build time (see facet-catalog production incident,
// 2026-07-25 -- every build since the Facet catalog cutover landed timed
// out with BUILD_EXCEEDED_MAXIMUM_TIME). Loading the full existing state
// once up front turns those reads into two queries total.
async function loadCatalogState(): Promise<CatalogState> {
  const [facets, aliases] = await Promise.all([
    prisma.facet.findMany({
      select: {
        id: true,
        slug: true,
        description: true,
        imagePath: true,
        icon: true,
        designer: true,
      },
    }),
    prisma.facetAlias.findMany({ select: { lookupKey: true, facetId: true } }),
  ])

  return {
    facetsBySlug: new Map(
      facets
        .filter((facet): facet is ExistingFacetRow & { slug: string } =>
          Boolean(facet.slug),
        )
        .map((facet) => [facet.slug, facet]),
    ),
    facetsById: new Map(facets.map((facet) => [facet.id, facet])),
    aliasOwner: new Map(
      aliases.map((alias) => [alias.lookupKey, alias.facetId]),
    ),
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 'P2002',
  )
}

async function createOrRecoverFacet(
  candidate: Candidate,
  slug: string,
): Promise<ExistingFacetRow> {
  try {
    return await prisma.facet.create({
      data: {
        title: candidate.title,
        slug,
        kind: legacyKind(candidate.taxonomy),
        description: candidate.description,
        imagePath: candidate.imagePath,
        icon: candidate.icon,
        designer: 'facet-catalog',
        creationSource: 'HUMAN',
        userId: 1,
        isPublic: true,
        isMature: false,
        isActive: true,
      },
    })
  } catch (error) {
    // Two seed runs (e.g. back-to-back production deploys) can race on a
    // brand-new slug: loadCatalogState()'s up-front snapshot only reflects
    // whichever Facet rows existed when EACH run started, so both runs can
    // decide "this is new" and both call create(). The DB's unique
    // constraint on `slug` is the real arbiter -- the loser gets P2002, not
    // a corrupted catalog. Recover by reading the winner's row and updating
    // it instead of failing the whole seed (see the concurrent-seed-run
    // incident logged on runWithConcurrency above, 2026-07-25).
    if (!isUniqueConstraintError(error)) throw error
    const winner = await prisma.facet.findUnique({ where: { slug } })
    if (!winner) throw error
    return prisma.facet.update({
      where: { id: winner.id },
      data: {
        title: candidate.title,
        kind: legacyKind(candidate.taxonomy),
        description: candidate.description || winner.description,
        imagePath: candidate.imagePath || winner.imagePath,
        icon: candidate.icon || winner.icon,
        isActive: true,
      },
    })
  }
}

async function saveCandidate(
  candidate: Candidate,
  state: CatalogState,
): Promise<void> {
  const slug = slugify(candidate.title)
  const lookupKey = normalizeFacetLookupKey(slug)
  const existingFacetId = lookupKey
    ? state.aliasOwner.get(lookupKey)
    : undefined
  const existingFacet =
    (existingFacetId !== undefined
      ? state.facetsById.get(existingFacetId)
      : undefined) ?? state.facetsBySlug.get(slug)

  const facet = existingFacet
    ? await prisma.facet.update({
        where: { id: existingFacet.id },
        data: {
          title: candidate.title,
          slug,
          kind: legacyKind(candidate.taxonomy),
          description: candidate.description || existingFacet.description,
          imagePath: candidate.imagePath || existingFacet.imagePath,
          icon: candidate.icon || existingFacet.icon,
          designer: existingFacet.designer || 'facet-catalog',
          isActive: true,
        },
      })
    : await createOrRecoverFacet(candidate, slug)

  state.facetsBySlug.set(slug, facet)
  state.facetsById.set(facet.id, facet)

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
      artRequired: candidate.taxonomy !== 'COLOR',
      sourceRank: candidate.sourceRank,
      metadata: JSON.stringify(candidate.metadata),
    },
    update: {
      taxonomy: candidate.taxonomy,
      canonicalValue: candidate.canonicalValue,
      groupKey: candidate.groupKey,
      groupLabel: candidate.groupLabel,
      sortOrder: candidate.sortOrder,
      isRandomizable: true,
      artRequired: candidate.taxonomy !== 'COLOR',
      sourceRank: candidate.sourceRank,
      metadata: JSON.stringify(candidate.metadata),
    },
  })

  for (const alias of prepareUniqueFacetAliases([slug, ...candidate.aliases])) {
    const ownerId = state.aliasOwner.get(alias.lookupKey)
    if (ownerId !== undefined && ownerId !== facet.id) continue
    await prisma.facetAlias.upsert({
      where: { lookupKey: alias.lookupKey },
      create: {
        facetId: facet.id,
        alias: alias.alias,
        lookupKey: alias.lookupKey,
        isCanonical: alias.lookupKey === lookupKey,
        isActive: true,
      },
      update: {
        alias: alias.lookupKey === lookupKey ? slug : alias.alias,
        isCanonical: alias.lookupKey === lookupKey,
        isActive: true,
      },
    })
    state.aliasOwner.set(alias.lookupKey, facet.id)
  }
}

function splitLegacyValues(fieldKey: string, value: string): string[] {
  if (fieldKey !== 'quirks') return [value.trim()].filter(Boolean)
  return value
    .split(/\n---\n|\||\n|;/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

type CharacterFacetJob = {
  characterId: number
  facetId: number
  fieldKey: string
  sortOrder: number
}

async function backfillCharacterLinks(state: CatalogState): Promise<number> {
  const [characters, existingLinks] = await Promise.all([
    prisma.character.findMany({
      select: {
        id: true,
        species: true,
        class: true,
        alignment: true,
        personality: true,
        backstory: true,
        quirks: true,
        genre: true,
        role: true,
      },
    }),
    prisma.characterFacet.findMany({
      select: {
        characterId: true,
        facetId: true,
        fieldKey: true,
        sortOrder: true,
        source: true,
      },
    }),
  ])

  const existingLinkMap = new Map(
    existingLinks.map((link) => [
      `${link.characterId}:${link.facetId}:${link.fieldKey}`,
      link,
    ]),
  )

  const jobs: CharacterFacetJob[] = []

  for (const character of characters) {
    const fields: Array<[string, string | null]> = [
      ['species', character.species],
      ['class', character.class],
      ['alignment', character.alignment],
      ['personality', character.personality],
      ['backstory', character.backstory],
      ['quirks', character.quirks],
      ['genre', character.genre],
      ['role', character.role],
    ]

    for (const [fieldKey, rawValue] of fields) {
      if (!rawValue) continue
      const values = splitLegacyValues(fieldKey, rawValue)
      for (const [sortOrder, value] of values.entries()) {
        const lookupKey = normalizeFacetLookupKey(value)
        if (!lookupKey) continue
        const facetId = state.aliasOwner.get(lookupKey)
        if (facetId === undefined) continue
        jobs.push({ characterId: character.id, facetId, fieldKey, sortOrder })
      }
    }
  }

  let linked = 0

  await runWithConcurrency(jobs, WRITE_CONCURRENCY, async (job) => {
    const key = `${job.characterId}:${job.facetId}:${job.fieldKey}`
    const existing = existingLinkMap.get(key)
    // Already correct from a prior run -- skip the redundant round trip.
    if (
      existing &&
      existing.sortOrder === job.sortOrder &&
      existing.source === 'MIGRATED'
    ) {
      linked++
      return
    }

    await prisma.characterFacet.upsert({
      where: {
        characterId_facetId_fieldKey: {
          characterId: job.characterId,
          facetId: job.facetId,
          fieldKey: job.fieldKey,
        },
      },
      create: {
        characterId: job.characterId,
        facetId: job.facetId,
        fieldKey: job.fieldKey,
        sortOrder: job.sortOrder,
        source: 'MIGRATED',
      },
      update: { sortOrder: job.sortOrder, source: 'MIGRATED' },
    })
    linked++
  })

  return linked
}

async function main(): Promise<void> {
  collectAdventureBuilder()
  collectAnimals()
  collectArtPresets()
  collectLegacyLists()

  const catalog = Array.from(candidates.values()).sort((a, b) =>
    a.taxonomy === b.taxonomy
      ? a.sortOrder === b.sortOrder
        ? a.title.localeCompare(b.title)
        : a.sortOrder - b.sortOrder
      : a.taxonomy.localeCompare(b.taxonomy),
  )
  const byTaxonomy = catalog.reduce<Record<string, number>>(
    (counts, candidate) => {
      counts[candidate.taxonomy] = (counts[candidate.taxonomy] ?? 0) + 1
      return counts
    },
    {},
  )

  if (!apply) {
    process.stdout.write(
      `${JSON.stringify(
        {
          mode: 'dry-run',
          candidates: catalog.length,
          byTaxonomy,
          missingRequiredArt: catalog.filter(
            (candidate) =>
              candidate.taxonomy !== 'COLOR' && !candidate.imagePath,
          ).length,
          note: 'Run with --apply after prisma migrate deploy.',
        },
        null,
        2,
      )}\n`,
    )
    return
  }

  const state = await loadCatalogState()
  await runWithKeyedConcurrency(
    catalog,
    WRITE_CONCURRENCY,
    (candidate) => slugify(candidate.title),
    (candidate) => saveCandidate(candidate, state),
  )
  const characterLinks = await backfillCharacterLinks(state)

  process.stdout.write(
    `${JSON.stringify(
      {
        mode: 'apply',
        candidates: catalog.length,
        saved: catalog.length,
        characterLinks,
        byTaxonomy,
      },
      null,
      2,
    )}\n`,
  )
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
