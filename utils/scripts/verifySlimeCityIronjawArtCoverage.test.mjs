import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const coverage = JSON.parse(
  readFileSync(
    new URL('../slimeCity/ironjawLizardArtCoverage.json', import.meta.url),
    'utf8',
  ),
)
const manifest = readFileSync(
  new URL('../slimeCity/artManifest.ts', import.meta.url),
  'utf8',
)

test('Ironjaw lizard art provenance remains complete and uncurated tokens stay out', () => {
  const entries = coverage.entries
  assert.equal(entries.length, 61)
  assert.equal(new Set(entries.map((entry) => entry.asset)).size, 61)
  assert.equal(new Set(entries.map((entry) => entry.imageId)).size, 61)
  assert.equal(entries.filter((entry) => entry.manifestPresent).length, 16)
  assert.equal(entries.filter((entry) => !entry.manifestPresent).length, 45)
  for (const entry of entries) {
    assert.equal(
      manifest.includes(': ' + entry.imageId + ','),
      entry.manifestPresent,
      entry.asset + ' must match the recorded manifest coverage',
    )
    if (!entry.manifestPresent) {
      assert.equal(entry.verification, 'pending-image-review')
    }
  }
})
