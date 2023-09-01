// /server/api/rewards/index.ts

import { Reward } from '@prisma/client'
import prisma from '../utils/prisma'

// Function to create a new Reward
export async function createReward(data: Partial<Reward>): Promise<Reward> {
  // Validate required fields
  if (!data.icon || !data.text) {
    throw new Error('Both Icon and Text must be provided')
  }

  // Check for unique text (since icon is no longer unique)
  const existingReward = await prisma.reward.findFirst({
    where: { text: data.text }
  })

  if (existingReward) {
    throw new Error(`A reward with the text "${data.text}" already exists`)
  }

  // Create the new Reward
  return prisma.reward.create({
    data: {
      icon: data.icon,
      text: data.text,
      power: data.power ?? '',
      collection: data.collection ?? 'genesis',
      rarity: data.rarity ?? 50
    }
  })
}

// Function to add multiple Rewards
export async function addRewards(
  rewardsData: Partial<Reward>[]
): Promise<{ count: number; rewards: Reward[]; errors: string[] }> {
  const errors: string[] = []
  const rewards: Reward[] = []

  for (const rewardData of rewardsData) {
    try {
      const newReward = await createReward(rewardData)
      rewards.push(newReward)
    } catch (error: any) {
      errors.push(`Failed to create reward: ${error.message}`)
    }
  }

  return { count: rewards.length, rewards, errors }
}

// Fetch all Rewards
export async function fetchAllRewards(): Promise<Reward[]> {
  return prisma.reward.findMany()
}
// Delete a Todo
export async function deleteReward(id: number): Promise<boolean> {
  const rewardExists = await prisma.reward.findUnique({ where: { id } })

  if (!rewardExists) {
    return false
  }

  await prisma.reward.delete({ where: { id } })
  return true
}
