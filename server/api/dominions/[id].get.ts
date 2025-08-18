// /server/api/dominions/[id].get.ts
import { defineEventHandler } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    if (!Number.isFinite(id) || id <= 0) {
      return { success: false, message: 'Invalid ID', statusCode: 400 }
    }

    const data = await prisma.dominion.findUnique({ where: { id } })
    if (!data) {
      return { success: false, message: 'Dominion not found', statusCode: 404 }
    }

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Dominion fetched.',
      data,
      statusCode: 200,
    }
  } catch (error) {
    return errorHandler(error)
  }
})
