// /server/api/scenarios/selects.ts
import type { Prisma } from '~/prisma/generated/prisma/client'

export const scenarioMutationSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  title: true,
  description: true,
  intros: true,
  userId: true,
  artImageId: true,
  imagePath: true,
  locations: true,
  artPrompt: true,
  genres: true,
  inspirations: true,
  isMature: true,
  isPublic: true,
  isActive: true,
  difficulty: true,
  group: true,
  secretNotes: true,
  tier: true,
  cast: true,
  outputType: true,
  slug: true,
} satisfies Prisma.ScenarioSelect

export type ScenarioMutationResult = Prisma.ScenarioGetPayload<{
  select: typeof scenarioMutationSelect
}>
