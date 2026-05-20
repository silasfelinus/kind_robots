// /server/api/comfy/test/info.get.ts
import { createError, defineEventHandler, getQuery } from 'h3'
import { getComfyInfoDirect } from './comfyDirect'

export default defineEventHandler(async (event) => {
  const authorizationHeader = event.node.req.headers.authorization

  if (!authorizationHeader?.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      message:
        'Authorization token is required in the format "Bearer <token>".',
    })
  }

  const query = getQuery(event)
  const target = String(query.target || 'system')
  const apiUrl = typeof query.apiUrl === 'string' ? query.apiUrl : undefined

  return await getComfyInfoDirect(apiUrl, target)
})
