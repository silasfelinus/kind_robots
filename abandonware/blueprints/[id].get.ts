import { defineEventHandler, createError } from 'h3'
import prisma from '../../server/api/utils/prisma'
import { errorHandler } from '../../server/api/utils/error'

export default defineEventHandler(async (event) => {
  const modelName = 'blueprint'
  const paramName = 'id'
  let id: number = 0
  let response

  try {
    id = Number(event.context.params?.[paramName])
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: `Invalid ${modelName} ID. Must be a positive integer.`,
      })
    }

    const data = await prisma[modelName].findUnique({
      where: { id },
      include: { coverArt: true, tags: true },
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
    console.error(`Error fetching ${modelName}:`, handled)
    event.node.res.statusCode = handled.statusCode || 500
    response = {
      success: false,
      message: handled.message || `Failed to fetch ${modelName} with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
