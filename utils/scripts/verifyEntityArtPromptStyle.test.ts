// Guards the prompt shape each render lane actually receives.
//
// kind-robots/t-105, 2026-09-16. ArtJob 25398 rendered the "Very Small Women"
// Pony LoRA as a single man. The LoRA is a size-DIFFERENCE concept whose own
// triggers are "large male, t1nyg1rlz, very small female", and the probe
// scaffold had put "single subject, upper body" six tokens away from them. The
// scaffold won. On top of that, buildEntityArtPrompt appended ~80 tokens of
// natural-language instructions to a CLIP prompt that cannot follow
// instructions and simply embedded them as content -- 74% of that job's prompt
// was boilerplate, spilling a 75-token CLIP chunk into a second chunk of noise.
import assert from 'node:assert/strict'
import { buildEntityArtPrompt } from '../../server/utils/entityArt'
import { LORA_PROBE_RECIPES } from '../loraProbe'
import { buildFluxWorkflowFromRequest } from '../../server/api/comfy/flux/utils/workflow'
import { buildDefaultComfyWorkflow } from '../../server/api/comfy/sdxl/utils/workflow'
import { checkpointFamily, checkpointProfile } from '../checkpointProfiles'
import { loraTriggerKey } from '../loraTriggerKey'
import {
  applyRequeueRepoint,
  assessRequeueSafety,
} from '../quarantinedCheckpoints'

const record = {
  id: 1,
  name: 'Very Small Women',
  customLabel: null,
  resourceType: 'LORA',
  generation: 'Pony',
  defaultTrigger: 'large male, t1nyg1rlz, very small female',
  triggerWords: null,
} as unknown as Parameters<typeof buildEntityArtPrompt>[1]['record']

const target = { entityType: 'resource' as const, field: 'imagePath', record }

// 1. A tag lane gets the user prompt and nothing else.
const tags = buildEntityArtPrompt('score_9, t1nyg1rlz, centered composition', target, {
  style: 'tags',
})
assert.equal(tags, 'score_9, t1nyg1rlz, centered composition')

// 2. None of the prose scaffolding may reach a tag lane. Each of these was
//    measurably harmful, not merely wasteful.
for (const banned of [
  'Compose this as', // carried "one clear subject"
  'not as text to render', // puts `text` in the POSITIVE prompt
  'Every surface in frame is blank and unmarked', // conditions toward blankness
  'Model type', // catalog metadata, not a visual concept
  'Base model',
]) {
  assert.ok(!tags.includes(banned), `tag lane must not contain ${banned}`)
}

// 3. A resource probe gets nothing appended on the PROSE lane either. The slot
//    framing there says "centred on one clear subject" -- the exact phrase that
//    dropped half of ArtJob 25398's two-subject LoRA -- and Name/Trigger words
//    only restate what the recipe already carries.
const prose = buildEntityArtPrompt('A candid photograph.', target, {
  style: 'prose',
})
assert.equal(prose, 'A candid photograph.')
for (const banned of ['Compose this as', 'one clear subject', 'Trigger words']) {
  assert.ok(!prose.includes(banned), `prose resource probe must not carry ${banned}`)
}

// 4. A non-resource entity still gets its context, and still never gets the
//    catalog metadata rows.
const character = buildEntityArtPrompt('A candid photograph.', {
  ...target,
  entityType: 'character' as const,
})
assert.ok(character.includes('Compose this as'), 'characters keep prose framing')
assert.ok(!character.includes('Model type'))
assert.ok(!character.includes('Base model'))

// 5. Default stays prose, so existing callers are unchanged.
assert.equal(buildEntityArtPrompt('A candid photograph.', target), prose)

// 6. No recipe may reimpose a single-subject or cropped framing...
for (const [family, recipe] of Object.entries(LORA_PROBE_RECIPES)) {
  const positive = recipe.positive('t1nyg1rlz')
  for (const banned of ['single subject', 'upper body', 'single figure']) {
    assert.ok(
      !positive.toLowerCase().includes(banned),
      `${family} recipe must not force "${banned}" -- it breaks multi-subject and full-body LoRAs`,
    )
  }
  assert.ok(positive.includes('t1nyg1rlz'), `${family} recipe must keep the trigger`)

  // ...but every recipe MUST still name a subject. A pure style LoRA supplies
  // none of its own, and a prompt with no subject noun renders nothing in
  // particular -- the Z-Image mannequin failure.
  assert.ok(
    /\bsubject\b/i.test(positive),
    `${family} recipe must anchor a subject, or style LoRAs have nothing to style`,
  )
}

