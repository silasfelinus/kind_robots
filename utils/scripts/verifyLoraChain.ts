// /utils/scripts/verifyLoraChain.ts
//
// Contract test: stacked LoRAs actually stack.
//
// Every Comfy builder here used to splice in exactly ONE LoRA node, and the
// enqueue route rejected a second Resource outright. Chaining replaced both. The
// failure mode this file guards is quiet, not loud: a chain that builds without
// error but leaves the sampler reading the BARE checkpoint, or leaves a text
// encoder on the un-LoRA'd CLIP, renders a perfectly plausible image with none
// of the styles applied. Nothing throws; you just never get what you picked.
//
// So the assertions are structural — follow the wires — rather than "a LoraLoader
// node exists".
import assert from 'node:assert/strict'
import {
  MAX_LORAS_PER_JOB,
  appendModelClipLoraChain,
  appendModelOnlyLoraChain,
  normalizeLoraSelections,
} from '../../server/api/comfy/utils/loraChain'
import { MAX_LORAS_PER_JOB as SHARED_CAP } from '../loraLimits'
import {
  buildDefaultComfyWorkflow,
  buildSdxlImg2ImgWorkflow,
} from '../../server/api/comfy/sdxl/utils/workflow'
import { buildKrea2WorkflowFromRequest } from '../../server/api/comfy/krea2/utils/workflow'
import { buildFlux2KleinWorkflowFromRequest } from '../../server/api/comfy/flux2/utils/workflow'
import { applyArtJobOverrides } from '../../server/utils/artJobRetry'

type Nodes = Record<
  string,
  {
    class_type?: string
    inputs?: Record<string, unknown>
    _meta?: Record<string, unknown>
  }
>

function nodesOf(workflow: unknown): Nodes {
  return workflow as Nodes
}

function nodeById(workflow: unknown, id: string) {
  const node = nodesOf(workflow)[id]
  assert.ok(node?.inputs, `workflow must contain node ${id}`)
  return node
}

function loraNodes(workflow: unknown) {
  return Object.entries(nodesOf(workflow))
    .filter(
      ([, node]) =>
        node.class_type === 'LoraLoader' ||
        node.class_type === 'LoraLoaderModelOnly',
    )
    .map(([id, node]) => ({ id, node }))
    .sort(
      (a, b) =>
        Number(a.node._meta?.krLoraIndex ?? 0) -
        Number(b.node._meta?.krLoraIndex ?? 0),
    )
}

function samplerInputs(workflow: unknown): Record<string, unknown> {
  const node = Object.values(nodesOf(workflow)).find(
    (entry) => entry.class_type === 'KSampler',
  )
  assert.ok(node?.inputs, 'workflow must contain a KSampler')
  return node.inputs
}

/**
 * Walk the chain from `start` back to its root, asserting each link reads the
 * previous one. A chain that merely EXISTS but is wired in parallel off the base
 * model applies only its last link — the exact bug this walks to rule out.
 */
function assertChainedFrom(
  workflow: unknown,
  start: unknown,
  expected: string[],
  key: 'model' | 'clip',
  label: string,
) {
  const walked: string[] = []
  let ref = start as [string, number]

  for (let step = 0; step < expected.length; step += 1) {
    assert.ok(Array.isArray(ref), `${label}: ${key} ref must be a node link`)
    const node = nodeById(workflow, ref[0])
    assert.ok(
      node.class_type === 'LoraLoader' ||
        node.class_type === 'LoraLoaderModelOnly',
      `${label}: ${key} must run through a LoRA node, found ${node.class_type}`,
    )
    walked.unshift(String(node.inputs!.lora_name))
    ref = node.inputs![key] as [string, number]
  }

  assert.deepEqual(
    walked,
    expected,
    `${label}: ${key} must pass through every LoRA in order`,
  )
}

// ── The cap is one number, shared ───────────────────────────────────────────

assert.equal(
  MAX_LORAS_PER_JOB,
  SHARED_CAP,
  'the chain builder and the browser-side picker must agree on the cap',
)

// ── normalizeLoraSelections ─────────────────────────────────────────────────

assert.deepEqual(
  normalizeLoraSelections({ loraName: 'a.safetensors', loraStrength: 0.7 }),
  [{ name: 'a.safetensors', strength: 0.7 }],
  'the legacy singular pair still resolves to a one-link chain',
)

assert.deepEqual(
  normalizeLoraSelections({
    loras: [
      { name: 'a.safetensors', strength: 0.8 },
      { name: 'b.safetensors' },
    ],
    loraName: 'ignored.safetensors',
  }),
  [
    { name: 'a.safetensors', strength: 0.8 },
    { name: 'b.safetensors', strength: 1 },
  ],
  'the multi form wins over the singular pair, and strength defaults to 1',
)

