import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { getOptionalApiUser } from '../../utils/authGuard'

type VoteBody = { candidateId?: unknown; vote?: unknown }

export default defineEventHandler(async (event) => {
  try {
    const auth = await getOptionalApiUser(event)
    if (!auth?.user.id) {
      throw createError({ statusCode: 401, message: 'Sign in to vote.' })
    }

    const body = await readBody<VoteBody>(event)
    const candidateId = Number(body?.candidateId)
    const vote = body?.vote
    if (!Number.isSafeInteger(candidateId) || candidateId < 1 || ![1, 0, -1].includes(vote as number)) {
      throw createError({ statusCode: 400, message: 'A candidate and vote of -1, 0 or 1 are required.' })
    }

    const candidate = await prisma.tzaddikCandidate.findUnique({
      where: { id: candidateId },
      select: { curationState: true, submittedByUserId: true },
    })
    if (
      !candidate ||
      (candidate.curationState !== 'APPROVED' &&
        !auth.isAdmin &&
        candidate.submittedByUserId !== auth.user.id)
    ) {
      throw createError({ statusCode: 404, message: 'Candidate not available for voting.' })
    }

    const existing = await prisma.reaction.findMany({
      where: {
        tzaddikCandidateId: candidateId,
        userId: auth.user.id,
        reactionCategory: 'TZADDIK',
        reactionType: { in: ['LOVED', 'BOOED'] },
        rating: 0,
        comment: null,
      },
      orderBy: { id: 'desc' },
    })

    if (vote === 0) {
      if (existing.length) {
        await prisma.reaction.deleteMany({ where: { id: { in: existing.map((row) => row.id) } } })
      }
    } else {
      const reactionType = vote === 1 ? 'LOVED' : 'BOOED'
      if (existing[0]) {
        await prisma.reaction.update({
          where: { id: existing[0].id },
          data: { reactionType },
        })
        if (existing.length > 1) {
          await prisma.reaction.deleteMany({
            where: { id: { in: existing.slice(1).map((row) => row.id) } },
          })
        }
      } else {
        await prisma.reaction.create({
          data: {
            tzaddikCandidateId: candidateId,
            userId: auth.user.id,
            reactionCategory: 'TZADDIK',
            reactionType,
            rating: 0,
          },
        })
      }
    }

    event.node.res.statusCode = 200
    return { success: true, data: { candidateId, vote }, statusCode: 200 }
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return { success: false, message, statusCode: event.node.res.statusCode }
  }
})
