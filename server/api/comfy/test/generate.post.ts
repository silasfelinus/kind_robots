// /server/api/comfy/test/generate.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import comfyTestJson from '../json/comfyTest.json'
import { resolveComfyRun } from './resolveComfyRun'

type GenerateBody = {
  serverId?: number
  checkpointId?: number
  prompt?: string
  width?: number
  height?: number
  seed?: number
  steps?: number
  cfg?: number
  samplerName?: string
  scheduler?: string
  timeoutMs?: number
  intervalMs?: number
}

type ComfyImageOutput = {
  filename: string
  subfolder?: string
  type?: string
}

function makeSeed(seed?: number) {
  if (typeof seed === 'number' && Number.isFinite(seed)) {
    return Math.floor(seed)
  }

  return Math.floor(Math.random() * 999999999999999)
}

function buildGraph(input: {
  prompt: string
  checkpointName: string
  width: number
  height: number
  seed?: number
  steps: number
  cfg: number
  samplerName: string
  scheduler: string
}) {
  const wrapper = structuredClone(comfyTestJson) as {
    prompt: Record<string, any>
  }

  const graph = wrapper.prompt

  graph['1'].inputs.width = input.width
  graph['1'].inputs.height = input.height
  graph['1'].inputs.batch_size = 1

  graph['2'].inputs.ckpt_name = input.checkpointName

  graph['7'].inputs.text = input.prompt

  graph['3'].inputs.seed = makeSeed(input.seed)
  graph['3'].inputs.steps = input.steps
  graph['3'].inputs.cfg = input.cfg
  graph['3'].inputs.sampler_name = input.samplerName
  graph['3'].inputs.scheduler = input.scheduler
  graph['3'].inputs.denoise = 1

  graph['5'].inputs.filename_prefix = `kind-comfy-test-${Date.now()}`

  return graph
}

async function readJsonResponse(res: Response) {
  const contentType = res.headers.get('content-type') || ''
  const text = await res.text()

  if (!contentType.includes('application/json')) {
    return {
      json: null,
      text,
    }
  }

  try {
    return {
      json: JSON.parse(text),
      text,
    }
  } catch {
    return {
      json: null,
      text,
    }
  }
}

async function submitPrompt(promptUrl: string, graph: Record<string, any>) {
  const res = await fetch(promptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: graph,
      client_id: `kind-comfy-${Date.now()}`,
    }),
  })

  const parsed = await readJsonResponse(res)

  if (!res.ok) {
    return {
      success: false,
      statusCode: res.status,
      message: `Comfy submit failed with HTTP ${res.status}`,
      debug: parsed.json ?? parsed.text.slice(0, 500),
    }
  }

  if (!parsed.json?.prompt_id) {
    return {
      success: false,
      statusCode: 502,
      message: 'Comfy submit did not return prompt_id.',
      debug: parsed.json ?? parsed.text.slice(0, 500),
    }
  }

  return {
    success: true,
    promptId: String(parsed.json.prompt_id),
    queuePosition: parsed.json.number ?? null,
    nodeErrors: parsed.json.node_errors ?? null,
  }
}

async function getHistory(baseUrl: string, promptId: string) {
  const res = await fetch(`${baseUrl}/history/${encodeURIComponent(promptId)}`)
  const parsed = await readJsonResponse(res)

  if (!res.ok || !parsed.json) {
    return null
  }

  return parsed.json
}

function findFirstImageOutput(
  history: any,
  promptId: string,
): ComfyImageOutput | null {
  const promptHistory = history?.[promptId] ?? history

  if (!promptHistory?.outputs) {
    return null
  }

  for (const output of Object.values(promptHistory.outputs) as any[]) {
    const images = output?.images

    if (Array.isArray(images) && images.length > 0) {
      const image = images[0]

      if (image?.filename) {
        return {
          filename: image.filename,
          subfolder: image.subfolder || '',
          type: image.type || 'output',
        }
      }
    }
  }

  return null
}

