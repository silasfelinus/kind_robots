// /server/api/art/slots/dedupe.post.ts
//
// Find candidates in the same slot that are the same picture (same prompt, seed,
// checkpoint, sampler, steps and cfg) and, with apply: true, move the extra
// copies to the Recycle Bin (restorable) and mark them `duplicate`. Silas,
// 2026-11-11 PT: "If the art is actually duplicated (same seed), they can be
// deleted." The selected image is always kept; protectArtImageIds (ids a game
// manifest already uses, sent by Conductor) are never removed.
// Body: { projectSlug?, slotKeys?: string[], protectArtImageIds?: number[], apply?: boolean }
import { createError, defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../../utils/error'
import { requireMachineUser } from '../../../utils/authGuard'
import {
  assertCurator,
  dedupeSlots,
  normalizeProjectSlug,
  normalizeSlotKey,
} from '../../../utils/artSlots'

const MAX_PROTECTED = 20000

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)
    assertCurator(auth)
    const body = (await readBody(event)) as Record<string, unknown> | null
    const slotKeys = Array.isArray(body?.slotKeys)
      ? body.slotKeys.slice(0, 500).map(normalizeSlotKey)
      : []
    const protect = Array.isArray(body?.protectArtImageIds)
      ? body.protectArtImageIds
          .map(Number)
          .filter((id) => Number.isSafeInteger(id) && id > 0)
      : []
    if (protect.length > MAX_PROTECTED)
      throw createError({
        statusCode: 400,
        message: `At most ${MAX_PROTECTED} protectArtImageIds.`,
      })
    const data = await dedupeSlots({
      projectSlug: normalizeProjectSlug(body?.projectSlug),
      slotKeys,
      protectArtImageIds: protect,
      apply: body?.apply === true,
      actor: { id: auth.user.id, isAdmin: true },
    })
    const planned = data.slots.reduce(
      (sum, slot) =>
        sum +
        slot.groups.reduce((n, group) => n + group.removeArtImageIds.length, 0),
      0,
    )
    return {
      success: true,
      message: data.apply
        ? `${data.removed} duplicate render(s) moved to the Recycle Bin.`
        : `${planned} duplicate render(s) would be moved to the Recycle Bin.`,
      data,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to dedupe art slots.',
      statusCode: event.node.res.statusCode,
    }
  }
})
