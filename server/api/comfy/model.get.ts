// server/api/comfy/model.get.ts
import { defineEventHandler } from 'h3'

export default defineEventHandler(async () => {
  const comfyUrl = process.env.COMFY_URL || 'http://127.0.0.1:8188'
  const start = Date.now()

  try {
    const response = await fetch(`${comfyUrl}/object_info`, {
      method: 'GET',
    })

    const msg = await response.json()

    const checkpoints = msg.data?.Checkpoints ?? []
    const current = checkpoints.find((c: any) => c.is_loaded)

    return {
      success: true,
      current: current?.name || null,
      all: checkpoints.map((c: any) => c.name),
      durationMs: Date.now() - start,
    }
  } catch (err) {
    return {
      success: false,
      error: 'Failed to fetch model info via HTTP',
      detail: err instanceof Error ? err.message : err,
      durationMs: Date.now() - start,
    }
  }
})
