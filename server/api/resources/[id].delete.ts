// /server/api/resources/[id].delete.ts
import { defineEventHandler, createError, getQuery, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'

/**
 * Was `cascadeImages` asked for? Accepted from the query string or a JSON body,
 * because DELETE with a body is awkward from some callers and this is the kind
 * of switch people reach for from a URL.
 */
async function readCascadeFlag(event: Parameters<typeof getQuery>[0]) {
  const query = getQuery(event)
  const raw = query.cascade ?? query.cascadeImages

  if (raw !== undefined) {
    const normalized = String(Array.isArray(raw) ? raw[0] : raw)
      .trim()
      .toLowerCase()
    return ['1', 'true', 'yes', 'images'].includes(normalized)
  }

  try {
    const body = await readBody(event)
    return body?.cascadeImages === true || body?.cascade === true
  } catch {
    return false
  }
}

export default defineEventHandler(async (event) => {
  let response
  let resourceId: number | null = null

  try {
    resourceId = Number(event.context.params?.id)

    if (Number.isNaN(resourceId) || resourceId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Resource ID. It must be a positive integer.',
      })
    }

    const { user, isAdmin } = await requireApiUser(event)

    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      select: { userId: true, name: true },
    })

    if (!resource) {
      throw createError({
        statusCode: 404,
        message: `Resource with ID ${resourceId} does not exist.`,
      })
    }

    if (!isAdmin && resource.userId !== user.id) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this resource.',
      })
    }

    const cascadeImages = await readCascadeFlag(event)
    let deletedImages = 0
    let keptImages = 0

    if (cascadeImages) {
      /*
       * Silas, 2026-09-17: "we should also be able to delete resources, with
       * the option to cascade them to the generated image(s)."
       *
       * Every image this resource produced: the generated preview, everything
       * rendered WITH it as a LoRA, everything rendered ON it as a checkpoint,
       * and its entity art history. The Civitai preview is a URL on the
       * Resource row rather than an ArtImage, so it goes with the row itself
       * and is not counted here.
       *
       * PERMISSION IS PER IMAGE, NOT PER RESOURCE. Owning a LoRA does not mean
       * owning what other people rendered with it, and a public LoRA can have
       * hundreds of those. Images the caller may not delete are counted and
       * left alone rather than silently taken or silently skipped -- the
       * response says how many of each, so "delete the images too" never
       * quietly means "delete some of the images too".
       */
      const candidates = await prisma.artImage.findMany({
        where: {
          OR: [
            { LoraResources: { some: { id: resourceId } } },
            { checkpointResourceId: resourceId },
            { Resources: { some: { id: resourceId } } },
            {
              EntityArtLinks: {
                some: { entityType: 'resource', entityId: resourceId },
              },
            },
          ],
        },
        select: { id: true, userId: true },
      })

      const deletable = candidates
        .filter((image) => isAdmin || image.userId === user.id)
        .map((image) => image.id)

      keptImages = candidates.length - deletable.length

      if (deletable.length) {
        const result = await prisma.artImage.deleteMany({
          where: { id: { in: deletable } },
        })
        deletedImages = result.count
      }
    }

    await prisma.resource.delete({ where: { id: resourceId } })

    const cascadeNote = cascadeImages
      ? ` ${deletedImages} image(s) deleted` +
        (keptImages ? `, ${keptImages} left in place (not yours).` : '.')
      : ''

    response = {
      success: true,
      message: `Resource with ID ${resourceId} successfully deleted.${cascadeNote}`,
      data: { cascadeImages, deletedImages, keptImages },
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message ||
        `Failed to delete resource with ID ${resourceId}.`,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
