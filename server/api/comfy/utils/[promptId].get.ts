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
    const entry = json[promptId]

    if (!entry) {
      return {
        success: false,
        promptId,
        error: 'No history entry found for this promptId',
      }
    }

    const statusMessages = entry.status?.messages || []
    const lastMsg = statusMessages[statusMessages.length - 1]?.[0]

    let status = 'unknown'
    if (lastMsg === 'execution_start') status = 'running'
    if (lastMsg === 'execution_cached') status = 'done'
    if (lastMsg === 'execution_success') status = 'done'
    if (lastMsg === 'execution_error') status = 'error'

    return {
      success: true,
      promptId,
      status,
      outputs: entry.outputs || {},
      nodeErrors: entry.node_errors || {},
      meta: entry.meta || {},
      messages: statusMessages,
      prompt: entry.prompt || null,
    }
  } catch (err) {
    return {
      success: false,
      promptId,
      error: (err as Error).message,
    }
  }
})
