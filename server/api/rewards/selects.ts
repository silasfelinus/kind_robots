// /server/api/rewards/selects.ts
import type { Prisma } from '~/prisma/generated/prisma/client'

export const rewardMutationSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  icon: true,
  collection: true,
  rarity: true,
  userId: true,
  artImageId: true,
  imagePath: true,
  isMature: true,
  isPublic: true,
  isActive: true,
  artPrompt: true,
  rewardType: true,
  description: true,
  effect: true,
  flavorText: true,
  name: true,
  slug: true,
} satisfies Prisma.RewardSelect

export type RewardMutationResult = Prisma.RewardGetPayload<{
  select: typeof rewardMutationSelect
}>
