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
const cardSection = manifest.match(/\\bcards:\\s*\\{([\\s\\S]*?)\\n\\s*\\}/)?.[1]
const crewSection = manifest.match(/\\bcrews:\\s*\\{([\\s\\S]*?)\\n\\s*\\}/)?.[1]
assert.ok(cardSection, 'artManifest.ts must expose a cards mapping')
assert.ok(crewSection, 'artManifest.ts must expose a crews mapping')
const readMappings = (section) =>
  new Map(
    [...section.matchAll(/(?:'([^']+)'|([\\w-]+))\\s*:\\s*(\\d+)\\s*,/g)].map(
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
        assert.equal(
          entry.verification,
          'pending-image-review',
          entry.asset + ' requires image review before manifest integration',
        )
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
