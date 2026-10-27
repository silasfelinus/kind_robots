import { createHash } from 'node:crypto'
import { decodeMakerLevel, type MakerLevel } from '~/utils/arcade/games/savePlumberMaker'
import prisma from '~/server/utils/prisma'

export const PLUMBER_REVIEW_COMMENT_MAX = 500

export function courseFromShareCode(code: unknown): {
  level: MakerLevel
  fingerprint: string
  payload: string
} {
  if (typeof code !== 'string') {
    throw new Error('A valid playable course share code is required.')
  }
  const level = decodeMakerLevel(code)
  const payload = JSON.stringify(level)
  return {
    level,
    payload,
    fingerprint: createHash('sha256').update(payload).digest('hex'),
  }
}

export async function plumberReviewSummary(
  levelId: number | null,
  viewerId: number | null,
) {
  if (!levelId) {
    return { courseId: null, average: 0, count: 0, myRating: 0, reviews: [] }
  }
  const where = {
    plumberLevelId: levelId,
    reactionCategory: 'PLUMBER_LEVEL' as const,
    rating: { gte: 1, lte: 5 },
  }
  const [aggregate, reactions, mine] = await Promise.all([
    prisma.reaction.aggregate({
      where,
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.reaction.findMany({
      where,
      select: {
        id: true,
        rating: true,
        comment: true,
        updatedAt: true,
        User: { select: { username: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 30,
    }),
    viewerId
      ? prisma.reaction.findUnique({
          where: {
            userId_plumberLevelId: {
              userId: viewerId,
              plumberLevelId: levelId,
            },
          },
          select: { rating: true },
        })
      : Promise.resolve(null),
  ])
  return {
    courseId: levelId,
    average: aggregate._avg.rating ?? 0,
    count: aggregate._count._all,
    myRating: mine?.rating ?? 0,
    reviews: reactions.map((reaction) => ({
      id: reaction.id,
      rating: reaction.rating,
      comment: reaction.comment,
      updatedAt: reaction.updatedAt,
      username: reaction.User.username,
    })),
  }
}
