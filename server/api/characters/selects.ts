// /server/api/characters/selects.ts
import type { Prisma } from '~/prisma/generated/prisma/client'

export const characterMutationSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  name: true,
  achievements: true,
  alignment: true,
  experience: true,
  level: true,
  class: true,
  species: true,
  backstory: true,
  drive: true,
  quirks: true,
  genre: true,
  artImageId: true,
  isPublic: true,
  userId: true,
  artPrompt: true,
  honorific: true,
  imagePath: true,
  designer: true,
  personality: true,
  sampleResponse: true,
  voice: true,
  isMature: true,
  isActive: true,
  charm: true,
  empathy: true,
  grace: true,
  luck: true,
  might: true,
  presentation: true,
  role: true,
  title: true,
  wits: true,
  gender: true,
  slug: true,
} satisfies Prisma.CharacterSelect

export type CharacterMutationResult = Prisma.CharacterGetPayload<{
  select: typeof characterMutationSelect
}>
