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
const dreamListRoute = read('server/api/dreams/index.get.ts')

for (const token of [
  '<kr-viewport-gate @hydrate="hydrateSlotItem(item.id)">',
  'v-if="hydratedSlotItems.has(item.id)"',
  'data-kr-gallery-placeholder',
  '{{ item.title }}',
]) {
  requireText(
    gallery,
    token,
    `custom gallery slots must keep a text-first index and defer component mounting: ${token}`,
  )
}

requireText(
  dreamListRoute,
  "if (value === undefined || value === null || value === '') return undefined",
  'Dream list requests without an explicit take must mean complete browse index',
)
requireText(
  dreamListRoute,
  '...(take === undefined ? {} : { take })',
  'Dream list query must omit Prisma take for complete browse-index requests',
)
forbidText(
  dreamListRoute,
  'thumbnailData: true',
  'Dream browse index must not ship inline thumbnail blobs before viewport hydration',
)
forbidText(
  dreamListRoute,
  'take: 3,\n',
  'Dream browse relationships must not be truncated to three records',
)
requireText(
  dreamListRoute,
  'const collectionPreviewSelect = {',
  'Dream browse records must carry a lightweight collection preview shape',
)
requireText(
  dreamListRoute,
  'ArtCollections: {\n    select: collectionPreviewSelect,\n  }',
  'Dream relationship browsing must receive every attached collection id',
)

if (failures.length) {
  for (const failure of failures) console.error(`FAIL - ${failure}`)
  process.exit(1)
}

console.log(
  'ok - galleries expose the complete text-first index, defer custom card setup near viewport, and Dream browsing is complete without inline image blobs',
)
