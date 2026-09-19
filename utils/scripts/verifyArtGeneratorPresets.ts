import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  ART_ENGINE_PROFILES,
  ART_GENERATOR_PRESETS,
  DEFAULT_ART_PRESET_ID,
  IMAGE_TO_IMAGE_PRESET_ID,
  defaultPresetSettings,
  detectCheckpointFamily,
  getPreset,
  presetForCheckpoint,
} from '../artGeneratorPresets'
import {
  artLoraCompatibilityRank,
  flux2LoraCompatibilityRank,
  fluxLoraCompatibilityRank,
  krea2LoraCompatibilityRank,
} from '../loraSelection'

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
  // The default lane starts from a blank canvas, so there is nothing to stay
  // near. Only the image-to-image preset carries a denoise.
  denoise: null,
  variant: null,
})

/*
 * THE IMAGE-TO-IMAGE LANE.
 *
 * Silas, 2026-09-18: "we should be able to select them and modify them, even if
 * they come from a civitai sample." Picking an image writes bytes into
 * artForm.sourceImageBase64, and before this preset existed every lane in the
 * catalogue was text-to-image -- so the picked image was loaded and then
 * ignored. This pins the one preset that can actually consume it.
 */
assert.equal(IMAGE_TO_IMAGE_PRESET_ID, 'sdxl-from-image')
assert.equal(preset(IMAGE_TO_IMAGE_PRESET_ID).engine, 'sdxl-img2img')

// Every OTHER preset must leave denoise null: a text-to-image lane carrying a
// denoise would look like it honours a source image it cannot read.
for (const entry of ART_GENERATOR_PRESETS) {
  if (entry.id === IMAGE_TO_IMAGE_PRESET_ID) {
    assert.ok(
      typeof entry.denoise === 'number' &&
        entry.denoise > 0 &&
        entry.denoise < 1,
      'the image-to-image preset needs a denoise strictly between 0 and 1',
    )
    continue
  }
  assert.equal(
    entry.denoise,
    null,
    `preset "${entry.id}" is text-to-image and must not carry a denoise`,
  )
  assert.notEqual(
    entry.engine,
    'sdxl-img2img',
    `preset "${entry.id}" must not claim the image-to-image engine`,
  )
}

// Exactly one lane starts from a picture; two would make "Use it" ambiguous.
assert.equal(
  ART_GENERATOR_PRESETS.filter((entry) => entry.engine === 'sdxl-img2img')
    .length,
  1,
)

// The source image decides the output size, so offering width and height in
// this lane would be offering a setting the workflow overrides.
assert.equal(ART_ENGINE_PROFILES['sdxl-img2img'].supports.size, false)
assert.equal(ART_ENGINE_PROFILES['sdxl-img2img'].supports.checkpoint, true)
assert.equal(ART_ENGINE_PROFILES['sdxl-img2img'].supports.lora, true)

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

const krea2Lora = {
  id: 1,
  generation: 'Krea 2',
  supportedServer: 'COMFY',
}
const genericKreaLora = {
  id: 2,
  generation: 'Krea',
  supportedServer: 'GENERIC',
}
const fluxLora = {
  id: 3,
  generation: 'Flux.1 D',
  supportedServer: 'FLUX',
}
const kontextLora = {
  id: 4,
  generation: 'Flux.1 Kontext',
  supportedServer: 'KONTEXT',
}
const krea1Lora = {
  id: 5,
  generation: 'Krea 1',
  supportedServer: 'COMFY',
}
const flux2Lora = {
  id: 6,
  generation: 'Flux.2 Klein',
  supportedServer: 'FLUX',
}
const genericFlux2Lora = {
  id: 7,
  generation: 'Flux 2',
  supportedServer: 'GENERIC',
}

assert.equal(krea2LoraCompatibilityRank(krea2Lora), 30)
assert.equal(krea2LoraCompatibilityRank(genericKreaLora), 20)
assert.equal(krea2LoraCompatibilityRank(fluxLora), 0)
assert.equal(krea2LoraCompatibilityRank(kontextLora), 0)
assert.equal(krea2LoraCompatibilityRank(krea1Lora), 0)
assert.equal(artLoraCompatibilityRank(fluxLora, 'krea2'), 0)
assert.equal(artLoraCompatibilityRank(kontextLora, 'krea2'), 0)
assert.equal(artLoraCompatibilityRank(krea2Lora, 'krea2'), 30)

assert.equal(flux2LoraCompatibilityRank(fluxLora), 0)
assert.equal(flux2LoraCompatibilityRank(kontextLora), 0)
assert.equal(flux2LoraCompatibilityRank(flux2Lora), 30)
assert.equal(flux2LoraCompatibilityRank(genericFlux2Lora), 10)
assert.equal(artLoraCompatibilityRank(fluxLora, 'flux2'), 0)
assert.equal(artLoraCompatibilityRank(kontextLora, 'flux2'), 0)
assert.equal(artLoraCompatibilityRank(flux2Lora, 'flux2'), 30)

