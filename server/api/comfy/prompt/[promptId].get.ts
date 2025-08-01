// server/api/comfy/prompt/[promptId].get.ts
import { getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
  const promptId = getRouterParam(event, 'promptId')

  if (!promptId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing promptId in route',
    })
  }

  const baseUrl = process.env.COMFY_URL
  if (!baseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'COMFY_URL is not defined in environment variables',
    })
  }

  const url = `${baseUrl}/history/${promptId}`

  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`)
    const json = await res.json()

    return {
      success: true,
      promptId,
      data: json[promptId],
    }
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message,
      promptId,
    }
  }
})
