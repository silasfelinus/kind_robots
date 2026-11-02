import { createError } from 'h3'
import prisma from '~/server/utils/prisma'
import type { Prisma } from '~/prisma/generated/prisma/client'
import {
  emptyAlienGuide,
  normalizeAlienGuide,
  type AlienGuide,
} from '~/utils/gameOfCaptains/alienFieldGuide'
import { mergeAlienGuideSnapshots } from '~/utils/gameOfCaptains/alienGuideSync'

const toJson = (guide: AlienGuide): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(guide)) as Prisma.InputJsonValue

export async function readSpaceCouchAlienGuide(
  userId: number,
): Promise<AlienGuide> {
  const row = await prisma.spaceCouchAlienGuide.findUnique({
    where: { userId },
  })
  return row ? normalizeAlienGuide(row.data) : emptyAlienGuide()
}

/** Optimistic write with bounded retries, merging the latest server snapshot
 * inside each transaction. Prevents two open tabs from erasing discoveries.
 */
export async function saveSpaceCouchAlienGuide(
  userId: number,
  incoming: unknown,
): Promise<AlienGuide> {
  const submitted = normalizeAlienGuide(incoming)
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        await tx.spaceCouchAlienGuide.upsert({
          where: { userId },
          update: {},
          create: { userId, data: toJson(emptyAlienGuide()) },
        })
        const row = await tx.spaceCouchAlienGuide.findUniqueOrThrow({
          where: { userId },
        })
        const guide = mergeAlienGuideSnapshots(row.data, submitted)
        const result = await tx.spaceCouchAlienGuide.updateMany({
          where: { userId, version: row.version },
          data: {
            data: toJson(guide),
            version: { increment: 1 },
          },
        })
        if (result.count !== 1)
          throw createError({
            statusCode: 409,
            message: 'Scrapbook changed in another tab.',
          })
        return guide
      })
    } catch (error) {
      if (
        attempt < 2 &&
        error &&
        typeof error === 'object' &&
        'statusCode' in error &&
        error.statusCode === 409
      )
        continue
      throw error
    }
  }
  throw createError({
    statusCode: 409,
    message: 'Scrapbook was updated during this save. Retry.',
  })
}
