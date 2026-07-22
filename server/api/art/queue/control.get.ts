// /server/api/art/queue/control.get.ts
//
// Read the ArtJob queue pause state for the admin queue UI. Graceful: returns
// { paused: false } if the QueueControl table has not been migrated yet.
import { createError, defineEventHandler } from 'h3'
import { errorHandler } from '../../../utils/error'
import { requireMachineUser } from '../../../utils/authGuard'
import { getQueueControl } from '../../../utils/queueControl'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)
    if (!auth.isAdmin && !auth.isServerKey) {
      throw createError({
        statusCode: 403,
        message: 'Admin access required to read queue control.',
      })
    }

    const state = await getQueueControl()
    return { success: true, message: 'Queue control state.', data: state, statusCode: 200 }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to read queue control.',
      statusCode,
    }
  }
})
