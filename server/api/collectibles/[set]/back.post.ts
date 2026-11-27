// POST /api/collectibles/:set/back
import { createError, defineEventHandler, readBody } from 'h3'
import { requireHumanApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'
import {
  selectBack,
  playerState,
  setFromEvent,
} from '~/server/utils/collectibles'

export default defineEventHandler(async (event) => {
  try {
    const set = setFromEvent(event)
    const auth = await requireHumanApiUser(event)
    const body = (await readBody<{ back?: unknown }>(event)) ?? {}
    const back = typeof body.back === 'string' ? body.back : ''
    if (!back) throw createError({ statusCode: 400, message: 'Back required.' })
    const result = await selectBack(auth.user.id, set, back)
    return {
      success: true,
      statusCode: 200,
      message: 'Card back selected.',
      data: { result, state: await playerState(auth.user.id, set) },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
