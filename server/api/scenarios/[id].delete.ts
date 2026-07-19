// /server/api/scenarios/[id].delete.ts
import { createError, defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import { userIsAdmin } from '../../utils/authUser'

export default defineEventHandler(async (event) => {
  let id: number | null = null

  try {
    id = Number(event.context.params?.id)

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid scenario ID. It must be a positive integer.',
      })
    }

    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const scenario = await prisma.scenario.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
      },
    })

    if (!scenario) {
      throw createError({
        statusCode: 404,
        message: `Scenario with ID ${id} does not exist.`,
      })
    }

    if (scenario.userId !== user.id && !userIsAdmin(user)) {
      throw createError({
        statusCode: 403,
        message: 'You are not authorized to delete this scenario.',
      })
    }

    await prisma.scenario.delete({ where: { id } })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: `Scenario with ID ${id} successfully deleted.`,
      data: null,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      message:
        handledError.message || `Failed to delete Scenario with ID ${id}.`,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
