import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  ART_ENGINE_PROFILES,
  ART_GENERATOR_PRESETS,
  DEFAULT_ART_PRESET_ID,
  artDimensionOptions,
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
  variant: null,
})

// Krea 2 Turbo is the distilled eight-step lane. More steps remain available
// only as an intentional manual override within the server's hard ceiling; the
// product must not advertise an unsupported "Detailed 16" quality recipe.
const kreaPresets = ART_GENERATOR_PRESETS.filter(
  (entry) => entry.engine === 'krea2',
)
assert.equal(kreaPresets.length, 1)
assert.equal(kreaPresets[0]!.id, 'krea2-turbo')
assert.equal(kreaPresets[0]!.steps, 8)
assert.ok(!ART_GENERATOR_PRESETS.some((entry) => entry.id === 'krea2-detailed'))

// Dimension menus stay close to each checkpoint family's training scale.
assert.deepEqual(
  artDimensionOptions('comfy', 'sd15'),
  [512, 576, 640, 704, 768],
)
assert.deepEqual(
  artDimensionOptions('comfy', 'sdxl'),
  [768, 832, 896, 1024, 1152, 1216, 1344],
)
assert.deepEqual(
  artDimensionOptions('krea2'),
  [768, 832, 896, 1024, 1152, 1216, 1344],
)
assert.deepEqual(artDimensionOptions('sdxl-img2img', 'sdxl'), [])

// Source-image support is a capability of a recipe, not a separate SDXL button.
assert.equal(
  ART_GENERATOR_PRESETS.some((entry) => entry.engine === 'sdxl-img2img'),
  false,
)
assert.equal(ART_ENGINE_PROFILES.krea2.supports.sourceImage, 'none')
assert.equal(ART_ENGINE_PROFILES.flux.supports.sourceImage, 'optional')
assert.equal(ART_ENGINE_PROFILES.flux.supports.sourceImageStrength, true)
assert.equal(ART_ENGINE_PROFILES.flux2.supports.sourceImage, 'optional')
assert.equal(ART_ENGINE_PROFILES.flux2.supports.sourceImageStrength, false)
assert.equal(ART_ENGINE_PROFILES.kontext.supports.sourceImage, 'required')
assert.equal(ART_ENGINE_PROFILES.comfy.supports.sourceImage, 'optional')
assert.equal(ART_ENGINE_PROFILES['sdxl-img2img'].supports.sourceImage, 'required')
assert.equal(ART_ENGINE_PROFILES['sdxl-img2img'].supports.size, false)
assert.equal(preset('kontext-edit').engine, 'kontext')
assert.equal(preset('sdxl-distilled').engine, 'comfy')
assert.equal(preset('sdxl-standard').engine, 'comfy')

const generatorSource = readFileSync('components/art/art-generator.vue', 'utf8')
assert.ok(generatorSource.includes('type="file"'))
assert.ok(generatorSource.includes('accept="image/*"'))
assert.ok(generatorSource.includes('blobToDataUri'))
assert.ok(generatorSource.includes('activeProfile.value.supports.sourceImage'))
assert.ok(generatorSource.includes("sourceImageSupport.value === 'required'"))
assert.ok(generatorSource.includes("activePreset.value.engine === 'comfy'"))
assert.ok(generatorSource.includes("'sdxl-img2img'"))
assert.ok(generatorSource.includes(':engine="generationEngine"'))
assert.ok(generatorSource.includes('sourceImageOwnsSize'))
assert.ok(!generatorSource.includes('IMAGE_TO_IMAGE_PRESET_ID'))
assert.ok(!generatorSource.includes('sdxl-from-image'))

const fluxWorkflowSource = readFileSync(
  'server/api/comfy/flux/utils/workflow.ts',
  'utf8',
)
assert.ok(fluxWorkflowSource.includes("class_type: 'LoadImage'"))
assert.ok(fluxWorkflowSource.includes("class_type: 'VAEEncode'"))
assert.ok(fluxWorkflowSource.includes("sourceImageName ? ['61', 0] : ['6', 0]"))

const flux2WorkflowSource = readFileSync(
  'server/api/comfy/flux2/utils/workflow.ts',
  'utf8',
)
assert.ok(flux2WorkflowSource.includes('buildFlux2KleinEditWorkflowFromRequest'))
assert.ok(flux2WorkflowSource.includes("class_type: 'ReferenceLatent'"))
assert.ok(flux2WorkflowSource.includes("class_type: 'EmptyFlux2LatentImage'"))
assert.ok(flux2WorkflowSource.includes("class_type: 'Flux2Scheduler'"))

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