assert.deepEqual(
  normalizeLoraSelections({
    loras: [{ name: 'dupe.safetensors' }, { name: 'DUPE.safetensors' }],
  }).length,
  1,
  'the same LoRA twice would silently double its strength, so it is deduped',
)

assert.equal(
  normalizeLoraSelections({
    loras: Array.from({ length: MAX_LORAS_PER_JOB + 4 }, (_, index) => ({
      name: `lora-${index}.safetensors`,
    })),
  }).length,
  MAX_LORAS_PER_JOB,
  'an over-long chain is truncated to the cap, not rejected',
)

assert.deepEqual(
  normalizeLoraSelections({ loras: [{ name: 'x.safetensors', strength: 99 }] }),
  [{ name: 'x.safetensors', strength: 2 }],
  'strength is clamped rather than passed through to the graph',
)

assert.deepEqual(
  normalizeLoraSelections({ loras: [], loraName: '  ' }),
  [],
  'blank input means no chain at all',
)

// ── Chain builders wire in order ────────────────────────────────────────────

{
  const workflow: Nodes = { '1': { class_type: 'UNETLoader', inputs: {} } }
  const model = appendModelOnlyLoraChain(workflow, {
    loras: [
      { name: 'one.safetensors', strength: 1 },
      { name: 'two.safetensors', strength: 0.5 },
    ],
    model: ['1', 0],
    startId: 10,
  })
  assertChainedFrom(
    workflow,
    model,
    ['one.safetensors', 'two.safetensors'],
    'model',
    'model-only chain',
  )
  assert.equal(
    Object.values(workflow).filter((node) => node.class_type === 'LoraLoader')
      .length,
    0,
    'the model-only chain must not introduce CLIP-rerouting LoraLoader nodes',
  )
}

{
  const workflow: Nodes = {
    '1': { class_type: 'CheckpointLoaderSimple', inputs: {} },
  }
  const chained = appendModelClipLoraChain(workflow, {
    loras: [
      { name: 'one.safetensors', strength: 1 },
      { name: 'two.safetensors', strength: 0.25 },
    ],
    model: ['1', 0],
    clip: ['1', 1],
    startId: 10,
  })
  assertChainedFrom(
    workflow,
    chained.model,
    ['one.safetensors', 'two.safetensors'],
    'model',
    'model+clip chain',
  )
  assertChainedFrom(
    workflow,
    chained.clip,
    ['one.safetensors', 'two.safetensors'],
    'clip',
    'model+clip chain',
  )
}

// An id already taken must not be overwritten -- kontext starts its chain at 61
// in a graph that already numbers into the 60s.
{
  const workflow: Nodes = {
    '1': { class_type: 'UNETLoader', inputs: {} },
    '10': { class_type: 'SomethingElse', inputs: { keep: true } },
  }
  appendModelOnlyLoraChain(workflow, {
    loras: [{ name: 'one.safetensors', strength: 1 }],
    model: ['1', 0],
    startId: 10,
  })
  assert.deepEqual(
    workflow['10']!.inputs,
    { keep: true },
    'chain allocation must skip occupied node ids instead of clobbering them',
  )
}

// ── Backwards compatibility: one LoRA still lands on node 10 ───────────────
//
// verifyComfyOnlyGeneration.ts asserts the SDXL lane's single-LoRA wiring by
// literal node id. Chaining must not move it.

{
  const workflow = buildDefaultComfyWorkflow({
    prompt: 'showcase',
    cfgValue: 6,
    checkpoint: 'base.safetensors',
    loraName: 'style.safetensors',
    loraStrength: 1,
  })
  assert.deepEqual(samplerInputs(workflow).model, ['10', 0])
  assert.deepEqual(nodeById(workflow, '2').inputs!.clip, ['10', 1])
}

// ── Whole-builder chains ───────────────────────────────────────────────────

const three = [
  { name: 'first.safetensors', strength: 1 },
  { name: 'second.safetensors', strength: 0.6 },
  { name: 'third.safetensors', strength: 0.3 },
]
const names = three.map((lora) => lora.name)

{
  const workflow = buildDefaultComfyWorkflow({
    prompt: 'stacked',
    cfgValue: 6,
    checkpoint: 'base.safetensors',
    loras: three,
  })
  assert.equal(loraNodes(workflow).length, 3, 'sdxl txt2img: three LoRA nodes')
  assertChainedFrom(
    workflow,
    samplerInputs(workflow).model,
    names,
    'model',
    'sdxl txt2img',
  )
  // Both encoders, not just the positive one: a negative prompt encoded against
  // un-LoRA'd CLIP mismatches the positive and quietly degrades the result.
  for (const id of ['2', '3']) {
    assertChainedFrom(
      workflow,
      nodeById(workflow, id).inputs!.clip,
      names,
      'clip',
      `sdxl txt2img node ${id}`,
    )
  }
}

