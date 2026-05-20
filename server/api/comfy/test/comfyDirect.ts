// /server/api/comfy/test/comfyDirect.ts
import comfyTestJson from '../json/comfyTest.json'

export type ComfyImageOutput = {
  filename: string
  subfolder?: string
  type?: string
}

export type ComfyGenerateInput = {
  prompt: string
  apiUrl?: string
  imageData?: string
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

export type ComfyGenerateResult = {
  success: boolean
  promptId?: string
  imageData?: string
  mimeType?: string
  filename?: string
  status?: 'done' | 'error' | 'timeout'
  message?: string
  statusCode?: number
  queuePosition?: number | null
  nodeErrors?: Record<string, unknown> | null
  history?: unknown
  debug?: unknown
}

const DEFAULT_COMFY_API_URL = 'https://comfy-api.acrocatranch.com'

function normalizeComfyUrl(url?: string) {
  return (url || DEFAULT_COMFY_API_URL)
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/prompt$/, '')
    .replace(/\/queue$/, '')
    .replace(/\/system_stats$/, '')
    .replace(/\/history\/?$/, '')
}

function toRawBase64(value?: string | null) {
  const raw = String(value || '')
    .trim()
    .replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '')

  if (!raw) {
    return ''
  }

  const pad = (4 - (raw.length % 4)) % 4

  return raw + '='.repeat(pad)
}

function makeSeed(seed?: number) {
  if (typeof seed === 'number' && Number.isFinite(seed)) {
    return Math.floor(seed)
  }

  return Math.floor(Math.random() * 999999999999999)
}

function getComfyPrompt(input: ComfyGenerateInput) {
  const graphWrapper = structuredClone(comfyTestJson) as {
    prompt: Record<string, any>
  }

  const graph = graphWrapper.prompt
  const seed = makeSeed(input.seed)

  graph['1'].inputs.width = input.width ?? 512
  graph['1'].inputs.height = input.height ?? 512
  graph['1'].inputs.batch_size = 1

  graph['7'].inputs.text = input.prompt

  graph['3'].inputs.seed = seed
  graph['3'].inputs.steps = input.steps ?? 20
  graph['3'].inputs.cfg = input.cfg ?? 8
  graph['3'].inputs.sampler_name = input.samplerName ?? 'euler'
  graph['3'].inputs.scheduler = input.scheduler ?? 'normal'
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

async function submitPrompt(apiBase: string, graph: Record<string, any>) {
  const res = await fetch(`${apiBase}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: graph,
      client_id: `kind-comfy-test-${Date.now()}`,
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
      message: 'Comfy submit did not return prompt_id',
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

async function getHistory(apiBase: string, promptId: string) {
  const res = await fetch(`${apiBase}/history/${encodeURIComponent(promptId)}`)
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

async function waitForImageOutput(
  apiBase: string,
  promptId: string,
  timeoutMs: number,
  intervalMs: number,
) {
  const started = Date.now()

  while (Date.now() - started < timeoutMs) {
    const history = await getHistory(apiBase, promptId)
    const image = findFirstImageOutput(history, promptId)

    if (image) {
      return {
        history,
        image,
      }
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  return {
    history: await getHistory(apiBase, promptId),
    image: null,
  }
}

async function fetchImageData(apiBase: string, image: ComfyImageOutput) {
  const params = new URLSearchParams({
    filename: image.filename,
    subfolder: image.subfolder || '',
    type: image.type || 'output',
  })

  const res = await fetch(`${apiBase}/view?${params.toString()}`)

  if (!res.ok) {
    return {
      success: false,
      statusCode: res.status,
      message: `Comfy image fetch failed with HTTP ${res.status}`,
    }
  }

  const mimeType = res.headers.get('content-type') || 'image/png'
  const buffer = Buffer.from(await res.arrayBuffer())
  const imageData = `data:${mimeType};base64,${buffer.toString('base64')}`

  return {
    success: true,
    imageData,
    mimeType,
  }
}

export async function generateComfyImageDirect(
  input: ComfyGenerateInput,
): Promise<ComfyGenerateResult> {
  const prompt = String(input.prompt || '').trim()

  if (!prompt) {
    return {
      success: false,
      statusCode: 400,
      status: 'error',
      message: 'Prompt is required.',
    }
  }

  const apiBase = normalizeComfyUrl(input.apiUrl)
  const graph = getComfyPrompt(input)
  const submitted = await submitPrompt(apiBase, graph)

  if (!submitted.success || !submitted.promptId) {
    return {
      ...submitted,
      success: false,
      status: 'error',
    }
  }

  const timeoutMs = input.timeoutMs ?? 120000
  const intervalMs = input.intervalMs ?? 2000

  const completed = await waitForImageOutput(
    apiBase,
    submitted.promptId,
    timeoutMs,
    intervalMs,
  )

  if (!completed.image) {
    return {
      success: false,
      status: 'timeout',
      promptId: submitted.promptId,
      queuePosition: submitted.queuePosition,
      nodeErrors: submitted.nodeErrors,
      message: `Timed out waiting for image output after ${timeoutMs}ms.`,
      history: completed.history,
    }
  }

  const imageResult = await fetchImageData(apiBase, completed.image)

  if (!imageResult.success || !imageResult.imageData) {
    return {
      success: false,
      status: 'error',
      promptId: submitted.promptId,
      message: imageResult.message || 'Failed to fetch image data.',
      statusCode: imageResult.statusCode,
      history: completed.history,
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
  }
}

export async function getComfyInfoDirect(
  apiUrl: string | undefined,
  target: string,
) {
  const apiBase = normalizeComfyUrl(apiUrl)
  const safeTarget = target || 'system'

  const pathByTarget: Record<string, string> = {
    system: '/system_stats',
    queue: '/queue',
    objectInfo: '/object_info',
    history: '/history',
  }

  const path = pathByTarget[safeTarget]

  if (!path) {
    return {
      success: false,
      statusCode: 400,
      message: `Unknown Comfy info target: ${safeTarget}`,
      allowedTargets: Object.keys(pathByTarget),
    }
  }

  const res = await fetch(`${apiBase}${path}`)
  const parsed = await readJsonResponse(res)

  if (!res.ok) {
    return {
      success: false,
      statusCode: res.status,
      message: `Comfy info request failed with HTTP ${res.status}`,
      debug: parsed.json ?? parsed.text.slice(0, 500),
    }
  }

  return {
    success: true,
    target: safeTarget,
    data: parsed.json,
  }
}

export async function getComfyHistoryDirect(
  apiUrl: string | undefined,
  promptId: string,
) {
  const apiBase = normalizeComfyUrl(apiUrl)
  const history = await getHistory(apiBase, promptId)

  if (!history) {
    return {
      success: false,
      statusCode: 404,
      status: 'unknown',
      message: 'No Comfy history found for promptId.',
    }
  }

  const image = findFirstImageOutput(history, promptId)

  return {
    success: true,
    status: image ? 'done' : 'pending',
    promptId,
    image,
    history,
  }
}
