// /utils/scripts/qualifyFacetDisplayNames.ts
import 'dotenv/config'
import {
  PrismaClient,
  type FacetTaxonomy,
} from './../../prisma/generated/prisma/client'
import { createDatabaseAdapter } from './../../server/utils/databaseAdapterConfig'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

const prisma = new PrismaClient({ adapter: createDatabaseAdapter(databaseUrl) })
const apply = process.argv.includes('--apply')
const BATCH_ID = '2026-08-01-display-qualification-09'

type JsonObject = Record<string, unknown>

type QualificationDefinition = {
  slug: string
  expectedTaxonomy: FacetTaxonomy
  title: string
  family:
    | 'punk-aesthetic'
    | 'art-mood'
    | 'personality'
    | 'bot-type'
    | 'dream-type'
  note: string
}

const QUALIFICATIONS: readonly QualificationDefinition[] = [
  {
    slug: 'art-punk-biopunk',
    expectedTaxonomy: 'STYLE',
    title: 'Biopunk Aesthetic',
    family: 'punk-aesthetic',
    note: 'Distinguishes the visual STYLE from the Biopunk narrative GENRE.',
  },
  {
    slug: 'art-punk-dieselpunk',
    expectedTaxonomy: 'STYLE',
    title: 'Dieselpunk Aesthetic',
    family: 'punk-aesthetic',
    note: 'Distinguishes the visual STYLE from the Dieselpunk narrative GENRE.',
  },
  {
    slug: 'art-punk-mythpunk',
    expectedTaxonomy: 'STYLE',
    title: 'Mythpunk Aesthetic',
    family: 'punk-aesthetic',
    note: 'Distinguishes the visual STYLE from the Mythpunk narrative GENRE.',
  },
  {
    slug: 'art-punk-nanopunk',
    expectedTaxonomy: 'STYLE',
    title: 'Nanopunk Aesthetic',
    family: 'punk-aesthetic',
    note: 'Distinguishes the visual STYLE from the Nanopunk narrative GENRE.',
  },
  {
    slug: 'art-punk-solarpunk',
    expectedTaxonomy: 'STYLE',
    title: 'Solarpunk Aesthetic',
    family: 'punk-aesthetic',
    note: 'Distinguishes the visual STYLE from the Solarpunk narrative GENRE.',
  },
  {
    slug: 'art-punk-steampunk',
    expectedTaxonomy: 'STYLE',
    title: 'Steampunk Aesthetic',
    family: 'punk-aesthetic',
    note: 'Distinguishes the visual STYLE from the Steampunk narrative GENRE.',
  },
  {
    slug: 'art-art-mood-dreamy',
    expectedTaxonomy: 'MOOD',
    title: 'Dreamy Art Mood',
    family: 'art-mood',
    note: 'Distinguishes the art-builder MOOD from the Dreamy PERSONALITY.',
  },
  {
    slug: 'art-art-mood-epic',
    expectedTaxonomy: 'MOOD',
    title: 'Epic Art Mood',
    family: 'art-mood',
    note: 'Distinguishes the art-builder MOOD from the Epic RARITY.',
  },
  {
    slug: 'art-art-mood-melancholy',
    expectedTaxonomy: 'MOOD',
    title: 'Melancholy Art Mood',
    family: 'art-mood',
    note: 'Distinguishes the art-builder MOOD from the Melancholy PERSONALITY.',
  },
  {
    slug: 'art-art-mood-serene',
    expectedTaxonomy: 'MOOD',
    title: 'Serene Art Mood',
    family: 'art-mood',
    note: 'Distinguishes the art-builder MOOD from the Serene PERSONALITY.',
  },
  {
    slug: 'art-art-mood-whimsical',
    expectedTaxonomy: 'MOOD',
    title: 'Whimsical Art Mood',
    family: 'art-mood',
    note:
      'Distinguishes the art-builder MOOD from the Whimsical PERSONALITY and the general Whimsical Tone recipe component.',
  },
  {
    slug: 'personality-loyal',
    expectedTaxonomy: 'PERSONALITY',
    title: 'Loyal Personality',
    family: 'personality',
    note: 'Distinguishes temperament from the art-backed Loyal ALIGNMENT.',
  },
  {
    slug: 'bot-type-narrator',
    expectedTaxonomy: 'BOT_TYPE',
    title: 'Narrator Bot Type',
    family: 'bot-type',
    note: 'Qualifies the legacy BotType structural option.',
  },
  {
    slug: 'dream-type-narrator',
    expectedTaxonomy: 'DREAM_TYPE',
    title: 'Narrator Dream Type',
    family: 'dream-type',
    note: 'Qualifies the DreamType structural option.',
  },
  {
    slug: 'bot-type-promptbot',
    expectedTaxonomy: 'BOT_TYPE',
    title: 'Prompt Bot Type',
    family: 'bot-type',
    note: 'Qualifies the legacy BotType structural option.',
  },
  {
    slug: 'dream-type-promptbot',
    expectedTaxonomy: 'DREAM_TYPE',
    title: 'Prompt Bot Dream Type',
    family: 'dream-type',
    note: 'Qualifies the DreamType structural option.',
  },
]

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

