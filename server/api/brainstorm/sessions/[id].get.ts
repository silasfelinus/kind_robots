import { createError, defineEventHandler, getRouterParam } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'
import type { BrainstormStoredSessionRow } from '../../../utils/brainstorm/brainstormPersistence'
import { storedBrainstormSession } from '../../../utils/brainstorm/brainstormPersistence'

function sessionId(value: string | undefined): number {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'A valid Brainstorm session id is required.' })
  }
  return id
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const id = sessionId(getRouterParam(event, 'id'))
    const session = await prisma.brainstormSession.findFirst({
      where: {
        id,
        userId: auth.user.id,
        isActive: true,
      },
      include: {
        Candidates: { orderBy: { position: 'asc' } },
      },
    })

    if (!session) {
      throw createError({ statusCode: 404, message: 'Saved Brainstorm session not found.' })
    }

    return {
      success: true,
      statusCode: 200,
      message: `Loaded Brainstorm session “${session.name}”.`,
      data: {
        session: storedBrainstormSession(
          session as unknown as BrainstormStoredSessionRow,
        ),
      },
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      statusCode: handled.statusCode || 500,
      message: handled.message || 'Failed to load the Brainstorm session.',
    }
  }
})
