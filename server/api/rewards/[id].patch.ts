// /server/api/rewards/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import { updateRewardById } from './index'
import { errorHandler } from '../utils/error'
import { verifyJwtToken } from '../auth'
import type { Reward } from '@prisma/client'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  let id: number | null = null

  try {
    // Parse and validate the reward ID from the URL params
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid ID format.',
      })
    }

    // Extract and validate the JWT token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const verificationResult = await verifyJwtToken(token)
    if (!verificationResult || !verificationResult.userId) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = verificationResult.userId // Use userId from the token

    // Parse the request body as partial Reward data
    const body: Partial<Reward> = await readBody(event)

    // Fetch the existing reward to ensure it exists
    const existingReward = await prisma.reward.findUnique({ where: { id } })
    if (!existingReward) {
      throw createError({
        statusCode: 404,
        message: 'Reward not found.',
      })
    }

    // (Optional) Check if the user has permissions to update this reward
    if (existingReward.userId !== userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this reward.',
      })
    }

    // Update the reward in the database
    const updatedReward = await updateRewardById(id, body)

    if (!updatedReward) {
      throw createError({
        statusCode: 404,
        message: 'Reward not found or could not be updated.',
      })
    }

    return { success: true, reward: updatedReward }
  } catch (error: unknown) {
    // Use errorHandler for consistent error handling
    return errorHandler({
      error,
      context: `Updating reward with ID ${id}`,
    })
  }
})
