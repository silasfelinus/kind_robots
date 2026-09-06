// /server/api/characters/selects.ts
import type { Prisma } from '~/prisma/generated/prisma/client'

/**
 * Catalog/card shape. Long-form authored Character text stays behind the by-id
 * detail route so the gallery can expose the complete index without shipping
 * every biography, prompt, voice sample, and personality block up front.
 */
export const characterBrowseSelect = {
  id: true,
  name: true,
  alignment: true,
  experience: true,
  level: true,
  class: true,
  species: true,
  genre: true,
  artImageId: true,
  isPublic: true,
  userId: true,
  packId: true,
  honorific: true,
  imagePath: true,
  icon: true,
  allowReviews: true,
  designer: true,
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
  theme: true,
} satisfies Prisma.CharacterSelect

export type CharacterBrowseResult = Prisma.CharacterGetPayload<{
  select: typeof characterBrowseSelect
}>

/**
 * Mutation responses feed selected/editing state and the rich detail cache, so
 * this select must remain the complete Character scalar model. Keeping it here
 * avoids a create/update response that TypeScript calls Character while runtime
 * silently omits newer fields (the card/hero/icon slots this once guarded were
 * retired by the entity-art slot collapse; theme and everything after it are
 * still the point).
 */
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
  packId: true,
  artPrompt: true,
  honorific: true,
  imagePath: true,
  icon: true,
  allowReviews: true,
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
  theme: true,
} satisfies Prisma.CharacterSelect

export type CharacterMutationResult = Prisma.CharacterGetPayload<{
  select: typeof characterMutationSelect
}>
