// /server/utils/comicStudioSlots.ts
// Slot edits shared by PATCH /api/comics/slots/:id and the render route's
// "Save & New" patch, so both apply the same field rules.
import prisma from '@/server/utils/prisma'
import { COMIC_ASPECTS, parseComicLanes } from '~/utils/comicLanes'
import { COMIC_SLOT_FIELDS, normalizeComicUpdate } from '~/utils/comicStudio'

type SlotForPatch = { id: number; seriesId: number; Series: { lanes: string } }

export async function applyComicSlotPatch(
  slot: SlotForPatch,
  raw: unknown,
): Promise<{ errors: string[]; changed: boolean }> {
  const body =
    raw && typeof raw === 'object'
      ? { ...(raw as Record<string, unknown>) }
      : {}
  const rawLaneKeys = body.laneKeys
  delete body.laneKeys
  const { data, errors } = normalizeComicUpdate(body, COMIC_SLOT_FIELDS)
  if (typeof data.aspect === 'string' && !COMIC_ASPECTS.includes(data.aspect)) {
    errors.push(`Aspect must be one of ${COMIC_ASPECTS.join(', ')}.`)
  }
  if (typeof data.entityId === 'number') {
    const entity = await prisma.comicEntity.findFirst({
      where: { id: data.entityId, seriesId: slot.seriesId },
      select: { id: true },
    })
    if (!entity)
      errors.push('A slot can only belong to an entity in its series.')
  }
  if (rawLaneKeys !== undefined) {
    if (rawLaneKeys === null) {
      data.laneKeys = null
    } else if (Array.isArray(rawLaneKeys)) {
      const known = new Set(
        parseComicLanes(slot.Series.lanes).map((lane) => lane.key),
      )
      const keys = [...new Set(rawLaneKeys.map((key) => String(key)))]
      const unknown = keys.filter((key) => !known.has(key))
      if (unknown.length) errors.push(`Unknown lane(s): ${unknown.join(', ')}.`)
      data.laneKeys = JSON.stringify(keys)
    } else {
      errors.push('laneKeys must be a list of lane keys or null.')
    }
  }
  if (errors.length || !Object.keys(data).length)
    return { errors, changed: false }
  await prisma.comicSlot.update({ where: { id: slot.id }, data })
  return { errors, changed: true }
}
