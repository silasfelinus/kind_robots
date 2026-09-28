import assert from 'node:assert/strict'
import {
  ART_STYLE_CATALOG,
  getArtStyle,
  randomArtStyle,
  weightedArtStyleFor,
  withArtStyle,
} from '../artStyleCatalog'
import { checkArtPromptContract } from '../../server/utils/artPromptContract'

// Ids are unique and every style is paintable on Krea 2 as written.
const ids = new Set(ART_STYLE_CATALOG.map((style) => style.id))
assert.equal(ids.size, ART_STYLE_CATALOG.length, 'style ids must be unique')
for (const style of ART_STYLE_CATALOG) {
  assert.ok(style.label.trim(), `${style.id} needs a label`)
  assert.ok(['vibrant', 'moody'].includes(style.mood), `${style.id} mood`)
  assert.ok(
    Number.isInteger(style.weight) && style.weight > 0,
    `${style.id} weight`,
  )
  assert.deepEqual(
    checkArtPromptContract({ prompt: style.prompt }),
    [],
    `${style.id} breaks the art prompt contract`,
  )
}

// The super vibrant narrator cartoon style is in the bank.
assert.ok(getArtStyle('adult-animated-cartoon'))

// Gloomy days stay occasional: moody styles hold under a tenth of the lane.
const total = ART_STYLE_CATALOG.reduce((sum, s) => sum + s.weight, 0)
const moody = ART_STYLE_CATALOG.filter((s) => s.mood === 'moody').reduce(
  (sum, s) => sum + s.weight,
  0,
)
assert.ok(moody > 0, 'keep at least one moody style')
assert.ok(moody / total < 0.1, `moody share ${moody}/${total} is too high`)

// Weighted pick is deterministic and reaches every style.
assert.equal(weightedArtStyleFor(12345).id, weightedArtStyleFor(12345).id)
const reached = new Set<string>()
for (let slot = 0; slot < total; slot++)
  reached.add(weightedArtStyleFor(slot).id)
assert.equal(reached.size, ART_STYLE_CATALOG.length)
assert.ok(ids.has(randomArtStyle(() => 0.5).id))

// Appending is idempotent and leaves an empty style choice alone.
const cartoon = getArtStyle('adult-animated-cartoon')!
assert.equal(withArtStyle('a fox, ', null), 'a fox')
const styled = withArtStyle('a fox', cartoon)
assert.equal(styled, `a fox, ${cartoon.prompt}`)
assert.equal(withArtStyle(styled, cartoon), styled)

console.log(`art style catalog OK (${ART_STYLE_CATALOG.length} styles)`)
