import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { readComicId, requireComicSeries } from '@/server/utils/comicStudio'
import { comicArrangementDiff } from '~/utils/comicStudio'

type ArrangeBody = { entities?: unknown; slots?: unknown }
type SlotMove = { id: number; entityId?: number | null }

function idList(value: unknown): number[] {
  return Array.isArray(value)
    ? value.map(Number).filter((id) => Number.isInteger(id) && id > 0)
    : []
}

function slotMoves(value: unknown): SlotMove[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item): SlotMove => {
      const record = (item ?? {}) as Record<string, unknown>
      const id = Number(record.id)
      if (record.entityId === undefined) return { id }
      const entityId = Number(record.entityId)
      return {
        id,
        entityId:
          record.entityId !== null && Number.isInteger(entityId)
            ? entityId
            : null,
      }
    })
    .filter((row) => Number.isInteger(row.id) && row.id > 0)
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const seriesId = readComicId(event, 'series id')
    await requireComicSeries(seriesId)
    const body = (await readBody<ArrangeBody>(event)) ?? {}
    const entityOrder = idList(body.entities)
    const slotOrder = slotMoves(body.slots)
    const [entities, slots] = await Promise.all([
      prisma.comicEntity.findMany({
        where: { seriesId },
        select: { id: true, sortOrder: true },
      }),
      prisma.comicSlot.findMany({
        where: { seriesId },
        select: { id: true, sortOrder: true, entityId: true },
      }),
    ])
    const entityIds = new Set(entities.map((row) => row.id))
    const slotIds = new Set(slots.map((row) => row.id))
    if (
      entityOrder.some((id) => !entityIds.has(id)) ||
      slotOrder.some((row) => !slotIds.has(row.id)) ||
      slotOrder.some(
        (row) => row.entityId != null && !entityIds.has(row.entityId),
      )
    ) {
      throw createError({
        statusCode: 400,
        message: 'Every arranged item must belong to this series.',
      })
    }
    const entityChanges = comicArrangementDiff(
      entities,
      entityOrder.map((id) => ({ id })),
    )
    const slotChanges = comicArrangementDiff(slots, slotOrder)
    await prisma.$transaction([
      ...entityChanges.map((row) =>
        prisma.comicEntity.update({
          where: { id: row.id },
          data: { sortOrder: row.sortOrder },
        }),
      ),
      ...slotChanges.map((row) =>
        prisma.comicSlot.update({
          where: { id: row.id },
          data: {
            sortOrder: row.sortOrder,
            ...(row.entityId !== undefined ? { entityId: row.entityId } : {}),
          },
        }),
      ),
    ])
    return {
      success: true,
      statusCode: 200,
      message: `Arranged ${entityChanges.length + slotChanges.length} item(s).`,
      data: { entities: entityChanges, slots: slotChanges },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
