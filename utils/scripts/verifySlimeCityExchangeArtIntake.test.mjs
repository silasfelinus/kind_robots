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

test('Meat Exchange occult redo rounds wire only reviewed keepers at their exact slot', () => {
  const rounds = intake.redoRounds ?? []
  assert.ok(rounds.length >= 1)
  const original = new Map(intake.entries.map((e) => [e.asset, e]))
  for (const round of rounds) {
    assert.ok(round.source && round.note)
    for (const entry of round.entries) {
      assert.ok(['keep', 'redo'].includes(entry.verdict), entry.asset)
      assert.ok(entry.reason, entry.asset + ' needs a review reason')
      // A redo round only re-renders plates that round 1 rejected.
      assert.equal(original.get(entry.asset)?.verdict, 'redo', entry.asset)
      assert.equal(original.get(entry.asset)?.imageId, entry.replacesImageId)
      const key = entry.asset.split('/').at(-1)
      const slot = "'" + key + "': " + entry.imageId + ','
      if (entry.verdict === 'keep') {
        assert.ok(
          manifest.includes(slot),
          entry.asset + ' keeper must be wired',
        )
      } else {
        assert.ok(
          !manifest.includes(': ' + entry.imageId + ','),
          entry.asset + ' must not ship rejected redo ' + entry.imageId,
        )
      }
    }
  }
})
