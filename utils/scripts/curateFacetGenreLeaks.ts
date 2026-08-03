// /utils/scripts/curateFacetGenreLeaks.ts
import 'dotenv/config'
import {
  PrismaClient,
  type FacetKind,
  type FacetTaxonomy,
} from './../../prisma/generated/prisma/client'
import { createDatabaseAdapter } from './../../server/utils/databaseAdapterConfig'
import { legacyFacetKindForTaxonomy } from './../../server/utils/facetProfileInput'
import { normalizeFacetLookupKey } from './../facetAliases'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

const prisma = new PrismaClient({
  adapter: createDatabaseAdapter(databaseUrl),
})
const apply = process.argv.includes('--apply')
const BATCH_ID = '2026-08-01-genre-leaks-06'
const CURATION_SOURCE_RANK = 1

type JsonObject = Record<string, unknown>

type FacetRow = {
  id: number
  title: string
  slug: string | null
  kind: FacetKind
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

type EnsureDefinition = {
  slug: string
  title: string
  taxonomy: FacetTaxonomy
  groupKey: string
  groupLabel: string
  randomWeight: number
  description: string
}

type RecipeDefinition = {
  lookup: readonly string[]
  components: readonly string[]
  note: string
}

const COMPONENTS: readonly EnsureDefinition[] = [
  {
    slug: 'aerial-world',
    title: 'Aerial World',
    taxonomy: 'SETTING',
    groupKey: 'curated-setting',
    groupLabel: 'Curated Settings',
    randomWeight: 1,
    description:
      'A world organized around open sky, floating settlements, airborne travel, and the hazards and freedoms of life above the ground.',
  },
  {
    slug: 'nomadic-culture',
    title: 'Nomadic Culture',
    taxonomy: 'THEME',
    groupKey: 'culture-theme',
    groupLabel: 'Culture Themes',
    randomWeight: 1,
    description:
      'Communities shaped by movement, seasonal routes, portable traditions, changing borders, and belonging carried through people rather than fixed territory.',
  },
  {
    slug: 'political-drama',
    title: 'Political Drama',
    taxonomy: 'GENRE',
    groupKey: 'curated-genre',
    groupLabel: 'Curated Genres',
    randomWeight: 1.5,
    description:
      'Drama driven by institutions, power, public responsibility, private compromise, coalition, succession, policy, and the human cost of governance.',
  },
  {
    slug: 'candlelit-intimacy',
    title: 'Candlelit Intimacy',
    taxonomy: 'MOOD',
    groupKey: 'mood',
    groupLabel: 'Moods',
    randomWeight: 1,
    description:
      'A close, low-lit emotional register built from quiet rooms, private conversation, fragile trust, and decisions made beyond the public stage.',
  },
]

const RECIPES: readonly RecipeDefinition[] = [
  {
    lookup: ['Sky Nomad', 'sky-nomad'],
    components: ['aerial-world', 'nomadic-culture'],
    note: 'Decomposed into a reusable setting and cultural theme.',
  },
  {
    lookup: [
      'Political Candlelight Drama',
      'political-candlelight-drama',
    ],
    components: ['political-drama', 'candlelit-intimacy'],
    note: 'Decomposed into a reusable political genre and intimate mood.',
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
  action: 'subject-theme' | 'decompose-genre-hybrid' | 'ensure-component'
  title: string
  previousTaxonomy?: FacetTaxonomy | null
  taxonomy: FacetTaxonomy
  artBacked: boolean
  note: string
  components?: readonly string[]
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
        components: options.components,
      },
    ],
  })
}

