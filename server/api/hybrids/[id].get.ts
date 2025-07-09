// /server/api/hybrids/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '@/server/api/utils/prisma'
import { errorHandler } from '@/server/api/utils/error'
import { validateApiKey } from '@/server/api/utils/validateKey'

export default defineEventHandler(async (event) => {
  const modelName = 'hybrid'
  const paramName = 'id'
  let id: number
  let response

  try {
    // 🔐 Validate token first
    const { isValid } = await validateApiKey(event)
    if (!isValid) {
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    // ✅ Then parse and validate ID
    id = Number(event.context.params?.[paramName])
    if (!id || isNaN(id) || id <= 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: `Invalid ${modelName} ID. Must be a positive integer.`,
      })
    }

    // 📦 Fetch hybrid
    const data = await prisma.hybrid.findUnique({
      where: { id },
      include: {
        art: true,
        artImage: true,
        user: true,
      },
    })

    if (!data) {
      event.node.res.statusCode = 404
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
      message: handled.message || `Failed to fetch ${modelName}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
