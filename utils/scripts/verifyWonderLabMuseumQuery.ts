// /utils/scripts/verifyWonderLabMuseumQuery.ts
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  normalizeWonderLabMuseumQuery,
  sameWonderLabMuseumQuery,
  wonderLabMuseumQuery,
} from '@/utils/wonderlab/museumQuery'

const normalized = normalizeWonderLabMuseumQuery({
  q: '  butterfly swarm  ',
  folder: ['screenfx', 'ignored'],
  status: 'working',
  sort: 'recently_reviewed',
  view: 'LIST',
})

assert.deepEqual(normalized, {
  search: 'butterfly swarm',
  folder: 'screenfx',
  status: 'WORKING',
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

assert.deepEqual(
  normalizeWonderLabMuseumQuery({
    q: [null, 'second value'],
    folder: null,
    status: 'not-a-real-status',
    sort: 'random',
    view: 'carousel',
  }),
  {
    search: 'second value',
    folder: '',
    status: 'all',
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
    sort: 'STATUS',
    view: 'list',
  },
  {
    search: 'preview host',
    folder: 'wonderlab',
    status: 'NEEDS_CONTEXT',
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
  sort: 'RATING',
  view: 'list',
})

assert.deepEqual(
  wonderLabMuseumQuery(preserved, {
    search: '',
    folder: '',
    status: 'all',
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
    sort: 'REVIEWS',
  }),
  false,
)
assert.equal(
  sameWonderLabMuseumQuery(normalized, {
    ...normalized,
    view: 'grid',
  }),
  false,
)

const [querySource, labSource, selectionRouterSource] = await Promise.all([
  readFile('utils/wonderlab/museumQuery.ts', 'utf8'),
  readFile('components/wonderlab/lab-interact.vue', 'utf8'),
  readFile('components/wonderlab/wonderlab-selection-router.vue', 'utf8'),
])

for (const queryKey of ['q', 'folder', 'status', 'sort', 'view']) {
  assert.match(
    querySource,
    new RegExp(`\\b${queryKey}\\b`),
    `museumQuery should own the ${queryKey} query key`,
  )
}

assert.match(querySource, /componentStatuses/)
assert.match(querySource, /componentCatalogSorts/)
assert.match(querySource, /wonderLabCollectionViews/)
assert.match(labSource, /useRoute\(\)/)
assert.match(labSource, /useRouter\(\)/)
assert.match(labSource, /setMuseumQuery\(\{ search \}, 'replace'\)/)
assert.match(labSource, /setMuseumQuery\(\{ folder \}, 'push'\)/)
assert.match(labSource, /setMuseumQuery\(\{ status \}, 'push'\)/)
assert.match(labSource, /setMuseumQuery\(\{ sort \}, 'push'\)/)
assert.match(labSource, /setMuseumQuery\(\{ view \}, 'push'\)/)
assert.match(labSource, /clearMuseumFilters/)
assert.match(labSource, /sortedComponents\.length \}\} of \{\{ componentCount/)
assert.match(labSource, /value="NEEDS_CONTEXT"/)
assert.match(labSource, /value="RETIRED"/)
assert.match(labSource, /value="PREVIEW_UNSUPPORTED"/)
assert.match(labSource, /value="RECENTLY_REVIEWED"/)
assert.match(labSource, /collectionView === 'grid'/)
assert.match(labSource, /collectionView === 'list'/)

assert.match(
  selectionRouterSource,
  /const query = \{ \.\.\.route\.query \}/,
  'component selection routing must preserve museum filter, sort, and view parameters',
)

console.log('WonderLab museum URL query contract passed.')
