// @ts-nocheck
/* eslint-disable */
// test-ignore

// /server/api/[model]/index.get.ts

import { defineEventHandler } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'

export default defineEventHandler(async (event) => {
  const modelName = 'sampleModel' // <-- update to your actual model (e.g., 'theme', 'bot', etc.)

  try {
    console.log(`[${modelName}.get] Fetching entries...`)

    const { isValid, user } = await validateApiKey(event)
    const includeUserData = isValid && user && typeof user.id === 'number'

    const whereClause = includeUserData
      ? {
          OR: [{ isPublic: true }, { userId: user.id }],
        }
      : { isPublic: true }

    const data = await prisma[modelName].findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    })

    console.log(`[${modelName}.get] Retrieved ${data.length} entries.`)

    event.node.res.statusCode = 200
    return {
      success: true,
      message: includeUserData
        ? `All ${modelName}s retrieved for user ${user.id}.`
        : `Public ${modelName}s retrieved successfully.`,
      data,
    }
  } catch (error) {
    const handled = errorHandler(error)
    console.error(`[${modelName}.get] Error:`, handled)

    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || `Failed to fetch ${modelName}s.`,
    }
  }
})
