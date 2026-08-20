import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  ART_ENGINE_PROFILES,
  ART_GENERATOR_PRESETS,
  DEFAULT_ART_PRESET_ID,
  defaultPresetSettings,
  detectCheckpointFamily,
  getPreset,
  presetForCheckpoint,
} from '../artGeneratorPresets'

function preset(id: string) {
  const found = ART_GENERATOR_PRESETS.find((entry) => entry.id === id)
  assert.ok(found, `preset "${id}" must exist`)
  return found
}

assert.equal(DEFAULT_ART_PRESET_ID, 'krea2-turbo')
assert.deepEqual(defaultPresetSettings(), {
  engine: 'krea2',
  steps: 8,
  cfg: 1,
  sampler: 'euler',
  scheduler: 'simple',
  width: 1024,
  height: 1024,
  guidance: null,
  variant: null,
})

assert.deepEqual(
  {
    steps: preset('flux2-klein').steps,
    cfg: preset('flux2-klein').cfg,
    sampler: preset('flux2-klein').sampler,
    scheduler: preset('flux2-klein').scheduler,
  },
  { steps: 4, cfg: 1, sampler: 'euler', scheduler: 'simple' },
)
assert.deepEqual(
  {
    steps: preset('flux-dev').steps,
    guidance: preset('flux-dev').guidance,
    sampler: preset('flux-dev').sampler,
    scheduler: preset('flux-dev').scheduler,
  },
  { steps: 30, guidance: 3.5, sampler: 'euler', scheduler: 'beta' },
)
assert.deepEqual(
  {
    steps: preset('sdxl-distilled').steps,
    cfg: preset('sdxl-distilled').cfg,
    sampler: preset('sdxl-distilled').sampler,
    scheduler: preset('sdxl-distilled').scheduler,
  },
  { steps: 8, cfg: 2, sampler: 'dpmpp_sde', scheduler: 'karras' },
)
assert.deepEqual(
  {
    steps: preset('sdxl-standard').steps,
    cfg: preset('sdxl-standard').cfg,
    sampler: preset('sdxl-standard').sampler,
    scheduler: preset('sdxl-standard').scheduler,
  },
  { steps: 20, cfg: 3, sampler: 'euler', scheduler: 'normal' },
)

assert.equal(
  ART_ENGINE_PROFILES.flux.supports.negativePrompt,
  false,
  'FLUX.1 must not advertise a negative prompt until its graph actually uses one',
)
for (const engine of ['krea2', 'flux2'] as const) {
  assert.equal(ART_ENGINE_PROFILES[engine].supports.negativePrompt, true)
  assert.match(
    ART_ENGINE_PROFILES[engine].negativePromptNote || '',
    /CFG 1/i,
    `${engine} must explain that negative conditioning is effectively inert at its default CFG`,
  )
}

for (const name of [
  'dreamshaperXL_v21TurboDPMSDE.safetensors',
  'RealitiesEdgeXLLIGHTNING_TURBOV7.safetensors',
  'someHyperModel.safetensors',
  'an_lcm_model.safetensors',
]) {
  assert.equal(detectCheckpointFamily({ name }), 'sdxl-distilled')
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

for (const entry of ART_GENERATOR_PRESETS) {
  assert.equal(getPreset(entry.id).id, entry.id)
  assert.ok(ART_ENGINE_PROFILES[entry.engine])
  assert.ok(!/openai|a1111|anthropic/i.test(entry.engine))
}
assert.equal(getPreset('no-such-preset').id, DEFAULT_ART_PRESET_ID)

const presetSource = readFileSync('utils/artGeneratorPresets.ts', 'utf8')
assert.ok(
  !presetSource.includes('server/api/comfy/'),
  'product presets must not import or mirror server workflow defaults',
)
assert.ok(
  presetSource.includes('Product-owned image generation quality profiles'),
  'the preset registry must declare product ownership explicitly',
)

const enqueue = readFileSync('server/api/art/enqueue.post.ts', 'utf8')
assert.ok(
  !enqueue.includes("from '../../utils/artGeneratorPresets'"),
  'the enqueue API must not import product preset policy',
)

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
  assert.equal(body.includes('loraName:'), supports.lora)
  assert.equal(body.includes('checkpoint:'), supports.checkpoint)
  assert.equal(body.includes('width:'), supports.size)
  assert.equal(body.includes('scheduler:'), supports.scheduler)
  assert.equal(body.includes('guidance:'), supports.guidance)
}

const generator = readFileSync('components/art/art-generator.vue', 'utf8')
assert.ok(generator.includes('ART_GENERATOR_PRESETS'))
assert.ok(generator.includes("server.serverType === 'COMFY'"))
assert.ok(generator.includes('activeProfile.supports.negativePrompt'))

const sharedButton = readFileSync('components/art/generate-button.vue', 'utf8')
assert.ok(sharedButton.includes('DEFAULT_ART_PRESET_ID'))
assert.ok(sharedButton.includes('presetSettings'))
assert.ok(sharedButton.includes("server.serverType === 'COMFY'"))
assert.ok(!/OPENAI|A1111|ANTHROPIC/.test(sharedButton))

const bench = readFileSync('stores/buildBenchStore.ts', 'utf8')
assert.ok(bench.includes("presetId: 'krea2-turbo'"))
assert.ok(bench.includes("presetId: 'sdxl-distilled'"))
assert.ok(bench.includes('defaultsFromPreset'))
assert.ok(!bench.includes('POLL_TIMEOUT_MS'))

console.log(
  'Art generation quality contract OK: presets are product-owned, primary/shared generators use the canonical profile registry, and server workflow fallbacks remain compatibility-only.',
)
