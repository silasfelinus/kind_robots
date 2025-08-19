// /server/api/resonance/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../server/api/utils/prisma'
import { errorHandler } from '../../server/api/utils/error'
import { validateApiKey } from '../../server/api/utils/validateKey'
import type { Prisma } from '@prisma/client'

export default defineEventHandler(async (event) => {
  let id
  let response

  try {
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid resonance ID. It must be a positive integer.',
      })
    }

    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    const existingresonance = await prisma.resonance.findUnique({
      where: { id },
    })
    if (!existingresonance) {
      throw createError({
        statusCode: 404,
        message: 'resonance not found.',
      })
    }

    if (existingresonance.userId !== userId && user.Role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this resonance.',
      })
    }

    const resonanceData: Prisma.ResonanceUpdateInput = await readBody(event)
    if (!resonanceData || Object.keys(resonanceData).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    const data = await prisma.resonance.update({
      where: { id },
      data: resonanceData,
    })

    response = {
      success: true,
      message: 'resonance updated successfully.',
      data,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message || `Failed to update resonance with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
