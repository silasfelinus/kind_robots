import { createError, defineEventHandler, readBody } from 'h3'
import { errorHandler } from '~/server/utils/error'
import { forwardK8Fund, requireK8Viewer } from '~/server/utils/k8Bridge'
import { K8_PROFILE_FIELDS } from '~/utils/k8Wildlife'

const allowed = new Set<string>(K8_PROFILE_FIELDS)

export default defineEventHandler(async (event) => {
  try {
    await requireK8Viewer(event, true)
    const body = await readBody<Record<string, unknown>>(event)
    if (
      !body ||
      !Number.isInteger(body.level) ||
      (body.level as number) < 1 ||
      (body.level as number) > 10 ||
      typeof body.fingerprint !== 'string' ||
      !/^[0-9a-f]{64}$/.test(body.fingerprint)
    ) {
      throw createError({
        statusCode: 400,
        message: 'Choose animal 1–10 with a current snapshot fingerprint.',
      })
    }
    const overrides = body.overrides
    if (
      overrides !== null &&
      (!overrides || typeof overrides !== 'object' || Array.isArray(overrides))
    ) {
      throw createError({
        statusCode: 400,
        message: 'Invalid animal profile overrides.',
      })
    }
    for (const [key, value] of Object.entries(overrides || {})) {
      if (
        !allowed.has(key) ||
        typeof value !== 'number' ||
        !Number.isFinite(value)
      ) {
        throw createError({
          statusCode: 400,
          message: 'Animal profile values must be supported finite numbers.',
        })
      }
    }
    const result = await forwardK8Fund('fund/levels', 'PUT', {
      level: body.level as number,
      fingerprint: body.fingerprint,
      overrides: overrides as object | null,
    })
    return { success: true, data: result }
  } catch (error) {
    const failure = errorHandler(error)
    event.node.res.statusCode = failure.statusCode || 500
    return { ...failure, statusCode: event.node.res.statusCode }
  }
})
