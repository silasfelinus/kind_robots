import { defineEventHandler } from 'h3'
import { errorHandler } from '~/server/utils/error'
import { forwardK8Fund, requireK8Viewer } from '~/server/utils/k8Bridge'

export default defineEventHandler(async (event) => {
  try {
    const viewer = await requireK8Viewer(event)
    const data = await forwardK8Fund('fund', 'GET')
    return { success: true, data: { ...data, readonly: viewer.readonly } }
  } catch (error) {
    const failure = errorHandler(error)
    event.node.res.statusCode = failure.statusCode || 500
    return { ...failure, statusCode: event.node.res.statusCode }
  }
})
