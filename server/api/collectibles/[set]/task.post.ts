// POST /api/collectibles/:set/task
import { createError, defineEventHandler, readBody } from 'h3'
import { requireHumanApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'
import {
  completeTask,
  playerState,
  setFromEvent,
} from '~/server/utils/collectibles'

export default defineEventHandler(async (event) => {
  try {
    const set = setFromEvent(event)
    const auth = await requireHumanApiUser(event)
    const body = (await readBody<{ task?: unknown }>(event)) ?? {}
    const task = typeof body.task === 'string' ? body.task : ''
    if (!task) throw createError({ statusCode: 400, message: 'Task required.' })
    const result = await completeTask(auth.user.id, set, task)
    return {
      success: true,
      statusCode: 200,
      message: 'Task recorded.',
      data: { result, state: await playerState(auth.user.id, set) },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
