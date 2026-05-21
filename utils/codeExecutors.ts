// /utils/codeExecutors.ts
import type { CodeDataType, CodeKind } from '@/stores/codeStore'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CodePortValue {
  type: CodeDataType
  value: unknown
}

export type CodeExecutorInputs = Record<
  string,
  CodePortValue | CodePortValue[] | undefined
>

export interface CodeExecutorContext {
  userId: number | null
  nodeId: string
  signal: AbortSignal
  /**
   * Called by streaming executors as partial output arrives.
   * portId is which output port is updating; chunk is the additional text.
   */
  onProgress?: (portId: string, chunk: string, fullSoFar: string) => void
}

export type CodeExecutor = (
  inputs: CodeExecutorInputs,
  values: Record<string, unknown>,
  ctx: CodeExecutorContext,
) => Promise<Record<string, CodePortValue>>

// ─────────────────────────────────────────────────────────────────────────────
// Field formatting for entity cards (projector pattern)
// ─────────────────────────────────────────────────────────────────────────────

function formatEntityFields(
  record: Record<string, any>,
  fields: readonly string[],
  labels: Record<string, string> = {},
): string {
  return fields
    .map((f) => {
      const v = record?.[f]
      if (v == null || v === '') return null
      const label = labels[f] ?? f.charAt(0).toUpperCase() + f.slice(1)
      return `${label}: ${v}`
    })
    .filter(Boolean)
    .join('\n')
}

const CHARACTER_LABELS: Record<string, string> = {
  name: 'Name', class: 'Class', species: 'Species',
  personality: 'Personality', backstory: 'Backstory', drive: 'Drive',
  quirks: 'Quirks', alignment: 'Alignment', role: 'Role',
  title: 'Title', honorific: 'Honorific', gender: 'Gender',
  genre: 'Genre', presentation: 'Presentation', achievements: 'Achievements',
}

const DEFAULT_CHARACTER_FIELDS = [
  'name', 'class', 'species', 'personality', 'backstory', 'drive',
] as const

// ─────────────────────────────────────────────────────────────────────────────
// Streaming helpers — three providers, three protocols
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generic SSE line iterator. Yields each "data: ..." payload as a string.
 * Works for both OpenAI and Anthropic streaming endpoints.
 */
async function* iterateSSE(
  response: Response,
  signal: AbortSignal,
): AsyncGenerator<string> {
  if (!response.body) throw new Error('No response body')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (!signal.aborted) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const payload = trimmed.slice(5).trim()
        if (payload === '[DONE]') return
        yield payload
      }
    }
  } finally {
    try { reader.cancel() } catch { /* noop */ }
  }
}

/**
 * Newline-delimited JSON iterator for Ollama's /api/chat stream.
 */
