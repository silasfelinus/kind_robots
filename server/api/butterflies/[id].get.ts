// /server/api/butterflies/[id].get.ts

import { defineEventHandler, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'

export default defineEventHandler(async (event) => {
  let id: number = 0
  let response

  try {
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid butterfly ID. Must be a positive integer.',
      })
    }

    const data = await prisma.butterfly.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        message: true,
        wingTopColor: true,
        wingBottomColor: true,
        speed: true,
        wingSpeed: true,
        scale: true,
        rarityNumber: true,
        artImageId: true,
        designer: true,
        isPublic: true,
      },
    })

    if (!data) {
      throw createError({
        statusCode: 404,
        message: `Butterfly with ID ${id} not found.`,
      })
    }

    if (!data.isPublic) {
      throw createError({
        statusCode: 403,
        message: 'This butterfly is not public.',
      })
    }

    response = {
      success: true,
      message: 'Butterfly fetched successfully.',
      data,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handled = errorHandler(error)
    console.error('[butterfly.id.get] Error:', handled)
    event.node.res.statusCode = handled.statusCode || 500
    response = {
      success: false,
      message: handled.message || `Failed to fetch butterfly with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
