import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import {
  attemptDtosForSlots,
  enqueueComicLane,
  parseLaneKeys,
  readComicId,
  requireComicSlot,
  toComicSlotDto,
} from '@/server/utils/comicStudio'
import { applyComicSlotPatch } from '@/server/utils/comicStudioSlots'
import { comicLaneForKey, parseComicLanes } from '~/utils/comicLanes'
import type { ComicRenderOutcome } from '~/types/comicStudio'

type RenderBody = { laneKeys?: unknown; patch?: unknown }

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const id = readComicId(event, 'slot id')
    const initial = await requireComicSlot(id)
    const body = (await readBody<RenderBody>(event)) ?? {}
    if (body.patch !== undefined) {
      const patched = await applyComicSlotPatch(initial, body.patch)
      if (patched.errors.length) {
        throw createError({
          statusCode: 400,
          message: patched.errors.join(' '),
        })
      }
    }
    const slot = await requireComicSlot(id)
    const lanes = parseComicLanes(slot.Series.lanes)
    const requested = Array.isArray(body.laneKeys)
      ? body.laneKeys.map((key) => String(key))
      : (parseLaneKeys(slot.laneKeys) ??
        lanes.filter((lane) => lane.active).map((lane) => lane.key))
    const unknown = requested.filter((key) => !comicLaneForKey(lanes, key))
    if (!requested.length || unknown.length) {
      throw createError({
        statusCode: 400,
        message: unknown.length
          ? `Unknown lane(s): ${unknown.join(', ')}.`
          : 'Pick at least one lane.',
      })
    }
    const outcomes: ComicRenderOutcome[] = []
    for (const key of requested) {
      outcomes.push(
        await enqueueComicLane(
          event,
          slot,
          slot.Series,
          comicLaneForKey(lanes, key)!,
        ),
      )
    }
    const queued = outcomes.filter(
      (outcome) => outcome.status === 'queued',
    ).length
    const statusCode = queued === outcomes.length ? 201 : queued ? 207 : 409
    event.node.res.statusCode = statusCode
    const fresh = await prisma.comicSlot.findUniqueOrThrow({ where: { id } })
    return {
      success: queued > 0,
      statusCode,
      message: `Queued ${queued} of ${outcomes.length} lane render${outcomes.length === 1 ? '' : 's'}.`,
      data: {
        slot: toComicSlotDto(fresh),
        outcomes,
        attempts: await attemptDtosForSlots([id]),
      },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
