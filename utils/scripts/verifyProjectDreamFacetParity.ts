// utils/scripts/verifyProjectDreamFacetParity.ts
import 'dotenv/config'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) })
const generatedAt = new Date().toISOString()
const fileStamp = generatedAt.replaceAll(':', '-').replaceAll('.', '-')
const outputArg = process.argv.find((argument) => argument.startsWith('--output='))
const outputPath = resolve(
  outputArg?.slice('--output='.length) ||
    `artifacts/schema-parity/project-dream-facet-${fileStamp}.json`,
)
const stdoutOnly = process.argv.includes('--stdout-only')

async function main() {
  const [projectDreams, genreDreams, pitchSheets] = await Promise.all([
    prisma.dream.findMany({
      where: { dreamType: 'PROJECT' },
      orderBy: { id: 'asc' },
      select: { id: true, title: true, slug: true },
    }),
    prisma.dream.findMany({
      where: { dreamType: 'GENRE' },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        title: true,
        slug: true,
        Scenarios: { select: { id: true, title: true } },
      },
    }),
    prisma.pitchSheet.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, title: true, dreamId: true, projectId: true },
    }),
  ])

  const projectResults = []
  for (const dream of projectDreams) {
    const project = dream.slug
      ? await prisma.project.findFirst({
          where: {
            OR: [{ conductorSlug: dream.slug }, { slug: dream.slug }],
          },
          select: { id: true, slug: true, conductorSlug: true },
        })
      : null

    const relationCounts = project
      ? {
          chats: await prisma.chat.count({
            where: { dreamId: dream.id, projectId: project.id },
          }),
          todos: await prisma.todo.count({
            where: { dreamId: dream.id, projectId: project.id },
          }),
          reactions: await prisma.reaction.count({
            where: { dreamId: dream.id, projectId: project.id },
          }),
          artJobs: await prisma.artJob.count({
            where: { dreamId: dream.id, projectId: project.id },
          }),
        }
      : { chats: 0, todos: 0, reactions: 0, artJobs: 0 }

    const legacyCounts = {
      chats: await prisma.chat.count({ where: { dreamId: dream.id } }),
      todos: await prisma.todo.count({ where: { dreamId: dream.id } }),
      reactions: await prisma.reaction.count({ where: { dreamId: dream.id } }),
      artJobs: await prisma.artJob.count({ where: { dreamId: dream.id } }),
    }

    projectResults.push({
      dream,
      project,
      legacyCounts,
      dualLinkedCounts: relationCounts,
      relationParity:
        project !== null &&
        legacyCounts.chats === relationCounts.chats &&
        legacyCounts.todos === relationCounts.todos &&
        legacyCounts.reactions === relationCounts.reactions &&
        legacyCounts.artJobs === relationCounts.artJobs,
    })
  }

  const facetResults = []
  for (const dream of genreDreams) {
    const facet = dream.slug
      ? await prisma.facet.findUnique({
          where: { slug: dream.slug },
          select: { id: true, slug: true, kind: true, isActive: true },
        })
      : null

    const missingScenarioLinks = []
    if (facet) {
      for (const scenario of dream.Scenarios) {
        const link = await prisma.scenarioFacet.findUnique({
          where: {
            scenarioId_facetId: {
              scenarioId: scenario.id,
              facetId: facet.id,
            },
          },
          select: { scenarioId: true },
        })
        if (!link) missingScenarioLinks.push(scenario)
      }
    } else {
      missingScenarioLinks.push(...dream.Scenarios)
    }

    facetResults.push({
      dream: { id: dream.id, title: dream.title, slug: dream.slug },
      facet,
      legacyScenarioCount: dream.Scenarios.length,
      missingScenarioLinks,
      scenarioParity: Boolean(facet) && missingScenarioLinks.length === 0,
    })
  }

  const invalidPitchSheets = pitchSheets.filter((sheet) => {
    const ownerCount = Number(sheet.dreamId !== null) + Number(sheet.projectId !== null)
    return ownerCount !== 1
  })

  const blockers = {
    projectDreamsMissingSlug: projectResults.filter((row) => !row.dream.slug),
    projectDreamsMissingProject: projectResults.filter((row) => !row.project),
    projectRelationParityFailures: projectResults.filter(
      (row) => !row.relationParity,
    ),
    genreDreamsMissingSlug: facetResults.filter((row) => !row.dream.slug),
    genreDreamsMissingFacet: facetResults.filter((row) => !row.facet),
    genreScenarioParityFailures: facetResults.filter(
      (row) => !row.scenarioParity,
    ),
    invalidPitchSheets,
  }

  const blockerCount = Object.values(blockers).reduce(
    (total, entries) => total + entries.length,
    0,
  )

  const report = {
    generatedAt,
    databaseCoverage: {
      projectDreamCount: projectDreams.length,
      genreDreamCount: genreDreams.length,
      pitchSheetCount: pitchSheets.length,
    },
    cleanupReady: blockerCount === 0,
    blockerCount,
    blockers,
    projectResults,
    facetResults,
  }

  const json = `${JSON.stringify(report, null, 2)}\n`
  if (!stdoutOnly) {
    await mkdir(dirname(outputPath), { recursive: true })
    await writeFile(outputPath, json, 'utf8')
    console.error(`Schema parity report written to ${outputPath}`)
  }
  process.stdout.write(json)

  if (!report.cleanupReady) process.exitCode = 1
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
