// /server/api/prompts/selects.ts
import type { Prisma } from '~/prisma/generated/prisma/client'

export const promptResourceSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  prompt: true,
  userId: true,
  botId: true,
  artImageId: true,
  creationSource: true,
  isMature: true,
  isPublic: true,
  isActive: true,
  artPrompt: true,
  imagePath: true,
  serverId: true,
  artStatus: true,
  batchId: true,
  batchIndex: true,
  queuePosition: true,
  startedAt: true,
  completedAt: true,
  errorMessage: true,
  notifiedAt: true,
  isBounty: true,
  bountyStatus: true,
  claimerId: true,
} satisfies Prisma.PromptSelect

export type PromptResource = Prisma.PromptGetPayload<{
  select: typeof promptResourceSelect
}>
