import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '@/server/api/utils/prisma'
import { validateApiKey } from '@/server/api/utils/validateKey'
import { errorHandler } from '@/server/api/utils/error'

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user)
      throw createError({ statusCode: 401, message: 'Unauthorized' })

    const body = await readBody(event)
    const { name, values, isPublic = false } = body

    if (!name || typeof name !== 'string')
      throw createError({ statusCode: 400, message: 'Theme name required' })
    if (!values || typeof values !== 'object')
      throw createError({ statusCode: 400, message: 'Invalid theme values' })

    const theme = await prisma.theme.create({
      data: {
        name,
        values,
        isPublic,
        userId: user.id,
      },
    })

    return { success: true, theme, statusCode: 201 }
  } catch (error) {
    const err = errorHandler(error)
    return { success: false, message: err.message, statusCode: err.statusCode }
  }
})
