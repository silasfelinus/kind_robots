// POST /api/collectibles/:set/pack
import { defineEventHandler } from 'h3'
import { requireHumanApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'
import {
  openCollectiblePack,
  playerState,
  setFromEvent,
} from '~/server/utils/collectibles'

export default defineEventHandler(async (event) => {
  try {
    const set = setFromEvent(event)
    const auth = await requireHumanApiUser(event)
    const result = await openCollectiblePack(auth.user.id, set)
    return {
      success: true,
      statusCode: 200,
      message: 'Pack opened.',
      data: { result, state: await playerState(auth.user.id, set) },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
