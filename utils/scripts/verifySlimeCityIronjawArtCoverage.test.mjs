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

// Check the actual token key, not merely whether an image ID happens to
// appear elsewhere in the manifest (for example as a card or crew image).
const tokenSection = manifest.match(/\btokens:\s*\{([\s\S]*?)\n\s*\}/)?.[1]
assert.ok(tokenSection, 'artManifest.ts must expose a tokens mapping')
const tokenIds = new Map(
  [...tokenSection.matchAll(/'([^']+)'\s*:\s*(\d+)\s*,/g)].map((match) => [
    match[1],
    Number(match[2]),
  ]),
)

// A curated image in another card slot must not masquerade as coverage.
const cardSection = manifest.match(/\bcards:\s*\{([\s\S]*?)\n\s*\}/)?.[1]
const crewSection = manifest.match(/\bcrews:\s*\{([\s\S]*?)\n\s*\}/)?.[1]
assert.ok(cardSection, 'artManifest.ts must expose a cards mapping')
assert.ok(crewSection, 'artManifest.ts must expose a crews mapping')
const readMappings = (section) =>
  new Map(
    [...section.matchAll(/(?:'([^']+)'|([\w-]+))\s*:\s*(\d+)\s*,/g)].map(
      (match) => [match[1] ?? match[2], Number(match[3])],
    ),
  )
const cardIds = readMappings(cardSection)
const crewIds = readMappings(crewSection)

test('Ironjaw lizard art intake tracks every plate and only verified token keepers', () => {
  const entries = coverage.entries
  assert.equal(entries.length, 61)
  assert.equal(
    new Set(entries.map((entry) => entry.asset)).size,
    entries.length,
  )
  assert.equal(
    new Set(entries.map((entry) => entry.imageId)).size,
    entries.length,
  )
  assert.equal(
    entries.filter((entry) => entry.asset.includes('/tokens/')).length,
    45,
  )

  for (const entry of entries) {
    const isToken = entry.asset.startsWith('slime-city/tokens/')
    const key = entry.asset.replace('slime-city/tokens/', '')
    if (isToken) {
      const wired = tokenIds.get(key) === entry.imageId
      assert.equal(
        wired,
        entry.manifestPresent,
        entry.asset + ' must match its exact runtime token mapping',
      )
      if (wired) {
        assert.ok(
          ['previously-curated', 'verified-keeper'].includes(
            entry.verification,
          ),
          entry.asset + ' cannot be wired without a keeper verdict',
        )
      } else {
        assert.ok(
          ['pending-image-review', 'rejected-image-review'].includes(
            entry.verification,
          ),
          entry.asset + ' requires image review before manifest integration',
        )
        if (entry.verification === 'rejected-image-review') {
          assert.ok(entry.note, entry.asset + ' rejection needs a reason')
        }
      }
    } else {
      assert.equal(entry.manifestPresent, true, entry.asset)
      assert.equal(entry.verification, 'previously-curated', entry.asset)
      const isCrew = entry.asset.startsWith('slime-city/crews/')
      const key = entry.asset.split('/').at(-1)
      const mapped = isCrew ? crewIds.get(key) : cardIds.get(key)
      assert.equal(
        mapped,
        entry.imageId,
        entry.asset + ' must retain its exact curated image mapping',
      )
    }
  }
})

test('Ironjaw lizard redo rounds wire only reviewed keepers at their exact slot', () => {
  const rounds = coverage.redoRounds ?? []
  assert.ok(rounds.length >= 1)
  for (const round of rounds) {
    assert.ok(round.source && round.note)
    for (const entry of round.entries) {
      assert.ok(['keep', 'redo'].includes(entry.verdict), entry.asset)
      assert.ok(entry.reason, entry.asset + ' needs a review reason')
      // The rejected render this redo replaces must never ship.
      assert.ok(!manifest.includes(': ' + entry.replacesImageId + ','))
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

test('Ironjaw lizard story rounds replace ogre-era plates only with reviewed keepers', () => {
  const rounds = coverage.storyRounds ?? []
  assert.ok(rounds.length >= 1)
  const storySection = manifest.match(/\bstory:\s*\{([\s\S]*?)\n\s*\}/)?.[1]
  assert.ok(storySection, 'artManifest.ts must expose a story mapping')
  const storyIds = new Map(
    [...storySection.matchAll(/'([^']+)'\s*:\s*(\d+)\s*,/g)].map((match) => [
      match[1],
      Number(match[2]),
    ]),
  )
  for (const round of rounds) {
    assert.ok(round.source && round.note)
    assert.equal(
      new Set(round.entries.map((entry) => entry.slot)).size,
      round.entries.length,
    )
    for (const entry of round.entries) {
      assert.ok(['keep', 'redo'].includes(entry.verdict), entry.slot)
      assert.ok(entry.reason, entry.slot + ' needs a review reason')
      assert.ok(storyIds.has(entry.slot), entry.slot + ' must be a story slot')
      const wired = storyIds.get(entry.slot)
      if (entry.verdict === 'keep') {
        assert.equal(wired, entry.imageId, entry.slot + ' keeper must be wired')
        assert.ok(
          !manifest.includes(': ' + entry.replacesImageId + ','),
          entry.slot + ' must not still ship ogre-era ' + entry.replacesImageId,
        )
      } else {
        assert.ok(
          !manifest.includes(': ' + entry.imageId + ','),
          entry.slot + ' must not ship rejected render ' + entry.imageId,
        )
      }
    }
  }
})
