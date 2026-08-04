// /utils/scripts/curateFacetTaxonomyLeaks.ts
import 'dotenv/config'
import {
  PrismaClient,
  type FacetKind,
  type FacetTaxonomy,
} from './../../prisma/generated/prisma/client'
import { createDatabaseAdapter } from './../../server/utils/databaseAdapterConfig'
import { normalizeFacetLookupKey } from './../facetAliases'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

const prisma = new PrismaClient({
  adapter: createDatabaseAdapter(databaseUrl),
})
const apply = process.argv.includes('--apply')
const BATCH_ID = '2026-08-01-taxonomy-leaks-05'
const CURATION_SOURCE_RANK = 1

type JsonObject = Record<string, unknown>

type FacetRow = {
  id: number
  title: string
  slug: string | null
  description: string | null
  imagePath: string | null
  cardPath: string | null
  heroPath: string | null
  iconPath: string | null
  icon: string | null
  artImageId: number | null
  artCollectionId: number | null
}

type ProfileRow = {
  taxonomy: FacetTaxonomy
  canonicalValue: string | null
  groupKey: string | null
  groupLabel: string | null
  sortOrder: number
  isRandomizable: boolean
  randomWeight: number
  artRequired: boolean
  sourceRank: number
  metadata: string | null
}

type TransformDefinition = {
  lookup: readonly string[]
  taxonomy: FacetTaxonomy
  groupKey: string
  groupLabel: string
  randomWeight: number
  note: string
}

type SuppressDefinition = {
  lookup: readonly string[]
  note: string
}

type EnsureDefinition = {
  slug: string
  title: string
  taxonomy: FacetTaxonomy
  groupKey: string
  groupLabel: string
  randomWeight: number
}

const TRANSFORMS: readonly TransformDefinition[] = [
  {
    lookup: ['Creative Writer', 'creative-writer'],
    taxonomy: 'OCCUPATION',
    groupKey: 'occupation',
    groupLabel: 'Occupations',
    randomWeight: 1,
    note: 'An occupation and creative practice, not a personality trait.',
  },
  {
    lookup: ["Believes They're Psychic", 'believes-they-re-psychic'],
    taxonomy: 'QUIRK',
    groupKey: 'quirk',
    groupLabel: 'Quirks',
    randomWeight: 1,
    note: 'A belief-shaped character quirk, not a personality trait.',
  },
  {
    lookup: ['Animist', 'animist'],
    taxonomy: 'THEME',
    groupKey: 'worldview',
    groupLabel: 'Worldviews',
    randomWeight: 0.75,
    note: 'A worldview and relationship to the living world, not a temperament.',
  },
  {
    lookup: [
      'Can only sleep standing up, and only on moving trains.',
      'can-only-sleep-standing-up-and-only-on-moving-trains',
    ],
    taxonomy: 'QUIRK',
    groupKey: 'quirk',
    groupLabel: 'Quirks',
    randomWeight: 0.5,
    note: 'A highly specific behavioral quirk rather than prior history.',
  },
  {
    lookup: [
      'Cursed to speak only in riddles… but only on Tuesdays.',
      'cursed-to-speak-only-in-riddles-but-only-on-tuesdays',
    ],
    taxonomy: 'QUIRK',
    groupKey: 'quirk',
    groupLabel: 'Quirks',
    randomWeight: 0.5,
    note: 'An ongoing speech constraint rather than prior history.',
  },
]

const SUPPRESS: readonly SuppressDefinition[] = [
  {
    lookup: ['4k render', '4k-render'],
    note: 'Resolution cargo-cult wording adds no reliable creative direction.',
  },
  {
    lookup: ['award-winning'],
    note: 'Quality-claim wording is not a useful randomized creative control.',
  },
  {
    lookup: ['award-winning concept art', 'award-winning-concept-art'],
    note: 'Quality-claim wording is not a useful randomized creative control.',
  },
  {
    lookup: ['Ambiguous', 'ambiguous'],
    note: 'Too underspecified to provide a dependable personality instruction.',
  },
]

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

function parseMetadata(value: string | null | undefined): JsonObject {
  if (!value) return {}
  try {
    const parsed: unknown = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as JsonObject)
      : {}
  } catch {
    return {}
  }
}

function curatedMetadata(options: {
  previous: string | null | undefined
  action: 'taxonomy-repair' | 'suppress-low-value' | 'decompose-recipe'
  title: string
  previousTaxonomy?: FacetTaxonomy | null
  taxonomy?: FacetTaxonomy
  artBacked: boolean
  note: string
}): string {
  const metadata = parseMetadata(options.previous)
  const history = Array.isArray(metadata.catalogCurationHistory)
    ? metadata.catalogCurationHistory.filter(
        (entry) =>
          !(
            entry &&
            typeof entry === 'object' &&
            'batchId' in entry &&
            entry.batchId === BATCH_ID &&
            'action' in entry &&
            entry.action === options.action
          ),
      )
    : []

  return JSON.stringify({
    ...metadata,
    catalogCurationHistory: [
      ...history,
      {
        batchId: BATCH_ID,
        action: options.action,
        title: options.title,
        previousTaxonomy: options.previousTaxonomy,
        taxonomy: options.taxonomy,
        artBacked: options.artBacked,
        note: options.note,
      },
    ],
  })
}

