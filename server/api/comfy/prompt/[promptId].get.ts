// /server/api/comfy/prompt/[promptId].get.ts
import { getRouterParam, createError } from 'h3'

function findInQueue(list: any, id: string): { found: boolean; index: number } {
  // Handles: ['pidA','pidB'] OR [['pidA',...], ['pidB',...]] OR objects with .prompt_id
  if (!Array.isArray(list)) return { found: false, index: -1 }
  for (let i = 0; i < list.length; i++) {
    const item = list[i]
    if (typeof item === 'string' && item === id)
      return { found: true, index: i }
    if (Array.isArray(item) && item.includes && item.includes(id))
      return { found: true, index: i }
    if (
      item &&
      typeof item === 'object' &&
      'prompt_id' in item &&
      item.prompt_id === id
    ) {
      return { found: true, index: i }
    }
  }
  return { found: false, index: -1 }
}

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
      statusMessage: 'COMFY_URL is not defined',
    })
  }

  const historyUrl = `${baseUrl}/history/${promptId}`

  try {
    // 1) HISTORY
    const res = await fetch(historyUrl)
    if (!res.ok && res.status !== 404) {
      throw new Error(`History fetch failed with status ${res.status}`)
    }

    if (res.ok) {
      const json = await res.json()
      const entry = json?.[promptId]
      if (entry) {
        const messages: any[] = entry.status?.messages || []
        const last = messages[messages.length - 1]?.[0]
        // Possible last messages: execution_start, execution_success, execution_error, execution_cached
        let status: 'running' | 'done' | 'error' | 'unknown' = 'unknown'
        if (last === 'execution_start') status = 'running'
        if (last === 'execution_success' || last === 'execution_cached')
          status = 'done'
        if (last === 'execution_error') status = 'error'

        return {
          success: true,
          promptId,
          status,
          stillProcessing: status === 'running', // 👈 simple flag
          outputs: entry.outputs || {},
          nodeErrors: entry.node_errors || {},
          meta: entry.meta || {},
          messages,
          prompt: entry.prompt || null,
          inQueue: false,
        }
      }
    }

    // 2) QUEUE (not in history yet)
    const queueRes = await fetch(`${baseUrl}/queue`)
    if (!queueRes.ok) {
      throw new Error(`Queue fetch failed with status ${queueRes.status}`)
    }
    const queueJson = await queueRes.json()

    const running = queueJson?.queue_running ?? []
    const pending = queueJson?.queue_pending ?? []

    const inRunning = findInQueue(running, promptId)
    if (inRunning.found) {
      return {
        success: true,
        promptId,
        status: 'running',
        stillProcessing: true,
        inQueue: true,
      }
    }

    const inPending = findInQueue(pending, promptId)
    if (inPending.found) {
      return {
        success: true,
        promptId,
        status: 'pending',
        stillProcessing: true,
        inQueue: true,
        queuePosition: inPending.index + 1,
      }
    }

    // 3) Unknown
    return {
      success: false,
      promptId,
      status: 'unknown',
      stillProcessing: false,
      error: 'No history entry or queue position found for this promptId',
    }
  } catch (err: any) {
    return {
      success: false,
      promptId,
      status: 'error',
      stillProcessing: false,
      error: err?.message ?? 'Unknown error',
    }
  }
})
