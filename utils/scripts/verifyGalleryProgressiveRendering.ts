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

const gallery = read('components/gallery/kr-gallery.vue')
const deferredImage = read('components/gallery/kr-deferred-image.vue')
const viewport = read('utils/viewportHydration.ts')
const artPlate = read('components/narrative/kr-art-plate.vue')
const facets = read('components/facets/facet-gallery.vue')
const artGallery = read('components/art/art-gallery.vue')
const imageCard = read('components/art/image-card.vue')
const resourceCard = read('components/resources/resource-card.vue')

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
requireText(
  deferredImage,
  'observeViewportHydration',
  'kr-deferred-image must use the shared viewport observer',
)
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
requireText(
  artPlate,
  '<kr-deferred-image',
  'shared entity art plates must defer their image sources',
)
requireText(
  resourceCard,
  '<kr-deferred-image',
  'resource gallery cards must not assign thousands of preview sources up front',
)

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
  'observeViewportHydration',
  'image-card heavy-data fetches must be driven by the shared viewport observer',
)
requireText(
  imageCard,
  '<kr-deferred-image',
  'image-card network image sources must be deferred too',
)

if (failures.length) {
  for (const failure of failures) console.error(`FAIL - ${failure}`)
  process.exit(1)
}

console.log(
  'ok - galleries render full lightweight indexes and hydrate images near the viewport',
)
