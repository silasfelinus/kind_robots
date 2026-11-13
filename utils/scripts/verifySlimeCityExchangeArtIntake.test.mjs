import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const intake = JSON.parse(
  readFileSync(
    new URL('../slimeCity/exchangeOccultArtIntake.json', import.meta.url),
    'utf8',
  ),
)
const manifest = readFileSync(
  new URL('../slimeCity/artManifest.ts', import.meta.url),
  'utf8',
)

test('Meat Exchange occult art intake has one traceable plate per subject', () => {
  const entries = intake.entries
  assert.equal(entries.length, 103)
  assert.equal(
    entries.filter((e) => e.asset.startsWith('slime-city/cards/')).length,
    40,
  )
  assert.equal(
    entries.filter((e) => e.asset.startsWith('slime-city/evolutions/')).length,
    63,
  )
  assert.equal(new Set(entries.map((e) => e.asset)).size, entries.length)
  assert.equal(new Set(entries.map((e) => e.imageId)).size, entries.length)
  assert.deepEqual(
    entries.map((e) => e.imageId).sort((a, b) => a - b),
    Array.from({ length: 103 }, (_, i) => 269792 + i),
  )
  for (const entry of entries) {
    assert.ok(['pending', 'keep', 'redo'].includes(entry.verdict), entry.asset)
    if (entry.verdict !== 'keep') {
      assert.ok(
        !manifest.includes(': ' + entry.imageId + ','),
        entry.asset + ' must not ship uncurated art ' + entry.imageId,
      )
    }
  }
})
