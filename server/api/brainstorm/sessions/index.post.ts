import { defineEventHandler, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'
import type { BrainstormStoredSessionRow } from '../../../utils/brainstorm/brainstormPersistence'
import {
  brainstormCandidateCreateData,
  brainstormSessionData,
  normalizeBrainstormSessionSaveRequest,
  storedBrainstormSession,
} from '../../../utils/brainstorm/brainstormPersistence'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const request = normalizeBrainstormSessionSaveRequest(await readBody(event))
    const session = await prisma.brainstormSession.create({
      data: {
        ...brainstormSessionData(auth.user.id, request),
        Candidates: {
          create: brainstormCandidateCreateData(request.snapshot.candidates),
        },
      },
      include: {
        Candidates: { orderBy: { position: 'asc' } },
      },
    })

    return {
      success: true,
      statusCode: 201,
      message: `Saved Brainstorm session “${session.name}”.`,
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
      message: handled.message || 'Failed to save the Brainstorm session.',
    }
  }
})
