// /utils/scripts/verifyOracleEngine.test.ts
//
// DB-free tests for utils/oracle/* (kind-oracle/t-004). Uses a synthetic deck and
// content table so the engine is proven independent of the authored card text.
import assert from 'node:assert/strict'
import { buildReading, drawSpread, sortedPairKey } from '../oracle/reading'
import { seededRandom } from '../oracle/rng'
import { ORACLE_SPREAD_IDS, ORACLE_SPREADS } from '../oracle/spreads'
import { ORACLE_ENERGIES, validateOracle } from '../oracle/validate'
import type { OracleCard, OracleContent, OracleSpreadId } from '../oracle/types'

let passed = 0
const test = (name: string, fn: () => void) => {
  fn()
  passed++
  console.log(`ok - ${name}`)
}

const words = (n: number, w: string) => Array.from({ length: n }, () => w).join(' ')
const deck: OracleCard[] = Array.from({ length: 22 }, (_, i) => ({
  id: `card-${i}`,
  arcana: 'major',
  order: i,
  title: `Card ${i}`,
  energy: ORACLE_ENERGIES[i % ORACLE_ENERGIES.length],
  upright: `${words(30, 'gift')} ${i}.`,
  reversed: `${words(30, 'blocked')} ${i}.`,
  prompt: 'What are you ready to begin today?',
}))
const energyPairs: Record<string, string> = {}
for (const a of ORACLE_ENERGIES)
  for (const b of ORACLE_ENERGIES)
    if (a <= b) for (const k of ['echo', 'contrast']) energyPairs[`${sortedPairKey(a, b)}:${k}`] = `${a} and ${b} ${k}.`
const content: OracleContent = {
  openings: { one: ['One a.', 'One b.', 'One c.'], three: ['Three a.', 'Three b.', 'Three c.'], five: ['Five a.', 'Five b.', 'Five c.'] },
  closings: { one: ['Close one.'], three: ['Close three.'], five: ['Close five.'] },
  positionText: { present: { 'card-3': { upright: 'Bespoke present text for card three.' } } },
  energyPairs,
  specialPairs: { [sortedPairKey('card-1', 'card-0')]: 'Special pair text.' },
}

test('seededRandom is deterministic and in range', () => {
  const a = seededRandom('x')
  const b = seededRandom('x')
  for (let i = 0; i < 50; i++) {
    const v = a()
    assert.equal(v, b())
    assert.ok(v >= 0 && v < 1)
  }
  assert.notEqual(seededRandom('x')(), seededRandom('y')())
})

test('draw is seeded, without replacement, and fills every position', () => {
  for (const id of ORACLE_SPREAD_IDS) {
    for (let s = 0; s < 200; s++) {
      const drawn = drawSpread(deck, id, `seed-${s}`)
      assert.equal(drawn.length, ORACLE_SPREADS[id].positions.length)
      assert.equal(new Set(drawn.map((d) => d.card.id)).size, drawn.length)
      assert.deepEqual(drawn, drawSpread(deck, id, `seed-${s}`))
    }
  }
})

test('orientation is roughly half reversed', () => {
  let reversed = 0
  let total = 0
  for (let s = 0; s < 400; s++)
    for (const d of drawSpread(deck, 'five', `o-${s}`)) {
      total++
      if (d.orientation === 'reversed') reversed++
    }
  assert.ok(reversed / total > 0.45 && reversed / total < 0.55, `reversed share ${reversed / total}`)
})

test('every spread yields complete text for 500 seeds', () => {
  for (const id of ORACLE_SPREAD_IDS as OracleSpreadId[]) {
    for (let s = 0; s < 500; s++) {
      const r = buildReading(deck, content, id, `t-${s}`)
      assert.ok(r.opening && r.closing.startsWith('Close') && r.closing.endsWith(deck[0].prompt))
      assert.equal(r.passages.length, r.cards.length)
      assert.equal(r.pairs.length, r.cards.length - 1)
      assert.ok(r.passages.every((p) => p.length > 20 && !p.includes('{card}')))
      assert.ok(!/undefined|null|\{/.test(r.text))
    }
  }
})

test('bespoke passage and special pair take priority, with frame fallback otherwise', () => {
  let sawBespoke = false
  let sawSpecial = false
  for (let s = 0; s < 3000 && !(sawBespoke && sawSpecial); s++) {
    const r = buildReading(deck, content, 'three', `p-${s}`)
    if (r.text.includes('Bespoke present text')) sawBespoke = true
    if (r.text.includes('Special pair text.')) sawSpecial = true
  }
  assert.ok(sawBespoke && sawSpecial)
  const one = buildReading(deck, content, 'one', 'frame')
  assert.ok(one.passages[0].startsWith('Your companion today is'))
})

test('reversed cards are marked and use the reversed text', () => {
  const r = buildReading(deck, content, 'five', 'rev')
  for (const c of r.cards) {
    const p = r.passages[r.cards.indexOf(c)]
    if (c.orientation === 'reversed') assert.ok(p.includes('(reversed)') && p.includes('blocked'))
  }
})

test('deck too small throws', () => {
  assert.throws(() => drawSpread(deck.slice(0, 2), 'three', 's'))
})

test('validator accepts the fixture and flags bad content', () => {
  assert.deepEqual(validateOracle(deck, content), [])
  const bad = [{ ...deck[0], reversed: deck[0].upright, prompt: 'Too short' }]
  const problems = validateOracle(bad, { ...content, energyPairs: {} })
  assert.ok(problems.some((p) => p.includes('reversed equals upright')))
  assert.ok(problems.some((p) => p.includes('prompt')))
  assert.ok(problems.some((p) => p.includes('missing energy pair')))
})

console.log(`${passed} tests passed`)
