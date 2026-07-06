// /server/api/comfy/test/generate.post.ts
//
// Automated smoke test for ComfyUI art generation. Talks to the Comfy server
// DIRECTLY (via comfyTestClient) with a minimal flux-schnell workflow, so it:
//   - charges NO mana (does not route through /api/comfy/flux/generate)
//   - authenticates ONCE (requireMachineUser), no internal self-HTTP hop
//   - needs NO checkpoint (flux loads a GGUF unet, not an SDXL checkpoint)
// Safe to run repeatedly / in CI.
import { createError, defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../../utils/error'
import { requireMachineUser } from '../../../utils/authGuard'
import { resolveServer } from '../../../utils/serverResolver'
import {
  assertComfyServer,
  runComfySmokeGeneration,
} from '../../../utils/comfyTestClient'

type ComfyDirectGenerateRequest = {
  serverId?: number | null
  serverName?: string | null
  prompt?: string | null
  negativePrompt?: string | null
  width?: number | null
  height?: number | null
  steps?: number | null
  cfg?: number | null
  guidance?: number | null
  seed?: number | null
  sampler?: string | null
  scheduler?: string | null
  denoise?: number | null
  timeoutMs?: number | null
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<ComfyDirectGenerateRequest>(event)
    const prompt = body.prompt?.trim()

    if (!prompt) {
      throw createError({
        statusCode: 400,
        message: 'Missing required field: "prompt".',
      })
    }

    const auth = await requireMachineUser(event)
    const server = await resolveServer({
      userId: auth.user.id,
      serverId: body.serverId ?? null,
      serverName: body.serverName ?? null,
      capability: 'comfy',
    })

    assertComfyServer(server)

    const result = await runComfySmokeGeneration({
      server,
      prompt,
      negativePrompt: body.negativePrompt ?? '',
      width: body.width ?? 512,
      height: body.height ?? 512,
      steps: body.steps ?? 8,
      cfg: body.cfg ?? 1,
      guidance: body.guidance ?? 4,
      seed: body.seed ?? -1,
      sampler: body.sampler ?? 'euler',
      scheduler: body.scheduler ?? 'normal',
      denoise: body.denoise ?? 1,
      timeoutMs: body.timeoutMs ?? 180_000,
    })

    return {
      success: true,
      message: 'Comfy smoke image generated successfully (no mana charged).',
      data: {
        status: 'done',
        promptId: result.promptId,
        queuePosition: result.queuePosition,
        imageData: result.imageData,
        filename: result.filename,
        subfolder: result.subfolder,
        type: result.type,
        mimeType:
          result.imageData.match(/^data:([^;]+);base64,/)?.[1] ?? null,
        serverId: server.id,
        serverName: server.title,
        baseUrl: result.baseUrl,
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      statusCode: handledError.statusCode || 500,
      message: handledError.message || 'Failed to generate Comfy test image.',
    }
  }
})
