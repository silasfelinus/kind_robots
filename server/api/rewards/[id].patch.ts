// /server/api/rewards/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'
import type { Reward } from '@prisma/client'

export default defineEventHandler(async (event) => {
  const rewardId = Number(event.context.params?.id)

  try {
    // Validate Reward ID
    if (isNaN(rewardId) || rewardId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Reward ID. It must be a positive integer.',
      })
    }

    // Use validateApiKey to authenticate
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      event.node.res.statusCode = 401 // Set HTTP status code to 401 Unauthorized
      return {
        success: false,
        message: 'Invalid or expired token.',
      }
    }

    // Verify Reward Ownership
    const existingReward = await prisma.reward.findUnique({
      where: { id: rewardId },
      select: { userId: true },
    })
    if (!existingReward) {
      event.node.res.statusCode = 404 // Set HTTP status code to 404 Not Found
      return {
        success: false,
        message: `Reward with ID ${rewardId} does not exist.`,
      }
    }
    if (existingReward.userId !== user.id) {
      event.node.res.statusCode = 403 // Set HTTP status code to 403 Forbidden
      return {
        success: false,
        message: 'You do not have permission to update this reward.',
      }
    }

    // Read and Validate Update Data
    const rewardData: Partial<Reward> = await readBody(event)
    if (!rewardData || Object.keys(rewardData).length === 0) {
      event.node.res.statusCode = 400 // Set HTTP status code to 400 Bad Request
      return {
        success: false,
        message: 'No data provided for update.',
      }
    }

    // Perform Update
    const data = await prisma.reward.update({
      where: { id: rewardId },
      data: rewardData,
    })

    // Set Success Response Status Code to 200
    event.node.res.statusCode = 200
    return {
      success: true,
      data,
    }
  } catch (error: unknown) {
    // Process Error with Error Handler
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500 // Set appropriate error status code
    return {
      success: false,
      message: message || `Failed to update reward with ID ${rewardId}.`,
    }
  }
})
