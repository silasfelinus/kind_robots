import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const curation = JSON.parse(
  readFileSync(
    new URL('../slimeCity/anarkissArtCuration.json', import.meta.url),
    'utf8',
  ),
)
const manifest = readFileSync(
  new URL('../slimeCity/artManifest.ts', import.meta.url),
  'utf8',
)

// slime-city/t-052: every ANARKISS-CARDS-ROUND-2 render carries a reviewed
// verdict, and the manifest ships exactly the keepers at their own slot.
test('ANARKISS round 2 art is contact-sheet curated, one verdict per render', () => {
  const entries = curation.entries
  assert.equal(entries.length, 102)
  assert.equal(
    entries.filter((e) => e.asset.startsWith('slime-city/cards/')).length,
    40,
  )
  assert.equal(
    entries.filter((e) => e.asset.startsWith('slime-city/evolutions/')).length,
    62,
  )
  assert.equal(new Set(entries.map((e) => e.asset)).size, entries.length)
  assert.deepEqual(
    entries.map((e) => e.imageId).sort((a, b) => a - b),
    Array.from({ length: 102 }, (_, i) => 269690 + i),
  )
  for (const entry of entries) {
    assert.ok(['keep', 'redo'].includes(entry.verdict), entry.asset)
    const key = entry.asset.split('/').at(-1)
    const quoted = /^[a-z]\w*$/.test(key) ? key : "'" + key + "'"
    const slot = quoted + ': ' + entry.imageId + ','
    if (entry.verdict === 'keep') {
      assert.ok(manifest.includes(slot), entry.asset + ' keeper must be wired')
    } else {
      assert.ok(
        !manifest.includes(': ' + entry.imageId + ','),
        entry.asset + ' must not ship rejected art ' + entry.imageId,
      )
    }
  }
})
