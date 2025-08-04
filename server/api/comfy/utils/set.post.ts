// server/api/comfy/model/set.post.ts
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const { ckpt } = await readBody(event)
  const comfyUrl = process.env.COMFY_URL || 'http://127.0.0.1:8188'

  if (!ckpt || typeof ckpt !== 'string') {
    return {
      success: false,
      error: 'Missing or invalid `ckpt` in request body',
    }
  }

  const prompt_id = `loadckpt-${Date.now()}`

  const graph = {
    '1': {
      class_type: 'CheckpointLoaderSimple',
      inputs: {
        ckpt_name: ckpt,
      },
    },
  }

  try {
    const res = await fetch(`${comfyUrl}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: graph }),
    })

    const json = await res.json()

    if (json?.prompt_id) {
      return {
        success: true,
        promptId: json.prompt_id,
        queuePosition: json.number ?? null,
        nodeErrors: json.node_errors ?? null,
      }
    }

    return {
      success: false,
      error: 'No prompt_id returned from server',
      debug: json,
    }
  } catch (err) {
    return {
      success: false,
      error: 'Failed to submit checkpoint load request',
      detail: (err as Error).message,
    }
  }
})
