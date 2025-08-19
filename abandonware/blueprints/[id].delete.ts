// /server/api/blueprints/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '../../server/api/utils/prisma'
import { errorHandler } from '../../server/api/utils/error'
import { validateApiKey } from '../../server/api/utils/validateKey'

export default defineEventHandler(async (event) => {
  const modelName = 'blueprint'
  const id = Number(event.context.params?.id)
  let response

  try {
    if (isNaN(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid blueprint ID.' })
    }

    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const item = await prisma.blueprint.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!item) {
      throw createError({ statusCode: 404, message: `Blueprint not found.` })
    }

    if (user.Role === 'ADMIN' || item.userId === user.id) {
      await prisma.blueprint.delete({ where: { id } })
      return { success: true, message: `Blueprint deleted.`, statusCode: 200 }
    }

    throw createError({
      statusCode: 403,
      message: 'Not authorized to delete this blueprint.',
    })
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    response = { success: false, message: handled.message }
  }

  return response
})
