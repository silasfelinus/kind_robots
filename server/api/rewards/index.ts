//server/api/rewards/index.ts
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

// Function to update an existing Reward by ID
export function updateReward(
  id: number,
  updatedReward: Partial<Reward>,
): Promise<Reward | null> {
  return prisma.reward.update({
    where: { id },
    data: updatedReward,
  })
}

// Function to delete a Reward by ID
export async function deleteReward(id: number): Promise<boolean> {
  const rewardExists = await prisma.reward.findUnique({ where: { id } })

  if (!rewardExists) {
    return false
  }

  await prisma.reward.delete({ where: { id } })
  return true
}

// Function to fetch all Rewards
export function fetchAllRewards(): Promise<Reward[]> {
  return prisma.reward.findMany()
}

// Function to fetch a single Reward by ID
export function fetchRewardById(id: number): Promise<Reward | null> {
  return prisma.reward.findUnique({
    where: { id },
  })
}

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
