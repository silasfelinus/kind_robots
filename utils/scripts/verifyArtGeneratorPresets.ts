// /utils/scripts/verifyArtGeneratorPresets.ts
//
// Contract test: the generator's Recipe chips must promise what the server does.
//
// utils/artGeneratorPresets.ts hard-codes the numbers each Comfy lane runs at so
// the panel can show them before you press Generate. Those numbers are copies --
// the originals live in the workflow builders -- and a copy that drifts is worse
// than no number at all: the chip says "8 steps, cfg 1" while the render does
// something else, and nobody has any reason to doubt the chip.
//
// It also pins the CAPABILITY matrix, which is the load-bearing half. The old
// generator drew a checkpoint dropdown that only reached the renderer on one of
// four lanes and a LoRA nowhere at all; `supports` is what lets the rebuilt
// panel hide a control instead of faking it, so a lane that quietly gains or
// loses a field has to come through here.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  KREA2_DEFAULT_CFG,
  KREA2_DEFAULT_HEIGHT,
  KREA2_DEFAULT_SAMPLER,
  KREA2_DEFAULT_SCHEDULER,
  KREA2_DEFAULT_STEPS,
  KREA2_DEFAULT_WIDTH,
} from '../../server/api/comfy/krea2/utils/workflow'
import {
  FLUX2_KLEIN_DEFAULT_CFG,
  FLUX2_KLEIN_DEFAULT_HEIGHT,
  FLUX2_KLEIN_DEFAULT_SAMPLER,
  FLUX2_KLEIN_DEFAULT_SCHEDULER,
  FLUX2_KLEIN_DEFAULT_STEPS,
  FLUX2_KLEIN_DEFAULT_WIDTH,
} from '../../server/api/comfy/flux2/utils/workflow'
import {
  DEFAULT_FLUX_SAMPLER,
  DEFAULT_FLUX_SCHEDULER,
  fluxModelByVariant,
} from '../../server/api/comfy/flux/utils/workflow'
import {
  SDXL_DISTILLED_PROFILE,
  SDXL_STANDARD_PROFILE,
} from '../../server/api/comfy/sdxl/utils/workflow'
import {
  ART_ENGINE_PROFILES,
  ART_GENERATOR_PRESETS,
  DEFAULT_ART_PRESET_ID,
  detectCheckpointFamily,
  getPreset,
  presetForCheckpoint,
} from '../artGeneratorPresets'

function preset(id: string) {
  const found = ART_GENERATOR_PRESETS.find((entry) => entry.id === id)
  assert.ok(found, `preset "${id}" must exist`)
  return found
}

// ── Every preset's numbers are the server's numbers ─────────────────────────

const krea2 = preset('krea2-turbo')
assert.equal(krea2.steps, KREA2_DEFAULT_STEPS)
assert.equal(krea2.cfg, KREA2_DEFAULT_CFG)
assert.equal(krea2.sampler, KREA2_DEFAULT_SAMPLER)
assert.equal(krea2.scheduler, KREA2_DEFAULT_SCHEDULER)
assert.equal(krea2.width, KREA2_DEFAULT_WIDTH)
assert.equal(krea2.height, KREA2_DEFAULT_HEIGHT)

// Krea 2 at its stock settings is what an omitted engine renders, so it is also
// what the generator must open on.
assert.equal(
  DEFAULT_ART_PRESET_ID,
  'krea2-turbo',
  'the generator must open on the same lane an omitted engine resolves to',
)

const flux2 = preset('flux2-klein')
assert.equal(flux2.steps, FLUX2_KLEIN_DEFAULT_STEPS)
assert.equal(flux2.cfg, FLUX2_KLEIN_DEFAULT_CFG)
assert.equal(flux2.sampler, FLUX2_KLEIN_DEFAULT_SAMPLER)
assert.equal(flux2.scheduler, FLUX2_KLEIN_DEFAULT_SCHEDULER)
assert.equal(flux2.width, FLUX2_KLEIN_DEFAULT_WIDTH)
assert.equal(flux2.height, FLUX2_KLEIN_DEFAULT_HEIGHT)

for (const [id, variant] of [
  ['flux-dev', 'dev'],
  ['flux-schnell', 'schnell'],
] as const) {
  const entry = preset(id)
  const config = fluxModelByVariant[variant]
  assert.equal(entry.variant, variant, `${id} must name its Flux variant`)
  assert.equal(entry.steps, config.defaultSteps)
  assert.equal(entry.cfg, config.defaultCfg)
  assert.equal(entry.guidance, config.defaultGuidance)
  assert.equal(entry.sampler, DEFAULT_FLUX_SAMPLER)
  assert.equal(entry.scheduler, DEFAULT_FLUX_SCHEDULER)
}

const distilled = preset('sdxl-distilled')
assert.equal(distilled.steps, SDXL_DISTILLED_PROFILE.steps)
assert.equal(distilled.cfg, SDXL_DISTILLED_PROFILE.cfg)
assert.equal(distilled.sampler, SDXL_DISTILLED_PROFILE.sampler)
assert.equal(distilled.scheduler, SDXL_DISTILLED_PROFILE.scheduler)

