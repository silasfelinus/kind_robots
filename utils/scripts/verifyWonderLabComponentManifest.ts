// /utils/scripts/verifyWonderLabComponentManifest.ts
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  loadWonderLabComponentManifest,
  resetWonderLabManifestCacheForTests,
  resolveWonderLabManifestEntry,
  wonderLabSourceUrl,
  type WonderLabComponentManifest,
} from '@/utils/wonderlab/componentManifest'

const manifest: WonderLabComponentManifest = {
  version: 1,
  generatedAt: '2026-01-01T00:00:00.000Z',
  componentRoot: 'components',
  count: 3,
  entries: [
    {
      sourceKey: 'components/content/cards/demo-card.vue',
      sourcePath: 'components/content/cards/demo-card.vue',
      sourceHash: 'a'.repeat(64),
      componentName: 'demo-card',
      slug: 'content-cards-demo-card',
      folderName: 'content/cards',
    },
    {
      sourceKey: 'components/admin/demo-card.vue',
      sourcePath: 'components/admin/demo-card.vue',
      sourceHash: 'b'.repeat(64),
      componentName: 'demo-card',
      slug: 'admin-demo-card',
      folderName: 'admin',
    },
    {
      sourceKey: 'components/wonderlab/unique-panel.vue',
      sourcePath: 'components/wonderlab/unique-panel.vue',
      sourceHash: 'c'.repeat(64),
      componentName: 'unique-panel',
      slug: 'wonderlab-unique-panel',
      folderName: 'wonderlab',
    },
  ],
}

assert.equal(
  resolveWonderLabManifestEntry(
    manifest.entries,
    'demo-card',
    'content/cards',
  )?.sourcePath,
  'components/content/cards/demo-card.vue',
)

assert.equal(
  resolveWonderLabManifestEntry(manifest.entries, 'demo-card.vue', 'cards')
    ?.sourcePath,
  'components/content/cards/demo-card.vue',
)

assert.equal(
  resolveWonderLabManifestEntry(
    manifest.entries,
    'wrong-name',
    '',
    '/components/admin/demo-card.vue',
  )?.sourcePath,
  'components/admin/demo-card.vue',
)

assert.equal(
  resolveWonderLabManifestEntry(manifest.entries, 'unique-panel')?.sourcePath,
  'components/wonderlab/unique-panel.vue',
)

assert.equal(resolveWonderLabManifestEntry(manifest.entries, 'missing'), null)
assert.equal(resolveWonderLabManifestEntry(manifest.entries, 'demo-card'), null)

assert.equal(
  wonderLabSourceUrl(manifest.entries[0]!),
  'https://github.com/silasfelinus/kind_robots/blob/main/components/content/cards/demo-card.vue',
)

resetWonderLabManifestCacheForTests()
let fetchCount = 0
const first = loadWonderLabComponentManifest(async () => {
  fetchCount += 1
  return manifest
})
const second = loadWonderLabComponentManifest(async () => {
  fetchCount += 1
  return manifest
})
assert.equal(first, second)
assert.equal((await first).count, 3)
assert.equal(fetchCount, 1)

resetWonderLabManifestCacheForTests()
await assert.rejects(
  loadWonderLabComponentManifest(async () => ({ version: 2, entries: [] })),
  /invalid shape/i,
)
resetWonderLabManifestCacheForTests()

const hostSource = await readFile(
  'components/wonderlab/wonderlab-preview-host.vue',
  'utf8',
)
assert.match(hostSource, /wonderlab-components\.json/)
assert.match(hostSource, /manifest matched/)
assert.match(hostSource, /manifest unmatched/)
assert.match(hostSource, /sourceHash\.slice\(0, 12\)/)
assert.match(hostSource, /wonderLabSourceUrl/)
assert.match(hostSource, /fixtureSourcePath/)

console.log('WonderLab component manifest verification passed.')
