// /server/api/art/queue/control.post.ts
//
// Pause or resume ArtJob queue processing (admin). When paused, the claim
// endpoint stops handing jobs to relays — the queue is preserved, just not
// drained — until resumed. Body: { paused: boolean, note?: string }.
import { createError, defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../../utils/error'
import { requireMachineUser } from '../../../utils/authGuard'
import { setQueuePaused } from '../../../utils/queueControl'

type ControlBody = { paused?: unknown; note?: unknown }

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)
    if (!auth.isAdmin && !auth.isServerKey) {
      throw createError({
        statusCode: 403,
        message: 'Admin access required to pause/resume the queue.',
      })
    }

    const body = (await readBody(event).catch(() => null)) as ControlBody | null
    if (typeof body?.paused !== 'boolean') {
      throw createError({
        statusCode: 400,
        message: 'Missing required boolean field "paused".',
      })
    }

    const note =
      typeof body.note === 'string' && body.note.trim()
        ? body.note.trim().slice(0, 500)
        : null
    const pausedBy = auth.user?.username || auth.user?.id?.toString() || 'admin'

    const state = await setQueuePaused(body.paused, pausedBy, note)

    return {
      success: true,
      message: state.paused
        ? 'Queue processing paused. Jobs stay queued; relays will not claim new work until resumed.'
        : 'Queue processing resumed.',
      data: state,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to update queue control.',
      statusCode,
    }
  }
})
