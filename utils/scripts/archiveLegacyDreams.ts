// utils/scripts/archiveLegacyDreams.ts
//
// Final step of the Dream → Project/Facet migration (phase 4): archive the
// remaining legacy PROJECT/GENRE dreams to a committed JSON file, then —
// only with --delete — remove the rows so the enum-dropping migration can
// deploy. Dry (archive-only) by default.
//
// Usage:
//   npx tsx utils/scripts/archiveLegacyDreams.ts [--delete] [--output=path]
//
// Run the relation audit (auditLegacyGenreDreamRelations.ts) and the parity
// verifier (verifyProjectDreamFacetParity.ts) first; the cleanup workflow
// gates on both before this script ever runs with --delete.
import 'dotenv/config'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) })
const generatedAt = new Date().toISOString()
const outputArg = process.argv.find((argument) =>
  argument.startsWith('--output='),
)
const outputPath = resolve(
  outputArg?.slice('--output='.length) ||
    'archives/legacy-dreams/legacy-dreams.json',
)
const doDelete = process.argv.includes('--delete')

const LEGACY_TYPES = ['PROJECT', 'GENRE'] as const

async function main() {
  const dreams = await prisma.dream.findMany({
    where: { dreamType: { in: [...LEGACY_TYPES] } },
    orderBy: { id: 'asc' },
    include: {
      Scenarios: { select: { id: true } },
      FacetLinks: { select: { facetId: true } },
      Reactions: { select: { id: true } },
      Compositions: { select: { id: true } },
      SourceComposition: { select: { id: true } },
      Chats: { select: { id: true } },
      ArtImages: { select: { id: true } },
      ArtCollections: { select: { id: true } },
      Characters: { select: { id: true } },
      Rewards: { select: { id: true } },
      Bots: { select: { id: true } },
      PitchSheet: { select: { id: true, projectId: true } },
      Todos: { select: { id: true, projectId: true } },
      RelationsFrom: {
        select: { id: true, toDreamId: true, relationType: true, note: true },
      },
      RelationsTo: {
        select: { id: true, fromDreamId: true, relationType: true, note: true },
      },
      LifeRuns: { select: { id: true } },
    },
  })

  const counts = {
    total: dreams.length,
    project: dreams.filter((dream) => dream.dreamType === 'PROJECT').length,
    genre: dreams.filter((dream) => dream.dreamType === 'GENRE').length,
  }

  const archive = {
    generatedAt,
    note:
      'Archival copy of the legacy PROJECT/GENRE dreams taken immediately ' +
      'before their deletion. Live data moved to the Project and Facet ' +
      'models (kind_robots PRs #172/#173 and follow-ups).',
    counts,
    dreams,
  }

  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(archive, null, 2)}\n`, 'utf8')
  console.error(
    `Archived ${counts.total} legacy dreams (${counts.project} PROJECT, ${counts.genre} GENRE) to ${outputPath}`,
  )

  if (!doDelete) {
    console.error('Dry run — pass --delete to remove the archived rows.')
    return
  }

  const failures: { id: number; title: string; error: string }[] = []
  let deleted = 0
  for (const dream of dreams) {
    try {
      await prisma.dream.delete({ where: { id: dream.id } })
      deleted += 1
    } catch (error) {
      failures.push({
        id: dream.id,
        title: dream.title,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const remaining = await prisma.dream.count({
    where: { dreamType: { in: [...LEGACY_TYPES] } },
  })
  console.error(
    `Deleted ${deleted}/${dreams.length}; ${remaining} legacy dreams remain.`,
  )
  if (failures.length > 0) {
    console.error(JSON.stringify(failures, null, 2))
    process.exitCode = 1
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
