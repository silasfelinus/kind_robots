import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  countZuzuMatches,
  parseZuzuResourceCandidates,
  reconcileZuzuResources,
  worldTags,
} from '../zuzuResourceAudit'

const manifest = {
  schema_version: 1,
  status: 'prepared-not-applied',
  characters: [
    {
      key: 'zuzu-koala-assassin',
      source_path:
        'projects/comic-creator/issues/zuzu-koala-assassin-01/BOOK-ONE.md',
      payload: { name: 'Zuzu', slug: 'zuzu-koala-assassin' },
    },
    {
      key: 'coyote-vagrant',
      source_path:
        'projects/comic-creator/issues/zuzu-koala-assassin-01/CAST-PICKS.md',
      payload: { name: 'Coyote Vagrant', slug: 'coyote-vagrant' },
    },
  ],
  scenarios: [
    {
      key: 'zuzu-watering-hole',
      source_path:
        'projects/comic-creator/issues/zuzu-koala-assassin-01/BOOK-ONE.md',
      payload: { title: 'The Watering Hole', slug: 'zuzu-watering-hole' },
    },
  ],
  rewards: [
    {
      key: 'zuzu-katana',
      source_path:
        'projects/comic-creator/issues/zuzu-koala-assassin-01/BOOK-ONE.md',
      payload: { name: 'The Back-Slung Katana', slug: 'zuzu-katana' },
    },
  ],
  model_resources: [
    {
      name: 'Abbess LoRA',
      trigger: 'zkaabbess',
      source_path:
        'projects/comic-creator/issues/zuzu-koala-assassin-01/LORA-SETS.yaml',
    },
  ],
}

const candidates = parseZuzuResourceCandidates(manifest)
assert.equal(candidates.length, 5)
assert.equal(new Set(candidates.map((candidate) => candidate.key)).size, 5)
const buckets = {
  character: [
    { id: 71, name: 'Zuzu', slug: 'zuzu-koala-assassin' },
    { id: 72, name: 'Coyote Vagrant', slug: null },
    { id: 73, name: 'Coyote Vagrant', slug: 'someone-else' },
  ],
  scenario: [{ id: 81, name: 'The Watering Hole', slug: 'zuzu-watering-hole' }],
  reward: [],
  'model-resource': [
    {
      id: 91,
      name: 'Unknown LoRA',
      slug: null,
      triggerWords: 'zkaabbess, example',
    },
  ],
}
const matches = reconcileZuzuResources(candidates, buckets)
assert.deepEqual(
  matches.map((match) => match.status),
  ['slug-match', 'ambiguous', 'slug-match', 'missing', 'trigger-review'],
)
assert.deepEqual(
  matches[0]?.matches.map((match) => match.id),
  [71],
)
assert.deepEqual(
  matches[1]?.matches.map((match) => match.id),
  [72, 73],
)
assert.deepEqual(countZuzuMatches(matches), {
  'slug-match': 2,
  'name-review': 0,
  'trigger-review': 1,
  ambiguous: 1,
  missing: 1,
})
const single = reconcileZuzuResources(candidates, {
  ...buckets,
  character: buckets.character.slice(0, 2),
})
assert.equal(single[1]?.status, 'name-review')
assert.deepEqual(worldTags({ worlds: ['zuzu', 3, 'other'] }), ['zuzu', 'other'])
assert.deepEqual(worldTags({ worlds: 'zuzu' }), [])
assert.deepEqual(worldTags(null), [])
assert.throws(() =>
  parseZuzuResourceCandidates({ ...manifest, schema_version: 2 }),
)
assert.throws(() =>
  parseZuzuResourceCandidates({ ...manifest, characters: [{}] }),
)
assert.throws(() =>
  parseZuzuResourceCandidates({
    ...manifest,
    characters: [manifest.characters[0], manifest.characters[0]],
  }),
)
assert.equal(
  reconcileZuzuResources(candidates, {
    ...buckets,
    'model-resource': [
      { id: 1, name: 'Not Abbess', slug: null, triggerWords: 'zkaabbess2' },
    ],
  })[4]?.status,
  'missing',
)

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')
const route = read('../../server/api/worlds/zuzu/resource-audit.get.ts')
assert.match(route, /requireAdminApiUser\(event\)/)
assert.match(route, /userId: ownerId/)
assert.match(route, /viewerShowsMature\(auth.user\)/)
assert.match(route, /worlds\/zuzu\/resource-submissions\.json/)
assert.match(route, /loadFacetCatalogEntries\(/)
assert.doesNotMatch(
  route,
  /\.(?:create|createMany|update|updateMany|delete|deleteMany)\(/,
)

const store = read('../../stores/zuzuWorldStore.ts')
assert.match(store, /\/api\/worlds\/zuzu\/resource-audit/)
console.log('Zuzu resource identity audit contract passed')
