// /server/api/compositions/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'

export default defineEventHandler(async (event) => {
  const modelName = 'composition'
  const paramName = 'id'
  let id = 0

  try {
    id = Number(event.context.params?.[paramName])

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: `Invalid ${modelName} ID.`,
      })
    }

    const data = await prisma.composition.findUnique({
      where: { id },
      include: {
        Character: {
          select: {
            id: true,
            name: true,
            artPrompt: true,
            class: true,
            species: true,
            backstory: true,
            drive: true,
            quirks: true,
          },
        },
        Dream: {
          select: {
            id: true,
            title: true,
            dreamType: true,
            pitch: true,
            artPrompt: true,
            description: true,
            flavorText: true,
          },
        },
        Scenario: {
          select: {
            id: true,
            title: true,
            artPrompt: true,
            description: true,
            intros: true,
            locations: true,
          },
        },
        Reward: {
          select: {
            id: true,
            name: true,
            description: true,
            flavorText: true,
            effect: true,
            icon: true,
            collection: true,
            rarity: true,
            rewardType: true,
            imagePath: true,
            artPrompt: true,
            isPublic: true,
            isMature: true,
          },
        },
        ArtImage: {
          select: {
            id: true,
            imagePath: true,
            fileName: true,
            thumbnailData: true,
          },
        },
      },
    })

    if (!data) {
      throw createError({
        statusCode: 404,
        message: `${modelName} with ID ${id} not found.`,
      })
    }

    event.node.res.statusCode = 200

    return {
      success: true,
      message: `${modelName} fetched successfully.`,
      data,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)

    console.error(`Error fetching ${modelName}:`, handled)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || `Failed to fetch ${modelName} with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }
})
