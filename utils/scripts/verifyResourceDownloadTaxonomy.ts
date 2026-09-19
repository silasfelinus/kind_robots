import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  CIVITAI_BASE_MODEL_GROUPS,
  CIVITAI_BASE_MODELS,
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

assert.equal(
  new Set(CIVITAI_BASE_MODELS).size,
  CIVITAI_BASE_MODELS.length,
  'base-model filter must not contain duplicate values',
)
for (const required of ['Krea 2', 'Flux.2 D', 'ZImage', 'Qwen']) {
  assert.ok(
    (CIVITAI_BASE_MODELS as readonly string[]).includes(required),
    `missing current base-model filter ${required}`,
  )
}

const loraScanner = readFileSync('scripts/lora-catalog/scan_loras.py', 'utf8')
const catalogMap =
  loraScanner.match(/BASEMODEL_MAP:[\s\S]*?\n}\n\n\ndef map_base/)?.[0] ?? ''
const catalogGenerations = [...catalogMap.matchAll(
  /:\s*\("[A-Z0-9_]+",\s*"([^"]+)"\),/g,
)]
  .map((match) => match[1])
  .filter((value): value is string => Boolean(value))
assert.ok(catalogGenerations.length > 20, 'failed to parse BASEMODEL_MAP')
for (const generation of catalogGenerations) {
  assert.ok(
    (CIVITAI_BASE_MODELS as readonly string[]).includes(generation),
    'catalog base model missing from Discover filter: ' + generation,
  )
}

const modelScanner = readFileSync('scripts/lora-catalog/scan_models.py', 'utf8')
const folderHints =
  modelScanner.match(/FOLDER_BASE_HINTS = \[[\s\S]*?\n\]\n\n\ndef checkpoint_group/)?.[0] ?? ''
const hintedGenerations = [...folderHints.matchAll(
  /\("[^"]+",\s*"[A-Z0-9_]+",\s*"([^"]+)"\),/g,
)]
  .map((match) => match[1])
  .filter((value): value is string => Boolean(value))
assert.ok(hintedGenerations.length > 10, 'failed to parse FOLDER_BASE_HINTS')
for (const generation of hintedGenerations) {
  assert.ok(
    (CIVITAI_BASE_MODELS as readonly string[]).includes(generation),
    'folder-detected base model missing from Discover filter: ' + generation,
  )
}

const browse = readFileSync('server/api/lora/browse.get.ts', 'utf8')
assert.ok(browse.includes('civitaiDiscoverType'))
assert.ok(browse.includes('resourceTypeForCivitaiModelType'))

const discoverUi = readFileSync('components/lora/lora-discover.vue', 'utf8')
assert.ok(discoverUi.includes('v-for="entry in CIVITAI_DISCOVER_TYPES"'))
assert.ok(discoverUi.includes('v-for="group in CIVITAI_BASE_MODEL_GROUPS"'))
assert.ok(discoverUi.includes('v-for="option in group.options"'))
assert.ok(discoverUi.includes('type CivitaiDiscoverResourceType'))
assert.ok(CIVITAI_BASE_MODEL_GROUPS.length >= 5)

const enqueue = readFileSync(
  'server/api/lora/download-request.post.ts',
  'utf8',
)
assert.ok(enqueue.includes('DOWNLOADABLE_RESOURCE_TYPES'))
assert.equal(enqueue.includes("const RESOURCE_TYPES = ["), false)

console.log('Model download taxonomy contract: all checks passed')
