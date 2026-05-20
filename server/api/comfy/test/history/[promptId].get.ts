// /server/api/comfy/test/history/[promptId].get.ts
import { createError, defineEventHandler, getQuery } from 'h3'
import { getComfyHistoryDirect } from '../comfyDirect'

export default defineEventHandler(async (event) => {
  const authorizationHeader = event.node.req.headers.authorization

  if (!authorizationHeader?.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      message:
        'Authorization token is required in the format "Bearer <token>".',
    })
  }

  const promptId = String(event.context.params?.promptId || '').trim()

  if (!promptId) {
    throw createError({
      statusCode: 400,
      message: 'promptId is required.',
    })
  }

  const query = getQuery(event)
  const apiUrl = typeof query.apiUrl === 'string' ? query.apiUrl : undefined

  return await getComfyHistoryDirect(apiUrl, promptId)
})