async function findFacet(lookups: readonly string[]): Promise<FacetRow | null> {
  for (const lookup of lookups) {
    const direct = await prisma.facet.findUnique({
      where: { slug: slugify(lookup) },
    })
    if (direct) return direct

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

async function profileFor(facetId: number): Promise<ProfileRow | null> {
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
  groupKey: string
  groupLabel: string
  isRandomizable: boolean
  randomWeight: number
  artBacked: boolean
  action: 'subject-theme' | 'decompose-genre-hybrid' | 'ensure-component'
  note: string
  components?: readonly string[]
}): Promise<void> {
  const metadata = curatedMetadata({
    previous: options.profile?.metadata,
    action: options.action,
    title: options.facet.title,
    previousTaxonomy: options.profile?.taxonomy,
    taxonomy: options.taxonomy,
    artBacked: options.artBacked,
    note: options.note,
    components: options.components,
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

async function moveSubjectTheme(options: {
  lookups: readonly string[]
  groupKey: string
  groupLabel: string
  randomWeight: number
  note: string
}): Promise<object> {
  const facet = await findFacet(options.lookups)
  if (!facet) return { lookup: options.lookups, action: 'missing' }
  const [profile, artBacked] = await Promise.all([
    profileFor(facet.id),
    hasArtwork(facet),
  ])

  if (apply) {
    await prisma.facet.update({
      where: { id: facet.id },
      data: { kind: 'THEME', isActive: true },
    })
    await writeProfile({
      facet,
      profile,
      taxonomy: 'THEME',
      groupKey: options.groupKey,
      groupLabel: options.groupLabel,
      isRandomizable: true,
      randomWeight: options.randomWeight,
      artBacked,
      action: 'subject-theme',
      note: options.note,
    })
  }

  return {
    facetId: facet.id,
    title: facet.title,
    action: apply ? 'moved-to-theme' : 'would-move-to-theme',
    previousTaxonomy: profile?.taxonomy ?? null,
    artBacked,
  }
}

async function ensureComponent(definition: EnsureDefinition): Promise<FacetRow | null> {
  let facet = await prisma.facet.findUnique({ where: { slug: definition.slug } })
  if (!facet && !apply) return null

  if (!facet) {
    facet = await prisma.facet.create({
      data: {
        title: definition.title,
        slug: definition.slug,
        kind: legacyFacetKindForTaxonomy(definition.taxonomy),
        description: definition.description,
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
    profileFor(facet.id),
    hasArtwork(facet),
  ])
  if (apply) {
    await prisma.facet.update({
      where: { id: facet.id },
      data: {
        title: definition.title,
        kind: legacyFacetKindForTaxonomy(definition.taxonomy),
        description: facet.description || definition.description,
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
      action: 'ensure-component',
      note: 'Reusable component created for a decomposed genre hybrid.',
    })
  }
  return { ...facet, title: definition.title }
}

async function decomposeRecipe(
  definition: RecipeDefinition,
  components: Map<string, FacetRow>,
): Promise<object> {
  const recipe = await findFacet(definition.lookup)
  if (!recipe) return { lookup: definition.lookup, action: 'missing' }
  const [profile, artBacked] = await Promise.all([
    profileFor(recipe.id),
    hasArtwork(recipe),
  ])
  const targets = definition.components
    .map((slug) => components.get(slug))
    .filter((facet): facet is FacetRow => Boolean(facet))

  if (apply) {
    await prisma.facet.update({
      where: { id: recipe.id },
      data: { kind: 'THEME', isActive: true },
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
      action: 'decompose-genre-hybrid',
      note: definition.note,
      components: definition.components,
    })

    for (const target of targets) {
      if (target.id === recipe.id) continue
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
          note: `${definition.note} Curated by ${BATCH_ID}.`,
        },
        update: {
          note: `${definition.note} Curated by ${BATCH_ID}.`,
        },
      })
    }
  }

  return {
    facetId: recipe.id,
    title: recipe.title,
    action: apply ? 'decomposed' : 'would-decompose',
    artBacked,
    components: targets.map((target) => target.title),
  }
}

async function main(): Promise<void> {
  const subjectThemes = [
    await moveSubjectTheme({
      lookups: ['Artificial Intelligence', 'artificial-intelligence'],
      groupKey: 'subject-theme',
      groupLabel: 'Subject Themes',
      randomWeight: 0.75,
      note: 'A narrative subject and world premise, not a genre form.',
    }),
    await moveSubjectTheme({
      lookups: ['Animal Protagonists', 'animal-protagonists'],
      groupKey: 'cast-theme',
      groupLabel: 'Cast Themes',
      randomWeight: 0.75,
      note: 'A cast and point-of-view constraint, not a genre form.',
    }),
  ]

  const components = new Map<string, FacetRow>()
  for (const definition of COMPONENTS) {
    const facet = await ensureComponent(definition)
    if (facet) components.set(definition.slug, facet)
  }

  const recipes = []
  for (const definition of RECIPES) {
    recipes.push(await decomposeRecipe(definition, components))
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        mode: apply ? 'apply' : 'dry-run',
        batchId: BATCH_ID,
        subjectThemes,
        recipes,
        artPolicy:
          'Art-backed subject and cast Facets keep their stable rows, titles, prose, prompts, image paths, and joined artwork. Genre hybrids are decomposed only after artwork detection.',
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
