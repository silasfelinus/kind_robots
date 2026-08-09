// /server/utils/artJobQueueSettings.ts
//
// Reading a queued ArtJob's real engine, sampler settings, and prompt out of its
// payload, plus the claim-time re-application of the prompt contract built on
// them. Extracted from artJobQueueCoverage.ts, which still re-exports all three
// for its existing callers.
//
// The extraction is not cosmetic. artJobQueueCoverage imports prisma, and
// prisma.ts throws at import time when DATABASE_URL is unset — so anything that
// touched these pure functions dragged a database requirement along with it, and
// the DB-free contract-tests workflow could not reach them. That is how a test
// for the claim-time guard failed in CI while passing locally, where a
// DATABASE_URL happened to be exported. These four functions need no database;
// living apart from one keeps them testable in the workflow that gates every PR.
import { assertArtPromptContract } from './artPromptContract'

type JsonRecord = Record<string, unknown>

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as JsonRecord
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function finiteNumber(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function workflowNodes(payload: unknown): JsonRecord[] {
  return Object.values(asRecord(asRecord(payload).workflow)).map(asRecord)
}

/** Infer the model family from the actual Comfy graph, not only relay engine. */
export function inferQueuedArtEngine(
  payload: unknown,
  fallbackEngine?: string | null,
): string {
  const record = asRecord(payload)
  const explicit = clean(record.engine).toLowerCase()
  if (explicit && explicit !== 'comfy') return explicit

  let sawCheckpointLoader = false
  for (const node of workflowNodes(record)) {
    const classType = clean(node.class_type)
    const inputs = asRecord(node.inputs)
    const clipType = clean(inputs.type).toLowerCase()
    const modelName =
      `${clean(inputs.unet_name)} ${clean(inputs.ckpt_name)}`.toLowerCase()

    if (clipType === 'krea2' || modelName.includes('krea-2')) return 'krea2'
    if (clipType === 'flux2' || modelName.includes('flux-2-klein'))
      return 'flux2'
    if (classType === 'FluxGuidance' || clipType === 'flux') return 'flux'
    if (classType === 'CheckpointLoaderSimple') sawCheckpointLoader = true
  }

  if (sawCheckpointLoader) return 'comfy'
  return clean(fallbackEngine).toLowerCase()
}

/** Read the settings the sampler will actually execute. */
export function queuedArtSamplerSettings(payload: unknown): {
  steps: number | null
  cfg: number | null
} {
  const record = asRecord(payload)
  for (const node of workflowNodes(record)) {
    if (clean(node.class_type) !== 'KSampler') continue
    const inputs = asRecord(node.inputs)
    return {
      steps: finiteNumber(inputs.steps) ?? finiteNumber(record.steps),
      cfg: finiteNumber(inputs.cfg) ?? finiteNumber(record.cfg),
    }
  }
  return {
    steps: finiteNumber(record.steps),
    cfg: finiteNumber(record.cfg),
  }
}

export function queuedArtPrompt(payload: unknown): string {
  const record = asRecord(payload)
  const topLevel = clean(record.promptString) || clean(record.prompt)
  if (topLevel) return topLevel

  for (const node of workflowNodes(record)) {
    const classType = clean(node.class_type)
    if (
      classType !== 'CLIPTextEncode' &&
      classType !== 'ImpactWildcardEncode'
    ) {
      continue
    }
    const title = clean(asRecord(node._meta).title).toLowerCase()
    if (title.includes('negative')) continue
    const inputs = asRecord(node.inputs)
    const prompt = clean(inputs.text) || clean(inputs.wildcard_text)
    if (prompt) return prompt
  }
  return ''
}

/**
 * Apply today's prompt/model contract to old PENDING rows too. The enqueue gate
 * protects new work; this guard stops pre-gate backlog rows from quietly
 * rendering with stale Krea settings or known-bad prompt vocabulary.
 *
 * Callers clamp out-of-band sampler settings first (see artJobSamplerRepair.ts);
 * what reaches here is what no machine can safely rewrite.
 */
export function assertQueuedArtPromptContract(
  engine: string,
  payload: unknown,
): void {
  const actualEngine = inferQueuedArtEngine(payload, engine)
  const sampler = queuedArtSamplerSettings(payload)
  assertArtPromptContract({
    prompt: queuedArtPrompt(payload),
    engine: actualEngine,
    steps: sampler.steps,
    cfg: sampler.cfg,
  })
}
