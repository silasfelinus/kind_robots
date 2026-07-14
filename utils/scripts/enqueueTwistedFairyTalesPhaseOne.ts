// utils/scripts/enqueueTwistedFairyTalesPhaseOne.ts
//
// Enqueue the paired color-detail and black-and-white coloring-page requests for
// Coloring Book Book Three: Twisted Fairy Tales.
//
// Usage:
//   npm run seed:twisted-fairy-tales            # dry run
//   npm run seed:twisted-fairy-tales -- --write # create missing ArtJob rows

import 'dotenv/config'
import { PrismaClient, type Prisma } from './../../prisma/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { twistedFairyTalesPhaseOnePrompts } from './../../stores/seeds/twistedFairyTalesArtPrompts'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) })
const WRITE = process.argv.includes('--write')
const USER_ID = Number(process.env.ART_SEED_USER_ID || 1)
const PROJECT_SLUG = 'twisted-fairy-tales'
const PRIORITY = 10

function requestIdFromPayload(payload: Prisma.JsonValue): string | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null
  const requestId = (payload as Record<string, Prisma.JsonValue>).requestId
  return typeof requestId === 'string' ? requestId : null
}

async function main() {
  if (!Number.isInteger(USER_ID) || USER_ID <= 0) {
    throw new Error('ART_SEED_USER_ID must be a positive integer')
  }

  const existingJobs = await prisma.artJob.findMany({
    where: { projectSlug: PROJECT_SLUG, userId: USER_ID },
    select: { id: true, status: true, payload: true },
  })

  const existingByRequestId = new Map(
    existingJobs
      .map((job) => [requestIdFromPayload(job.payload), job] as const)
      .filter((entry): entry is [string, (typeof existingJobs)[number]] => Boolean(entry[0])),
  )

  const missing = twistedFairyTalesPhaseOnePrompts.filter(
    (entry) => !existingByRequestId.has(entry.requestId),
  )

  console.log(
    `Twisted Fairy Tales phase one: ${twistedFairyTalesPhaseOnePrompts.length} prompt(s), ` +
      `${twistedFairyTalesPhaseOnePrompts.length - missing.length} already queued, ` +
      `${missing.length} missing.`,
  )

  for (const entry of twistedFairyTalesPhaseOnePrompts) {
    const existing = existingByRequestId.get(entry.requestId)
    console.log(
      `${existing ? 'EXISTS' : WRITE ? 'QUEUE ' : 'WOULD '}  ${entry.requestId}` +
        `${existing ? ` (#${existing.id}, ${existing.status})` : ''}`,
    )
  }

  if (!WRITE) {
    console.log('\nDry run only. Re-run with --write to create missing ArtJob rows.')
    return
  }

  if (!missing.length) {
    console.log('\nNothing to add.')
    return
  }

  const created = await prisma.$transaction(
    missing.map((entry) =>
      prisma.artJob.create({
        data: {
          engine: 'A1111',
          priority: PRIORITY,
          projectSlug: PROJECT_SLUG,
          userId: USER_ID,
          payload: {
            requestId: entry.requestId,
            title: entry.title,
            conceptSlug: entry.conceptSlug,
            variant: entry.variant,
            promptString: entry.promptString,
            negativePrompt: entry.negativePrompt,
            width: entry.width,
            height: entry.height,
            imagePath: entry.imagePath,
            sourceImages: entry.sourceImages ?? [],
            save: {
              isPublic: true,
              isMature: true,
              designer: 'Kind Robots / Twisted Fairy Tales',
            },
          } as Prisma.InputJsonValue,
        },
      }),
    ),
  )

  console.log(`\nQueued ${created.length} new Twisted Fairy Tales ArtJob row(s).`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