// 7. The whole point: a Pony probe now fits one 75-token CLIP chunk.
const pony = LORA_PROBE_RECIPES.pony.positive(
  'large male, t1nyg1rlz, very small female',
)
const full = buildEntityArtPrompt(pony, target, { style: 'tags' })
assert.ok(
  full.length / 4 < 75,
  `Pony probe must fit one CLIP chunk, got ~${Math.round(full.length / 4)} tokens`,
)

// 8. The Flux lane must actually apply the LoRA it was handed.
//
// buildFluxWorkflowFromRequest accepted no `loras` at all until 2026-09-16, so
// every Flux job rendered base flux1-dev with the selection silently dropped.
// Nothing errored -- 126 queued Flux LoRA previews were simply of the wrong
// thing, which no failure could have revealed.
const withLora = buildFluxWorkflowFromRequest({
  prompt: 'aidmaHyperrealism. A subject centered in frame.',
  loras: [{ name: 'Flux/aidmaHyperrealism.safetensors', strength: 0.8 }],
})
const loraNodes = Object.values(withLora.workflow).filter((node) =>
  String(node.class_type ?? '').includes('Lora'),
)
assert.equal(loraNodes.length, 1, 'Flux workflow must chain the requested LoRA')
assert.equal(
  loraNodes[0]?.inputs?.lora_name,
  'Flux/aidmaHyperrealism.safetensors',
)

// It must be spliced between the UNet and the encoder that feeds the sampler,
// not left dangling where nothing reads it.
const encode = Object.entries(withLora.workflow).find(
  ([, node]) => node.class_type === 'ImpactWildcardEncode',
)
const loraId = Object.entries(withLora.workflow).find(
  ([, node]) => String(node.class_type ?? '').includes('Lora'),
)?.[0]
assert.deepEqual(
  encode?.[1]?.inputs?.model,
  [loraId, 0],
  'ImpactWildcardEncode must read the LoRA chain, not the raw UNet',
)
assert.deepEqual(
  loraNodes[0]?.inputs?.model,
  ['24', 0],
  'the LoRA chain must start at the GGUF UNet loader',
)

// No LoRAs requested -> graph is untouched and still routes UNet -> encoder.
const noLora = buildFluxWorkflowFromRequest({ prompt: 'a plain test prompt.' })
assert.equal(
  Object.values(noLora.workflow).filter((n) =>
    String(n.class_type ?? '').includes('Lora'),
  ).length,
  0,
)
assert.deepEqual(noLora.workflow['59']?.inputs?.model, ['24', 0])

// 9. Trigger dedup must see through the probe's own escaping.
//
// ArtJob 24571 ended `..., she hulk(marvel)` because the escaped copy already
// in the prompt (`she hulk\\(marvel\\)`) failed a plain substring test, so the
// raw term was appended again -- re-weighting `marvel`, which is precisely
// what escaping existed to prevent.
assert.equal(loraTriggerKey('she hulk\\(marvel\\)'), loraTriggerKey('she hulk(marvel)'))
assert.equal(loraTriggerKey('Blue \\[Archive\\]'), loraTriggerKey('blue [archive]'))
// A trailing comma in a catalog trigger broke the same test the same way.
assert.equal(loraTriggerKey('zzYor, black hair,'), loraTriggerKey('zzyor, black hair'))
// Genuinely different triggers must stay different.
assert.notEqual(loraTriggerKey('she hulk'), loraTriggerKey('she hulk(marvel)'))

// 10. A requeue must not silently re-run a frozen graph whose checkpoint the
//     planner has since abandoned. Both cases below actually happened on
//     2026-09-16 after a dashboard requeue, because fixing the planner does
//     nothing to a graph already written into a job's payload.
const faetality = {
  '1': {
    class_type: 'CheckpointLoaderSimple',
    inputs: { ckpt_name: 'Pony/ponyFaetality_v11.safetensors' },
  },
}
const verdict = assessRequeueSafety(faetality)
assert.equal(verdict.action, 'repoint')
if (verdict.action === 'repoint') {
  assert.equal(verdict.to, 'Pony/realcartoonPony_v1.safetensors')
  assert.ok(applyRequeueRepoint(faetality, verdict.from, verdict.to))
  assert.equal(
    faetality['1'].inputs.ckpt_name,
    'Pony/realcartoonPony_v1.safetensors',
  )
}

// A Z-Image checkpoint on an SD-shaped graph cannot be repaired by swapping a
// file -- it is the wrong graph -- so it must be refused, not repointed.
assert.equal(
  assessRequeueSafety({
    '1': {
      class_type: 'CheckpointLoaderSimple',
      inputs: { ckpt_name: 'ZImage/zImageTurboNSFW_82_FP8.safetensors' },
    },
  }).action,
  'block',
)

