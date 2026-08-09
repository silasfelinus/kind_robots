// Contract test for server/utils/artJobSamplerRepair.ts and the two callers
// that decide whether a pre-gate backlog row renders or dies.
//
// The case this file exists for, in full: on 2026-08-09 the shared render queue
// reported nine recent failures, eight of them identical —
//
//   ArtJob validation failed before claim: Art prompt rejected by the prompt
//   contract (1 violation):
//     [engine-step-mismatch] krea2 runs at roughly 12 steps or fewer; got 20.
//
// ArtJobs 4843/4844/4845/4858/4859/4860/4867/4877, all enqueued 2026-08-02..04,
// all with cfg already correct at 1 and prompts that pass every other rule. A
// scan of the full 2815-row PENDING backlog found 27 more (7633..7965) with the
// same single defect and nothing else wrong. The gate was right to exist and
// wrong to be terminal here: "20 steps on a model distilled for 8" is a number
// to clamp, not a prompt to re-author.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  repairQueuedArtSampler,
  recordSamplerRepair,
} from '../../server/utils/artJobSamplerRepair'
import { assertQueuedArtPromptContract } from '../../server/utils/artJobQueueCoverage'
import { DISTILLED_ENGINE_LIMITS } from '../../server/utils/artPromptContract'

/** The shape ArtJob 4877 actually carried, trimmed to what the gate reads. */
function krea2JobAsShipped(steps: number, cfg: number) {
  return {
    promptString:
      'Create artwork for Magic. Visible subject and scene context: a brass ' +
      'orrery on a workbench, an unpeopled frame — the subject stands alone ' +
      'with no bystanders, onlookers, or crowd',
    width: 1024,
    height: 1024,
    steps,
    cfg,
    collection: 'krea2',
    workflow: {
      '1': {
        inputs: { unet_name: 'Krea-2-Turbo-Q5_K_S.gguf' },
        class_type: 'UnetLoaderGGUF',
      },
      '2': {
        inputs: {
          clip_name: 'qwen3vl_4b_fp8_scaled.safetensors',
          type: 'krea2',
        },
        class_type: 'CLIPLoader',
      },
      '7': {
        inputs: {
          seed: 12345,
          steps,
          cfg: 1,
          sampler_name: 'euler',
          scheduler: 'simple',
          denoise: 1,
        },
        class_type: 'KSampler',
      },
    },
  }
}

// ── The exact failure, repaired ─────────────────────────────────────────────

const shipped = krea2JobAsShipped(20, 7)

// Unrepaired, this is precisely what killed the eight jobs.
assert.throws(
  () => assertQueuedArtPromptContract('COMFY', shipped),
  /engine-step-mismatch/,
  'the as-shipped 20-step krea2 job must still be rejected without repair',
)

const repaired = repairQueuedArtSampler('COMFY', shipped)
assert.equal(
  repaired.engine,
  'krea2',
  'engine is inferred from the Comfy graph',
)
assert.ok(repaired.changed, 'a 20-step krea2 job must report a repair')
assert.doesNotThrow(
  () => assertQueuedArtPromptContract('COMFY', repaired.payload),
  'the repaired payload must pass the same gate that rejected the original',
)

// The clamp lands where the sampler actually reads it, not only on the metadata.
const workflow = repaired.payload.workflow as Record<
  string,
  { inputs: Record<string, unknown> }
>
assert.equal(
  workflow['7']!.inputs.steps,
  DISTILLED_ENGINE_LIMITS.krea2!.maxSteps,
  'the KSampler node is what executes — clamp it, not just payload.steps',
)
assert.equal(repaired.payload.steps, DISTILLED_ENGINE_LIMITS.krea2!.maxSteps)
assert.equal(
  repaired.payload.cfg,
  DISTILLED_ENGINE_LIMITS.krea2!.cfg,
  'a top-level cfg of 7 on a cfg-1 engine is also out of band',
)

// The caller's object is never mutated: claim.post.ts still reports the
// original candidate elsewhere, and a silent in-place edit would desync it.
assert.equal(shipped.steps, 20, 'repair must not mutate its input')
assert.equal(shipped.workflow['7'].inputs.steps, 20)

// ── What repair must NOT do ─────────────────────────────────────────────────

// In-band settings are left exactly alone — no gratuitous payload churn across
// a 2800-row backlog, and no "repaired" stamp on a job nothing was wrong with.
const healthy = repairQueuedArtSampler('COMFY', krea2JobAsShipped(8, 1))
assert.equal(healthy.changed, false, 'an 8-step krea2 job is already legal')
assert.deepEqual(healthy.repairs, [])

