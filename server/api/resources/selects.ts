import type { Prisma } from '~/prisma/generated/prisma/client'

export const resourceMutationSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  name: true,
  customLabel: true,
  MediaPath: true,
  customUrl: true,
  civitaiUrl: true,
  huggingUrl: true,
  localPath: true,
  description: true,
  isMature: true,
  resourceType: true,
  userId: true,
  artImageId: true,
  generation: true,
  supportedServer: true,
  isPublic: true,
  isActive: true,
  artPrompt: true,
  imagePath: true,
  slug: true,
} satisfies Prisma.ResourceSelect

export type ResourceMutationResult = Prisma.ResourceGetPayload<{
  select: typeof resourceMutationSelect
}>