const standard = preset('sdxl-standard')
assert.equal(standard.steps, SDXL_STANDARD_PROFILE.steps)
assert.equal(standard.cfg, SDXL_STANDARD_PROFILE.cfg)
assert.equal(standard.sampler, SDXL_STANDARD_PROFILE.sampler)
assert.equal(standard.scheduler, SDXL_STANDARD_PROFILE.scheduler)

// ── Checkpoint families route to the profile the server would pick ──────────
//
// sdxlSamplerProfile() matches turbo/lightning/lcm/hyper anywhere in the
// checkpoint string. A checkpoint the server profiles as distilled but the
// panel offers standard settings for would render at 20 steps of cfg 3 on an
// 8-step model -- a burnt image with a preset chip insisting it was fine.

for (const name of [
  'dreamshaperXL_v21TurboDPMSDE.safetensors',
  'RealitiesEdgeXLLIGHTNING_TURBOV7.safetensors',
  'someHyperModel.safetensors',
  'an_lcm_model.safetensors',
]) {
  assert.equal(
    detectCheckpointFamily({ name }),
    'sdxl-distilled',
    `${name} is distilled and must get the distilled preset`,
  )
  assert.equal(presetForCheckpoint({ name }).id, 'sdxl-distilled')
}

assert.equal(
  detectCheckpointFamily({ name: 'plainSDXL.safetensors', generation: 'SDXL' }),
  'sdxl',
)
assert.equal(
  presetForCheckpoint({ name: 'plainSDXL.safetensors', generation: 'SDXL' }).id,
  'sdxl-standard',
)
assert.equal(presetForCheckpoint(null).id, 'sdxl-standard')

// Every preset resolves, and an unknown id falls back rather than throwing.
for (const entry of ART_GENERATOR_PRESETS) {
  assert.equal(getPreset(entry.id).id, entry.id)
}
assert.equal(getPreset('no-such-preset').id, DEFAULT_ART_PRESET_ID)

// ── The capability matrix matches what enqueue.post.ts forwards ─────────────

const enqueue = readFileSync('server/api/art/enqueue.post.ts', 'utf8')

function laneBody(marker: string): string {
  const start = enqueue.indexOf(marker)
  assert.ok(start > -1, `enqueue.post.ts must still call ${marker}`)
  const end = enqueue.indexOf('})', start)
  return enqueue.slice(start, end)
}

const lanes = {
  krea2: laneBody('buildKrea2WorkflowFromRequest({'),
  flux2: laneBody('buildFlux2KleinWorkflowFromRequest({'),
  flux: laneBody('buildFluxWorkflowFromRequest({'),
  comfy: laneBody('buildDefaultComfyWorkflow({'),
} as const

for (const [engine, body] of Object.entries(lanes)) {
  const supports =
    ART_ENGINE_PROFILES[engine as keyof typeof ART_ENGINE_PROFILES].supports

  assert.equal(
    body.includes('loraName:'),
    supports.lora,
    `${engine}: supports.lora must match whether the lane forwards loraName`,
  )
  assert.equal(
    body.includes('checkpoint:'),
    supports.checkpoint,
    `${engine}: supports.checkpoint must match whether the lane forwards a checkpoint`,
  )
  assert.equal(
    body.includes('width:'),
    supports.size,
    `${engine}: supports.size must match whether the lane forwards width`,
  )
  assert.equal(
    body.includes('scheduler:'),
    supports.scheduler,
    `${engine}: supports.scheduler must match whether the lane forwards a scheduler`,
  )
  assert.equal(
    body.includes('guidance:'),
    supports.guidance,
    `${engine}: supports.guidance must match whether the lane forwards guidance`,
  )
}

// ── Comfy only ──────────────────────────────────────────────────────────────
//
// Silas, 2026-08-18: "use Comfy as the assumed base, no more switching to
// OpenAI images or others."

for (const entry of ART_GENERATOR_PRESETS) {
  assert.ok(
    ART_ENGINE_PROFILES[entry.engine],
    `preset ${entry.id} names an engine with no profile`,
  )
  assert.ok(
    !/openai|a1111|anthropic/i.test(entry.engine),
    `preset ${entry.id} must be a Comfy lane`,
  )
}

const generator = readFileSync('components/art/art-generator.vue', 'utf8')
assert.ok(
  generator.includes("server.serverType === 'COMFY'"),
  'the generator server picker must offer Comfy servers only',
)

// Comments stripped first, for the same reason verifyComfyOnlyGeneration.ts
// does it: the generator's own note explaining why OpenAI servers are filtered
// out otherwise reads as an OpenAI server being offered.
const generatorCode = generator
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/.*$/gm, '')
assert.ok(
  !/OPENAI|OpenAI|ANTHROPIC|A1111/.test(generatorCode),
  'the generator must not offer non-Comfy image engines',
)

console.log(
  'Art generator preset contract OK: preset numbers match the workflow ' +
    'builders, checkpoint families route to the server profile, and the ' +
    'capability matrix matches what each enqueue lane forwards.',
)
