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
  civitaiModelId: true,
  civitaiModelVersionId: true,
  imagePath: true,
  slug: true,
  commercialSafe: true,
  ArtImage: {
    select: resourcePreviewArtImageSelect,
  },
  // NO `_count`. This carried `_count: { select: { ArtImages: true,
  // UsedInImages: true } }`, which made the list query emit two correlated
  // aggregates per row against ArtImage -- the most expensive thing in an
  // already-unpaginated findMany over the whole Resource table, and the
  // likeliest source of the /resources pool timeouts. What it bought was two
  // card badges reading "0 checkpoint uses / 0 LoRA uses" -- zero on every card
  // in the report Silas sent on 2026-08-08. Dropped on his call the same day.
  //
  // If per-resource usage counts return, they belong on the DETAIL fetch
  // (`[id].get.ts`) or a separate endpoint for the visible page -- not on every
  // row of the catalog listing.
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