// A1111 and other non-distilled engines have no ceiling to clamp to. ArtJob
// 8116 (A1111, 24 steps) failed on a refused ComfyUI connection, not on this —
// clamping its steps would be inventing a rule the contract does not have.
const a1111 = repairQueuedArtSampler('A1111', {
  promptString: 'a lighthouse at dusk',
  steps: 24,
  cfg: 6,
})
assert.equal(a1111.changed, false, 'non-distilled engines are untouched')
assert.equal(a1111.payload.steps, 24)

// Repair is for the mechanical rules only. A prompt a machine cannot safely
// rewrite must still fail loudly, exactly as it did before.
const conditional = repairQueuedArtSampler('COMFY', {
  ...krea2JobAsShipped(20, 7),
  promptString:
    'a treasure-card illustration of a ladle; include robots only when the ' +
    'subject or scene explicitly calls for them',
})
assert.throws(
  () => assertQueuedArtPromptContract('COMFY', conditional.payload),
  /conditional-instruction|format-vocabulary/,
  'clamping steps must not launder a prompt that needs re-authoring',
)

// Refiner graphs carry more than one KSampler; the first one is not the only one.
const twoSamplers = repairQueuedArtSampler('COMFY', {
  promptString: 'a brass orrery',
  collection: 'krea2',
  workflow: {
    '2': { inputs: { type: 'krea2' }, class_type: 'CLIPLoader' },
    '7': { inputs: { steps: 20, cfg: 1 }, class_type: 'KSampler' },
    '9': { inputs: { steps: 30, cfg: 1 }, class_type: 'KSampler' },
  },
})
const twoSamplerNodes = twoSamplers.payload.workflow as Record<
  string,
  { inputs: Record<string, unknown> }
>
assert.equal(twoSamplerNodes['7']!.inputs.steps, 12)
assert.equal(
  twoSamplerNodes['9']!.inputs.steps,
  12,
  'every KSampler is clamped',
)

// A missing/blank steps value is absent, not zero — Number('') is 0, and a
// clamp that reads 0 would quietly rewrite "unset" into a real setting.
const unset = repairQueuedArtSampler('COMFY', {
  promptString: 'a brass orrery',
  collection: 'krea2',
  steps: '',
  workflow: { '2': { inputs: { type: 'krea2' }, class_type: 'CLIPLoader' } },
})
assert.equal(unset.changed, false)
assert.equal(unset.payload.steps, '', 'an unset value stays unset')

// ── The audit stamp ─────────────────────────────────────────────────────────

const stamped: Record<string, unknown> = {}
recordSamplerRepair(stamped, repaired, '2026-08-09T12:00:00.000Z')
const stamp = stamped.samplerRepair as {
  engine: string
  repairs: Array<{ path: string; from: number; to: number }>
}
assert.equal(stamp.engine, 'krea2')
assert.ok(
  stamp.repairs.some(
    (r) => r.path === 'workflow.7.inputs.steps' && r.from === 20,
  ),
  'the stamp must name what changed and what it was',
)

const unstamped: Record<string, unknown> = {}
recordSamplerRepair(unstamped, healthy, '2026-08-09T12:00:00.000Z')
assert.equal(
  unstamped.samplerRepair,
  undefined,
  'an untouched job gets no repair record',
)

// ── The callers stay wired ──────────────────────────────────────────────────
//
// The repair is worthless if a later refactor drops the call, and neither
// caller is reachable from a DB-free test. Assert the wiring textually, the
// same way verifyFacetCatalogMaintenance.ts guards the claim-time contract.

const claim = readFileSync('server/api/art/queue/claim.post.ts', 'utf8')
for (const required of [
  'repairQueuedArtSampler',
  'assertQueuedArtPromptContract(candidate.engine, samplerRepair.payload)',
  'recordSamplerRepair',
]) {
  assert.ok(
    claim.includes(required),
    `claim.post.ts must repair the sampler before asserting: ${required}`,
  )
}
assert.ok(
  !claim.includes(
    'assertQueuedArtPromptContract(candidate.engine, candidate.payload)',
  ),
  'claim.post.ts must assert against the REPAIRED payload, not the raw candidate',
)

const requeue = readFileSync(
  'server/api/art/queue/reenqueue-failed.post.ts',
  'utf8',
)
assert.ok(
  requeue.includes('repairQueuedArtSampler'),
  'requeueing a failed job must clamp the sampler, or it fails again at claim',
)

// The other half of the split: ENQUEUE must keep rejecting outright, so a
// producer writing new work still fails loudly instead of being quietly fixed.
const enqueue = readFileSync('server/api/art/enqueue.post.ts', 'utf8')
assert.ok(
  enqueue.includes('assertArtPromptContract'),
  'the enqueue gate must stay a hard rejection',
)
assert.ok(
  !enqueue.includes('repairQueuedArtSampler'),
  'enqueue must NOT auto-repair — producers fix themselves, backlog self-heals',
)

console.log('artJobSamplerRepair contract OK')
