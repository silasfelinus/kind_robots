import type { Prisma, Reward } from '@prisma/client'
import prisma from '../utils/prisma'

// Function to create a new Reward
export function createReward(reward: Partial<Reward>): Promise<Reward> {
  // Validate required fields
  if (!reward.text || !reward.power || !reward.icon) {
    throw new Error('Text, power, and icon must be provided')
  }

  // Create the new Reward
  return prisma.reward.create({
    data: {
      text: reward.text,
      power: reward.power,
      icon: reward.icon,
      collection: reward.collection || 'genesis',
      rarity: reward.rarity || 50,
      // Add other fields if necessary
    },
  })
}

// Function to update a Reward by its ID using Prisma's built-in types
export const updateRewardById = async (
  id: number,
  data: Prisma.RewardUpdateInput,
) => {
  try {
    const reward = await prisma.reward.update({
      where: { id },
      data,
    })
    return reward
  } catch (error) {
    throw new Error(
      `Error updating Reward with ID ${id}: ${(error as Error).message}`,
    )
  }
}

// Function to update an existing Reward by ID
export function updateReward(
  id: number,
  updatedReward: Prisma.RewardUpdateInput,
): Promise<Reward | null> {
  return prisma.reward.update({
    where: { id },
    data: updatedReward,
  })
}

// Function to create multiple Rewards in a batch
export async function createRewardsBatch(
  rewardsData: Partial<Reward>[],
): Promise<{ count: number; rewards: Reward[]; errors: string[] }> {
  const errors: string[] = []

  // Validate and filter the rewards
  const data: Prisma.RewardCreateManyInput[] = rewardsData
    .filter((rewardData) => {
      if (!rewardData.text || !rewardData.power || !rewardData.icon) {
        errors.push(
          `Reward with text ${rewardData.text}, power ${rewardData.power}, and icon ${rewardData.icon} is incomplete.`,
        )
        return false
      }
      return true
    })
    .map((rewardData) => rewardData as Prisma.RewardCreateManyInput)

  // Create the rewards in a batch
  const result = await prisma.reward.createMany({
    data,
    skipDuplicates: true, // Skip duplicate records based on constraints
  })

  // Fetch the newly created rewards
  const rewards = await prisma.reward.findMany()

  return { count: result.count, rewards, errors }
}

export type { Reward }
