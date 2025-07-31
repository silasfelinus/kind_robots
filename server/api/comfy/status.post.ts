// server/api/comfy/status.post.ts
import { defineEventHandler, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const promptId = query?.promptId
  const baseUrl = query?.url || process.env.COMFY_HTTP || 'http://0.0.0.0'

  if (!promptId || typeof promptId !== 'string') {
    return {
      success: false,
      error: 'Missing or invalid promptId parameter.',
    }
  }

  const historyUrl = `${baseUrl}/history/${promptId}`
  console.log(`[STATUS] 📥 Fetching prompt history from: ${historyUrl}`)

  try {
    const res = await fetch(historyUrl)
    if (!res.ok) {
      return {
        success: false,
        error: `HTTP ${res.status}: Failed to retrieve prompt status`,
      }
    }

    const json = await res.json()
    const promptData = json[promptId]

    if (!promptData) {
      return {
        success: false,
        error: 'Prompt ID not found in response.',
      }
    }

    return {
      success: true,
      promptId,
      status: promptData.status?.status_str ?? 'unknown',
      completed: promptData.status?.completed ?? false,
      outputs: promptData.outputs ?? null,
      messages: promptData.status?.messages ?? [],
    }
  } catch (err) {
    console.error(`[STATUS] ❌ Failed to fetch status for ${promptId}:`, err)
    return {
      success: false,
      error: 'Failed to fetch prompt status',
      detail: (err as Error).message,
    }
  }
})
