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
    // ✅ Parse and validate ID
    id = Number(event.context.params?.[paramName])
    if (!id || isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: `Invalid ${modelName} ID. Must be a positive integer.`,
      })
    }

    // 📦 Fetch hybrid with visibility and user info
    const hybrid = await prisma.hybrid.findUnique({
      where: { id },
      include: {
        art: true,
        artImage: true,
        user: true,
      },
    })

    if (!hybrid) {
      throw createError({
        statusCode: 404,
        message: `${modelName} with ID ${id} not found.`,
      })
    }

    // 🔐 Validate token only if needed
    const { isValid, user } = await validateApiKey(event)

    const isOwner = isValid && user && hybrid.userId === user.id
    const isPublic = hybrid.isPublic === true

    if (!isPublic && !isOwner) {
      throw createError({
        statusCode: 401,
        message: `Unauthorized. This ${modelName} is private.`,
      })
    }

    // ✅ Success
    response = {
      success: true,
      message: `${modelName} fetched successfully.`,
      data: hybrid,
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