// But the real Z-Image lane loads its UNet separately and must stay allowed,
// or the guard would block the very lane that fixes the blocked case.
assert.equal(
  assessRequeueSafety({
    '1': {
      class_type: 'UNETLoader',
      inputs: { unet_name: 'z_image_turbo_bf16.safetensors' },
    },
  }).action,
  'allow',
)
assert.equal(
  assessRequeueSafety({
    '1': {
      class_type: 'CheckpointLoaderSimple',
      inputs: { ckpt_name: 'Pony/realcartoonPony_v1.safetensors' },
    },
  }).action,
  'allow',
)

// 11. Every checkpoint must reach its OWN family profile.
//
// enqueue.post.ts passed `cfgValue: body.cfg ?? 3`, and the builder resolves
// `input.cfgValue || profile.cfg`, so the literal 3 always won and the
// distilled profile's cfg (2) was unreachable -- 343 queued probes on
// dreamshaperXL Turbo rendered over-guided. `steps` deferred correctly with
// `?? undefined`, which is exactly why the profile looked like it worked.
function sampler(workflow: Record<string, { class_type?: string; inputs?: Record<string, unknown> }>) {
  return Object.values(workflow).find((n) => n.class_type === 'KSampler')?.inputs ?? {}
}
function clipSkipOf(workflow: Record<string, { class_type?: string; inputs?: Record<string, unknown> }>) {
  return Object.values(workflow).find((n) => n.class_type === 'CLIPSetLastLayer')?.inputs
    ?.stop_at_clip_layer
}

const CHECKPOINTS = [
  'Pony/realcartoonPony_v1.safetensors',
  'Illustrious/illustrij_v21.safetensors',
  'SD15/revAnimated_v2Rebirth.safetensors',
  'SDXL/duskMixXLIllustration_v15.safetensors',
  'SDXL/dreamshaperXL_v21TurboDPMSDE.safetensors',
]
for (const checkpoint of CHECKPOINTS) {
  const profile = checkpointProfile(checkpoint)
  const workflow = buildDefaultComfyWorkflow({ prompt: 'a test subject', checkpoint })
  const k = sampler(workflow)
  assert.equal(k.cfg, profile.cfg, `${checkpoint} must use its family cfg`)
  assert.equal(k.steps, profile.steps, `${checkpoint} must use its family steps`)
  assert.equal(k.sampler_name, profile.sampler)
  assert.equal(k.scheduler, profile.scheduler)
  assert.equal(clipSkipOf(workflow), profile.clipSkip, `${checkpoint} clip skip`)
}

// A distilled merge overrides its base lineage. dreamshaperXL is SDXL-family by
// directory, but Turbo by filename, and Turbo wins.
assert.equal(checkpointFamily('SDXL/dreamshaperXL_v21TurboDPMSDE.safetensors'), 'distilled')
assert.equal(checkpointFamily('Pony/somePonyLightning_v1.safetensors'), 'distilled')

// Family comes from the DIRECTORY, never Resource.generation: the catalog has
// duchaitenStylelikeme (SD 1.5) recorded as SDXL and revAnimated as ARCHIVE.
assert.equal(checkpointFamily('SD15/duchaitenStylelikeme_v15Fp16NoEma.safetensors'), 'sd15')
assert.equal(checkpointProfile('SD15/revAnimated_v2Rebirth.safetensors').width, 768)

// The LoRA chain and both encoders must read the clip-skipped CLIP, or the
// LoRA's trigger tokens are encoded at a depth the base was not trained for.
const chained = buildDefaultComfyWorkflow({
  prompt: 'a test subject',
  checkpoint: 'Pony/realcartoonPony_v1.safetensors',
  loras: [{ name: 'Pony/SFW/example.safetensors', strength: 0.8 }],
}) as Record<string, { class_type?: string; inputs?: Record<string, unknown> }>
const skipNode = Object.entries(chained).find(([, n]) => n.class_type === 'CLIPSetLastLayer')
const loraNode = Object.entries(chained).find(([, n]) => String(n.class_type ?? '').includes('Lora'))
assert.ok(skipNode && loraNode)
assert.deepEqual(loraNode![1].inputs!.clip, [skipNode![0], 0], 'LoRA chain reads the skipped CLIP')
assert.deepEqual(chained['2']!.inputs!.clip, [loraNode![0], 1], 'encoder reads the LoRA CLIP')

// An explicit caller value still wins over the profile.
assert.equal(
  sampler(
    buildDefaultComfyWorkflow({
      prompt: 'a test subject',
      checkpoint: 'Pony/realcartoonPony_v1.safetensors',
      cfgValue: 9,
      clipSkip: -1,
    }),
  ).cfg,
  9,
)

console.log('verifyEntityArtPromptStyle: all assertions passed')
