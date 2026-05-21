// @ts-nocheck
/* eslint-disable */
// test-ignore

// /server/api/compositions/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'

export default defineEventHandler(async (event) => {
  const modelName = 'composition'
  const paramName = 'id'
  let id = 0
  let response

  try {
    id = Number(event.context.params?.[paramName])
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: `Invalid ${modelName} ID.`,
      })
    }

    const data = await prisma[modelName].findUnique({
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
            artPrompt: true,
            description: true,
            currentVibe: true,
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
        Pitch: {
          select: {
            id: true,
            title: true,
            pitch: true,
            flavorText: true,
            artPrompt: true,
          },
        },
        Reward: {
          select: {
            id: true,
            label: true,
            text: true,
            power: true,
            rarity: true,
            rewardType: true,
          },
        },
        ArtImage: {
          select: { id: true, imagePath: true, thumbnailData: true },
        },
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