{
  const { workflow } = buildSdxlImg2ImgWorkflow({
    prompt: 'stacked restyle',
    imageName: 'source.png',
    checkpoint: 'base.safetensors',
    loras: three,
  })
  assert.equal(loraNodes(workflow).length, 3, 'sdxl img2img: three LoRA nodes')
  assertChainedFrom(
    workflow,
    samplerInputs(workflow).model,
    names,
    'model',
    'sdxl img2img',
  )
  for (const id of ['2', '3']) {
    assertChainedFrom(
      workflow,
      nodeById(workflow, id).inputs!.clip,
      names,
      'clip',
      `sdxl img2img node ${id}`,
    )
  }
}

for (const [label, build] of [
  [
    'krea2',
    () =>
      buildKrea2WorkflowFromRequest({ prompt: 'stacked', loras: three })
        .workflow,
  ],
  [
    'flux2',
    () =>
      buildFlux2KleinWorkflowFromRequest({ prompt: 'stacked', loras: three })
        .workflow,
  ],
] as Array<[string, () => unknown]>) {
  const workflow = build()
  assert.equal(loraNodes(workflow).length, 3, `${label}: three LoRA nodes`)
  assertChainedFrom(
    workflow,
    samplerInputs(workflow).model,
    names,
    'model',
    label,
  )
  // These lanes load CLIP separately; re-routing it through a model-only LoRA
  // would be a graph error, so the encoders must stay on the CLIPLoader.
  assert.deepEqual(
    nodeById(workflow, '3').inputs!.clip,
    ['2', 0],
    `${label}: text encoders stay on the CLIPLoader`,
  )
}

// No LoRAs asked for means no LoRA nodes and the bare model — the base graph
// must be byte-identical to what it was before chaining existed.
for (const [label, build] of [
  [
    'sdxl txt2img',
    () =>
      buildDefaultComfyWorkflow({
        prompt: 'x',
        cfgValue: 6,
        checkpoint: 'c.safetensors',
      }),
  ],
  ['krea2', () => buildKrea2WorkflowFromRequest({ prompt: 'x' }).workflow],
  ['flux2', () => buildFlux2KleinWorkflowFromRequest({ prompt: 'x' }).workflow],
] as Array<[string, () => unknown]>) {
  const workflow = build()
  assert.equal(
    loraNodes(workflow).length,
    0,
    `${label}: no LoRA nodes when none asked for`,
  )
  assert.deepEqual(
    samplerInputs(workflow).model,
    ['1', 0],
    `${label}: the sampler reads the base model directly`,
  )
}

// ── A singular override must not collapse a chain ──────────────────────────
//
// applyArtJobOverrides repoints every non-"required" style LoRA node, which is
// right for WAN's two expert passes and wrong for a stack: it would set all
// three links to one file. krLoraIndex is how the two are told apart.

{
  const workflow = buildDefaultComfyWorkflow({
    prompt: 'stacked',
    cfgValue: 6,
    checkpoint: 'base.safetensors',
    loras: three,
  })
  const out = applyArtJobOverrides(
    { workflow, resources: { loraNames: names } },
    { loraName: 'swapped.safetensors', loraStrength: 0.9 },
  )
  const applied = loraNodes(out.workflow).map(
    ({ node }) => node.inputs!.lora_name,
  )
  assert.deepEqual(
    applied,
    ['swapped.safetensors', 'second.safetensors', 'third.safetensors'],
    'a singular override lands on the first link only',
  )
  assert.deepEqual(
    (out.resources as { loraNames: string[] }).loraNames,
    ['swapped.safetensors', 'second.safetensors', 'third.safetensors'],
    'the metadata list follows the workflow instead of flattening to one name',
  )
}

// WAN-style unindexed nodes keep taking the override on every pass.
{
  const payload: Record<string, unknown> = {
    workflow: {
      high: {
        class_type: 'LoraLoaderModelOnly',
        inputs: { lora_name: 'old.safetensors', strength_model: 1 },
        _meta: { title: 'Load Selected WAN LoRA (high)' },
      },
      low: {
        class_type: 'LoraLoaderModelOnly',
        inputs: { lora_name: 'old.safetensors', strength_model: 1 },
        _meta: { title: 'Load Selected WAN LoRA (low)' },
      },
    },
  }
  const out = applyArtJobOverrides(payload, { loraName: 'new.safetensors' })
  const graph = out.workflow as Nodes
  assert.equal(graph.high!.inputs!.lora_name, 'new.safetensors')
  assert.equal(
    graph.low!.inputs!.lora_name,
    'new.safetensors',
    'unindexed multi-pass nodes keep taking the override on every pass',
  )
}

console.log(
  'LoRA chain contract OK: selections normalize and dedupe, chains wire in ' +
    'order through model and CLIP on every lane, the single-LoRA graph is ' +
    'unchanged, and a singular override lands on one link.',
)
