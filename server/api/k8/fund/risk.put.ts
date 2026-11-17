import { createError, defineEventHandler, readBody } from 'h3'
import { errorHandler } from '~/server/utils/error'
import { forwardK8Fund, requireK8Viewer } from '~/server/utils/k8Bridge'

export default defineEventHandler(async (event) => {
  try {
    await requireK8Viewer(event, true)
    const body = await readBody<Record<string, unknown>>(event)
    if (
      !body ||
      !Number.isInteger(body.level) ||
      (body.level as number) < 0 ||
      (body.level as number) > 10 ||
      typeof body.fingerprint !== 'string' ||
      !/^[0-9a-f]{64}$/.test(body.fingerprint)
    ) {
      throw createError({
        statusCode: 400,
        message: 'Choose level 0–10 with a current snapshot fingerprint.',
      })
    }
    const result = await forwardK8Fund('fund/risk', 'PUT', {
      level: body.level as number,
      fingerprint: body.fingerprint,
    })
    return { success: true, data: result }
  } catch (error) {
    const failure = errorHandler(error)
    event.node.res.statusCode = failure.statusCode || 500
    return { ...failure, statusCode: event.node.res.statusCode }
  }
})
