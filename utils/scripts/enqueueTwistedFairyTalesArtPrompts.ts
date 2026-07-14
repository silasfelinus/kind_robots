// utils/scripts/enqueueTwistedFairyTalesArtPrompts.ts
//
// Enqueue the 46 full-color Twisted Fairy Tales proposal images as individual
// 1024x1536 ArtJob rows.
//
// Usage:
//   npm run seed:twisted-fairy-tales            # dry run
//   npm run seed:twisted-fairy-tales -- --write # create missing ArtJob rows

import 'dotenv/config'
import type { Prisma } from './../../prisma/generated/prisma/client'
import prisma from './../../server/utils/prisma'
import { twistedFairyTalesArtPrompts } from './../../stores/seeds/twistedFairyTalesArtPrompts'

const WRITE = process.argv.includes('--write')
const USER_ID = Number(process.env.ART_SEED_USER_ID || 1)
const PROJECT_SLUG = 'twisted-fairy-tales'
const PRIORITY = 10

function requestIdFromPayload(payload: Prisma.JsonValue): string | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload))
    return null
  const requestId = (payload as Record<string, Prisma.JsonValue>).requestId
  return typeof requestId === 'string' ? requestId : null
}

async function main() {
  if (twistedFairyTalesArtPrompts.length !== 46) {
    throw new Error(
      `Expected 46 Twisted Fairy Tales prompts, found ${twistedFairyTalesArtPrompts.length}`,
    )
  }

  if (!Number.isInteger(USER_ID) || USER_ID <= 0) {
    throw new Error('ART_SEED_USER_ID must be a positive integer')
  }

  const requestIds = twistedFairyTalesArtPrompts.map((entry) => entry.requestId)
  if (new Set(requestIds).size !== requestIds.length) {
    throw new Error('Twisted Fairy Tales request IDs must be unique')
  }

  const existingJobs = await prisma.artJob.findMany({
    where: { projectSlug: PROJECT_SLUG, userId: USER_ID },
    select: { id: true, status: true, payload: true },
  })

  const existingByRequestId = new Map(
    existingJobs
      .map((job) => [requestIdFromPayload(job.payload), job] as const)
      .filter((entry): entry is [string, (typeof existingJobs)[number]] =>
        Boolean(entry[0]),
      ),
  )

  const missing = twistedFairyTalesArtPrompts.filter(
    (entry) => !existingByRequestId.has(entry.requestId),
  )

  console.log(
    `Twisted Fairy Tales: ${twistedFairyTalesArtPrompts.length} proposal prompt(s), ` +
      `${twistedFairyTalesArtPrompts.length - missing.length} already queued, ` +
      `${missing.length} missing.`,
  )

  for (const entry of twistedFairyTalesArtPrompts) {
    const existing = existingByRequestId.get(entry.requestId)
    console.log(
      `${existing ? 'EXISTS' : WRITE ? 'QUEUE ' : 'WOULD '}  ` +
        `${String(entry.number).padStart(2, '0')} ${entry.title}` +
        `${existing ? ` (#${existing.id}, ${existing.status})` : ''}`,
    )
  }

  if (!WRITE) {
    console.log(
      '\nDry run only. Re-run with --write to create missing ArtJob rows.',
    )
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
            number: entry.number,
            title: entry.title,
            conceptSlug: entry.conceptSlug,
            promptString: entry.promptString,
            negativePrompt: entry.negativePrompt,
            width: entry.width,
            height: entry.height,
            imagePath: entry.imagePath,
            sourceImages: entry.sourceImages,
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

  console.log(
    `\nQueued ${created.length} new Twisted Fairy Tales ArtJob row(s).`,
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
