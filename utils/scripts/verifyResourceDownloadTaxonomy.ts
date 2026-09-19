import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  CIVITAI_BASE_MODEL_FAMILIES,
  CIVITAI_BASE_MODELS,
  CIVITAI_DISCOVER_TYPES,
  CIVITAI_OTHER_BASE_MODEL_FAMILIES,
  CIVITAI_SUPPORTED_BASE_MODEL_FAMILIES,
  DOWNLOADABLE_RESOURCE_TYPES,
  civitaiBaseModelsForFamily,
  resourceTypeForCivitaiModelType,
} from '../resourceDownloads'

const discover = CIVITAI_DISCOVER_TYPES.map((entry) => [
  entry.resourceType,
  entry.civitaiType,
])
assert.deepEqual(discover, [
  ['LORA', 'LORA'],
  ['CHECKPOINT', 'Checkpoint'],
  ['EMBEDDING', 'TextualInversion'],
  ['HYPERNETWORK', 'Hypernetwork'],
  ['CONTROLNET', 'Controlnet'],
  ['VAE', 'VAE'],
  ['UPSCALER', 'Upscaler'],
])

for (const required of [
  'CHECKPOINT',
  'EMBEDDING',
  'LORA',
  'LYCORIS',
  'HYPERNETWORK',
  'CONTROLNET',
  'VAE',
  'TEXT_ENCODER',
  'DIFFUSION_MODEL',
  'LATENT_UPSCALER',
  'UPSCALER',
] as const) {
  assert.ok(
    DOWNLOADABLE_RESOURCE_TYPES.includes(required),
    `missing downloadable ResourceType ${required}`,
  )
}
for (const nonFile of ['API', 'URL', 'SAMPLER']) {
  assert.equal(
    (DOWNLOADABLE_RESOURCE_TYPES as readonly string[]).includes(nonFile),
    false,
    `${nonFile} must not enter the binary download queue`,
  )
}

assert.equal(resourceTypeForCivitaiModelType('Checkpoint'), 'CHECKPOINT')
assert.equal(resourceTypeForCivitaiModelType('TextualInversion'), 'EMBEDDING')
assert.equal(resourceTypeForCivitaiModelType('LoCon'), 'LORA')
assert.equal(resourceTypeForCivitaiModelType('DoRA'), 'LORA')
assert.equal(resourceTypeForCivitaiModelType('Upscaler'), 'UPSCALER')
assert.equal(resourceTypeForCivitaiModelType('Workflow'), null)

assert.equal(
  new Set(CIVITAI_BASE_MODEL_FAMILIES.map((family) => family.id)).size,
  CIVITAI_BASE_MODEL_FAMILIES.length,
  'base-model family ids must be unique',
)
assert.equal(
  new Set(CIVITAI_BASE_MODELS).size,
  CIVITAI_BASE_MODELS.length,
  'exact Civitai base-model values must not be duplicated across families',
)
assert.equal(
  CIVITAI_BASE_MODEL_FAMILIES.length,
  14,
  'Discover should stay family-sized instead of regrowing into a version list',
)
assert.deepEqual(
  CIVITAI_SUPPORTED_BASE_MODEL_FAMILIES.map((family) => family.label),
  ['Krea 2', 'FLUX.2', 'SDXL', 'Pony', 'SD 1.5', 'Z-Image'],
)
assert.equal(
  CIVITAI_OTHER_BASE_MODEL_FAMILIES.some((family) => family.label === 'Krea 1'),
  false,
  'Krea 1 is not a useful separate choice when Kind Robots runs Krea 2',
)

assert.deepEqual(civitaiBaseModelsForFamily('krea2'), ['Krea 2'])
assert.deepEqual(civitaiBaseModelsForFamily('zimage'), [
  'ZImageTurbo',
  'ZImageBase',
])
assert.ok(civitaiBaseModelsForFamily('sdxl').includes('SDXL 1.0'))
assert.ok(civitaiBaseModelsForFamily('sdxl').includes('SDXL Turbo'))
assert.ok(civitaiBaseModelsForFamily('flux2').includes('Flux.2 Klein 9B'))
assert.deepEqual(civitaiBaseModelsForFamily('SDXL 1.0'), ['SDXL 1.0'])
assert.deepEqual(civitaiBaseModelsForFamily('not-a-base'), [])

const browse = readFileSync('server/api/lora/browse.get.ts', 'utf8')
assert.ok(browse.includes('civitaiDiscoverType'))
assert.ok(browse.includes('resourceTypeForCivitaiModelType'))
assert.ok(browse.includes('civitaiBaseModelsForFamily'))
assert.ok(browse.includes("params.append('baseModels', baseModel)"))
assert.ok(browse.includes('query.baseFamily ?? query.baseModel'))
assert.ok(browse.includes('options.baseModels.includes(candidate.baseModel'))

const discoverUi = readFileSync('components/lora/lora-discover.vue', 'utf8')
assert.ok(discoverUi.includes('v-for="entry in CIVITAI_DISCOVER_TYPES"'))
assert.ok(
  discoverUi.includes(
    'v-for="family in CIVITAI_SUPPORTED_BASE_MODEL_FAMILIES"',
  ),
)
assert.ok(
  discoverUi.includes('v-for="family in CIVITAI_OTHER_BASE_MODEL_FAMILIES"'),
)
assert.ok(discoverUi.includes('optgroup label="✓ Supported here"'))
assert.ok(discoverUi.includes("params.set('baseFamily', baseFamily.value)"))
assert.ok(discoverUi.includes('type CivitaiDiscoverResourceType'))

const enqueue = readFileSync(
  'server/api/lora/download-request.post.ts',
  'utf8',
)
assert.ok(enqueue.includes('DOWNLOADABLE_RESOURCE_TYPES'))
assert.equal(enqueue.includes("const RESOURCE_TYPES = ["), false)

console.log('Model download taxonomy contract: all checks passed')
