// /server/api/projects/selects.ts
import type { Prisma } from '~/prisma/generated/prisma/client'

export const projectMutationSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  title: true,
  slug: true,
  description: true,
  pitch: true,
  flavorText: true,
  goal: true,
  status: true,
  priority: true,
  conductorSlug: true,
  repoUrl: true,
  liveUrl: true,
  channelKey: true,
  tabKey: true,
  lastSyncedAt: true,
  allowReviews: true,
  highlightImage: true,
  icon: true,
  imagePath: true,
  cardPath: true,
  heroPath: true,
  designer: true,
  creationSource: true,
  userId: true,
  managerBotId: true,
  artImageId: true,
  artCollectionId: true,
  isPublic: true,
  isMature: true,
  isActive: true,
} satisfies Prisma.ProjectSelect

export type ProjectMutationResult = Prisma.ProjectGetPayload<{
  select: typeof projectMutationSelect
}>
