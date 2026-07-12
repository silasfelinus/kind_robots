// /server/api/achievements/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import type { Prisma, Achievement } from '~/prisma/generated/prisma/client'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'
import { slugify } from '~/utils/slugify'

export default defineEventHandler(async (event) => {
  let response

  try {
    // Read and validate the achievements data from the request body
    const achievementsData: Partial<Achievement>[] = await readBody(event)

    if (!Array.isArray(achievementsData)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid JSON body. Expected an array of achievements.',
      })
    }

    // Create achievements in batch and retrieve results
    const { createdAchievements, errors } =
      await createAchievementsBatch(achievementsData)

    // Prepare the response based on the presence of errors
    if (errors.length > 0) {
      response = {
        success: false,
        message: 'Some achievements could not be created.',
        data: createdAchievements, // Ensure `data` is an array
        errors,
        statusCode: 400,
      }
    } else {
      response = {
        success: true,
        message: 'All achievements created successfully.',
        data: createdAchievements, // Ensure `data` is an array
        statusCode: 201,
      }
    }
    event.node.res.statusCode = response.statusCode
  } catch (error) {
    const handledError = errorHandler(error)
    console.error('Error creating achievements:', handledError)

    // Set the response and status code based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to create achievements.',
      data: [], // Ensure `data` is always returned as an array, even on error
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

// Function to create achievements in batch and return the created records
async function createAchievementsBatch(
  achievementsData: Partial<Achievement>[],
): Promise<{ createdAchievements: Achievement[]; errors: string[] }> {
  const errors: string[] = []
  const createdAchievements: Achievement[] = []

  for (const data of achievementsData) {
    if (!isValidAchievementData(data)) {
      errors.push(
        `Achievement with label "${data.label || 'undefined'}" is missing required fields.`,
      )
      continue
    }

    try {
      const achievement = await prisma.achievement.create({
        data: {
          ...(data as Prisma.AchievementCreateInput),
          // triggerCode is the unique trigger key — enforce canonical slug form
          triggerCode: slugify(String(data.triggerCode)),
        },
      })
      createdAchievements.push(achievement)
    } catch (error) {
      errors.push(
        `Failed to create achievement with label "${data.label}". Error: ${(error as Error).message}`,
      )
    }
  }

  return { createdAchievements, errors }
}

// Helper function to check required fields for achievement creation
function isValidAchievementData(data: Partial<Achievement>): boolean {
  return Boolean(data.label && data.message && data.triggerCode && data.icon)
}
