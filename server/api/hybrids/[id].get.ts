// /server/api/hybrids/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'

export default defineEventHandler(async (event) => {
  const modelName = 'hybrid'
  const paramName = 'id'
  let id: number
  let response

  try {
    id = Number(event.context.params?.[paramName])
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: `Invalid ${modelName} ID. Must be a positive integer.`,
      })
    }

    const data = await prisma.hybrid.findUnique({
      where: { id },
      include: {
        art: true,
        artImage: true,
        prompt: true,
        user: true,
      },
    })

    if (!data) {
      throw createError({
        statusCode: 404,
        message: `${modelName} with ID ${id} not found.`,
      })
    }

    response = {
      success: true,
      message: `${modelName} fetched successfully.`,
      data,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    response = {
      success: false,
      message: handled.message || `Failed to fetch ${modelName} with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
