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
})

assert.deepEqual(normalized, {
  search: 'butterfly swarm',
  folder: 'screenfx',
  status: 'WORKING',
})

assert.deepEqual(
  normalizeWonderLabMuseumQuery({
    q: [null, 'second value'],
    folder: null,
    status: 'not-a-real-status',
  }),
  {
    search: 'second value',
    folder: '',
    status: 'all',
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
  },
  {
    search: 'preview host',
    folder: 'wonderlab',
    status: 'UNDER_CONSTRUCTION',
  },
)

assert.deepEqual(preserved, {
  component: 'wonderlab/component-card',
  tab: 'museum',
  q: 'preview host',
  folder: 'wonderlab',
  status: 'UNDER_CONSTRUCTION',
})

assert.deepEqual(
  wonderLabMuseumQuery(preserved, {
    search: '',
    folder: '',
    status: 'all',
  }),
  {
    component: 'wonderlab/component-card',
    tab: 'museum',
  },
  'clearing filters should preserve exhibit selection and unrelated query state',
)

assert.equal(
  sameWonderLabMuseumQuery(normalized, { ...normalized }),
  true,
)
assert.equal(
  sameWonderLabMuseumQuery(normalized, {
    ...normalized,
    status: 'BROKEN',
  }),
  false,
)

const [labSource, selectionRouterSource] = await Promise.all([
  readFile('components/wonderlab/lab-interact.vue', 'utf8'),
  readFile('components/wonderlab/wonderlab-selection-router.vue', 'utf8'),
])

for (const queryKey of ['q', 'folder', 'status']) {
  assert.match(
    labSource,
    new RegExp(`\\b${queryKey}\\b`),
    `lab-interact should expose the ${queryKey} query key`,
  )
}

assert.match(labSource, /useRoute\(\)/)
assert.match(labSource, /useRouter\(\)/)
assert.match(labSource, /setMuseumQuery\(\{ search \}, 'replace'\)/)
assert.match(labSource, /setMuseumQuery\(\{ folder \}, 'push'\)/)
assert.match(labSource, /setMuseumQuery\(\{ status \}, 'push'\)/)
assert.match(labSource, /clearMuseumFilters/)
assert.match(labSource, /filteredComponents\.length \}\} of \{\{ componentCount/)

assert.match(
  selectionRouterSource,
  /const query = \{ \.\.\.route\.query \}/,
  'component selection routing must preserve museum filter query parameters',
)

console.log('WonderLab museum URL query contract passed.')
