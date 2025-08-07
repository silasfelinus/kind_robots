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

  const historyUrl = `${baseUrl}/history/${promptId}`

  try {
    const res = await fetch(historyUrl)
    if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`)
    const json = await res.json()
    const entry = json[promptId]

    // ✅ If in history
    if (entry) {
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
        inQueue: false,
      }
    }

    // 🔍 Check queue if not in history
    const queueRes = await fetch(`${baseUrl}/queue`)
    const queueJson = await queueRes.json()

    const isRunning = queueJson.queue_running?.includes(promptId)
    const queueIndex = queueJson.queue_pending?.indexOf(promptId)

    if (isRunning) {
      return {
        success: true,
        promptId,
        status: 'running',
        inQueue: true,
      }
    }

    if (queueIndex !== -1) {
      return {
        success: true,
        promptId,
        status: 'pending',
        inQueue: true,
        queuePosition: queueIndex + 1,
      }
    }

    return {
      success: false,
      promptId,
      error: 'No history entry or queue position found for this promptId',
    }
  } catch (err) {
    return {
      success: false,
      promptId,
      error: (err as Error).message,
    }
  }
})
