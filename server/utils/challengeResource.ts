// /server/utils/challengeResource.ts
import type { Prisma } from '~/prisma/generated/prisma/client'

export const challengeMutationSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  slug: true,
  title: true,
  challengeType: true,
  difficulty: true,
  promptText: true,
  judgeNotes: true,
  status: true,
  isMature: true,
  userId: true,
} satisfies Prisma.ChallengeSelect
