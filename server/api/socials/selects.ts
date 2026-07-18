// /server/api/socials/selects.ts
import type { Prisma } from '~/prisma/generated/prisma/client'

export const socialTargetMutationSelect = {
  id: true,
  postId: true,
  platform: true,
  status: true,
} satisfies Prisma.SocialTargetSelect

export const socialPostMutationSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  designer: true,
  title: true,
  body: true,
  mediaUrls: true,
  status: true,
  sourceType: true,
  sourceId: true,
  scheduledAt: true,
  isPublic: true,
  userId: true,
  isActive: true,
  isMature: true,
  audience: true,
  targets: {
    orderBy: { platform: 'asc' },
    select: socialTargetMutationSelect,
  },
} satisfies Prisma.SocialPostSelect

export type SocialPostMutationResult = Prisma.SocialPostGetPayload<{
  select: typeof socialPostMutationSelect
}>