async function waitForImageOutput(input: {
  baseUrl: string
  promptId: string
  timeoutMs: number
  intervalMs: number
}) {
  const started = Date.now()

  while (Date.now() - started < input.timeoutMs) {
    const history = await getHistory(input.baseUrl, input.promptId)
    const image = findFirstImageOutput(history, input.promptId)

    if (image) {
      return {
        history,
        image,
      }
    }

    await new Promise((resolve) => setTimeout(resolve, input.intervalMs))
  }

  return {
    history: await getHistory(input.baseUrl, input.promptId),
    image: null,
  }
}

async function fetchImageData(baseUrl: string, image: ComfyImageOutput) {
  const params = new URLSearchParams({
    filename: image.filename,
    subfolder: image.subfolder || '',
    type: image.type || 'output',
  })

  const res = await fetch(`${baseUrl}/view?${params.toString()}`)

  if (!res.ok) {
    return {
      success: false,
      statusCode: res.status,
      message: `Comfy image fetch failed with HTTP ${res.status}.`,
    }
  }

  const mimeType = res.headers.get('content-type') || 'image/png'
  const buffer = Buffer.from(await res.arrayBuffer())

  return {
    success: true,
    imageData: `data:${mimeType};base64,${buffer.toString('base64')}`,
    mimeType,
  }
}

export default defineEventHandler(async (event) => {
  const authorizationHeader = event.node.req.headers.authorization

  if (!authorizationHeader?.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      message:
        'Authorization token is required in the format "Bearer <token>".',
    })
  }

  const body = await readBody<GenerateBody>(event)
  const prompt = String(body.prompt || '').trim()

  if (!prompt) {
    return {
      success: false,
      statusCode: 400,
      status: 'error',
      message: 'Prompt is required.',
    }
  }

  const resolved = await resolveComfyRun({
    serverId: body.serverId,
    checkpointId: body.checkpointId,
  })

  const graph = buildGraph({
    prompt,
    checkpointName: resolved.checkpointName,
    width: body.width ?? resolved.server.defaultWidth ?? 512,
    height: body.height ?? resolved.server.defaultHeight ?? 512,
    seed: body.seed,
    steps: body.steps ?? resolved.server.defaultSteps ?? 20,
    cfg: body.cfg ?? Math.round(resolved.server.defaultCfg ?? 8),
    samplerName: body.samplerName ?? resolved.server.defaultSampler ?? 'euler',
    scheduler: body.scheduler ?? resolved.server.defaultScheduler ?? 'normal',
  })

  const submitted = await submitPrompt(resolved.promptUrl, graph)

  if (!submitted.success || !submitted.promptId) {
    return {
      ...submitted,
      success: false,
      status: 'error',
      resolved: {
        serverId: resolved.serverId,
        checkpointId: resolved.checkpointId,
        baseUrl: resolved.baseUrl,
        promptUrl: resolved.promptUrl,
        checkpointName: resolved.checkpointName,
      },
    }
  }

  const completed = await waitForImageOutput({
    baseUrl: resolved.baseUrl,
    promptId: submitted.promptId,
    timeoutMs: body.timeoutMs ?? 180000,
    intervalMs: body.intervalMs ?? 2000,
  })

  if (!completed.image) {
    return {
      success: false,
      status: 'timeout',
      promptId: submitted.promptId,
      message: 'Timed out waiting for Comfy image output.',
      history: completed.history,
      resolved: {
        serverId: resolved.serverId,
        checkpointId: resolved.checkpointId,
        baseUrl: resolved.baseUrl,
        promptUrl: resolved.promptUrl,
        checkpointName: resolved.checkpointName,
      },
    }
  }

  const imageResult = await fetchImageData(resolved.baseUrl, completed.image)

  if (!imageResult.success) {
    return {
      ...imageResult,
      success: false,
      status: 'error',
      promptId: submitted.promptId,
    }
  }

  return {
    success: true,
    status: 'done',
    promptId: submitted.promptId,
    queuePosition: submitted.queuePosition,
    nodeErrors: submitted.nodeErrors,
    filename: completed.image.filename,
    imageData: imageResult.imageData,
    mimeType: imageResult.mimeType,
    serverId: resolved.serverId,
    checkpointId: resolved.checkpointId,
    checkpointName: resolved.checkpointName,
  }
})
