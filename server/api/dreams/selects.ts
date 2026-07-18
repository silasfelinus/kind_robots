// /server/api/dreams/selects.ts
import type { Prisma } from '~/prisma/generated/prisma/client'

export const dreamMutationSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  title: true,
  slug: true,
  dreamType: true,
  creationSource: true,
  description: true,
  pitch: true,
  flavorText: true,
  examples: true,
  artPrompt: true,
  imagePath: true,
  cardPath: true,
  heroPath: true,
  highlightImage: true,
  icon: true,
  designer: true,
  allowReviews: true,
  userId: true,
  artImageId: true,
  artCollectionId: true,
  isPublic: true,
  isMature: true,
  isActive: true,
} satisfies Prisma.DreamSelect

export type DreamMutationResult = Prisma.DreamGetPayload<{
  select: typeof dreamMutationSelect
}>
