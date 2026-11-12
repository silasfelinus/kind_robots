// /server/api/art/slots/[id]/select.post.ts
//
// Choose which candidate an art slot uses. Body: { artImageId }
import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { errorHandler } from '../../../../utils/error'
import { requireMachineUser } from '../../../../utils/authGuard'
import { assertCurator, selectCandidate } from '../../../../utils/artSlots'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)
    assertCurator(auth)
    const slotId = Number(getRouterParam(event, 'id'))
    const body = (await readBody(event)) as { artImageId?: unknown } | null
    const artImageId = Number(body?.artImageId)
    if (!Number.isSafeInteger(slotId) || slotId < 1)
      throw createError({ statusCode: 400, message: 'Invalid slot id.' })
    if (!Number.isSafeInteger(artImageId) || artImageId < 1)
      throw createError({ statusCode: 400, message: 'artImageId is required.' })
    const slot = await selectCandidate(slotId, artImageId, auth.user.id)
    return {
      success: true,
      message: `Slot ${slot.slotKey} now uses ArtImage ${artImageId}.`,
      data: { slot },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to choose the candidate.',
      statusCode: event.node.res.statusCode,
    }
  }
})