/*
 * THE FLUX.1 LANE TAKES A LORA, AND THE CATALOGUE HAS TO SAY SO.
 *
 * It advertised supports.lora: false, and artLoraCompatibilityRank returned 0
 * for every LoRA on this engine. Both were correct until 2026-09-16, when the
 * flux builder stopped silently dropping them (kind-robots/t-105) -- after
 * which the generator was hiding a picker the workflow would have honoured,
 * while the probe pipeline happily ran Flux LoRAs on flux1-dev. Confirmed
 * against production: 30 of 30 recent jobs were flux1-dev + a Flux LoRA.
 */
assert.equal(
  ART_ENGINE_PROFILES.flux.supports.lora,
  true,
  'FLUX.1 takes a LoRA; the builder has wired one since 2026-09-16',
)
assert.doesNotMatch(
  ART_ENGINE_PROFILES.flux.blurb,
  /does not take a lora/i,
  'the blurb must not still claim FLUX.1 cannot use a LoRA',
)

// The real shape, from production: generation 'Flux.1 D', server 'FLUX'.
assert.equal(fluxLoraCompatibilityRank(fluxLora), 30)
assert.equal(artLoraCompatibilityRank(fluxLora, 'flux'), 30)
assert.equal(
  fluxLoraCompatibilityRank({
    id: 8,
    generation: 'Flux.1 D',
    supportedServer: 'COMFY',
  }),
  20,
)
assert.equal(
  fluxLoraCompatibilityRank({
    id: 9,
    generation: 'Flux',
    supportedServer: 'GENERIC',
  }),
  10,
)

/*
 * THREE MODELS SAY "FLUX", AND ONLY ONE OF THEM IS THIS LANE. A substring test
 * would offer all three; these are the cases that catch one.
 */
assert.equal(
  fluxLoraCompatibilityRank(flux2Lora),
  0,
  'FLUX.2 weights do not load on FLUX.1',
)
assert.equal(fluxLoraCompatibilityRank(genericFlux2Lora), 0)
assert.equal(
  fluxLoraCompatibilityRank(kontextLora),
  0,
  'Kontext is the editing model, not dev',
)
assert.equal(artLoraCompatibilityRank(flux2Lora, 'flux'), 0)
assert.equal(artLoraCompatibilityRank(kontextLora, 'flux'), 0)

// And nothing from another architecture leaks in.
assert.equal(fluxLoraCompatibilityRank(krea2Lora), 0)
assert.equal(
  fluxLoraCompatibilityRank({
    id: 10,
    generation: 'Pony',
    supportedServer: 'SDXL',
  }),
  0,
)
assert.equal(
  artLoraCompatibilityRank(
    { id: 11, generation: 'SDXL', supportedServer: 'SDXL' },
    'flux',
  ),
  0,
)

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

const loraResolver = readFileSync('server/utils/artLoraResource.ts', 'utf8')
assert.ok(
  loraResolver.includes('krea2LoraCompatibilityRank(resource)'),
  'the enqueue resolver must enforce the same Krea family check as the picker',
)
assert.ok(
  loraResolver.includes('flux2LoraCompatibilityRank(resource)'),
  'the enqueue resolver must enforce the same Flux.2 generation check as the picker',
)
assert.ok(
  loraResolver.includes('generation: true'),
  'the enqueue resolver must fetch Resource.generation before checking model-family compatibility',
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
  /*
   * TWO SPELLINGS MEAN THE SAME THING. krea2, flux2 and comfy take a single
   * `loraName:`; the flux lane takes the plural `loras:` chain added with the
   * builder fix in kind-robots/t-105. Testing only the first read the flux
   * lane as passing no LoRA at all, which is how supports.lora stayed false
   * for three days after the workflow started honouring one.
   */
  const passesLora = body.includes('loraName:') || body.includes('loras:')
  assert.equal(passesLora, supports.lora)
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

const artStore = readFileSync('stores/artStore.ts', 'utf8')
assert.ok(artStore.includes('defaultPresetSettings'))
assert.ok(artStore.includes('PRODUCT_DEFAULT_ART_SETTINGS'))
assert.ok(!artStore.includes('ART_QUEUE_TIMEOUT_MS'))
assert.ok(
  !/steps:\s*25[\s\S]{0,120}cfg:\s*7/.test(artStore),
  'the shared art form must not fall back to the legacy 25-step / CFG 7 product defaults',
)
assert.ok(
  !artStore.includes("selectGenerationSampler('Euler a')"),
  'the shared art store must not inject the legacy A1111 sampler into Comfy generation',
)

const bench = readFileSync('stores/buildBenchStore.ts', 'utf8')
assert.ok(bench.includes("presetId: 'krea2-turbo'"))
assert.ok(bench.includes("presetId: 'sdxl-distilled'"))
assert.ok(bench.includes('defaultsFromPreset'))
assert.ok(!bench.includes('POLL_TIMEOUT_MS'))

console.log(
  'Art generation quality contract OK: Krea and Flux.2 LoRAs stay in their model families, presets are product-owned, shared generation uses the canonical profile registry, and browser polling follows durable ArtJobs until terminal state.',
)
