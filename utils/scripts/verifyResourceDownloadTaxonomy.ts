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
  CIVITAI_OTHER_BASE_MODEL_FAMILIES.some(
    (family) => String(family.label) === 'Krea 1',
  ),
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

const statusRoute = readFileSync(
  'server/api/lora/download/index.get.ts',
  'utf8',
)
const retryRoute = readFileSync(
  'server/api/lora/download/[id]/retry.post.ts',
  'utf8',
)
const downloadStore = readFileSync(
  'stores/resourceDownloadsStore.ts',
  'utf8',
)
const downloadView = readFileSync(
  'components/resources/resource-downloads.vue',
  'utf8',
)
const resourceManager = readFileSync(
  'components/resources/resource-manager.vue',
  'utf8',
)

assert.ok(statusRoute.includes('requireAdminApiUser(event)'))
assert.ok(retryRoute.includes('requireAdminApiUser(event)'))
assert.ok(statusRoute.includes("setResponseHeader(event, 'Cache-Control', 'private, no-store')"))
assert.ok(statusRoute.includes("where: { status: { in: ['PENDING', 'CLAIMED'] } }"))
assert.ok(statusRoute.includes("status: { in: ['DONE', 'FAILED'] }"))
assert.ok(statusRoute.includes('take: HISTORY_PAGE_SIZE + 1'))
assert.ok(statusRoute.includes('nextBefore: hasMore'))
assert.ok(statusRoute.includes("groupBy({"))
assert.ok(statusRoute.includes('select: fields'))
assert.equal(statusRoute.includes('downloadUrl: true'), false)
assert.equal(statusRoute.includes('claimedBy: true'), false)
assert.ok(retryRoute.includes("existing.status !== 'FAILED'"))
assert.ok(retryRoute.includes('if (existing.resourceId)'))
assert.ok(retryRoute.includes("status: { in: ['PENDING', 'CLAIMED'] }"))
assert.ok(retryRoute.includes("where: { id, status: 'FAILED' }"))
assert.ok(retryRoute.includes("status: 'PENDING'"))
assert.ok(retryRoute.includes('attempts: 0'))
assert.ok(retryRoute.includes('claimedAt: null'))
assert.ok(retryRoute.includes('claimedBy: null'))
assert.ok(retryRoute.includes('error: null'))
assert.ok(retryRoute.includes('updated.count !== 1'))
assert.equal(retryRoute.includes('downloadRequest.update({'), false)
assert.ok(resourceManager.includes("'library' | 'discover' | 'downloads'"))
assert.ok(resourceManager.includes("key: 'downloads'"))
assert.ok(resourceManager.includes("<resource-downloads v-else"))
assert.ok(downloadStore.includes('/api/lora/download'))
assert.ok(downloadStore.includes('/retry'))
assert.ok(downloadStore.includes('hasLoadedOlder'))
assert.ok(downloadView.includes('clearInterval(refreshTimer)'))
assert.ok(downloadView.includes('if (!document.hidden)'))
assert.ok(downloadView.includes('downloads.loadMore()'))
assert.ok(downloadView.includes('downloads.retry(item.id)'))
assert.ok(downloadView.includes('class="kr-scroll min-h-0 flex-1'))
assert.equal(downloadView.includes('percent complete'), false)

const retryGuard = readFileSync(
  'server/utils/retryDownloadRequest.ts',
  'utf8',
)
const deleteRoute = readFileSync(
  'server/api/lora/download/[id]/index.delete.ts',
  'utf8',
)
const bulkRoute = readFileSync(
  'server/api/lora/download/failed.post.ts',
  'utf8',
)
assert.ok(retryGuard.includes("existing.status !== 'FAILED'"))
assert.ok(retryGuard.includes("status: { in: ['PENDING', 'CLAIMED'] }"))
assert.ok(retryGuard.includes("where: { id, status: 'FAILED', resourceId: null }"))
assert.ok(retryGuard.includes('attempts: 0'))
assert.ok(retryGuard.includes('claimedBy: null'))
assert.ok(retryGuard.includes('updated.count !== 1'))
assert.ok(deleteRoute.includes('requireAdminApiUser(event)'))
assert.ok(deleteRoute.includes("status: { in: ['DONE', 'FAILED'] }"))
assert.ok(deleteRoute.includes('downloadRequest.deleteMany'))
assert.equal(deleteRoute.includes('resource.delete'), false)
assert.ok(bulkRoute.includes('requireAdminApiUser(event)'))
assert.ok(bulkRoute.includes('const MAX_BATCH = 50'))
assert.ok(bulkRoute.includes('new Set(ids).size !== ids.length'))
assert.ok(bulkRoute.includes("status: 'FAILED'"))
assert.ok(bulkRoute.includes('retryFailedDownloadRequest(id)'))
assert.ok(bulkRoute.includes('downloadRequest.deleteMany'))
assert.ok(downloadView.includes('visibleFailedIds'))
assert.ok(downloadView.includes('Confirm clear'))
assert.ok(downloadView.includes('Confirm delete'))
assert.ok(downloadView.includes('downloads.deleteRecord(id)'))
assert.ok(downloadView.includes('downloads.bulkFailed(operation, visibleFailedIds.value)'))
assert.ok(downloadStore.includes('async function bulkFailed('))
assert.ok(downloadStore.includes('async function deleteRecord('))
assert.equal(deleteRoute.includes('unlink('), false)
assert.equal(bulkRoute.includes('unlink('), false)

console.log('Model download taxonomy contract: all checks passed')
