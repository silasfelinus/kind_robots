// POST /api/collectibles/:set/art-sync -- admin: link rendered ledger art.
import { defineEventHandler } from 'h3'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'
import { setFromEvent, syncCollectibleArt } from '~/server/utils/collectibles'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const set = setFromEvent(event)
    const result = await syncCollectibleArt(set)
    return {
      success: true,
      statusCode: 200,
      message: `${result.linked} collectible images linked from ${result.jobs} rendered jobs.`,
      data: result,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
