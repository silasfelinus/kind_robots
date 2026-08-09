// /server/utils/artJobSamplerRepair.ts
//
// Mechanical repair of out-of-band sampler settings on a queued ArtJob.
//
// The prompt contract (server/utils/artPromptContract.ts) shipped 2026-08-08 and
// is re-applied at claim time so pre-gate backlog rows cannot render with stale
// Krea settings. That guard did exactly what it was built to do — and then the
// bill arrived: on 2026-08-09 eight ArtJobs enqueued 2026-08-02..04 (4843, 4844,
// 4845, 4858, 4859, 4860, 4867, 4877) all died at claim with
//
//   [engine-step-mismatch] krea2 runs at roughly 12 steps or fewer; got 20.
//
// with a further 27 PENDING rows (7633..7965) carrying the identical defect and
// queued to die the same way, one relay poll at a time. Their graphs were
// otherwise fine: cfg had already been corrected to 1, the prompt text passed
// every other rule, only `steps` was left at the pre-fix 20.
//
// Failing those is the wrong trade. The contract exists to stop BAD ART, and a
// step count above the engine's ceiling is the one violation with an objectively
// correct repair: clamp it. There is no authorial intent to preserve in "20
// steps on a model distilled for 8" — it is a number the old queue builder wrote
// before anyone knew better. Every other rule (a conditional the model cannot
// evaluate, a format noun, a pile of text exclusions) needs a human to re-author
// the prompt, and those still hard-fail.
//
// The split that keeps both properties:
//   - ENQUEUE still rejects. A producer that sends krea2 at 20 steps gets a 422
//     and fixes itself; "violations are hard errors, not warnings" is intact for
//     everything writing new work.
//   - CLAIM repairs, then asserts. Rows that predate the gate self-heal as the
//     backlog drains, and the repair is recorded on the payload so it is visible
//     rather than silent.
import { DISTILLED_ENGINE_LIMITS } from './artPromptContract'
import { inferQueuedArtEngine } from './artJobQueueSettings'
import { parseArtJobPayload, type ArtJobPayloadRecord } from './artJobPayload'

export type SamplerRepairEntry = {
  /** `payload.steps`, or `workflow.<nodeId>.inputs.cfg` — where the value lived. */
  path: string
  from: number
  to: number
}

export type ArtJobSamplerRepairResult = {
  payload: ArtJobPayloadRecord
  changed: boolean
  /** The model family the clamp was resolved against, for the audit record. */
  engine: string
  repairs: SamplerRepairEntry[]
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function finiteNumber(value: unknown): number | null {
  // `Number('')` is 0 and `Number(null)` is 0; neither is a sampler setting.
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Clamp `steps` and `cfg` to the ceiling the engine is distilled for, wherever
 * they appear — the top-level payload fields the A1111 path reads AND every
 * KSampler node in the Comfy graph, which is what actually executes.
 *
 * Non-distilled engines have no ceiling to clamp to and are returned untouched.
 * The returned payload is a clone; the caller's input is never mutated.
 */
export function repairQueuedArtSampler(
  engine: string | null | undefined,
  rawPayload: unknown,
): ArtJobSamplerRepairResult {
  const payload = structuredClone(parseArtJobPayload(rawPayload))
  const resolvedEngine = inferQueuedArtEngine(payload, engine)
  const limits = DISTILLED_ENGINE_LIMITS[resolvedEngine]
  const repairs: SamplerRepairEntry[] = []

  if (!limits) {
    return { payload, changed: false, engine: resolvedEngine, repairs }
  }

  const ceilings: Array<{ key: 'steps' | 'cfg'; max: number }> = [
    { key: 'steps', max: limits.maxSteps },
    { key: 'cfg', max: limits.cfg },
  ]

  const clamp = (
    holder: Record<string, unknown>,
    key: 'steps' | 'cfg',
    max: number,
    path: string,
  ): void => {
    const current = finiteNumber(holder[key])
    if (current === null || current <= max) return
    holder[key] = max
    repairs.push({ path, from: current, to: max })
  }

  for (const { key, max } of ceilings) {
    clamp(payload as Record<string, unknown>, key, max, `payload.${key}`)
  }

  // A graph can legitimately carry more than one KSampler (base pass plus a
  // refiner); clamp each rather than the first one found.
  for (const [nodeId, node] of Object.entries(asRecord(payload.workflow))) {
    const record = asRecord(node)
    if (String(record.class_type || '').trim() !== 'KSampler') continue
    const inputs = record.inputs
    if (!inputs || typeof inputs !== 'object' || Array.isArray(inputs)) continue
    for (const { key, max } of ceilings) {
      clamp(
        inputs as Record<string, unknown>,
        key,
        max,
        `workflow.${nodeId}.inputs.${key}`,
      )
    }
  }

  return {
    payload,
    changed: repairs.length > 0,
    engine: resolvedEngine,
    repairs,
  }
}

/**
 * Stamp the repair onto the payload so a clamped job is auditable after the
 * fact — "why did this render at 12 steps when the row said 20" has an answer
 * in the row itself, not only in a log line nobody kept.
 */
export function recordSamplerRepair(
  payload: ArtJobPayloadRecord,
  result: ArtJobSamplerRepairResult,
  repairedAt: string,
): void {
  if (!result.changed) return
  payload.samplerRepair = {
    repairedAt,
    engine: result.engine,
    repairs: result.repairs,
  }
}
