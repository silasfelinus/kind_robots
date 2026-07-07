// /server/utils/syncFolderCollection.ts
//
// Shared "materialize a folder into a real DB ArtCollection" routine, used by
// both POST /api/art/collection/folder/[slug]/sync (one slug) and
// POST /api/art/collection/folders/sync (every folder at once). A folder under
// public/images/ whose name matches a slug IS that slug's collection
// (Silas, 2026-07-04); this ensures the ArtCollection row exists at that slug
// and creates a lightweight ArtImage row (imagePath -> the public URL, no
// imageData) for every folder image not already linked.
//
// Idempotent and keyed on the unique slug: re-running only adds images that
// appeared since last time, never duplicates an image (dedup by imagePath), and
// never creates a second collection for the same folder.
import prisma from '~/server/utils/prisma'
import { resolveFolderImages, folderPathFromImageUrl } from './folderCollections'

// ArtImage.imagePath is the default VarChar(191) (unlike `path`/`fileName`,
// which are VarChar(764)). A deeply-nested long slug URL can exceed 191 chars
// and would throw on insert, failing the whole sync. We guard by skipping any
// URL that would overflow and reporting it, rather than crashing (t-017).
export const MAX_IMAGE_PATH = 191

export type FolderSyncResult = {
  slug: string
  collectionId: number
  total: number
  created: number
  alreadyPresent: number
  skipped: number
  createdCollection: boolean
}

function labelFromSlug(slug: string): string {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function fileNameFromUrl(url: string): string {
  const name = url.split('/').pop() || url
  return name.slice(0, 764)
}

function fileTypeFromUrl(url: string): string {
  return url.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] || 'png'
}

/**
 * Ensure the folder collection for `slug` exists in the DB and its images are
 * linked. Returns null when the folder has no images (nothing to sync). Pass
 * `preresolvedImages` to skip a re-fetch when the caller already listed them
 * (the bulk endpoint gets them for free from listFolderCollections).
 */
export async function syncFolderCollection(
  slug: string,
  origin: string,
  userId: number,
  preresolvedImages?: string[],
): Promise<FolderSyncResult | null> {
  const images = preresolvedImages ?? (await resolveFolderImages(slug, origin))
  if (!images || images.length === 0) return null

  // Ensure the collection exists (keyed on the unique slug).
  let collection = await prisma.artCollection.findUnique({
    where: { slug },
    select: { id: true, ArtImages: { select: { id: true, imagePath: true } } },
  })

  let createdCollection = false
  if (!collection) {
    // Record the folder's parent path (from any resolved image) so nested
    // locations round-trip; null for top-level folders.
    const parentFolder = folderPathFromImageUrl(images[0])?.parentFolder ?? null
    const created = await prisma.artCollection.create({
      data: {
        slug,
        label: labelFromSlug(slug),
        description: `Folder collection synced from public/images/ (${slug}).`,
        userId,
        isPublic: true,
        ...(parentFolder ? { parentFolder } : {}),
      },
      select: { id: true },
    })
    collection = { id: created.id, ArtImages: [] }
    createdCollection = true
  }

  const existingPaths = new Set(
    collection.ArtImages.map((image) => image.imagePath).filter(
      (p): p is string => typeof p === 'string',
    ),
  )

  const toCreate = images.filter((url) => !existingPaths.has(url))

  // Split off any URL that would overflow ArtImage.imagePath (VarChar(191)) so
  // a single pathological path can't fail the whole batch insert.
  const toCreateSafe = toCreate.filter((url) => url.length <= MAX_IMAGE_PATH)
  const skipped = toCreate.length - toCreateSafe.length
  if (skipped > 0) {
    console.warn(
      `[folder-sync:${slug}] skipped ${skipped} image(s) whose imagePath exceeds ${MAX_IMAGE_PATH} chars.`,
    )
  }

  // Batch: create every new ArtImage and connect it to the collection in a
  // single nested write, instead of 2 queries per image in a loop.
  if (toCreateSafe.length > 0) {
    await prisma.artCollection.update({
      where: { id: collection.id },
      data: {
        ArtImages: {
          create: toCreateSafe.map((url) => ({
            imagePath: url,
            path: url.slice(0, 764),
            fileName: fileNameFromUrl(url),
            fileType: fileTypeFromUrl(url),
            userId,
            isPublic: true,
            designer: `folder-sync:${slug}`,
          })),
        },
      },
    })
  }

  return {
    slug,
    collectionId: collection.id,
    total: images.length,
    created: toCreateSafe.length,
    alreadyPresent: images.length - toCreate.length,
    skipped,
    createdCollection,
  }
}
