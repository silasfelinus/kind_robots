import { createHash } from 'node:crypto'
import { createError } from 'h3'
import {
  parseArtJobPayload,
  type ArtJobPayloadRecord,
} from './artJobPayload'

export type ArtJobCompletionOutput = {
  filename: string
  subfolder: string
  type: string
}

export type ArtJobCompletionProof = {
  relayVersion?: string | null
  relayCommit?: string | null
  promptId?: string | null
  promptHash?: string | null
  workflowHash?: string | null
  workflowPromptHash?: string | null
  output?: Partial<ArtJobCompletionOutput> | null
}

export type ArtJobProvenanceRecord = {
  version: 1
  normalizedPrompt: string
  promptHash: string
  workflowHash: string | null
  workflowPromptHash: string | null
  workflowPromptMatches: boolean | null
  workflowTextCandidates: string[]
  expectedModels: string[]
  attemptFingerprint: string
  idempotencyKey: string | null
  requireCompletionProof: boolean
  createdAt: string
  completion?: Record<string, unknown>
}

type ProvenanceOptions = {
  projectSlug?: string | null
  idempotencyKey?: string | null
  requireCompletionProof?: boolean
}

const TEXT_INPUT_PATTERN = /(^|_)(prompt|text)($|_)/i
const MODEL_INPUT_PATTERN =
  /(^|_)(ckpt|checkpoint|unet|clip|vae|lora|controlnet|ipadapter|ip_adapter|upscale|model).*name($|_)/i

function asRecord(value: unknown): ArtJobPayloadRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as ArtJobPayloadRecord
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    )
  }

  if (typeof value === 'number' && !Number.isFinite(value)) return null
  return value
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export function normalizeArtPrompt(value: unknown): string {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function collectWorkflowStrings(
  value: unknown,
  predicate: (key: string, value: string) => boolean,
  output: string[],
): void {
  if (Array.isArray(value)) {
    for (const child of value) collectWorkflowStrings(child, predicate, output)
    return
  }

  if (!value || typeof value !== 'object') return

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (typeof child === 'string' && predicate(key, child)) {
      const normalized = normalizeArtPrompt(child)
      if (normalized) output.push(normalized)
    }

    collectWorkflowStrings(child, predicate, output)
  }
}

export function extractWorkflowTextCandidates(workflow: unknown): string[] {
  const values: string[] = []

  collectWorkflowStrings(
    workflow,
    (key) =>
      TEXT_INPUT_PATTERN.test(key) ||
      key === 'wildcard_text' ||
      key === 'populated_text',
    values,
  )

  return [...new Set(values)]
}

export function extractWorkflowModels(workflow: unknown): string[] {
  const values: string[] = []

  collectWorkflowStrings(
    workflow,
    (key, value) =>
      MODEL_INPUT_PATTERN.test(key) ||
      (/\.(safetensors|ckpt|pt|pth|gguf|bin)$/i.test(value) &&
        /(model|loader|checkpoint|unet|clip|vae|lora)/i.test(key)),
    values,
  )

  return [...new Set(values)].sort()
}

function requestPrompt(payload: ArtJobPayloadRecord): string {
  return normalizeArtPrompt(
    payload.promptString || payload.artPrompt || payload.prompt,
  )
}

function cleanIdempotencyKey(value: unknown): string | null {
  const key = String(value || '').trim()
  return key ? key.slice(0, 512) : null
}