async function findFacet(lookups: readonly string[]): Promise<FacetRow | null> {
  for (const lookup of lookups) {
    const bySlug = await prisma.facet.findUnique({
      where: { slug: slugify(lookup) },
    })
    if (bySlug) return bySlug

    const lookupKey = normalizeFacetLookupKey(lookup)
    if (!lookupKey) continue
    const alias = await prisma.facetAlias.findUnique({
      where: { lookupKey },
      select: { facetId: true },
    })
    if (!alias) continue

    const aliased = await prisma.facet.findUnique({
      where: { id: alias.facetId },
    })
    if (aliased) return aliased
  }
  return null
}

async function getProfile(facetId: number): Promise<ProfileRow | null> {
  return prisma.facetProfile.findUnique({ where: { facetId } })
}

async function hasArtwork(facet: FacetRow): Promise<boolean> {
  if (
    facet.imagePath ||
    facet.cardPath ||
    facet.heroPath ||
    facet.iconPath ||
    facet.icon ||
    facet.artImageId !== null ||
    facet.artCollectionId !== null
  ) {
    return true
  }

  const [imageLinks, collectionLinks] = await Promise.all([
    prisma.facetArtImage.count({ where: { facetId: facet.id } }),
    prisma.facetArtCollection.count({ where: { facetId: facet.id } }),
  ])
  return imageLinks > 0 || collectionLinks > 0
}

async function writeProfile(options: {
  facet: FacetRow
  profile: ProfileRow | null
  taxonomy: FacetTaxonomy
  groupKey: string | null
  groupLabel: string | null
  isRandomizable: boolean
  randomWeight: number
  artBacked: boolean
  action: 'taxonomy-repair' | 'suppress-low-value' | 'decompose-recipe'
  note: string
}): Promise<void> {
  const metadata = curatedMetadata({
    previous: options.profile?.metadata,
    action: options.action,
    title: options.facet.title,
    previousTaxonomy: options.profile?.taxonomy,
    taxonomy: options.taxonomy,
    artBacked: options.artBacked,
    note: options.note,
  })

  await prisma.facetProfile.upsert({
    where: { facetId: options.facet.id },
    create: {
      facetId: options.facet.id,
      taxonomy: options.taxonomy,
      canonicalValue: options.facet.title,
      groupKey: options.groupKey,
      groupLabel: options.groupLabel,
      sortOrder: options.profile?.sortOrder ?? 0,
      isRandomizable: options.isRandomizable,
      randomWeight: options.randomWeight,
      artRequired: options.profile?.artRequired ?? options.artBacked,
      sourceRank: CURATION_SOURCE_RANK,
      metadata,
    },
    update: {
      taxonomy: options.taxonomy,
      canonicalValue: options.facet.title,
      groupKey: options.groupKey,
      groupLabel: options.groupLabel,
      isRandomizable: options.isRandomizable,
      randomWeight: options.randomWeight,
      sourceRank: CURATION_SOURCE_RANK,
      metadata,
    },
  })
}

async function transformFacet(
  definition: TransformDefinition,
): Promise<object> {
  const facet = await findFacet(definition.lookup)
  if (!facet) return { lookup: definition.lookup, action: 'missing' }

  const [profile, artBacked] = await Promise.all([
    getProfile(facet.id),
    hasArtwork(facet),
  ])

  if (apply) {
    await prisma.facet.update({
      where: { id: facet.id },
      data: { isActive: true },
    })
    await writeProfile({
      facet,
      profile,
      taxonomy: definition.taxonomy,
      groupKey: definition.groupKey,
      groupLabel: definition.groupLabel,
      isRandomizable: true,
      randomWeight: definition.randomWeight,
      artBacked,
      action: 'taxonomy-repair',
      note: definition.note,
    })
  }

  return {
    facetId: facet.id,
    title: facet.title,
    action: apply ? 'transformed' : 'would-transform',
    previousTaxonomy: profile?.taxonomy ?? null,
    taxonomy: definition.taxonomy,
    artBacked,
    randomWeight: definition.randomWeight,
  }
}

