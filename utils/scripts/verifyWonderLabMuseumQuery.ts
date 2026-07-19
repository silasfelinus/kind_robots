// /utils/scripts/verifyWonderLabMuseumQuery.ts
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import {
  normalizeWonderLabMuseumQuery,
  sameWonderLabMuseumQuery,
  wonderLabMuseumQuery,
} from '@/utils/wonderlab/museumQuery'

const normalized = normalizeWonderLabMuseumQuery({
  q: '  butterfly swarm  ',
  folder: ['screenfx', 'ignored'],
  status: 'working',
  reviews: 'REVIEWED',
  discovery: 'MISSING',
  sort: 'recently_reviewed',
  view: 'LIST',
})

assert.deepEqual(normalized, {
  search: 'butterfly swarm',
  folder: 'screenfx',
  status: 'WORKING',
  reviews: 'reviewed',
  discovery: 'missing',
  sort: 'RECENTLY_REVIEWED',
  view: 'list',
})

for (const status of [
  'UNREVIEWED',
  'WORKING',
  'NEEDS_CONTEXT',
  'UNDER_CONSTRUCTION',
  'BROKEN',
  'RETIRED',
  'PREVIEW_UNSUPPORTED',
]) {
  assert.equal(
    normalizeWonderLabMuseumQuery({ status: status.toLowerCase() }).status,
    status,
  )
}

for (const sort of [
  'NAME',
  'STATUS',
  'RATING',
  'REVIEWS',
  'RECENTLY_CHANGED',
  'RECENTLY_REVIEWED',
]) {
  assert.equal(
    normalizeWonderLabMuseumQuery({ sort: sort.toLowerCase() }).sort,
    sort,
  )
}

for (const reviews of ['all', 'reviewed', 'unreviewed'] as const) {
  assert.equal(normalizeWonderLabMuseumQuery({ reviews }).reviews, reviews)
}
for (const discovery of ['all', 'discovered', 'missing'] as const) {
  assert.equal(
    normalizeWonderLabMuseumQuery({ discovery }).discovery,
    discovery,
  )
}

assert.deepEqual(
  normalizeWonderLabMuseumQuery({
    q: [null, 'second value'],
    folder: null,
    status: 'not-a-real-status',
    reviews: 'popular',
    discovery: 'unknown',
    sort: 'random',
    view: 'carousel',
  }),
  {
    search: 'second value',
    folder: '',
    status: 'all',
    reviews: 'all',
    discovery: 'all',
    sort: 'NAME',
    view: 'grid',
  },
  'invalid or missing query values should be harmless',
)

const preserved = wonderLabMuseumQuery(
  {
    component: 'wonderlab/component-card',
    tab: 'museum',
    q: 'old search',
    folder: 'old-folder',
    status: 'BROKEN',
    reviews: 'unreviewed',
    discovery: 'discovered',
    sort: 'STATUS',
    view: 'list',
  },
  {
    search: 'preview host',
    folder: 'wonderlab',
    status: 'NEEDS_CONTEXT',
    reviews: 'reviewed',
    discovery: 'missing',
    sort: 'RATING',
    view: 'list',
  },
)

assert.deepEqual(preserved, {
  component: 'wonderlab/component-card',
  tab: 'museum',
  q: 'preview host',
  folder: 'wonderlab',
  status: 'NEEDS_CONTEXT',
  reviews: 'reviewed',
  discovery: 'missing',
  sort: 'RATING',
  view: 'list',
})

assert.deepEqual(
  wonderLabMuseumQuery(preserved, {
    search: '',
    folder: '',
    status: 'all',
    reviews: 'all',
    discovery: 'all',
    sort: 'NAME',
    view: 'grid',
  }),
  {
    component: 'wonderlab/component-card',
    tab: 'museum',
  },
  'default collection state should preserve exhibit selection and remove filter/sort/view keys',
)

assert.equal(
  sameWonderLabMuseumQuery(normalized, { ...normalized }),
  true,
)
assert.equal(
  sameWonderLabMuseumQuery(normalized, {
    ...normalized,
    reviews: 'unreviewed',
  }),
  false,
)
assert.equal(
  sameWonderLabMuseumQuery(normalized, {
    ...normalized,
    discovery: 'discovered',
  }),
  false,
)

const [querySource, labSource, selectionRouterSource] = await Promise.all([
  readFile('utils/wonderlab/museumQuery.ts', 'utf8'),
  readFile('components/wonderlab/lab-interact.vue', 'utf8'),
  readFile('components/wonderlab/wonderlab-selection-router.vue', 'utf8'),
])

for (const queryKey of [
  'q',
  'folder',
  'status',
  'reviews',
  'discovery',
  'sort',
  'view',
]) {
  assert.match(
    querySource,
    new RegExp(`\\b${queryKey}\\b`),
    `museumQuery should own the ${queryKey} query key`,
  )
}

assert.match(querySource, /componentStatuses/)
assert.match(querySource, /componentCatalogSorts/)
assert.match(querySource, /wonderLabCollectionViews/)
assert.match(querySource, /wonderLabReviewFilters/)
assert.match(querySource, /wonderLabDiscoveryFilters/)
assert.match(labSource, /setMuseumQuery\(\{ reviews \}, 'push'\)/)
assert.match(labSource, /setMuseumQuery\(\{ discovery \}, 'push'\)/)
assert.match(labSource, /reviewFilter\.value !== 'all'/)
assert.match(labSource, /component\.reviewCount \?\? 0/)
assert.match(labSource, /discoveryFilter\.value !== 'all'/)
assert.match(labSource, /component\.isDiscovered === true/)
assert.match(labSource, /component\.isDiscovered !== true/)
assert.match(labSource, /aria-label="Filter WonderLab components by review coverage"/)
assert.match(labSource, /aria-label="Filter WonderLab components by discovery state"/)
assert.match(labSource, /reviews: 'all'/)
assert.match(labSource, /discovery: 'all'/)
assert.match(labSource, /sortedComponents\.length \}\} of \{\{ componentCount/)

assert.match(
  selectionRouterSource,
  /const query = \{ \.\.\.route\.query \}/,
  'component selection routing must preserve all museum query parameters',
)

for (const temporaryPath of [
  '.github/workflows/wonderlab-coverage-filters.yml',
  '.github/scripts/apply-wonderlab-coverage-filters.py',
]) {
  let exists = true
  try {
    await access(temporaryPath)
  } catch {
    exists = false
  }
  assert.equal(exists, false, `${temporaryPath} must be removed`)
}

console.log('WonderLab museum URL and coverage filter contract passed.')
