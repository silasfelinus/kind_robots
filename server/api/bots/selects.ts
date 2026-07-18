// /server/api/bots/selects.ts
import type { Prisma } from '~/prisma/generated/prisma/client'

export const botMutationSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  BotType: true,
  name: true,
  slug: true,
  subtitle: true,
  description: true,
  avatarImage: true,
  imagePath: true,
  botIntro: true,
  userIntro: true,
  prompt: true,
  trainingPath: true,
  theme: true,
  personality: true,
  modules: true,
  sampleResponse: true,
  tagline: true,
  narrativeVoice: true,
  forgeIntro: true,
  chatBorderImage: true,
  designer: true,
  userId: true,
  serverId: true,
  serverName: true,
  artImageId: true,
  isPublic: true,
  underConstruction: true,
  canDelete: true,
  isMature: true,
  isActive: true,
  artPrompt: true,
} satisfies Prisma.BotSelect

export type BotMutationResult = Prisma.BotGetPayload<{
  select: typeof botMutationSelect
}>
