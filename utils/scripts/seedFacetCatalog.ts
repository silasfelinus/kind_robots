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

async function saveCandidate(candidate: Candidate): Promise<void> {
  const slug = slugify(candidate.title)
  const lookupKey = normalizeFacetLookupKey(slug)
  const existingAlias = lookupKey
    ? await prisma.facetAlias.findUnique({ where: { lookupKey } })
    : null
  const existingFacet = existingAlias
    ? await prisma.facet.findUnique({ where: { id: existingAlias.facetId } })
    : await prisma.facet.findUnique({ where: { slug } })

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
    : await prisma.facet.create({
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
    const existing = await prisma.facetAlias.findUnique({
      where: { lookupKey: alias.lookupKey },
    })
    if (existing && existing.facetId !== facet.id) continue
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
  }
}

function splitLegacyValues(fieldKey: string, value: string): string[] {
  if (fieldKey !== 'quirks') return [value.trim()].filter(Boolean)
  return value
    .split(/\n---\n|\||\n|;/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

async function backfillCharacterLinks(): Promise<number> {
  const characters = await prisma.character.findMany({
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
  })
  let linked = 0

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
        const alias = await prisma.facetAlias.findUnique({ where: { lookupKey } })
        if (!alias) continue
        await prisma.characterFacet.upsert({
          where: {
            characterId_facetId_fieldKey: {
              characterId: character.id,
              facetId: alias.facetId,
              fieldKey,
            },
          },
          create: {
            characterId: character.id,
            facetId: alias.facetId,
            fieldKey,
            sortOrder,
            source: 'MIGRATED',
          },
          update: { sortOrder, source: 'MIGRATED' },
        })
        linked++
      }
    }
  }

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
            (candidate) => candidate.taxonomy !== 'COLOR' && !candidate.imagePath,
          ).length,
          note: 'Run with --apply after prisma migrate deploy.',
        },
        null,
        2,
      )}\n`,
    )
    return
  }

  for (const candidate of catalog) await saveCandidate(candidate)
  const characterLinks = await backfillCharacterLinks()

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
