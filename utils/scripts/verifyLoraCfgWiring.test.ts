// Contract test: the named-checkpoint comfy lane (buildDefaultComfyWorkflow)
// actually reads Resource.recommendedCfg through loraStackCfgCeiling
// (utils/loraCfg.ts, kind-robots/t-106) instead of only having the helper
// exist unused. loraStackCfgCeiling's own arithmetic is covered by
// verifyLoraCfg.test.ts; this file covers the wiring -- that the builder
// calls it with the right checkpoint-family cfg and that an explicit
// caller cfg still wins, the same "explicit beats derived" rule every other
// default in this builder already follows (see verifyComfyOnlyGeneration.ts).
//
// Deliberately scoped to buildDefaultComfyWorkflow only:
//   - buildSdxlImg2ImgWorkflow is NOT checkpoint-family-profiled by design
//     (its cfg is pinned to 2 as this builder's own contract -- see its
//     comment in server/api/comfy/sdxl/utils/workflow.ts), so a LoRA ceiling
//     would contradict that pinned contract rather than extend it.
//   - patchComfyWorkflow (the direct/relay render route in generate.post.ts)
//     never resolves LoRAs against the Resource table, so it has no
//     recommendedCfg to read; wiring it would need a DB-resolution change
//     that is out of scope here.
import assert from 'node:assert/strict'
import { buildDefaultComfyWorkflow } from '../../server/api/comfy/sdxl/utils/workflow'

type Nodes = Record<
  string,
  { class_type?: string; inputs?: Record<string, unknown> }
>

function samplerCfg(workflow: unknown): number {
  const nodes = workflow as Nodes
  const node = Object.values(nodes).find((n) => n.class_type === 'KSampler')
  assert.ok(node?.inputs, 'workflow must contain a KSampler')
  return node.inputs.cfg as number
}

// Pony family default cfg is 10 (utils/checkpointProfiles.ts). No LoRA data ->
// unchanged family default, matching every Resource today (recommendedCfg is
// still null repo-wide; the backfill is deliberate follow-up scope).
assert.equal(
  samplerCfg(
    buildDefaultComfyWorkflow({
      prompt: 'a lighthouse',
      checkpoint: 'Pony/realcartoonPony_v1.safetensors',
    }),
  ),
  10,
  'no recommendedCfg data must leave the family default untouched',
)
assert.equal(
  samplerCfg(
    buildDefaultComfyWorkflow({
      prompt: 'a lighthouse',
      checkpoint: 'Pony/realcartoonPony_v1.safetensors',
      loraRecommendedCfgs: [null, null],
    }),
  ),
  10,
  'both-null recommendedCfg entries must leave the family default untouched',
)

// A clipping-prone LoRA (low recommendedCfg) pulls the render cfg down --
// the "most clipping-prone LoRA in the stack is the binding constraint" rule
// from the Resource.recommendedCfg doc comment.
assert.equal(
  samplerCfg(
    buildDefaultComfyWorkflow({
      prompt: 'a lighthouse',
      checkpoint: 'Pony/realcartoonPony_v1.safetensors',
      loraRecommendedCfgs: [8],
    }),
  ),
  8,
  'a single LoRA ceiling below the family default must win',
)

// Stacking multiple LoRAs takes the MINIMUM, not the family default and not
// an average -- exactly loraStackCfgCeiling's own contract.
assert.equal(
  samplerCfg(
    buildDefaultComfyWorkflow({
      prompt: 'a lighthouse',
      checkpoint: 'Pony/realcartoonPony_v1.safetensors',
      loraRecommendedCfgs: [12, 6, 9],
    }),
  ),
  6,
  'stacking must take the minimum recommendedCfg across selected LoRAs',
)

// A LoRA ceiling ABOVE the family default never raises the cfg past it --
// recommendedCfg records what a LoRA tolerates, not a floor to push toward.
assert.equal(
  samplerCfg(
    buildDefaultComfyWorkflow({
      prompt: 'a lighthouse',
      checkpoint: 'Pony/realcartoonPony_v1.safetensors',
      loraRecommendedCfgs: [13],
    }),
  ),
  10,
  'a recommendedCfg above the family default must not raise the render cfg',
)

// An explicit cfgValue still wins over both the family default and the LoRA
// ceiling -- the same "explicit caller value always wins" rule the rest of
// this builder's defaults already follow.
assert.equal(
  samplerCfg(
    buildDefaultComfyWorkflow({
      prompt: 'a lighthouse',
      checkpoint: 'Pony/realcartoonPony_v1.safetensors',
      cfgValue: 11,
      loraRecommendedCfgs: [6],
    }),
  ),
  11,
  'an explicit cfgValue must win over a lower LoRA ceiling',
)

console.log('LoRA cfg ceiling enqueue-path wiring verified')
