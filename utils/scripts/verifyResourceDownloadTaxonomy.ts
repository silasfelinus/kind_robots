import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  CIVITAI_DISCOVER_TYPES,
  DOWNLOADABLE_RESOURCE_TYPES,
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

const browse = readFileSync('server/api/lora/browse.get.ts', 'utf8')
assert.ok(browse.includes('civitaiDiscoverType'))
assert.ok(browse.includes('resourceTypeForCivitaiModelType'))

const discoverUi = readFileSync('components/lora/lora-discover.vue', 'utf8')
assert.ok(discoverUi.includes('v-for="entry in CIVITAI_DISCOVER_TYPES"'))
assert.ok(discoverUi.includes('type CivitaiDiscoverResourceType'))

const enqueue = readFileSync(
  'server/api/lora/download-request.post.ts',
  'utf8',
)
assert.ok(enqueue.includes('DOWNLOADABLE_RESOURCE_TYPES'))
assert.equal(enqueue.includes("const RESOURCE_TYPES = ["), false)

console.log('Model download taxonomy contract: all checks passed')
