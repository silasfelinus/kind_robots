// server/api/comfy/flux/test.post.ts
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const comfyHttpUrl =
    body.apiUrl ||
    (process.env.COMFY_URL ? `${process.env.COMFY_URL}/prompt` : null) ||
    'http://192.168.4.3/prompt'

  const prompt_id = `httptest-${Date.now()}`
  console.log(`[HTTPTEST] 🚀 Sending HTTP prompt with ID: ${prompt_id}`)

  try {
    // Minimal working graph
    const prompt = {
      '1': {
        class_type: 'EmptyLatentImage',
        inputs: {
          width: 512,
          height: 512,
          batch_size: 1,
        },
      },
      '2': {
        class_type: 'CheckpointLoaderSimple',
        inputs: {
          ckpt_name: body.ckpt_name || 'Flux/flux1-schnell-fp8.safetensors',
        },
      },
      '3': {
        class_type: 'CLIPTextEncode',
        inputs: {
          text: body.promptText || 'a robot made of candy',
          clip: ['2', 1],
        },
      },
      '4': {
        class_type: 'KSampler',
        inputs: {
          cfg: body.cfg ?? 7,
          denoise: body.denoise ?? 1,
          steps: body.steps ?? 20,
          seed: Math.floor(Math.random() * 1e7),
          sampler_name: 'euler',
          scheduler: 'normal',
          model: ['2', 0],
          positive: ['3', 0],
          negative: ['3', 0],
          latent_image: ['1', 0],
        },
      },
      '5': {
        class_type: 'VAEDecode',
        inputs: {
          samples: ['4', 0],
          vae: ['2', 2],
        },
      },
      '6': {
        class_type: 'SaveImage',
        inputs: {
          images: ['5', 0],
          filename_prefix: 'http-test',
        },
      },
    }

    const res = await fetch(comfyHttpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })

    const json = await res.json()

    if (json?.prompt_id) {
      console.log(`[HTTPTEST] ✅ Prompt queued with ID: ${json.prompt_id}`)
      return {
        success: true,
        promptId: json.prompt_id,
        queuePosition: json.number ?? null,
        nodeErrors: json.node_errors ?? null,
      }
    }

    console.warn(`[HTTPTEST] ⚠️ No prompt_id in response`)
    return {
      success: false,
      error: 'No prompt_id in response',
      debug: json,
    }
  } catch (err) {
    console.error(`[HTTPTEST] ❌ Failed to submit HTTP prompt`, err)
    return {
      success: false,
      error: 'Failed to submit prompt via HTTP',
      detail: (err as Error).message,
    }
  }
})
