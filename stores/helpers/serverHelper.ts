// /stores/helpers/serverHelper.ts
import type { Server } from '~/prisma/generated/prisma/client'

export type ModelStatusEngine =
  | 'A1111'
  | 'COMFY'
  | 'FLUX'
  | 'KONTEXT'
  | 'UNKNOWN'

export type ModelStatusTone = 'safe' | 'warning' | 'error' | 'unknown'

export type ModelStatusSource =
  | 'options'
  | 'sd-models'
  | 'generation-info'
  | 'comfy-history'
  | 'server-fallback'
  | 'unknown'

export interface RuntimeHealthReport {
  ok: boolean
  status: number
  statusText: string
  latencyMs: number
  path: string
  data?: unknown
}

export interface ServerRuntimeReport {
  serverId: number
  engine: ModelStatusEngine
  checkedAt: string
  success: boolean
  message: string
  health?: RuntimeHealthReport
  a1111?: Record<string, unknown>
  comfy?: Record<string, unknown>
  raw?: unknown
}

export interface ModelStatusReport {
  success: boolean
  engine: ModelStatusEngine
  tone: ModelStatusTone
  message: string
  serverId: number | null
  serverTitle: string
  selectedCheckpoint: string
  requestedCheckpoint: string
  activeModel: string
  actualGenerationModel: string
  modelHash: string
  sampler: string
  source: ModelStatusSource
  raw?: unknown
}

export interface A1111OptionsResponse {
  sd_model_checkpoint?: string
  sd_checkpoint_hash?: string
  sd_checkpoint_cache?: number
}

export interface A1111GenerationInfo {
  sd_model_name?: string
  sd_model_hash?: string
  sd_vae_name?: string
  sampler_name?: string
  scheduler?: string
}

export interface ComfyWorkflowNode {
  class_type?: string
  inputs?: Record<string, unknown>
}

export interface ComfyHistoryResponse {
  [promptId: string]: {
    prompt?: [number, string, Record<string, ComfyWorkflowNode>]
    status?: unknown
    outputs?: unknown
  }
}

export function getModelStatusEngine(
  server: Server | null | undefined,
): ModelStatusEngine {
  if (!server) return 'UNKNOWN'

  if (server.generationEngine === 'A1111' || server.serverType === 'A1111') {
    return 'A1111'
  }

  if (
    server.generationEngine === 'COMFY' ||
    server.serverType === 'COMFY' ||
    server.supportsComfyWorkflow
  ) {
    return 'COMFY'
  }

  if (server.generationEngine === 'FLUX') return 'FLUX'
  if (server.generationEngine === 'KONTEXT') return 'KONTEXT'

  return 'UNKNOWN'
}

