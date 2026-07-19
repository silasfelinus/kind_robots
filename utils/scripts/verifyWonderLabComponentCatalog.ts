// /utils/scripts/verifyWonderLabComponentCatalog.ts
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import type { ComponentCatalogItem } from '@/utils/wonderlab/componentCatalog'
import {
  componentCatalogSorts,
  isComponentCatalogSort,
  sortComponentCatalog,
} from '@/utils/wonderlab/componentCatalog'

function component(
  id: number,
  componentName: string,
  overrides: Partial<ComponentCatalogItem> = {},
): ComponentCatalogItem {
  return {
    id,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    folderName: 'wonderlab',
    componentName,
    isWorking: false,
    underConstruction: false,
    isBroken: false,
    slug: null,
    sourcePath: null,
    sourceKey: null,
    sourceHash: null,
    status: 'UNREVIEWED',
    statusReason: null,
    title: componentName,
    description: null,
    notes: null,
    category: null,
    tags: null,
    previewMode: null,
    previewConfig: null,
    lastSeenAt: null,
    isDiscovered: true,
    artImageId: null,
    reviewCount: 0,
    ratingCount: 0,
    averageRating: null,
    lastReviewedAt: null,
    ...overrides,
  }
}

const items = [
  component(1, 'zeta-card', {
    title: 'Zeta Card',
    status: 'WORKING',
    isWorking: true,
    reviewCount: 4,
    ratingCount: 3,
    averageRating: 4.5,
    updatedAt: new Date('2026-07-15T00:00:00.000Z'),
    lastReviewedAt: '2026-07-16T00:00:00.000Z',
  }),
  component(2, 'alpha-panel', {
    title: 'Alpha Panel',
    status: 'BROKEN',
    isBroken: true,
    reviewCount: 9,
    ratingCount: 5,
    averageRating: 3.5,
    updatedAt: new Date('2026-07-18T00:00:00.000Z'),
    lastReviewedAt: '2026-07-10T00:00:00.000Z',
  }),
  component(3, 'beta-manager', {
    title: 'Beta Manager',
    status: 'RETIRED',
    reviewCount: 1,
    ratingCount: 1,
    averageRating: 4.5,
    updatedAt: new Date('2026-06-01T00:00:00.000Z'),
    lastReviewedAt: null,
  }),
]

const originalIds = items.map((item) => item.id)
assert.deepEqual(
  sortComponentCatalog(items, 'NAME').map((item) => item.id),
  [2, 3, 1],
)
assert.deepEqual(
  sortComponentCatalog(items, 'STATUS').map((item) => item.id),
  [2, 1, 3],
)
assert.deepEqual(
  sortComponentCatalog(items, 'RATING').map((item) => item.id),
  [1, 3, 2],
  'equal ratings should prefer the item with more ratings',
)
assert.deepEqual(
  sortComponentCatalog(items, 'REVIEWS').map((item) => item.id),
  [2, 1, 3],
)
assert.deepEqual(
  sortComponentCatalog(items, 'RECENTLY_CHANGED').map((item) => item.id),
  [2, 1, 3],
)
assert.deepEqual(
  sortComponentCatalog(items, 'RECENTLY_REVIEWED').map((item) => item.id),
  [1, 2, 3],
)
assert.deepEqual(
  items.map((item) => item.id),
  originalIds,
  'sorting must not mutate the Pinia collection',
)

assert.deepEqual(componentCatalogSorts, [
  'NAME',
  'STATUS',
  'RATING',
  'REVIEWS',
  'RECENTLY_CHANGED',
  'RECENTLY_REVIEWED',
])
assert.equal(isComponentCatalogSort('RATING'), true)
assert.equal(isComponentCatalogSort('random'), false)

const [apiSource, storeSource] = await Promise.all([
  readFile('server/api/components/index.get.ts', 'utf8'),
  readFile('stores/componentStore.ts', 'utf8'),
])

assert.match(apiSource, /prisma\.reaction\.groupBy/)
assert.match(apiSource, /componentId:\s*\{ not: null \}/)
assert.match(apiSource, /reactionCategory:\s*'COMPONENT'/)
assert.match(apiSource, /_count:[\s\S]*?_all:\s*true[\s\S]*?rating:\s*true/)
assert.match(apiSource, /_avg:[\s\S]*?rating:\s*true/)
assert.match(apiSource, /_max:[\s\S]*?createdAt:\s*true/)
assert.match(apiSource, /reviewCount:/)
assert.match(apiSource, /ratingCount:/)
assert.match(apiSource, /averageRating:/)
assert.match(apiSource, /lastReviewedAt:/)
assert.doesNotMatch(apiSource, /include:[\s\S]*?Reactions/)

assert.match(storeSource, /ComponentCatalogItem\[\]/)
assert.match(storeSource, /loadSnapshot<ComponentCatalogItem>/)
assert.match(storeSource, /const merged: ComponentCatalogItem/)
assert.match(storeSource, /\.\.\.existing/)
assert.match(storeSource, /\.\.\.updated/)
assert.match(storeSource, /selectedComponent\.value = merged/)

console.log('WonderLab Component catalog metrics and sorting contract passed.')