assert.equal(artLoraCompatibilityRank(kontextLora, 'kontext'), 30)
assert.equal(artLoraCompatibilityRank(fluxLora, 'kontext'), 0)
assert.equal(artLoraCompatibilityRank(flux2Lora, 'kontext'), 0)
assert.equal(
  artLoraCompatibilityRank(
    {
      id: 16,
      generation: 'Flux.1 Kontext',
      supportedServer: 'FLUX',
    },
    'kontext',
  ),
  20,
)

// SDXL image-to-image uses the same Resource classes as its server resolver.
// It must offer SDXL/Comfy/generic LoRAs instead of presenting an empty picker.
assert.equal(
  artLoraCompatibilityRank(
    { id: 12, generation: 'SDXL', supportedServer: 'SDXL' },
    'sdxl-img2img',
    'sdxl',
  ),
  30,
)
assert.equal(
  artLoraCompatibilityRank(
    { id: 13, generation: 'SDXL', supportedServer: 'COMFY' },
    'sdxl-img2img',
    'unknown',
  ),
  15,
)
assert.equal(
  artLoraCompatibilityRank(
    { id: 14, generation: 'SD 1.5', supportedServer: 'SD15' },
    'sdxl-img2img',
    'sd15',
  ),
  30,
)
assert.equal(
  artLoraCompatibilityRank(
    { id: 15, generation: 'SDXL', supportedServer: 'SDXL' },
    'sdxl-img2img',
    'sd15',
  ),
  0,
)

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
assert.equal(
  detectCheckpointFamily({
    name: 'illustrij_v21.safetensors',
    localPath: 'Illustrious/illustrij_v21.safetensors',
    generation: 'ARCHIVE',
  }),
  'illustrious',
)
assert.equal(
  presetForCheckpoint({
    name: 'illustrij_v21.safetensors',
    localPath: 'Illustrious/illustrij_v21.safetensors',
    generation: 'ARCHIVE',
  }).id,
  'sdxl-standard',
)
assert.equal(
  detectCheckpointFamily({
    name: 'duchaitenStylelikeme_v15.safetensors',
    localPath: 'SD15/duchaitenStylelikeme_v15.safetensors',
    generation: 'SDXL',
  }),
  'sd15',
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
assert.ok(enqueue.includes("normalizeArtSourceImage(body.sourceImageBase64, 'flux1')"))
assert.ok(enqueue.includes("normalizeArtSourceImage(body.sourceImageBase64, 'flux2')"))
assert.ok(enqueue.includes('buildFlux2KleinEditWorkflowFromRequest'))
assert.ok(enqueue.includes("'kontext_queue'"))
assert.ok(enqueue.includes('originalWeight: body.originalWeight ?? null'))

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
assert.ok(generator.includes(':checkpoint-family="selectedCheckpointFamily"'))
assert.ok(generator.includes('artDimensionOptions('))
assert.ok(generator.includes('v-for="option in widthOptions"'))
assert.ok(generator.includes('v-for="option in heightOptions"'))
assert.ok(generator.includes('placement="up"'))
assert.ok(generator.includes('<details class="kr-panel-flat">'))
assert.ok(generator.includes('v-if="artStore.lastGeneratedArtImage"'))
assert.ok(!generator.includes('Nothing rendered yet this session.'))

const artLoraPickerSource = readFileSync(
  'components/art/art-lora-picker.vue',
  'utf8',
)
assert.ok(artLoraPickerSource.includes("'max-h-[14rem]'"))
assert.ok(artLoraPickerSource.includes("'max-h-[24rem]'"))
assert.ok(!artLoraPickerSource.includes('max-h-none'))

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
assert.ok(
  artStore.includes("data.engine === 'sdxl-img2img'"),
  'SDXL image-to-image must resolve through a Comfy generation requirement',
)
assert.ok(
  artStore.includes("engine === 'sdxl-img2img'"),
  'Comfy servers must preserve the SDXL image-to-image engine instead of falling back to another lane',
)

const bench = readFileSync('stores/buildBenchStore.ts', 'utf8')
assert.ok(bench.includes("presetId: 'krea2-turbo'"))
assert.ok(bench.includes("presetId: 'sdxl-distilled'"))
assert.ok(bench.includes('defaultsFromPreset'))
assert.ok(!bench.includes('POLL_TIMEOUT_MS'))

console.log(
  'Art generation quality contract OK: source-image capabilities match the wired workflows, checkpoint families stay visible, presets are product-owned, and browser polling follows durable ArtJobs until terminal state.',
)
