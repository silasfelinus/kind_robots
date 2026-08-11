// /server/api/rewards/random.get.ts
import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { getOptionalApiUser } from '../../utils/authGuard'
import { viewablePackIds } from '../../utils/contentAccess'

export default defineEventHandler(async (event) => {
  let response

  try {
    const auth = await getOptionalApiUser(event)
    const userId = auth?.user.id ?? null
    const isAdmin = auth?.isAdmin ?? false
    const packIds = userId && !isAdmin ? await viewablePackIds(userId) : []

    const visibility = isAdmin
      ? {}
      : userId
        ? {
            OR: [
              { isPublic: true },
              { userId },
              ...(packIds.length ? [{ packId: { in: packIds } }] : []),
            ],
          }
        : { isPublic: true }

    const where = { isActive: true, ...visibility }

    // Count the total number of viewable rewards
    const totalRewards = await prisma.reward.count({ where })

    if (totalRewards === 0) {
      return {
        success: false,
        message: 'No rewards available in the database.',
        statusCode: 404,
      }
    }

    // Generate a random offset to pick a reward
    const randomOffset = Math.floor(Math.random() * totalRewards)

    // Fetch a random reward from the database
    const randomReward = await prisma.reward.findFirst({
      where,
      skip: randomOffset,
      take: 1,
    })

    if (!randomReward) {
      return {
        success: false,
        message: 'No reward found after random selection.',
        statusCode: 404,
      }
    }

    response = {
      success: true,
      reward: randomReward,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error(`Error fetching random reward: ${errorMessage}`)

    response = {
      success: false,
      message: `Failed to fetch random reward: ${errorMessage}`,
      statusCode: 500,
    }
  }

  return response
})
