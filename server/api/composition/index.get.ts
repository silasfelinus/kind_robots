// /server/api/compositions/index.get.ts
import { defineEventHandler } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'

export default defineEventHandler(async (event) => {
  const modelName = 'composition'

  try {
    console.log(`[${modelName}.get] Fetching entries...`)

    const { isValid, user } = await validateApiKey(event)
    const includeUserData = isValid && user && typeof user.id === 'number'

    const whereClause = includeUserData
      ? { OR: [{ isPublic: true }, { userId: user.id }], isActive: true }
      : { isPublic: true, isActive: true }

    const data = await prisma[modelName].findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        Character: {
          select: {
            id: true,
            name: true,
            artPrompt: true,
            class: true,
            species: true,
          },
        },
        Dream: {
          select: { id: true, title: true, artPrompt: true, description: true },
        },
        Scenario: {
          select: { id: true, title: true, artPrompt: true, description: true },
        },
        Pitch: {
          select: { id: true, title: true, pitch: true, flavorText: true },
        },
        Reward: {
          select: {
            id: true,
            label: true,
            text: true,
            rarity: true,
            rewardType: true,
          },
        },
        ArtImage: {
          select: { id: true, imagePath: true, thumbnailData: true },
        },
      },
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
