// /server/api/resonate/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from './../utils/prisma'
import { errorHandler } from './../utils/error'
import { validateApiKey } from './../utils/validateKey'
import type { Prisma } from '@prisma/client'

export default defineEventHandler(async (event) => {
  let id
  let response

  try {
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Resonate ID. It must be a positive integer.',
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

    const existingResonate = await prisma.resonate.findUnique({ where: { id } })
    if (!existingResonate) {
      throw createError({
        statusCode: 404,
        message: 'Resonate not found.',
      })
    }

    if (existingResonate.userId !== userId && user.Role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this resonate.',
      })
    }

    const resonateData: Prisma.ResonateUpdateInput = await readBody(event)
    if (!resonateData || Object.keys(resonateData).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    const data = await prisma.resonate.update({
      where: { id },
      data: resonateData,
    })

    response = {
      success: true,
      message: 'Resonate updated successfully.',
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
        handledError.message || `Failed to update resonate with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
