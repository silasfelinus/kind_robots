import { readFileSync } from 'node:fs'

const failures: string[] = []

function read(path: string): string {
  return readFileSync(path, 'utf8')
}

function requireText(source: string, text: string, message: string): void {
  if (!source.includes(text)) failures.push(message)
}

function forbidText(source: string, text: string, message: string): void {
  if (source.includes(text)) failures.push(message)
}

function requireCount(
  source: string,
  text: string,
  minimum: number,
  message: string,
): void {
  const count = source.split(text).length - 1
  if (count < minimum) failures.push(`${message} (found ${count}, need ${minimum})`)
}

const gallery = read('components/gallery/kr-gallery.vue')
const deferredImage = read('components/gallery/kr-deferred-image.vue')
const viewportGate = read('components/gallery/kr-viewport-gate.vue')
const viewport = read('utils/viewportHydration.ts')
const artPlate = read('components/narrative/kr-art-plate.vue')
const facets = read('components/facets/facet-gallery.vue')
const artGallery = read('components/art/art-gallery.vue')
const collectionCard = read('components/art/collection-card.vue')
const browseStore = read('stores/artCollectionBrowseStore.ts')
const unsortedRoute = read('server/api/art/collection/unsorted.get.ts')
const imageCard = read('components/art/image-card.vue')
const resourceCard = read('components/resources/resource-card.vue')
const checkpointCard = read('components/servers/checkpoint-card.vue')
const achievementCard = read('components/achievements/earned-achievement-card.vue')
const stylistGallery = read('components/art/stylist-client-gallery.vue')
const enqueueRoute = read('server/api/art/enqueue.post.ts')
const completionRoute = read('server/api/art/queue/[id]/complete.post.ts')
const generatedCollections = read('server/utils/generatedArtCollections.ts')
const saveImageHelper = read('server/utils/saveImage.ts')
const saveGeneratedRoute = read('server/api/art/save-generated.post.ts')
const a1111GenerateRoute = read('server/api/art/generate.post.ts')
const sdxlGenerateRoute = read('server/api/comfy/sdxl/generate.post.ts')
const openAiGenerateRoute = read('server/api/chats/openai/images/generate.post.ts')
const legacyPromptGenerateRoute = read('server/api/prompts/generate.post.ts')
const dailyDreamRoute = read('server/api/dreams/daily.post.ts')

for (const token of [
  'pageSize',
  'pageCount',
  'pagedItems',
  'pageRangeLabel',
  'Previous page',
  'Next page',
]) {
  forbidText(gallery, token, `kr-gallery must not restore pagination: ${token}`)
}
requireText(
  gallery,
  'v-for="item in items"',
  'kr-gallery must render the complete filtered item index',
)
requireText(
  gallery,
  'contentVisibility',
  'kr-gallery items must retain offscreen rendering containment',
)
requireText(
  gallery,
  'containIntrinsicSize',
  'kr-gallery items must preserve estimated offscreen geometry',
)
requireText(
  gallery,
  '<kr-deferred-image',
  'kr-gallery built-in art must use source-less viewport hydration',
)

requireText(
  deferredImage,
  ':src="activeSrc || undefined"',
  'kr-deferred-image must leave src absent before hydration',
)
for (const [source, message] of [
  [deferredImage, 'kr-deferred-image must use the shared viewport observer'],
  [viewportGate, 'kr-viewport-gate must use the shared viewport observer'],
  [imageCard, 'image-card heavy-data fetches must use the shared viewport observer'],
] as const) {
  requireText(source, 'observeViewportHydration', message)
}
requireText(
  viewport,
  "rootMargin: '1800px 0px 1800px 0px'",
  'viewport hydration must keep several screens of overscan',
)
requireText(
  viewport,
  'const callbacks = new WeakMap',
  'viewport hydration must pool callbacks behind one observer',
)
for (const [source, message] of [
  [artPlate, 'shared entity art plates must defer their image sources'],
  [resourceCard, 'resource gallery cards must defer preview image sources'],
  [checkpointCard, 'checkpoint gallery cards must defer preview image sources'],
  [achievementCard, 'earned achievement cards must defer generated art'],
] as const) {
  requireText(source, '<kr-deferred-image', message)
}

for (const token of ['const PAGE =', 'showMore(', ':page-size=']) {
  forbidText(facets, token, `facet gallery must not restore client windowing: ${token}`)
}

for (const token of [
  'folderPage',
  'imagePage',
  'currentPageCount',
  'pagedActiveImages',
  'Select page',
  'hydrateVisibleImages',
  'isHydratingImages',
  ':page-size=',
]) {
  forbidText(artGallery, token, `art gallery must not restore paging hydration: ${token}`)
}
requireText(
  artGallery,
  'filteredActiveImages.value.map',
  'art gallery must build GalleryItems from the complete filtered image set',
)
requireText(
  artGallery,
  '@loaded="handleImageLoaded"',
  'art gallery must retain viewport-hydrated records for selection and batch actions',
)
requireText(
  imageCard,
  'deferLoadUntilVisible',
  'image-card must expose viewport-gated full-record hydration',
)
requireText(
  imageCard,
  '<kr-deferred-image',
  'image-card network image sources must be deferred too',
)
requireText(
  stylistGallery,
  '<kr-viewport-gate',
  'stylist photo blobs must be gated by viewport proximity',
)
forbidText(
  stylistGallery,
  'Promise.all(next.map(loadBlob))',
  'stylist gallery must not eagerly fetch every authenticated photo blob',
)

