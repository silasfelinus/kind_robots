import { createError } from 'h3'
import prisma from '~/server/utils/prisma'
import type { Prisma } from '~/prisma/generated/prisma/client'
import { mergeAlienGuides } from '~/utils/gameOfCaptains/alienAccountMerge'
import { emptyAlienGuide, normalizeAlienGuide } from '~/utils/gameOfCaptains/alienFieldGuide'

const toJson = (guide: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(guide))

export async function getSpaceCouchAlienGuide(userId: number) {
  const entry = await prisma.spaceCouchAlienGuide.findUnique({ where: { userId } })
  return entry ? normalizeAlienGuide(entry.data) : emptyAlienGuide()
}

/** Each version guard is one atomic DB write; conflicts are re-read and merged. */
export async function saveSpaceCouchAlienGuide(userId: number, submitted: unknown) {
  const incoming = normalizeAlienGuide(submitted)
  for (let attempt = 0; attempt < 8; attempt++) {
    const current = await prisma.spaceCouchAlienGuide.findUnique({
      where: { userId },
    })
    const merged = mergeAlienGuides(current?.data ?? null, incoming)
    if (!current) {
      try {
        await prisma.spaceCouchAlienGuide.create({
          data: { userId, data: toJson(merged) },
        })
        return merged
      } catch (error) {
        if (
          error &&
          typeof error === 'object' &&
          'code' in error &&
          error.code === 'P2002'
        ) continue
        throw error
      }
    }
    const result = await prisma.spaceCouchAlienGuide.updateMany({
      where: { userId, version: current.version },
      data: { data: toJson(merged), version: { increment: 1 } },
    })
    if (result.count === 1) return merged
  }
  throw createError({
    statusCode: 409,
    message: 'Another tab saved alien discoveries. Retry to merge.',
  })
}
