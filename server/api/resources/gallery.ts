import type { Prisma } from '~/prisma/generated/prisma/client'

export const resourcePreviewArtImageSelect = {
  id: true,
  imagePath: true,
  path: true,
  thumbnailPath: true,
  fileName: true,
  fileType: true,
  isMature: true,
} satisfies Prisma.ArtImageSelect

export const resourceGallerySelect = {
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
  triggerWords: true,
  defaultTrigger: true,
  hash: true,
  previewImageUrl: true,
  imagePath: true,
  slug: true,
  ArtImage: {
    select: resourcePreviewArtImageSelect,
  },
  _count: {
    select: {
      ArtImages: true,
      UsedInImages: true,
    },
  },
} satisfies Prisma.ResourceSelect

export type ResourceGalleryRecord = Prisma.ResourceGetPayload<{
  select: typeof resourceGallerySelect
}>

export function resourceGalleryWhere(options: {
  userId: number | null
  isAdmin: boolean
  showMature: boolean
}): Prisma.ResourceWhereInput {
  const where: Prisma.ResourceWhereInput = {
    isActive: true,
  }

  if (!options.isAdmin) {
    where.OR = options.userId
      ? [{ isPublic: true }, { userId: options.userId }]
      : [{ isPublic: true }]
  }

  if (!options.isAdmin && !options.showMature) {
    where.isMature = false
  }

  return where
}
