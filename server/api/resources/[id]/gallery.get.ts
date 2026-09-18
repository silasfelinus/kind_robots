// /server/api/resources/[id]/gallery.get.ts
//
// Every image that belongs to a Resource, not just the one on its card.
//
// Silas, 2026-09-17: "we are only seeing a single resource image when we should
// see any that are made with that resource, including civitai image(s)."
//
// A Resource's art arrives by four different routes and the card only ever drew
// the first:
//
//   preview     Resource.artImageId -- the art generated FOR this resource,
//               what resource-card.vue shows
//   civitai     Resource.previewImageUrl -- the upstream preview, a URL rather
//               than an ArtImage row, so it has no id and cannot be deleted or
//               reacted to here. Shown, never owned.
//   lora        ArtImage.LoraResources -- every image this LoRA was used in.
//               The relation has existed all along (ArtImageLoraResources) and
//               nothing read it back from the Resource side.
//   checkpoint  ArtImage.checkpointResourceId -- the same, for a CHECKPOINT
//               row rather than a LoRA.
//   entity      EntityArtImage -- the generic per-object art history the other
//               managers mount, which `resource` has always been a valid type
//               for.
//
// One image can arrive by several routes at once (a probe is both the preview
// and a lora use), so rows are deduped by id and carry every origin that
// claimed them -- the UI groups by origin without fetching anything twice.
import { defineEventHandler, createError, getRouterParam } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { getOptionalApiUser } from '~/server/utils/authGuard'
import { canView, viewerShowsMature } from '~/server/utils/contentAccess'
import {
  buildArtImageWhere,
  getArtImageAccessContext,
} from '~/server/utils/artImageAccess'
import { listEntityArtHistory } from '~/server/utils/entityArt'

export type ResourceArtOrigin = 'preview' | 'lora' | 'checkpoint' | 'entity'

/** How many generated images to return per origin. */
const MAX_PER_ORIGIN = 120

const gallerySelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  fileName: true,
  fileType: true,
  imagePath: true,
  path: true,
  thumbnailPath: true,
  cardPath: true,
  promptString: true,
  negativePrompt: true,
  artPrompt: true,
  checkpoint: true,
  checkpointResourceId: true,
  seed: true,
  steps: true,
  cfg: true,
  designer: true,
  isPublic: true,
  isMature: true,
}

export default defineEventHandler(async (event) => {
  const resourceId = Number(getRouterParam(event, 'id'))

  try {
    if (!Number.isInteger(resourceId) || resourceId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Resource ID. It must be a positive integer.',
      })
    }

    const auth = await getOptionalApiUser(event)
    const resource = await prisma.resource.findFirst({
      where: { id: resourceId, isActive: true },
      select: {
        id: true,
        name: true,
        userId: true,
        isPublic: true,
        isMature: true,
        artImageId: true,
        previewImageUrl: true,
        resourceType: true,
      },
    })

    if (!resource) {
      throw createError({ statusCode: 404, message: 'Resource not found.' })
    }

    /*
     * Same gate as /api/resources/:id -- a gallery of a resource you may not
     * see is the resource, in pictures.
     */
    const isAdmin = auth?.isAdmin ?? false
    const allowed = await canView(
      { id: resource.id, userId: resource.userId, isPublic: resource.isPublic },
      'RESOURCE',
      auth ? { id: auth.user.id, isAdmin } : null,
    )
    /*
     * One rule, no admin carve-out: logged in, not a CHILD, opted in. The
     * `!isAdmin` bypass here meant an admin with their own maturity toggle OFF
     * still received mature resources -- privilege standing in for preference.
     * An admin who wants to see mature content turns the toggle on like anyone.
     */
    const matureBlocked = resource.isMature && !viewerShowsMature(auth?.user)

    if (!allowed || matureBlocked) {
      throw createError({ statusCode: 404, message: 'Resource not found.' })
    }

    // The images themselves carry their own visibility, independent of the
    // resource's: a private image of someone else's does not become visible by
    // having been made with a public LoRA.
    const access = await getArtImageAccessContext(event)
    const visible = buildArtImageWhere(access)

    const [preview, loraUses, checkpointUses, entityHistory] =
      await Promise.all([
        resource.artImageId
          ? prisma.artImage.findFirst({
              where: { AND: [{ id: resource.artImageId }, visible] },
              select: gallerySelect,
            })
          : null,
        prisma.artImage.findMany({
          where: {
            AND: [{ LoraResources: { some: { id: resourceId } } }, visible],
          },
          select: gallerySelect,
          orderBy: { createdAt: 'desc' },
          take: MAX_PER_ORIGIN,
        }),
        prisma.artImage.findMany({
          where: { AND: [{ checkpointResourceId: resourceId }, visible] },
          select: gallerySelect,
          orderBy: { createdAt: 'desc' },
          take: MAX_PER_ORIGIN,
        }),
        listEntityArtHistory(prisma, 'resource', resourceId),
      ])

    type GalleryRow = Record<string, unknown> & {
      id: number
      origins: ResourceArtOrigin[]
    }

    const byId = new Map<number, GalleryRow>()

    const add = (
      row: Record<string, unknown> & { id: number },
      origin: ResourceArtOrigin,
    ) => {
      const existing = byId.get(row.id)
      if (existing) {
        if (!existing.origins.includes(origin)) existing.origins.push(origin)
        return
      }
      byId.set(row.id, { ...row, origins: [origin] })
    }

    if (preview) add(preview, 'preview')
    for (const row of loraUses) add(row, 'lora')
    for (const row of checkpointUses) add(row, 'checkpoint')

    /*
     * The entity history is already access-checked by its own link table, but
     * it selects a different shape and does not run buildArtImageWhere -- so
     * only rows already present, or ones passing the same visibility query,
     * are merged in. Cheaper than re-querying: the ids are in hand.
     */
    const historyIds = entityHistory
      .map((row: { id: number }) => row.id)
      .filter((id: number) => !byId.has(id))

    if (historyIds.length) {
      const rows = await prisma.artImage.findMany({
        where: { AND: [{ id: { in: historyIds } }, visible] },
        select: gallerySelect,
        orderBy: { createdAt: 'desc' },
      })
      for (const row of rows) add(row, 'entity')
    } else {
      for (const row of entityHistory) {
        if (byId.has(row.id)) add({ id: row.id }, 'entity')
      }
    }

    const images = Array.from(byId.values()).sort((a, b) => {
      // The preview first -- it is the card's image and the obvious anchor --
      // then newest first.
      const aPreview = a.origins.includes('preview') ? 1 : 0
      const bPreview = b.origins.includes('preview') ? 1 : 0
      if (aPreview !== bPreview) return bPreview - aPreview

      const aAt = new Date(String(a.createdAt ?? 0)).getTime()
      const bAt = new Date(String(b.createdAt ?? 0)).getTime()
      return bAt - aAt
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: `Loaded ${images.length} image(s) for ${resource.name}.`,
      data: {
        resourceId: resource.id,
        resourceType: resource.resourceType,
        // A URL, not a row: Civitai's own preview, which this site never owned.
        civitaiPreviewUrl: resource.previewImageUrl || null,
        images,
        counts: {
          total: images.length,
          lora: loraUses.length,
          checkpoint: checkpointUses.length,
        },
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to load resource gallery.',
      data: null,
      statusCode,
    }
  }
})