async function suppressFacet(definition: SuppressDefinition): Promise<object> {
  const facet = await findFacet(definition.lookup)
  if (!facet) return { lookup: definition.lookup, action: 'missing' }

  const [profile, artBacked] = await Promise.all([
    getProfile(facet.id),
    hasArtwork(facet),
  ])
  const taxonomy = profile?.taxonomy ?? 'OTHER'

  if (apply) {
    await writeProfile({
      facet,
      profile,
      taxonomy,
      groupKey: profile?.groupKey ?? null,
      groupLabel: profile?.groupLabel ?? null,
      isRandomizable: false,
      randomWeight: 0,
      artBacked,
      action: 'suppress-low-value',
      note: definition.note,
    })
  }

  return {
    facetId: facet.id,
    title: facet.title,
    action: apply ? 'suppressed-from-random' : 'would-suppress-from-random',
    taxonomy,
    artBacked,
  }
}

async function ensureExactFacet(
  definition: EnsureDefinition,
): Promise<FacetRow | null> {
  let facet = await prisma.facet.findUnique({
    where: { slug: definition.slug },
  })
  if (!facet && !apply) return null

  if (!facet) {
    facet = await prisma.facet.create({
      data: {
        title: definition.title,
        slug: definition.slug,
        designer: 'facet-curation',
        creationSource: 'HUMAN',
        userId: 1,
        isPublic: true,
        isMature: false,
        isActive: true,
      },
    })
  }

  const [profile, artBacked] = await Promise.all([
    getProfile(facet.id),
    hasArtwork(facet),
  ])
  if (apply) {
    await prisma.facet.update({
      where: { id: facet.id },
      data: {
        title: definition.title,
        isActive: true,
      },
    })
    await writeProfile({
      facet: { ...facet, title: definition.title },
      profile,
      taxonomy: definition.taxonomy,
      groupKey: definition.groupKey,
      groupLabel: definition.groupLabel,
      isRandomizable: true,
      randomWeight: definition.randomWeight,
      artBacked,
      action: 'taxonomy-repair',
      note: 'Reusable component created for a decomposed genre recipe.',
    })
  }

  return { ...facet, title: definition.title }
}

async function decomposeWhimsicalStew(): Promise<object> {
  const recipe = await findFacet(['Whimsical Stew', 'whimsical-stew'])
  if (!recipe) return { title: 'Whimsical Stew', action: 'missing' }

  const [profile, artBacked] = await Promise.all([
    getProfile(recipe.id),
    hasArtwork(recipe),
  ])
  const whimsicalTone = await ensureExactFacet({
    slug: 'whimsical-tone',
    title: 'Whimsical Tone',
    taxonomy: 'MOOD',
    groupKey: 'mood',
    groupLabel: 'Moods',
    randomWeight: 1,
  })
  const culinaryFantasy = await ensureExactFacet({
    slug: 'culinary-fantasy',
    title: 'Culinary Fantasy',
    taxonomy: 'GENRE',
    groupKey: 'curated-genre',
    groupLabel: 'Curated Genres',
    randomWeight: 1.5,
  })

  if (apply) {
    await prisma.facet.update({
      where: { id: recipe.id },
      data: { isActive: true },
    })
    await writeProfile({
      facet: recipe,
      profile,
      taxonomy: 'THEME',
      groupKey: 'genre-recipe',
      groupLabel: 'Genre Recipes',
      isRandomizable: false,
      randomWeight: 0,
      artBacked,
      action: 'decompose-recipe',
      note: 'Decomposed into reusable Whimsical Tone mood and Culinary Fantasy genre.',
    })

    for (const target of [whimsicalTone, culinaryFantasy]) {
      if (!target || target.id === recipe.id) continue
      await prisma.facetRelation.upsert({
        where: {
          fromFacetId_toFacetId_relationType: {
            fromFacetId: recipe.id,
            toFacetId: target.id,
            relationType: 'CONTAINS',
          },
        },
        create: {
          fromFacetId: recipe.id,
          toFacetId: target.id,
          relationType: 'CONTAINS',
          note: `Reusable component of the former composite genre. Curated by ${BATCH_ID}.`,
        },
        update: {
          note: `Reusable component of the former composite genre. Curated by ${BATCH_ID}.`,
        },
      })
    }
  }

  return {
    facetId: recipe.id,
    title: recipe.title,
    action: apply ? 'decomposed' : 'would-decompose',
    artBacked,
    components: ['Whimsical Tone', 'Culinary Fantasy'],
  }
}

async function main(): Promise<void> {
  const transformed = []
  for (const definition of TRANSFORMS) {
    transformed.push(await transformFacet(definition))
  }

  const suppressed = []
  for (const definition of SUPPRESS) {
    suppressed.push(await suppressFacet(definition))
  }

  const whimsicalStew = await decomposeWhimsicalStew()

  process.stdout.write(
    `${JSON.stringify(
      {
        mode: apply ? 'apply' : 'dry-run',
        batchId: BATCH_ID,
        transformed,
        suppressed,
        whimsicalStew,
        artPolicy:
          'Taxonomy repairs preserve stable Facet rows, titles, prose, prompt fields, and all direct or joined artwork. Low-value controls remain manually available but leave random selection.',
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
