import assert from 'node:assert/strict'
import {
  ART_STYLE_CATALOG,
  getArtStyle,
  randomArtStyle,
  weightedArtStyleFor,
  withArtStyle,
} from '../artStyleCatalog'
import { checkArtPromptContract } from '../../server/utils/artPromptContract'

// The three subjects of the 2026-09-29 style bake-off.
const SAMPLE_SUBJECTS = [
  'character portrait of a young fox-featured river courier with a patched canvas satchel and a bright scarf, mid-stride on a sloping rooftop, quick clever expression, vertical 2:3 portrait composition, full figure with room around it',
  'a floating market of patched wooden boats on a wide river delta, stalls stacked with fruit, lanterns and bolts of cloth, towpath and reeds in the distance, vertical 2:3 portrait composition, wide establishing view with a strong foreground anchor',
  'a single brass hourglass with its sand flowing upward, resting on a worn wooden table, one object alone, vertical 2:3 portrait composition, close still-life view',
]

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
    checkArtPromptContract({ prompt: style.prompt, engine: 'krea2' }),
    [],
    `${style.id} breaks the art prompt contract`,
  )
  // Some rules only fire in context: art nouveau's "ornamental curving frames"
  // passed alone and was rejected at enqueue once a character stood in front
  // of it (bake-off ArtJob 31767). Check each style as it is actually sent.
  for (const subject of SAMPLE_SUBJECTS) {
    assert.deepEqual(
      checkArtPromptContract({
        prompt: withArtStyle(subject, style),
        engine: 'krea2',
      }),
      [],
      `${style.id} breaks the art prompt contract after "${subject.slice(0, 30)}..."`,
    )
  }
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
