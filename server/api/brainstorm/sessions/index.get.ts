import { defineEventHandler } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const sessions = await prisma.brainstormSession.findMany({
      where: {
        userId: auth.user.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        premise: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { Candidates: true } },
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: 100,
    })

    return {
      success: true,
      statusCode: 200,
      message: `${sessions.length} saved Brainstorm session${sessions.length === 1 ? '' : 's'}.`,
      data: {
        sessions: sessions.map((session) => ({
          id: session.id,
          name: session.name,
          premise: session.premise,
          candidateCount: session._count.Candidates,
          createdAt: session.createdAt.toISOString(),
          updatedAt: (session.updatedAt ?? session.createdAt).toISOString(),
        })),
      },
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      statusCode: handled.statusCode || 500,
      message: handled.message || 'Failed to load saved Brainstorm sessions.',
      data: { sessions: [] },
    }
  }
})
