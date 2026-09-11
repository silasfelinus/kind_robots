// /server/api/art/entities/[entityType]/[id]/promote.post.ts
import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import {
  applyEntityArtImage,
  listEntityArtHistory,
  listEntityArtSlots,
  resolveEntityArtTarget,
  slotArtImageIdField,
} from '~/server/utils/entityArt'

type PromoteBody = {
  field?: string
  artImageId?: number | string
  preserveOriginal?: boolean
}

/**
 * Make an image the entity's current art for a slot without regenerating it.
 *
 * Silas, 2026-09-11: "I should be able to set one of the inspiration images to
 * be the main image, but that doesn't seem to be an option". Every path into a
 * slot went through a render or an upload, so an image already sitting in the
 * inspiration gallery -- including the ones the slot collapse left behind in
 * the retired card and hero columns -- could only be reinstated by uploading
 * it again from disk.
 *
 * The candidate has to already be reachable from this entity, so promoting
 * cannot pull an arbitrary ArtImage row in by id: either it is in this
 * entity's inspiration history, or it is the current image of one of the
 * entity's own slots (which is what makes "use the old hero as the main
 * image" work).
 */
export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const entityType = getRouterParam(event, 'entityType')
    const id = getRouterParam(event, 'id')
    const body = await readBody<PromoteBody>(event)
    const artImageId = Number(body?.artImageId)
    if (!Number.isInteger(artImageId) || artImageId <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid image ID.' })
    }

    const target = await resolveEntityArtTarget(
      prisma,
      entityType,
      id,
      body?.field,
      auth,
    )
    if (target.config.retired) {
      throw createError({
        statusCode: 400,
        message:
          `The ${target.config.label} slot is no longer generated, so it cannot be set as ` +
          'the main image. Promote into the primary slot instead.',
      })
    }

    const link = await prisma.entityArtImage.findUnique({
      where: {
        entityType_entityId_artImageId: {
          entityType: target.entityType,
          entityId: target.entityId,
          artImageId,
        },
      },
      select: { artImageId: true },
    })
    if (!link && !holdsArtImage(target.record, artImageId, target.entityType)) {
      throw createError({
        statusCode: 404,
        message: 'That image is not part of this item’s artwork.',
      })
    }

    if (currentSlotArtImageId(target.record, target.field) === artImageId) {
      throw createError({
        statusCode: 409,
        message: `That image is already the current ${target.config.label.toLowerCase()}.`,
      })
    }

    const preserveOriginal = body?.preserveOriginal !== false
    const result = await prisma.$transaction((tx) =>
      applyEntityArtImage(tx, {
        entityType: target.entityType,
        entityId: target.entityId,
        field: target.field,
        artImageId,
        preserveOriginal,
      }),
    )
    const history = await listEntityArtHistory(
      prisma,
      target.entityType,
      target.entityId,
    )

    return {
      success: true,
      message: preserveOriginal
        ? `${target.config.label} updated; the previous image was kept as inspiration.`
        : `${target.config.label} updated without retaining the previous image.`,
      data: {
        entity: result.entity,
        history,
        artImageId,
        archivedArtImageId: result.archivedArtImageId,
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to set that image as the main image.',
      data: null,
      statusCode,
    }
  }
})

const IMAGE_API_PATTERN = /\/api\/art\/images\/(\d+)\/file/

/*
 * Mirrors entityArt.ts's own resolution order: the slot's id column first, the
 * id embedded in an /api/art/images/<id>/file path second (rows the 2026-08-06
 * backfill has not reached), and the record's primary artImageId only for the
 * primary field.
 */
function currentSlotArtImageId(
  record: Record<string, unknown>,
  field: string,
): number | null {
  const slotField = slotArtImageIdField(field)
  const columnId = Number(slotField ? record[slotField] : record.artImageId)
  if (Number.isInteger(columnId) && columnId > 0) return columnId
  const path =
    typeof record[field] === 'string' ? (record[field] as string) : ''
  const embedded = Number(path.match(IMAGE_API_PATTERN)?.[1])
  return Number.isInteger(embedded) && embedded > 0 ? embedded : null
}

function holdsArtImage(
  record: Record<string, unknown>,
  artImageId: number,
  entityType: Parameters<typeof listEntityArtSlots>[0],
): boolean {
  return listEntityArtSlots(entityType).some(
    (slot) => currentSlotArtImageId(record, slot.field) === artImageId,
  )
}
