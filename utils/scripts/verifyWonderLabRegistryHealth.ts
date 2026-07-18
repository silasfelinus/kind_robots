// /utils/scripts/verifyWonderLabRegistryHealth.ts
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  clearWonderLabManifestCache,
  loadWonderLabComponentManifest,
  type WonderLabComponentManifest,
} from '@/utils/wonderlab/componentManifest'
import { summarizeWonderLabRegistry } from '@/utils/wonderlab/componentRegistryHealth'

const manifest: WonderLabComponentManifest = {
  version: 1,
  generatedAt: '2026-01-01T00:00:00.000Z',
  componentRoot: 'components',
  count: 4,
  entries: [
    {
      sourceKey: 'components/alpha/foo-card.vue',
      sourcePath: 'components/alpha/foo-card.vue',
      sourceHash: 'a'.repeat(64),
      componentName: 'foo-card',
      slug: 'alpha-foo-card',
      folderName: 'alpha',
    },
    {
      sourceKey: 'components/beta/bar-panel.vue',
      sourcePath: 'components/beta/bar-panel.vue',
      sourceHash: 'b'.repeat(64),
      componentName: 'bar-panel',
      slug: 'beta-bar-panel',
      folderName: 'beta',
    },
    {
      sourceKey: 'components/x/duplicate-card.vue',
      sourcePath: 'components/x/duplicate-card.vue',
      sourceHash: 'c'.repeat(64),
      componentName: 'duplicate-card',
      slug: 'x-duplicate-card',
      folderName: 'x',
    },
    {
      sourceKey: 'components/y/duplicate-card.vue',
      sourcePath: 'components/y/duplicate-card.vue',
      sourceHash: 'd'.repeat(64),
      componentName: 'duplicate-card',
      slug: 'y-duplicate-card',
      folderName: 'y',
    },
  ],
}

const health = summarizeWonderLabRegistry(manifest.entries, [
  { id: 1, componentName: 'foo-card', folderName: 'alpha' },
  { id: 2, componentName: 'duplicate-card', folderName: 'x' },
  { id: 3, componentName: 'retired-widget', folderName: 'legacy' },
])

assert.equal(health.manifestCount, 4)
assert.equal(health.recordCount, 3)
assert.equal(health.matchedRecordCount, 2)
assert.equal(health.staleRecordCount, 1)
assert.equal(health.missingRecordCount, 2)
assert.equal(health.duplicateNameCount, 1)
assert.deepEqual(health.staleRecords.map((record) => record.id), [3])
assert.deepEqual(
  health.missingEntries.map((entry) => entry.sourcePath),
  ['components/beta/bar-panel.vue', 'components/y/duplicate-card.vue'],
)
assert.deepEqual(health.duplicateNames, ['duplicate-card'])

// A rejected manifest request must not poison the shared cache permanently.
clearWonderLabManifestCache()
let attempts = 0
await assert.rejects(
  loadWonderLabComponentManifest(async () => {
    attempts += 1
    throw new Error('temporary manifest outage')
  }),
  /temporary manifest outage/,
)
const recovered = await loadWonderLabComponentManifest(async () => {
  attempts += 1
  return manifest
})
assert.equal(recovered.count, 4)
assert.equal(attempts, 2)
clearWonderLabManifestCache()

const panelSource = await readFile(
  'components/wonderlab/component-registry-health.vue',
  'utf8',
)
assert.match(panelSource, /\/wonderlab-components\.json/)
assert.match(panelSource, /\/api\/components/)
assert.match(panelSource, /summarizeWonderLabRegistry/)
assert.match(panelSource, /Reconciliation remains an explicit admin action/)
assert.match(panelSource, /clearWonderLabManifestCache/)

const contentSource = await readFile('content/wonderlab.md', 'utf8')
assert.match(contentSource, /:component-registry-health/)
assert.match(contentSource, /:lab-manager/)
assert.ok(
  contentSource.indexOf(':component-registry-health') <
    contentSource.indexOf(':lab-manager'),
)

console.log('WonderLab registry health verification passed.')
