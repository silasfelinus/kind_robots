// @ts-nocheck
/* eslint-disable */
// test-ignore

// /server/api/[model]/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'

export default defineEventHandler(async (event) => {
  const modelName = 'sampleModel' // <-- replace with actual Prisma model name
  const paramName = 'id'
  let id: number
  let response

  try {
    // Validate ID param
    id = Number(event.context.params?.[paramName])
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: `Invalid ${modelName} ID. Must be a positive integer.`,
      })
    }

    console.log(`Deleting ${modelName} with ID: ${id}`)

    // Validate API key
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({ statusCode: 401, message: 'Invalid or expired token.' })
    }

    const userId = user.id

    // Fetch record for owner check
    const item = await prisma[modelName].findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!item) {
      throw createError({
        statusCode: 404,
        message: `${modelName} with ID ${id} not found.`,
      })
    }

    // Admin override
    if (user.Role === 'ADMIN' || item.userId === userId) {
      await prisma[modelName].delete({ where: { id } })
      return {
        success: true,
        message: `${modelName} with ID ${id} successfully deleted.`,
        statusCode: 200,
      }
    }

    throw createError({
      statusCode: 403,
      message: `You are not authorized to delete this ${modelName}.`,
    })
  } catch (error) {
    const handled = errorHandler(error)
    console.error(`Error deleting ${modelName}:`, handled)
    event.node.res.statusCode = handled.statusCode || 500
    response = {
      success: false,
      message: handled.message || `Failed to delete ${modelName} with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
