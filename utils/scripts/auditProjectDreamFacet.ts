// utils/scripts/auditProjectDreamFacet.ts
import 'dotenv/config'
import { writeFile } from 'node:fs/promises'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) })

const outputArg = process.argv.find((argument) => argument.startsWith('--output='))
const outputPath = outputArg?.slice('--output='.length) || null

const facetCandidateTypes = ['GENRE', 'BRAINSTORM', 'ART'] as const
const reviewCandidateTypes = ['LOCATION', 'PITCH', 'WISH'] as const

async function main() {
  const [
    typeCounts,
    projectDreams,
    pitchSheets,
    facetCandidates,
    reviewCandidates,
    taxonomyRelations,
  ] = await Promise.all([
    prisma.dream.groupBy({
      by: ['dreamType'],
      _count: { _all: true },
      orderBy: { dreamType: 'asc' },
    }),
    prisma.dream.findMany({
      where: { dreamType: 'PROJECT' },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        title: true,
        slug: true,
        projectStatus: true,
        priority: true,
        goal: true,
        waypoints: true,
        repoUrl: true,
        liveUrl: true,
        artImageId: true,
        artCollectionId: true,
        PitchSheet: {
          select: {
            id: true,
            title: true,
            layoutKey: true,
          },
        },
        _count: {
          select: {
            Chats: true,
            Todos: true,
            Reactions: true,
            ArtImages: true,
            ArtCollections: true,
            Characters: true,
            Rewards: true,
            Scenarios: true,
            Bots: true,
          },
        },
      },
    }),
    prisma.pitchSheet.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        title: true,
        layoutKey: true,
        dreamId: true,
        Dream: {
          select: {
            id: true,
            title: true,
            slug: true,
            dreamType: true,
          },
        },
      },
    }),
    prisma.dream.findMany({
      where: { dreamType: { in: [...facetCandidateTypes] } },
      orderBy: [{ dreamType: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        title: true,
        slug: true,
        dreamType: true,
        description: true,
        examples: true,
        artImageId: true,
        artCollectionId: true,
        _count: {
          select: {
            Characters: true,
            Rewards: true,
            Scenarios: true,
            Bots: true,
            Chats: true,
          },
        },
      },
    }),
    prisma.dream.findMany({
      where: { dreamType: { in: [...reviewCandidateTypes] } },
      orderBy: [{ dreamType: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        title: true,
        slug: true,
        dreamType: true,
        description: true,
        pitch: true,
        examples: true,
        _count: {
          select: {
            Characters: true,
            Rewards: true,
            Scenarios: true,
            Bots: true,
            Chats: true,
          },
        },
      },
    }),
    prisma.dreamRelation.findMany({
      where: {
        relationType: { in: ['IS_A', 'CONTAINS', 'APPEARS_IN'] },
      },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        relationType: true,
        note: true,
        FromDream: {
          select: { id: true, title: true, slug: true, dreamType: true },
        },
        ToDream: {
          select: { id: true, title: true, slug: true, dreamType: true },
        },
      },
    }),
  ])

  const projectPitchSheets = pitchSheets.filter(
    (sheet) => sheet.Dream?.dreamType === 'PROJECT',
  )
  const missingProjectSlugs = projectDreams.filter((dream) => !dream.slug)
  const facetCandidatesWithWorldInfrastructure = facetCandidates.filter((dream) => {
    const count = dream._count
    return (
      count.Characters > 0 ||
      count.Rewards > 0 ||
      count.Scenarios > 0 ||
      count.Bots > 0 ||
      count.Chats > 0
    )
  })

  const report = {
    generatedAt: new Date().toISOString(),
    mode: 'read-only',
    summary: {
      dreamCount: typeCounts.reduce((sum, row) => sum + row._count._all, 0),
      projectDreamCount: projectDreams.length,
      pitchSheetCount: pitchSheets.length,
      projectPitchSheetCount: projectPitchSheets.length,
      facetCandidateCount: facetCandidates.length,
      manualReviewCandidateCount: reviewCandidates.length,
      taxonomyRelationCount: taxonomyRelations.length,
      missingProjectSlugCount: missingProjectSlugs.length,
      facetCandidatesWithWorldInfrastructureCount:
        facetCandidatesWithWorldInfrastructure.length,
    },
    dreamTypeCounts: Object.fromEntries(
      typeCounts.map((row) => [row.dreamType, row._count._all]),
    ),
    projectDreams,
    pitchSheets: {
      all: pitchSheets,
      currentlyAttachedToProjectDreams: projectPitchSheets,
      migrationRule:
        'When a PROJECT Dream becomes a Project, move its PitchSheet ownership from dreamId to projectId in the same transaction. Every PitchSheet must finish with exactly one owner.',
    },
    facetCandidates,
    facetCandidatesWithWorldInfrastructure,
    manualReviewCandidates: reviewCandidates,
    taxonomyRelations,
    blockers: {
      missingProjectSlugs,
      pitchSheetsRequiringProjectOwnershipMove: projectPitchSheets,
      facetCandidatesWithWorldInfrastructure,
    },
  }

  const json = `${JSON.stringify(report, null, 2)}\n`
  if (outputPath) {
    await writeFile(outputPath, json)
    console.log(`Schema-shift audit written to ${outputPath}`)
  } else {
    process.stdout.write(json)
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