export function enrichArtJobPayload(
  engine: 'A1111' | 'COMFY',
  rawPayload: unknown,
  options: ProvenanceOptions = {},
): {
  payload: ArtJobPayloadRecord
  provenance: ArtJobProvenanceRecord
} {
  const payload = structuredClone(parseArtJobPayload(rawPayload))
  const normalizedPrompt = requestPrompt(payload)

  if (!normalizedPrompt) {
    throw createError({
      statusCode: 400,
      message: 'ArtJob payload requires a non-empty promptString.',
    })
  }

  const promptHash = sha256(normalizedPrompt)
  let workflowHash: string | null = null
  let workflowPromptHash: string | null = null
  let workflowPromptMatches: boolean | null = null
  let workflowTextCandidates: string[] = []
  let expectedModels: string[] = []

  if (engine === 'COMFY') {
    const workflow = asRecord(payload.workflow)

    if (!Object.keys(workflow).length) {
      throw createError({
        statusCode: 400,
        message: 'COMFY ArtJob payload requires a workflow object.',
      })
    }

    workflowTextCandidates = extractWorkflowTextCandidates(workflow)
    workflowPromptMatches = workflowTextCandidates.includes(normalizedPrompt)

    if (!workflowPromptMatches) {
      throw createError({
        statusCode: 400,
        message:
          'COMFY workflow prompt does not match the top-level promptString. Refusing to enqueue ambiguous prompt metadata.',
      })
    }

    workflowHash = sha256(canonicalJson(workflow))
    workflowPromptHash = sha256(canonicalJson(workflowTextCandidates))
    expectedModels = extractWorkflowModels(workflow)
  }

  const idempotencyKey = cleanIdempotencyKey(options.idempotencyKey)
  const priorProvenance = asRecord(payload.provenance)
  const fingerprintPayload = structuredClone(payload)
  delete fingerprintPayload.provenance
  delete fingerprintPayload.attemptFingerprint

  const attemptFingerprint = sha256(
    canonicalJson({
      engine,
      projectSlug: options.projectSlug || null,
      idempotencyKey,
      request: fingerprintPayload,
    }),
  )

  const provenance: ArtJobProvenanceRecord = {
    version: 1,
    normalizedPrompt,
    promptHash,
    workflowHash,
    workflowPromptHash,
    workflowPromptMatches,
    workflowTextCandidates,
    expectedModels,
    attemptFingerprint,
    idempotencyKey,
    requireCompletionProof: options.requireCompletionProof === true,
    createdAt: new Date().toISOString(),
    ...(asRecord(priorProvenance.completion).status
      ? { completion: asRecord(priorProvenance.completion) }
      : {}),
  }

  payload.promptString = normalizedPrompt
  payload.attemptFingerprint = attemptFingerprint
  payload.provenance = provenance

  return { payload, provenance }
}

export function readArtJobProvenance(
  rawPayload: unknown,
): ArtJobProvenanceRecord | null {
  const provenance = asRecord(parseArtJobPayload(rawPayload).provenance)
  if (provenance.version !== 1) return null

  return provenance as ArtJobProvenanceRecord
}

function requiredString(value: unknown, field: string): string {
  const text = String(value || '').trim()
  if (!text) {
    throw createError({
      statusCode: 409,
      message: `COMFY completion proof is missing ${field}.`,
    })
  }
  return text
}

export function validateArtJobCompletionProof(
  rawPayload: unknown,
  rawProof: ArtJobCompletionProof | null | undefined,
): Record<string, unknown> {
  const provenance = readArtJobProvenance(rawPayload)

  if (!provenance) {
    return {
      status: 'UNAVAILABLE',
      verified: false,
      reasons: ['ArtJob was created before prompt provenance was recorded.'],
    }
  }

  if (!rawProof) {
    if (provenance.requireCompletionProof) {
      throw createError({
        statusCode: 409,
        message:
          'This COMFY ArtJob requires completion provenance, but the relay supplied none.',
      })
    }

    return {
      status: 'UNVERIFIED',
      verified: false,
      reasons: ['Relay did not supply Comfy prompt/output provenance.'],
      expected: provenance,
    }
  }

  const promptId = requiredString(rawProof.promptId, 'promptId')
  const relayVersion = requiredString(rawProof.relayVersion, 'relayVersion')
  const promptHash = requiredString(rawProof.promptHash, 'promptHash')
  const workflowHash = requiredString(rawProof.workflowHash, 'workflowHash')
  const workflowPromptHash = requiredString(
    rawProof.workflowPromptHash,
    'workflowPromptHash',
  )
  const output = rawProof.output || {}
  const filename = requiredString(output.filename, 'output.filename')
  const subfolder = String(output.subfolder || '').trim()
  const type = requiredString(output.type, 'output.type')

  const mismatches = [
    promptHash !== provenance.promptHash ? 'promptHash' : null,
    workflowHash !== provenance.workflowHash ? 'workflowHash' : null,
    workflowPromptHash !== provenance.workflowPromptHash
      ? 'workflowPromptHash'
      : null,
  ].filter(Boolean)

  if (mismatches.length) {
    throw createError({
      statusCode: 409,
      message: `COMFY completion provenance mismatch: ${mismatches.join(', ')}.`,
    })
  }

  return {
    status: 'VERIFIED',
    verified: true,
    verifiedAt: new Date().toISOString(),
    promptId,
    relayVersion,
    relayCommit: String(rawProof.relayCommit || '').trim() || null,
    promptHash,
    workflowHash,
    workflowPromptHash,
    output: { filename, subfolder, type },
    expectedModels: provenance.expectedModels,
    attemptFingerprint: provenance.attemptFingerprint,
  }
}

export function attachCompletionTrace(
  rawPayload: unknown,
  completion: Record<string, unknown>,
): ArtJobPayloadRecord {
  const payload = structuredClone(parseArtJobPayload(rawPayload))
  const provenance = asRecord(payload.provenance)
  payload.provenance = {
    ...provenance,
    completion,
  }
  return payload
}
