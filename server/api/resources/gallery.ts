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
  allowReviews: true,
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

/**
 * The LIST payload -- what a card in the grid actually draws, and nothing else.
 *
 * WHY IT IS SEPARATE FROM resourceGallerySelect. `/api/resources` is still an
 * unpaginated findMany over the whole catalog (~1,500 rows and climbing),
 * because the type and base-model dropdowns derive their options from the
 * loaded set and paginating the query would empty them. That is a defensible
 * trade only if each ROW is cheap, and it was not: the full select carried
 * ~30 columns per row including several long strings nothing in the grid
 * reads -- civitaiUrl, huggingUrl, customUrl, MediaPath, hash -- plus
 * timestamps and ids used only by the editor.
 *
 * Silas, 2026-08-08, from a tablet: "there was also a loading errors and not
 * all images every loaded ... which wasn't happening an hour ago, though then
 * was desktop and this was tablet". A payload that a desktop absorbs and a
 * tablet does not is a size problem, so this trims the row rather than the
 * row count.
 *
 * Everything dropped here is still available -- the card back hydrates the
 * full record through `/api/resources/[id]` when it opens, which is the same
 * "detail fetch, not every row" split the `_count` note below argues for.
 */
export const resourceListSelect = {
  id: true,
  name: true,
  customLabel: true,
  description: true,
  resourceType: true,
  generation: true,
  supportedServer: true,
  localPath: true,
  defaultTrigger: true,
  triggerWords: true,
  artPrompt: true,
  previewImageUrl: true,
  imagePath: true,
  isMature: true,
  isPublic: true,
  allowReviews: true,
  userId: true,
  ArtImage: {
    select: resourcePreviewArtImageSelect,
  },
} satisfies Prisma.ResourceSelect

export type ResourceListRecord = Prisma.ResourceGetPayload<{
  select: typeof resourceListSelect
}>

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
