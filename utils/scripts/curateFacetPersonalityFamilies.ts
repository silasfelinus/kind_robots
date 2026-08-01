// /utils/scripts/curateFacetPersonalityFamilies.ts
import 'dotenv/config'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import { createDatabaseAdapter } from './../../server/utils/databaseAdapterConfig'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

const prisma = new PrismaClient({ adapter: createDatabaseAdapter(databaseUrl) })
const apply = process.argv.includes('--apply')
const BATCH_ID = '2026-08-01-personality-families-08'
const CURATION_SOURCE_RANK = 1

type JsonObject = Record<string, unknown>

type FamilyDefinition = {
  id: string
  label: string
  anchor: string
  members: readonly string[]
}

const FAMILIES: readonly FamilyDefinition[] = [
  {
    id: 'grounded-practicality',
    label: 'Grounded Practicality',
    anchor: 'practical',
    members: ['pragmatic', 'realistic'],
  },
  {
    id: 'composure',
    label: 'Composure',
    anchor: 'calm',
    members: ['serene', 'personality-unflappable', 'coolheaded', 'stoic'],
  },
  {
    id: 'ease',
    label: 'Ease',
    anchor: 'relaxed',
    members: ['personality-laid-back', 'carefree'],
  },
  {
    id: 'warmth-and-care',
    label: 'Warmth and Care',
    anchor: 'personality-warm',
    members: [
      'friendly',
      'caring',
      'compassionate',
      'considerate',
      'personality-nurturing',
      'gentle',
      'empathetic',
    ],
  },
  {
    id: 'emotional-distance',
    label: 'Emotional Distance',
    anchor: 'personality-aloof',
    members: ['cold', 'detached', 'indifferent', 'apathetic'],
  },
  {
    id: 'cheerfulness',
    label: 'Cheerfulness',
    anchor: 'cheerful',
    members: ['bubbly', 'personality-buoyant', 'jovial', 'enthusiastic'],
  },
  {
    id: 'theatricality',
    label: 'Theatricality',
    anchor: 'dramatic',
    members: ['theatrical', 'show-off', 'personality-excessive'],
  },
  {
    id: 'resolve',
    label: 'Resolve',
    anchor: 'stubborn',
    members: ['unyielding', 'driven', 'personality-focused'],
  },
  {
    id: 'analytical-method',
    label: 'Analytical Method',
    anchor: 'analytical',
    members: ['logical', 'personality-methodical', 'calculating', 'meticulous'],
  },
  {
    id: 'social-restraint',
    label: 'Social Restraint',
    anchor: 'introverted',
    members: [
      'reserved',
      'shy',
      'timid',
      'soft-spoken',
      'personality-terse',
      'personality-understated',
    ],
  },
  {
    id: 'vigilance-and-anxiety',
    label: 'Vigilance and Anxiety',
    anchor: 'personality-anxious',
    members: [
      'nervous',
      'worrisome',
      'suspicious',
      'paranoid',
      'conspiracy-minded',
      'cautious',
    ],
  },
  {
    id: 'audacity-and-risk',
    label: 'Audacity and Risk',
    anchor: 'bold',
    members: [
      'daring',
      'daredevil',
      'fearless',
      'reckless',
      'impulsive',
      'personality-spontaneous',
    ],
  },
  {
    id: 'creative-imagination',
    label: 'Creative Imagination',
    anchor: 'creative',
    members: ['artistic', 'inventive', 'visionary'],
  },
  {
    id: 'secrecy-and-strategy',
    label: 'Secrecy and Strategy',
    anchor: 'secretive',
    members: ['personality-mysterious', 'deceptive', 'devious', 'scheming'],
  },
  {
    id: 'humor-style',
    label: 'Humor Style',
    anchor: 'personality-witty',
    members: [
      'sarcastic',
      'deadpan',
      'personality-irreverent',
      'sense-of-humor',
      'cheerfully-morbid',
    ],
  },
  {
    id: 'melancholy-and-reflection',
    label: 'Melancholy and Reflection',
    anchor: 'melancholy',
    members: [
      'gloomy',
      'brooding',
      'personality-world-weary',
      'personality-nostalgic',
    ],
  },
  {
    id: 'sociability-and-charisma',
    label: 'Sociability and Charisma',
    anchor: 'extroverted',
    members: ['gregarious', 'charismatic', 'charming'],
  },
  {
    id: 'confidence',
    label: 'Confidence',
    anchor: 'confident',
    members: ['personality-self-assured'],
  },
  {
    id: 'adaptability',
    label: 'Adaptability',
    anchor: 'flexible',
    members: ['personality-adaptable', 'resourceful'],
  },
  {
    id: 'collaboration',
    label: 'Collaboration',
    anchor: 'personality-collaborative',
    members: ['team-player', 'personality-accommodating'],
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

function familyMetadata(options: {
  previous: string | null | undefined
  family: FamilyDefinition
  role: 'anchor' | 'member'
  artBacked: boolean
}): string {
  const metadata = parseMetadata(options.previous)
  const existing = Array.isArray(metadata.semanticFamilies)
    ? metadata.semanticFamilies.filter(
        (entry) =>
          !(
            entry &&
            typeof entry === 'object' &&
            'id' in entry &&
            entry.id === options.family.id
          ),
      )
    : []

  return JSON.stringify({
    ...metadata,
    semanticFamilies: [
      ...existing,
      {
        id: options.family.id,
        label: options.family.label,
        role: options.role,
        batchId: BATCH_ID,
        artBacked: options.artBacked,
        aliasPolicy: 'related-neighbor-not-alias',
      },
    ],
  })
}

async function main(): Promise<void> {
  const slugs = [...new Set(FAMILIES.flatMap((family) => [family.anchor, ...family.members]))]
  const facets = await prisma.facet.findMany({
    where: { slug: { in: slugs }, isActive: true },
    select: {
      id: true,
      title: true,
      slug: true,
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
  const [profiles, artImageLinks, artCollectionLinks] = await Promise.all([
    prisma.facetProfile.findMany({
      where: { facetId: { in: facetIds } },
      select: {
        facetId: true,
        taxonomy: true,
        randomWeight: true,
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
  ])
  const profileByFacet = new Map(profiles.map((profile) => [profile.facetId, profile]))
  const joinedArtIds = new Set([
    ...artImageLinks.map((link) => link.facetId),
    ...artCollectionLinks.map((link) => link.facetId),
  ])

  const reports = []
  const operations = []

  for (const family of FAMILIES) {
    const anchor = bySlug.get(family.anchor)
    const missing = [family.anchor, ...family.members].filter((slug) => !bySlug.has(slug))
    const wrongTaxonomy: string[] = []
    const linked: string[] = []
    const artBacked: string[] = []

    if (!anchor) {
      reports.push({
        id: family.id,
        label: family.label,
        action: 'missing-anchor',
        missing,
        wrongTaxonomy,
        linked,
        artBacked,
      })
      continue
    }

    for (const [role, slug] of [
      ['anchor', family.anchor],
      ...family.members.map((member) => ['member', member] as const),
    ] as const) {
      const facet = bySlug.get(slug)
      if (!facet) continue
      const profile = profileByFacet.get(facet.id)
      if (!profile || profile.taxonomy !== 'PERSONALITY') {
        wrongTaxonomy.push(slug)
        continue
      }

      const hasArt = Boolean(
        facet.imagePath ||
          facet.cardPath ||
          facet.heroPath ||
          facet.icon ||
          facet.artImageId !== null ||
          facet.artCollectionId !== null ||
          joinedArtIds.has(facet.id),
      )
      if (hasArt) artBacked.push(slug)
      const ceiling = role === 'anchor' ? 1 : 0.5
      const nextWeight = Math.min(profile.randomWeight, ceiling)

      if (apply) {
        operations.push(
          prisma.facetProfile.update({
            where: { facetId: facet.id },
            data: {
              randomWeight: nextWeight,
              sourceRank: CURATION_SOURCE_RANK,
              metadata: familyMetadata({
                previous: profile.metadata,
                family,
                role,
                artBacked: hasArt,
              }),
            },
          }),
        )
      }

      if (role === 'member') {
        linked.push(slug)
        if (apply) {
          for (const [fromFacetId, toFacetId] of [
            [facet.id, anchor.id],
            [anchor.id, facet.id],
          ] as const) {
            operations.push(
              prisma.facetRelation.upsert({
                where: {
                  fromFacetId_toFacetId_relationType: {
                    fromFacetId,
                    toFacetId,
                    relationType: 'RELATED',
                  },
                },
                create: {
                  fromFacetId,
                  toFacetId,
                  relationType: 'RELATED',
                  note: `${family.label} semantic family. Related neighbor, not an alias. Curated by ${BATCH_ID}.`,
                },
                update: {
                  note: `${family.label} semantic family. Related neighbor, not an alias. Curated by ${BATCH_ID}.`,
                },
              }),
            )
          }
        }
      }
    }

    reports.push({
      id: family.id,
      label: family.label,
      anchor: family.anchor,
      action: apply ? 'curated' : 'would-curate',
      missing,
      wrongTaxonomy,
      linked,
      artBacked,
    })
  }

  if (apply && operations.length) {
    const chunkSize = 80
    for (let offset = 0; offset < operations.length; offset += chunkSize) {
      await prisma.$transaction(operations.slice(offset, offset + chunkSize))
    }
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        mode: apply ? 'apply' : 'dry-run',
        batchId: BATCH_ID,
        families: reports,
        summary: {
          families: FAMILIES.length,
          profilesFound: profiles.length,
          operations: operations.length,
          missingSlugs: reports.flatMap((report) => report.missing),
          wrongTaxonomy: reports.flatMap((report) => report.wrongTaxonomy),
        },
        policy:
          'Exact synonyms are merged elsewhere. These are related semantic neighbors: stable Facet rows, prose, prompts, and artwork remain untouched, while secondary family members receive weight 0.5 to reduce lottery crowding.',
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
