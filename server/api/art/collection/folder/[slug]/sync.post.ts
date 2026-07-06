// /server/api/art/collection/folder/[slug]/sync.post.ts
//
// Sync a folder into a real DB ArtCollection. A folder under public/images/
// whose name matches a slug IS that slug's collection (Silas, 2026-07-04);
// this endpoint materializes that: it ensures an ArtCollection exists at the
// slug and creates a lightweight ArtImage row (imagePath -> the public URL,
// no imageData) for every folder image not already linked, then connects them.
//
// Idempotent: re-syncing only adds images that appeared since last time; it
// never duplicates an image already in the collection (dedup by imagePath).
// Machine auth (JWT / user apiKey / beta admin) so both the browser gallery
// and conductor automation can trigger it.
import {
  defineEventHandler,
  getRouterParam,
  getRequestURL,
  createError,
} from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireMachineUser } from '~/server/utils/authGuard'
import {
  resolveFolderImages,
  SLUG_PATTERN,
} from '~/server/utils/folderCollections'

// ArtImage.imagePath is the default VarChar(191) (unlike `path`/`fileName`,
// which are VarChar(764)). A deeply-nested long slug URL can exceed 191 chars
// and would throw on insert, failing the whole sync. We guard by skipping any
// URL that would overflow and reporting it, rather than crashing (t-017).
// Permanent fix is to widen the column to VarChar(764); until that migration
// lands, this keeps the endpoint safe.
const MAX_IMAGE_PATH = 191

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

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)

    const slug = String(getRouterParam(event, 'slug') || '')
      .trim()
      .toLowerCase()

    if (!SLUG_PATTERN.test(slug)) {
      throw createError({ statusCode: 400, message: 'Invalid collection slug.' })
    }

    const origin = getRequestURL(event).origin
    const images = await resolveFolderImages(slug, origin)

    if (images === null || images.length === 0) {
      throw createError({
        statusCode: 404,
        message: `No folder collection found for "${slug}" - nothing to sync.`,
      })
    }

    // Ensure the collection exists (keyed on the unique slug).
    let collection = await prisma.artCollection.findUnique({
      where: { slug },
      select: { id: true, ArtImages: { select: { id: true, imagePath: true } } },
    })

    if (!collection) {
      const created = await prisma.artCollection.create({
        data: {
          slug,
          label: labelFromSlug(slug),
          description: `Folder collection synced from public/images/ (${slug}).`,
          userId: auth.user.id,
          isPublic: true,
        },
        select: { id: true },
      })
      collection = { id: created.id, ArtImages: [] }
    }

    const existingPaths = new Set(
      collection.ArtImages.map((image) => image.imagePath).filter(
        (p): p is string => typeof p === 'string',
      ),
    )

    const toCreate = images.filter((url) => !existingPaths.has(url))

    // Split off any URL that would overflow ArtImage.imagePath (VarChar(191))
    // so a single pathological path can't fail the whole batch insert.
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
              userId: auth.user.id,
              isPublic: true,
              designer: `folder-sync:${slug}`,
            })),
          },
        },
      })
    }

    const created = toCreateSafe.length

    return {
      success: true,
      message: created
        ? `Synced ${created} new image(s) into "${slug}".${skipped ? ` Skipped ${skipped} over-long path(s).` : ''}`
        : skipped
          ? `"${slug}": nothing synced; ${skipped} image path(s) exceed the ${MAX_IMAGE_PATH}-char limit.`
          : `"${slug}" already up to date.`,
      data: {
        slug,
        collectionId: collection.id,
        total: images.length,
        created,
        alreadyPresent: images.length - toCreate.length,
        skipped,
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to sync folder collection.',
      statusCode,
    }
  }
})