for (const token of [
  'folderGroups',
  'folderCollections',
  'fetchFolderCollections',
  'syncActiveFolder',
  'syncFolderCollection',
  'isSyncingFolder',
  'folderUrlToArtImage',
  'isFolder',
]) {
  forbidText(
    artGallery,
    token,
    `art gallery browsing must not derive collections from folders: ${token}`,
  )
}
forbidText(
  artGallery,
  'fetchAllArtImages(',
  'art gallery first-layer collection browsing must not load the complete art index',
)
for (const token of ['summary: true', 'includeImages: true', 'imageLimit: 1']) {
  requireText(
    artGallery,
    token,
    `art gallery must keep collection-first summary loading: ${token}`,
  )
}
requireText(
  artGallery,
  'browseStore.fetchCollectionDetail',
  'opening a saved collection must fetch only that collection detail',
)
requireText(
  artGallery,
  'browseStore.fetchUnsortedSummary',
  'art gallery must derive Unsorted through the DB browse query',
)
requireText(
  browseStore,
  '`/api/art/collection/${id}`',
  'collection browse store must fetch one collection at a time',
)
requireText(
  browseStore,
  '/api/art/collection/unsorted',
  'collection browse store must use the DB-derived Unsorted endpoint',
)
requireText(
  unsortedRoute,
  'ArtCollections: { none: {} }',
  'Unsorted must mean ArtImages with no ArtCollection relation in the database',
)
requireText(
  unsortedRoute,
  'getArtImageAccessContext',
  'Unsorted must reuse normal art visibility and maturity policy',
)
requireText(
  collectionCard,
  'artImageCount',
  'collection cards must display authoritative summary counts rather than preview-array length',
)

for (const token of [
  'artCollectionId?: number | null',
  'artCollectionIds?: number[] | null',
  'normalizeRequestedArtCollectionIds(body)',
  'assertOwnedActiveArtCollectionIds(',
  'artCollectionIds: requestedArtCollectionIds',
]) {
  requireText(
    enqueueRoute,
    token,
    `ArtJob enqueue must preserve validated collection intent: ${token}`,
  )
}
requireCount(
  completionRoute,
  'attachCompletedArtImageToCollections(tx, {',
  2,
  'normal and overwrite ArtJob completion must both assign canonical collections',
)
requireText(
  completionRoute,
  'completedCollectionIds',
  'ArtJob completion must report the collections applied to finished art',
)
for (const token of [
  'ensureGeneratedArtCollectionId(',
  'ArtCollections: {',
  'Characters: { some: { id: metadata.entityId } }',
  'Rewards: { some: { id: metadata.entityId } }',
  'Scenarios: { some: { id: metadata.entityId } }',
  'narratorId: metadata.entityId',
  'metadata.entityType === \'project\'',
  'metadata.entityType === \'facet\'',
]) {
  requireText(
    generatedCollections,
    token,
    `generated art collection assignment must retain entity-context coverage: ${token}`,
  )
}
requireText(
  saveImageHelper,
  'attachCompletedArtImageToCollections(prisma, {',
  'direct synchronous generated art must join canonical Generated Art server-side',
)
requireText(
  saveImageHelper,
  'if (!options.deferGeneratedCollection)',
  'saveImage must expose a queue-staging defer switch',
)
requireText(
  saveGeneratedRoute,
  '{ deferGeneratedCollection: true }',
  'ArtJob staging uploads must defer Generated Art assignment until completion',
)
for (const [source, label] of [
  [a1111GenerateRoute, 'A1111 direct generation'],
  [sdxlGenerateRoute, 'SDXL direct generation'],
  [openAiGenerateRoute, 'OpenAI direct generation'],
] as const) {
  requireText(
    source,
    'saveImage(',
    `${label} must continue through the canonical generated-image save helper`,
  )
}
requireText(
  legacyPromptGenerateRoute,
  'attachCompletedArtImageToCollections(prisma, {',
  'legacy Prompt generation must not create Unsorted generated ArtImages while it remains callable',
)
for (const token of [
  'const collection = await tx.artCollection.create({',
  'artCollectionId: collection.id',
  'ArtCollections: { connect: { id: collection.id } }',
  'ensureExistingArtCollection(existing)',
  'ensureExistingArtCollection(raced)',
]) {
  requireText(
    dailyDreamRoute,
    token,
    `Daily Dream must create or repair its canonical ArtCollection: ${token}`,
  )
}

if (failures.length) {
  for (const failure of failures) console.error(`FAIL - ${failure}`)
  process.exit(1)
}

console.log(
  'ok - galleries render full lightweight indexes; Art Gallery is DB-collection-first; queued, synchronous, entity-context, and Daily Dream generation preserve canonical collection membership',
)