function qualifiedMetadata(options: {
  previous: string | null | undefined
  definition: QualificationDefinition
  previousTitle: string
  artBacked: boolean
}): string {
  const metadata = parseMetadata(options.previous)
  const history = Array.isArray(metadata.catalogCurationHistory)
    ? metadata.catalogCurationHistory.filter(
        (entry) =>
          !(
            entry &&
            typeof entry === 'object' &&
            'batchId' in entry &&
            entry.batchId === BATCH_ID
          ),
      )
    : []

  return JSON.stringify({
    ...metadata,
    displayQualification: {
      family: options.definition.family,
      qualifiedTitle: options.definition.title,
      unqualifiedTitle: options.previousTitle,
      canonicalValuePreserved: true,
      aliasesPreserved: true,
    },
    catalogCurationHistory: [
      ...history,
      {
        batchId: BATCH_ID,
        action: 'qualify-cross-taxonomy-display-name',
        previousTitle: options.previousTitle,
        title: options.definition.title,
        taxonomy: options.definition.expectedTaxonomy,
        artBacked: options.artBacked,
        note: options.definition.note,
      },
    ],
  })
}

async function main(): Promise<void> {
  const slugs = QUALIFICATIONS.map((definition) => definition.slug)
  const facets = await prisma.facet.findMany({
    where: { slug: { in: slugs }, isActive: true },
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
      icon: true,
      artImageId: true,
      artCollectionId: true,
    },
  })
  const bySlug = new Map(
    facets
      .filter((facet): facet is typeof facet & { slug: string } => Boolean(facet.slug))
      .map((facet) => [facet.slug, facet]),
  )
  const facetIds = facets.map((facet) => facet.id)
  const [profiles, artImageLinks, artCollectionLinks, titleConflicts] =
    await Promise.all([
      prisma.facetProfile.findMany({
        where: { facetId: { in: facetIds } },
        select: {
          facetId: true,
          taxonomy: true,
          canonicalValue: true,
          metadata: true,
        },
      }),
      prisma.facetArtImage.findMany({
        where: { facetId: { in: facetIds } },
        select: { facetId: true },
      }),
      prisma.facetArtCollection.findMany({
        where: { facetId: { in: facetIds } },
        select: { facetId: true },
      }),
      prisma.facet.findMany({
        where: {
          title: { in: QUALIFICATIONS.map((definition) => definition.title) },
          isActive: true,
        },
        select: { id: true, title: true, slug: true },
      }),
    ])

  const profileByFacet = new Map(profiles.map((profile) => [profile.facetId, profile]))
  const joinedArtIds = new Set([
    ...artImageLinks.map((link) => link.facetId),
    ...artCollectionLinks.map((link) => link.facetId),
  ])
  const conflictsByTitle = new Map(
    titleConflicts.map((facet) => [facet.title, facet]),
  )

  const reports = []
  const operations = []

  for (const definition of QUALIFICATIONS) {
    const facet = bySlug.get(definition.slug)
    if (!facet) {
      reports.push({
        slug: definition.slug,
        title: definition.title,
        action: 'missing',
      })
      continue
    }

    const profile = profileByFacet.get(facet.id)
    if (!profile || profile.taxonomy !== definition.expectedTaxonomy) {
      reports.push({
        slug: definition.slug,
        facetId: facet.id,
        previousTitle: facet.title,
        title: definition.title,
        action: 'taxonomy-mismatch',
        expectedTaxonomy: definition.expectedTaxonomy,
        actualTaxonomy: profile?.taxonomy ?? null,
      })
      continue
    }

    const conflict = conflictsByTitle.get(definition.title)
    if (conflict && conflict.id !== facet.id) {
      throw new Error(
        `Cannot qualify ${definition.slug} as ${definition.title}; active Facet ${conflict.id} (${conflict.slug}) already uses that title.`,
      )
    }

    const artBacked = Boolean(
      facet.imagePath ||
        facet.cardPath ||
        facet.heroPath ||
        facet.icon ||
        facet.artImageId !== null ||
        facet.artCollectionId !== null ||
        joinedArtIds.has(facet.id),
    )

    reports.push({
      slug: definition.slug,
      facetId: facet.id,
      previousTitle: facet.title,
      title: definition.title,
      taxonomy: profile.taxonomy,
      canonicalValue: profile.canonicalValue,
      artBacked,
      action:
        facet.title === definition.title
          ? 'already-qualified'
          : apply
            ? 'qualified'
            : 'would-qualify',
    })

    if (apply && facet.title !== definition.title) {
      operations.push(
        prisma.facet.update({
          where: { id: facet.id },
          data: { title: definition.title },
        }),
        prisma.facetProfile.update({
          where: { facetId: facet.id },
          data: {
            metadata: qualifiedMetadata({
              previous: profile.metadata,
              definition,
              previousTitle: facet.title,
              artBacked,
            }),
          },
        }),
      )
    }
  }

  if (apply && operations.length) {
    await prisma.$transaction(operations)
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        mode: apply ? 'apply' : 'dry-run',
        batchId: BATCH_ID,
        qualifications: reports,
        summary: {
          expected: QUALIFICATIONS.length,
          found: facets.length,
          qualified: reports.filter((report) => report.action === 'qualified').length,
          alreadyQualified: reports.filter(
            (report) => report.action === 'already-qualified',
          ).length,
          missing: reports
            .filter((report) => report.action === 'missing')
            .map((report) => report.slug),
          taxonomyMismatches: reports
            .filter((report) => report.action === 'taxonomy-mismatch')
            .map((report) => report.slug),
        },
        policy:
          'Only display titles change. Stable ids, slugs, aliases, canonical values, structural enum metadata, builder values, prose, prompts, direct artwork, and joined artwork remain untouched.',
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