async function* iterateNDJSON(
  response: Response,
  signal: AbortSignal,
): AsyncGenerator<string> {
  if (!response.body) throw new Error('No response body')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (!signal.aborted) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed) yield trimmed
      }
    }
  } finally {
    try { reader.cancel() } catch { /* noop */ }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Coercion — graph carries only text/image/model/video/collection
// ─────────────────────────────────────────────────────────────────────────────

export function coerceToText(
  pv: CodePortValue | CodePortValue[] | undefined,
): string {
  if (!pv) return ''
  if (Array.isArray(pv)) {
    return pv.map(coerceToText).filter(Boolean).join('\n\n')
  }
  if (pv.type === 'text') return String(pv.value ?? '')
  return ''
}

export function coerceToImageRef(
  pv: CodePortValue | CodePortValue[] | undefined,
): any {
  if (!pv) return null
  const first = Array.isArray(pv) ? pv[0] : pv
  return first?.type === 'image' ? first.value : null
}

// ─────────────────────────────────────────────────────────────────────────────
// Executors
// ─────────────────────────────────────────────────────────────────────────────

export const codeExecutors: Partial<Record<CodeKind, CodeExecutor>> = {
  // ─── Inputs ───────────────────────────────────────────────────────────────

  'text-input': async (_inputs, values) => ({
    text: { type: 'text', value: String(values.text ?? '') },
  }),

  'image-upload-select': async (_inputs, values, ctx) => {
    if (!values.artImageId) throw new Error('No ArtImage selected')
    const res = await fetch(`/api/art-images/${values.artImageId}`, {
      signal: ctx.signal,
    })
    if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`)
    const data = await res.json()
    return { image: { type: 'image', value: data?.data ?? data } }
  },

  'random-image': async (_inputs, values, ctx) => {
    if (!values.collectionId) throw new Error('No collection selected')
    const res = await fetch(
      `/api/art-collections/${values.collectionId}/random`,
      { signal: ctx.signal },
    )
    if (!res.ok) throw new Error(`Random image failed: ${res.status}`)
    const data = await res.json()
    return { image: { type: 'image', value: data?.data ?? data } }
  },

  // ─── Text models (streaming) ──────────────────────────────────────────────

  'openai-text': async (inputs, values, ctx) => {
    const prompt = coerceToText(inputs.text)
    if (!prompt) throw new Error('Empty prompt')

    const res = await fetch('/api/chat/openai/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctx.signal,
      body: JSON.stringify({
        prompt,
        system: values.system || undefined,
        model: values.modelName || 'gpt-4o-mini',
        temperature: values.temperature ?? 0.7,
      }),
    })
    if (!res.ok) throw new Error(`OpenAI failed: ${res.status}`)

    let full = ''
    for await (const payload of iterateSSE(res, ctx.signal)) {
      try {
        const parsed = JSON.parse(payload)
        const chunk = parsed?.choices?.[0]?.delta?.content ?? ''
        if (chunk) {
          full += chunk
          ctx.onProgress?.('text', chunk, full)
        }
      } catch { /* ignore malformed lines */ }
    }
    return { text: { type: 'text', value: full } }
  },

  'anthropic-text': async (inputs, values, ctx) => {
    const prompt = coerceToText(inputs.text)
    if (!prompt) throw new Error('Empty prompt')

    const res = await fetch('/api/chat/anthropic/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctx.signal,
      body: JSON.stringify({
        prompt,
        system: values.system || undefined,
        model: values.modelName || 'claude-sonnet-4-6',
      }),
    })
    if (!res.ok) throw new Error(`Anthropic failed: ${res.status}`)

    let full = ''
    for await (const payload of iterateSSE(res, ctx.signal)) {
      try {
        const parsed = JSON.parse(payload)
        if (parsed?.type === 'content_block_delta') {
          const chunk = parsed?.delta?.text ?? ''
          if (chunk) {
            full += chunk
            ctx.onProgress?.('text', chunk, full)
          }
        }
      } catch { /* ignore */ }
    }
    return { text: { type: 'text', value: full } }
  },

  'ollama-text': async (inputs, values, ctx) => {
    const prompt = coerceToText(inputs.text)
    if (!prompt) throw new Error('Empty prompt')

    const res = await fetch('/api/chat/ollama/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctx.signal,
      body: JSON.stringify({
        prompt,
        system: values.system || undefined,
        model: values.modelName || 'llama3.2',
        serverName: values.serverName,
      }),
    })
    if (!res.ok) throw new Error(`Ollama failed: ${res.status}`)

    let full = ''
    for await (const line of iterateNDJSON(res, ctx.signal)) {
      try {
        const parsed = JSON.parse(line)
        const chunk = parsed?.message?.content ?? parsed?.response ?? ''
        if (chunk) {
          full += chunk
          ctx.onProgress?.('text', chunk, full)
        }
        if (parsed?.done) break
      } catch { /* ignore */ }
    }
    return { text: { type: 'text', value: full } }
  },

  // ─── Image models (non-streaming, but parallelizable) ─────────────────────

  'openai-image': async (inputs, values, ctx) => {
    const prompt = coerceToText(inputs.prompt ?? inputs.text)
    const res = await fetch('/api/art/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctx.signal,
      body: JSON.stringify({ prompt, size: values.size || '1024x1024' }),
    })
    if (!res.ok) throw new Error(`OpenAI image failed: ${res.status}`)
    const data = await res.json()
    return { image: { type: 'image', value: data?.artImage ?? data?.data } }
  },

  'stable-diffusion': async (inputs, values, ctx) => {
    const prompt = coerceToText(inputs.prompt ?? inputs.text)
    const res = await fetch('/api/art/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctx.signal,
      body: JSON.stringify({
        prompt,
        serverName: values.serverName,
        checkpoint: values.checkpoint,
        seed: values.seed ?? -1,
        steps: values.steps ?? 30,
        cfg: values.cfg ?? 3.5,
        userId: ctx.userId,
      }),
    })
    if (!res.ok) throw new Error(`Stable Diffusion failed: ${res.status}`)
    const data = await res.json()
    return { image: { type: 'image', value: data?.artImage ?? data?.data } }
  },

  // Comfy variants — same shape, different workflow value.
  'comfy-sdxl':     makeComfyExecutor('sdxl'),
  'comfy-kombine':  makeComfyExecutor('kombine'),
  'comfy-kontext':  makeComfyExecutor('kontext'),
  'comfy-schnell':  makeComfyExecutor('schnell'),
  'comfy-dev':      makeComfyExecutor('dev'),

  // ─── Media ────────────────────────────────────────────────────────────────

  'image2vid': async (inputs, values, ctx) => {
    const image = coerceToImageRef(inputs.image)
    if (!image) throw new Error('No image input')
    const prompt = coerceToText(inputs.prompt)
    const res = await fetch('/api/media/image2vid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctx.signal,
      body: JSON.stringify({ image, prompt, serverName: values.serverName }),
    })
    if (!res.ok) throw new Error(`Image-to-video failed: ${res.status}`)
    const data = await res.json()
    return { video: { type: 'video', value: data?.video ?? data?.data } }
  },

  'text2vid': async (inputs, values, ctx) => {
    const prompt = coerceToText(inputs.prompt ?? inputs.text)
    const res = await fetch('/api/media/text2vid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctx.signal,
      body: JSON.stringify({ prompt, serverName: values.serverName }),
    })
    if (!res.ok) throw new Error(`Text-to-video failed: ${res.status}`)
    const data = await res.json()
    return { video: { type: 'video', value: data?.video ?? data?.data } }
  },

  'img2model': async (inputs, values, ctx) => {
    const image = coerceToImageRef(inputs.image)
    if (!image) throw new Error('No image input')
    const res = await fetch('/api/media/img2model', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctx.signal,
      body: JSON.stringify({ image, serverName: values.serverName }),
    })
    if (!res.ok) throw new Error(`Image-to-model failed: ${res.status}`)
    const data = await res.json()
    return { model: { type: 'model', value: data?.model ?? data?.data } }
  },

  // ─── Entity projectors — read a record, emit text and/or image ────────────

  character: async (_inputs, values, ctx) => {
    if (!values.targetId) throw new Error('No character selected')
    const res = await fetch(`/api/characters/${values.targetId}`, {
      signal: ctx.signal,
    })
    if (!res.ok) throw new Error(`Character fetch failed: ${res.status}`)
    const data = await res.json()
    const record = data?.data ?? data

    const fields = (values.fields as string[]) ?? DEFAULT_CHARACTER_FIELDS
    const includePortrait = values.includePortrait !== false

    const outputs: Record<string, CodePortValue> = {
      text: { type: 'text', value: formatEntityFields(record, fields, CHARACTER_LABELS) },
    }
    if (includePortrait && record?.ArtImage) {
      outputs.portrait = { type: 'image', value: record.ArtImage }
    }
    return outputs
  },

  pitch: async (_inputs, values, ctx) => {
    if (!values.targetId) throw new Error('No pitch selected')
    const res = await fetch(`/api/pitches/${values.targetId}`, { signal: ctx.signal })
    if (!res.ok) throw new Error(`Pitch fetch failed: ${res.status}`)
    const data = await res.json()
    const record = data?.data ?? data

    const fields = (values.fields as string[]) ?? ['title', 'pitch', 'flavorText', 'description']
    const outputs: Record<string, CodePortValue> = {
      text: { type: 'text', value: formatEntityFields(record, fields) },
    }
    if (values.includeImage !== false && record?.ArtImage) {
      outputs.image = { type: 'image', value: record.ArtImage }
    }
    return outputs
  },

  dream: async (_inputs, values, ctx) => {
    if (!values.targetId) throw new Error('No dream selected')
    const res = await fetch(`/api/dreams/${values.targetId}`, { signal: ctx.signal })
    if (!res.ok) throw new Error(`Dream fetch failed: ${res.status}`)
    const data = await res.json()
    const record = data?.data ?? data

    const fields = (values.fields as string[]) ?? ['title', 'description', 'currentVibe']
    const outputs: Record<string, CodePortValue> = {
      text: { type: 'text', value: formatEntityFields(record, fields) },
    }
    if (values.includeImage !== false && record?.ArtImage) {
      outputs.image = { type: 'image', value: record.ArtImage }
    }
    return outputs
  },

  scenario: async (_inputs, values, ctx) => {
    if (!values.targetId) throw new Error('No scenario selected')
    const res = await fetch(`/api/scenarios/${values.targetId}`, { signal: ctx.signal })
    if (!res.ok) throw new Error(`Scenario fetch failed: ${res.status}`)
    const data = await res.json()
    const record = data?.data ?? data

    const fields = (values.fields as string[]) ?? ['title', 'description', 'intros', 'locations']
    const outputs: Record<string, CodePortValue> = {
      text: { type: 'text', value: formatEntityFields(record, fields) },
    }
    if (values.includeImage !== false && record?.ArtImage) {
      outputs.image = { type: 'image', value: record.ArtImage }
    }
    return outputs
  },

  bot: async (_inputs, values, ctx) => {
    if (!values.targetId) throw new Error('No bot selected')
    const res = await fetch(`/api/bots/${values.targetId}`, { signal: ctx.signal })
    if (!res.ok) throw new Error(`Bot fetch failed: ${res.status}`)
    const data = await res.json()
    const record = data?.data ?? data

    const fields = (values.fields as string[]) ?? ['name', 'botIntro', 'prompt', 'personality']
    const outputs: Record<string, CodePortValue> = {
      text: { type: 'text', value: formatEntityFields(record, fields) },
    }
    if (values.includeAvatar !== false && record?.ArtImage) {
      outputs.avatar = { type: 'image', value: record.ArtImage }
    }
    return outputs
  },

  reward: async (_inputs, values, ctx) => {
    if (!values.targetId) throw new Error('No reward selected')
    const res = await fetch(`/api/rewards/${values.targetId}`, { signal: ctx.signal })
    if (!res.ok) throw new Error(`Reward fetch failed: ${res.status}`)
    const data = await res.json()
    const record = data?.data ?? data

    const fields = (values.fields as string[]) ?? ['label', 'text', 'power', 'rarity']
    const outputs: Record<string, CodePortValue> = {
      text: { type: 'text', value: formatEntityFields(record, fields) },
    }
    if (values.includeImage !== false && record?.ArtImage) {
      outputs.image = { type: 'image', value: record.ArtImage }
    }
    return outputs
  },

  prompt: async (_inputs, values, ctx) => {
    if (!values.targetId) throw new Error('No prompt selected')
    const res = await fetch(`/api/prompts/${values.targetId}`, { signal: ctx.signal })
    if (!res.ok) throw new Error(`Prompt fetch failed: ${res.status}`)
    const data = await res.json()
    const record = data?.data ?? data

    return {
      text: { type: 'text', value: String(record?.prompt ?? '') },
    }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Comfy factory
// ─────────────────────────────────────────────────────────────────────────────

function makeComfyExecutor(workflow: string): CodeExecutor {
  return async (inputs, values, ctx) => {
    const prompt = coerceToText(inputs.prompt ?? inputs.text)
    const image = coerceToImageRef(inputs.image)

    const res = await fetch('/api/art/comfy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctx.signal,
      body: JSON.stringify({
        workflow,
        prompt,
        image,
        serverName: values.serverName,
        checkpoint: values.checkpoint,
        seed: values.seed ?? -1,
        steps: values.steps ?? 30,
        cfg: values.cfg ?? 3.5,
        userId: ctx.userId,
      }),
    })
    if (!res.ok) throw new Error(`Comfy ${workflow} failed: ${res.status}`)
    const data = await res.json()
    return { image: { type: 'image', value: data?.artImage ?? data?.data } }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Layered topological sort — for parallel execution within layers
// ─────────────────────────────────────────────────────────────────────────────

export interface LayerSortable {
  nodes: { id: string }[]
  connections: { fromNodeId: string; toNodeId: string }[]
}

/**
 * Group nodes into layers where all nodes in a layer can run in parallel.
 * Returns null on cycle. Each layer's dependencies are all in earlier layers.
 */
export function topoLayers(graph: LayerSortable): string[][] | null {
  const inDeg = new Map<string, number>()
  for (const n of graph.nodes) inDeg.set(n.id, 0)
  for (const c of graph.connections) {
    inDeg.set(c.toNodeId, (inDeg.get(c.toNodeId) ?? 0) + 1)
  }

  const layers: string[][] = []
  const visited = new Set<string>()

  while (visited.size < graph.nodes.length) {
    const ready: string[] = []
    inDeg.forEach((deg, id) => {
      if (deg === 0 && !visited.has(id)) ready.push(id)
    })
    if (!ready.length) return null // cycle

    layers.push(ready)
    for (const id of ready) {
      visited.add(id)
      for (const c of graph.connections.filter((c) => c.fromNodeId === id)) {
        inDeg.set(c.toNodeId, (inDeg.get(c.toNodeId) ?? 0) - 1)
      }
    }
  }
  return layers
}
