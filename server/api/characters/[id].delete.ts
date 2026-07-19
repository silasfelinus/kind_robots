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
        message: 'Invalid character ID. It must be a positive integer.',
      })
    }

    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const character = await prisma.character.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
      },
    })

    if (!character) {
      throw createError({
        statusCode: 404,
        message: `Character with ID ${id} does not exist.`,
      })
    }

    if (character.userId !== user.id && !userIsAdmin(user)) {
      throw createError({
        statusCode: 403,
        message: 'You are not authorized to delete this character.',
      })
    }

    await prisma.character.delete({ where: { id } })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: `Character with ID ${id} successfully deleted.`,
      data: null,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    if (statusCode >= 500) {
      console.error('Character delete failed:', handled)
    }

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || `Failed to delete Character with ID ${id}.`,
      data: null,
      statusCode,
    }
  }
})
