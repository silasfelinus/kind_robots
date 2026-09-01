import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { requireHumanOrDelegatedApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import prisma from '@/server/utils/prisma'

function parseId(value: string | undefined) {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid agent profile id.' })
  }
  return id
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireHumanOrDelegatedApiUser(event)
    const id = parseId(getRouterParam(event, 'id'))
    const body = await readBody<{ body?: unknown }>(event)
    const noteBody = typeof body?.body === 'string' ? body.body.trim() : ''

    if (!noteBody) {
      throw createError({ statusCode: 400, message: 'Note text is required.' })
    }
    if (noteBody.length > 5000) {
      throw createError({
        statusCode: 400,
        message: 'Notes must be 5000 characters or fewer.',
      })
    }

    const profile = await prisma.agentProfile.findUnique({
      where: { id },
      select: { id: true, userId: true, isActive: true },
    })
    if (!profile) {
      throw createError({
        statusCode: 404,
        message: 'Agent profile not found.',
      })
    }
    if (profile.userId !== auth.user.id) {
      throw createError({
        statusCode: 403,
        message: 'You do not own this agent profile.',
      })
    }
    if (!profile.isActive) {
      throw createError({
        statusCode: 409,
        message: 'Reactivate this agent before sending it notes.',
      })
    }

    const note = await prisma.agentNote.create({
      data: {
        agentProfileId: id,
        userId: auth.user.id,
        body: noteBody,
      },
      select: {
        id: true,
        createdAt: true,
        body: true,
        deliveredAt: true,
      },
    })

    return {
      success: true,
      note,
      message: 'Note queued for the agent’s next check-in.',
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: message || 'Failed to create agent note.',
    }
  }
})
