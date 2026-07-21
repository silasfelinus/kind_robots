import type { Prisma } from '~/prisma/generated/prisma/client'

// Mutation responses deliberately exclude every inline media blob. Callers that
// need pixels hydrate them through GET /api/art/image/:id with the explicit
// includeImageData/includeThumbnailData flags.
export const artImageMutationSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  fileName: true,
  fileType: true,
  imagePath: true,
  path: true,
  promptString: true,
  artPrompt: true,
  negativePrompt: true,
  checkpoint: true,
  checkpointResourceId: true,
  sampler: true,
  seed: true,
  steps: true,
  cfg: true,
  cfgHalf: true,
  designer: true,
  genres: true,
  isPublic: true,
  isMature: true,
  isActive: true,
  serverId: true,
  serverName: true,
  serverUrl: true,
  thumbnailPath: true,
  heroPath: true,
  cardPath: true,
  iconPath: true,
} satisfies Prisma.ArtImageSelect

export type ArtImageMutationRecord = Prisma.ArtImageGetPayload<{
  select: typeof artImageMutationSelect
}>