export function normalizeCheckpointName(value: unknown): string {
  if (typeof value !== 'string') return ''

  return (
    value
      .trim()
      .replace(/^['"]|['"]$/g, '')
      .replace(/\s+\[[a-fA-F0-9]+\]$/, '')
      .replace(/\\/g, '/')
      .split('/')
      .pop()
      ?.trim() || ''
  )
}

export function normalizeModelName(value: unknown): string {
  if (typeof value !== 'string') return ''

  return value.trim().replace(/^['"]|['"]$/g, '')
}

export function modelNamesMatch(left: unknown, right: unknown): boolean {
  const a = normalizeCheckpointName(left).toLowerCase()
  const b = normalizeCheckpointName(right).toLowerCase()

  if (!a || !b) return false
  if (a === b) return true

  const aBase = a.replace(/\.(safetensors|ckpt|pt|bin)$/i, '')
  const bBase = b.replace(/\.(safetensors|ckpt|pt|bin)$/i, '')

  return aBase === bBase
}

export function parseA1111GenerationInfo(value: unknown): A1111GenerationInfo {
  if (!value) return {}

  if (typeof value === 'string') {
    try {
      return parseA1111GenerationInfo(JSON.parse(value))
    } catch {
      return {}
    }
  }

  if (typeof value !== 'object') return {}

  const data = value as Record<string, unknown>

  return {
    sd_model_name:
      typeof data.sd_model_name === 'string' ? data.sd_model_name : '',
    sd_model_hash:
      typeof data.sd_model_hash === 'string' ? data.sd_model_hash : '',
    sd_vae_name: typeof data.sd_vae_name === 'string' ? data.sd_vae_name : '',
    sampler_name:
      typeof data.sampler_name === 'string' ? data.sampler_name : '',
    scheduler: typeof data.scheduler === 'string' ? data.scheduler : '',
  }
}

export function findComfyCheckpointFromWorkflow(workflow: unknown): string {
  if (!workflow || typeof workflow !== 'object') return ''

  const nodes = workflow as Record<string, ComfyWorkflowNode>

  for (const node of Object.values(nodes)) {
    const classType = node.class_type || ''
    const lowerClassType = classType.toLowerCase()
    const inputs = node.inputs || {}

    if (
      classType === 'CheckpointLoaderSimple' ||
      classType === 'CheckpointLoader' ||
      lowerClassType.includes('checkpoint')
    ) {
      const checkpoint =
        inputs.ckpt_name ||
        inputs.checkpoint ||
        inputs.model ||
        inputs.model_name

      if (typeof checkpoint === 'string' && checkpoint.trim()) {
        return checkpoint.trim()
      }
    }

    if (
      classType === 'UNETLoader' ||
      classType === 'DiffusionModelLoader' ||
      lowerClassType.includes('unet')
    ) {
      const model = inputs.unet_name || inputs.model_name || inputs.model

      if (typeof model === 'string' && model.trim()) {
        return model.trim()
      }
    }
  }

  return ''
}

export function findComfyCheckpointFromHistory(history: unknown): string {
  if (!history || typeof history !== 'object') return ''

  const entries = Object.values(history as ComfyHistoryResponse)

  for (const entry of entries.reverse()) {
    const workflow = entry.prompt?.[2]
    const checkpoint = findComfyCheckpointFromWorkflow(workflow)

    if (checkpoint) return checkpoint
  }

  return ''
}

export function createModelStatusReport(input: {
  server: Server | null | undefined
  selectedCheckpoint?: string
  requestedCheckpoint?: string
  activeModel?: string
  actualGenerationModel?: string
  modelHash?: string
  sampler?: string
  source?: ModelStatusSource
  raw?: unknown
}): ModelStatusReport {
  const server = input.server
  const selectedCheckpoint = normalizeCheckpointName(input.selectedCheckpoint)
  const requestedCheckpoint = normalizeCheckpointName(input.requestedCheckpoint)
  const activeModel = normalizeCheckpointName(input.activeModel)
  const actualGenerationModel = normalizeCheckpointName(
    input.actualGenerationModel,
  )
  const modelHash =
    typeof input.modelHash === 'string' ? input.modelHash.trim() : ''
  const sampler = typeof input.sampler === 'string' ? input.sampler.trim() : ''
  const engine = getModelStatusEngine(server)

  const expected = requestedCheckpoint || selectedCheckpoint
  const observed = actualGenerationModel || activeModel

  let tone: ModelStatusTone = 'unknown'
  let message = 'Model status is unknown.'

  if (!server) {
    tone = 'error'
    message = 'No active art server selected.'
  } else if (!expected && !observed) {
    tone = 'unknown'
    message = 'No selected or live model is available.'
  } else if (expected && observed && modelNamesMatch(expected, observed)) {
    tone = 'safe'
    message = 'Selected/requested model matches observed model.'
  } else if (expected && observed) {
    tone = 'warning'
    message = 'Selected/requested model does not match observed model.'
  } else if (expected && !observed) {
    tone = 'warning'
    message =
      'Model was selected/requested, but the server did not report a model.'
  } else if (!expected && observed) {
    tone = 'unknown'
    message = 'Server reported a model, but no app checkpoint is selected.'
  }

  return {
    success: tone !== 'error',
    engine,
    tone,
    message,
    serverId: server?.id ?? null,
    serverTitle: server?.label || server?.title || 'No server',
    selectedCheckpoint,
    requestedCheckpoint,
    activeModel,
    actualGenerationModel,
    modelHash,
    sampler,
    source: input.source || 'unknown',
    raw: input.raw,
  }
}
