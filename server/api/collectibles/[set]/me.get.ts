// GET /api/collectibles/:set/me -- the signed-in player's wallet and album.
import { defineEventHandler, setHeader } from 'h3'
import { requireHumanApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'
import { playerState, setFromEvent } from '~/server/utils/collectibles'

export default defineEventHandler(async (event) => {
  try {
    const set = setFromEvent(event)
    const auth = await requireHumanApiUser(event)
    setHeader(event, 'Cache-Control', 'private, no-store')
    return {
      success: true,
      statusCode: 200,
      message: 'Collection loaded.',
      data: await playerState(auth.user.id, set),
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
