// /utils/scripts/verifySolitaireEngine.test.ts
//
// DB-free tests for utils/solitaireEngine.ts (kr-solitaire/t-004).
import assert from 'node:assert/strict'
import {
  applyMove,
  canAutoComplete,
  cloneState,
  isLegal,
  isWon,
  legalMoves,
  newGame,
  nextAutoCompleteMove,
  play,
  shuffledDeck,
  solveWithin,
  startGame,
  undo,
  type SolitaireState,
} from '../solitaireEngine'

let passed = 0
const test = (name: string, fn: () => void) => {
  fn()
  passed++
  console.log(`ok - ${name}`)
}

const emptyTableau = () =>
  [[], [], [], [], [], [], []] as SolitaireState['tableau']

test('shuffle is a deterministic permutation of 52 cards', () => {
  const a = shuffledDeck('seed-1')
  assert.deepEqual(a, shuffledDeck('seed-1'))
  assert.notDeepEqual(a, shuffledDeck('seed-2'))
  assert.deepEqual(
    [...a].sort((x, y) => x - y),
    Array.from({ length: 52 }, (_, i) => i),
  )
})

test('deal: 28 tableau cards, one face-up per column, 24 in stock', () => {
  const s = newGame('deal')
  assert.equal(s.stock.length, 24)
  assert.equal(s.waste.length, 0)
  s.tableau.forEach((col, i) => {
    assert.equal(col.length, i + 1)
    assert.equal(col.filter((c) => c.up).length, 1)
    assert.ok(col[col.length - 1].up)
  })
  const all = [...s.stock, ...s.tableau.flat().map((c) => c.id)]
  assert.equal(new Set(all).size, 52)
})

test('same seed deals the same game; draw mode does not change the deal', () => {
  const a = newGame('same', 1)
  const b = newGame('same', 3)
  assert.deepEqual(a.tableau, b.tableau)
  assert.deepEqual(a.stock, b.stock)
})

test('draw-1 moves one card, draw-3 moves three, empty stock recycles waste', () => {
  const one = applyMove(newGame('d', 1), { type: 'draw' }) as SolitaireState
  assert.equal(one.waste.length, 1)
  const three = applyMove(newGame('d', 3), { type: 'draw' }) as SolitaireState
  assert.equal(three.waste.length, 3)
  let s = newGame('d', 3)
  for (let i = 0; i < 8; i++)
    s = applyMove(s, { type: 'draw' }) as SolitaireState
  assert.equal(s.stock.length, 0)
  assert.equal(s.waste.length, 24)
  const recycled = applyMove(s, { type: 'draw' }) as SolitaireState
  assert.equal(recycled.stock.length, 24)
  assert.equal(recycled.waste.length, 0)
  assert.deepEqual(recycled.stock, newGame('d', 3).stock)
})

test('applyMove never mutates its input and rejects illegal moves', () => {
  const s = newGame('pure')
  const frozen = JSON.stringify(s)
  applyMove(s, { type: 'draw' })
  assert.equal(JSON.stringify(s), frozen)
  assert.equal(applyMove(s, { type: 'waste-to-foundation' }), null)
  assert.equal(
    applyMove(s, { type: 'tableau-to-tableau', from: 0, index: 0, to: 0 }),
    null,
  )
  assert.equal(
    isLegal(s, { type: 'foundation-to-tableau', suit: 0, to: 0 }),
    false,
  )
})

test('every generated legal move applies; card count is conserved', () => {
  for (let i = 0; i < 20; i++) {
    let s = newGame(`walk-${i}`, i % 2 ? 3 : 1)
    for (let step = 0; step < 60; step++) {
      const moves = legalMoves(s)
      if (!moves.length) break
      const m = moves[(step * 7 + i) % moves.length]
      const n = applyMove(s, m)
      assert.ok(n, `legal move ${JSON.stringify(m)} must apply`)
      s = n as SolitaireState
      const total =
        s.stock.length +
        s.waste.length +
        s.foundations.reduce((a, p) => a + p.length, 0) +
        s.tableau.reduce((a, c) => a + c.length, 0)
      assert.equal(total, 52)
      s.tableau.forEach((col) => {
        if (col.length) assert.ok(col[col.length - 1].up, 'top card face-up')
      })
    }
  }
})

test('tableau build rules: alternate colour, descending; kings only on empty', () => {
  const s = newGame('rules')
  s.tableau = emptyTableau()
  s.stock = []
  s.tableau[0] = [{ id: 0 * 13 + 5, up: true }] // 6 of spades
  s.tableau[1] = [{ id: 1 * 13 + 4, up: true }] // 5 of hearts
  s.tableau[2] = [{ id: 0 * 13 + 4, up: true }] // 5 of spades
  s.tableau[3] = [{ id: 0 * 13 + 12, up: true }] // king of spades
  assert.ok(
    isLegal(s, { type: 'tableau-to-tableau', from: 1, index: 0, to: 0 }),
  )
  assert.ok(
    !isLegal(s, { type: 'tableau-to-tableau', from: 2, index: 0, to: 0 }),
  )
  assert.ok(
    isLegal(s, { type: 'tableau-to-tableau', from: 3, index: 0, to: 4 }),
  )
  assert.ok(
    !isLegal(s, { type: 'tableau-to-tableau', from: 1, index: 0, to: 4 }),
  )
})

test('moving a run flips the newly exposed card', () => {
  const s = newGame('flip')
  s.tableau = emptyTableau()
  s.tableau[0] = [
    { id: 20, up: false },
    { id: 1 * 13 + 4, up: true }, // 5 of hearts
    { id: 0 * 13 + 3, up: true }, // 4 of spades
  ]
  s.tableau[1] = [{ id: 0 * 13 + 5, up: true }] // 6 of spades
  const n = applyMove(s, {
    type: 'tableau-to-tableau',
    from: 0,
    index: 1,
    to: 1,
  }) as SolitaireState
  assert.equal(n.tableau[1].length, 3)
  assert.equal(n.tableau[0].length, 1)
  assert.ok(n.tableau[0][0].up)
})

test('foundations build A..K per suit and can return to the tableau', () => {
  const s = newGame('found')
  s.tableau = emptyTableau()
  s.stock = []
  s.waste = [13] // ace of hearts
  assert.ok(isLegal(s, { type: 'waste-to-foundation' }))
  const n = applyMove(s, { type: 'waste-to-foundation' }) as SolitaireState
  assert.equal(n.foundations[1].length, 1)
  n.waste = [13 + 2] // 3 of hearts, out of order
  assert.ok(!isLegal(n, { type: 'waste-to-foundation' }))
  n.tableau[0] = [{ id: 2 * 13 + 1, up: true }] // 2 of diamonds
  assert.ok(!isLegal(n, { type: 'foundation-to-tableau', suit: 1, to: 0 }))
  n.tableau[0] = [{ id: 0 * 13 + 1, up: true }] // 2 of spades
  assert.ok(isLegal(n, { type: 'foundation-to-tableau', suit: 1, to: 0 }))
})

test('win and auto-complete detection', () => {
  const s = newGame('win')
  s.stock = []
  s.waste = []
  s.tableau = emptyTableau()
  for (let suit = 0; suit < 4; suit++) {
    s.tableau[suit] = Array.from({ length: 13 }, (_, i) => ({
      id: suit * 13 + (12 - i),
      up: true,
    }))
  }
  assert.ok(canAutoComplete(s))
  assert.ok(!isWon(s))
  let cur: SolitaireState = s
  for (let guard = 0; guard < 60 && !isWon(cur); guard++) {
    const m = nextAutoCompleteMove(cur)
    assert.ok(m, 'auto-complete must always have a next move here')
    cur = applyMove(cur, m as NonNullable<typeof m>) as SolitaireState
  }
  assert.ok(isWon(cur))
  assert.ok(!canAutoComplete(cur))
  assert.ok(!canAutoComplete(newGame('no-auto')))
})

test('undo restores the exact previous state, repeatedly', () => {
  const g = startGame('undo', 3)
  const initial = JSON.stringify(g.state)
  assert.ok(!undo(g))
  const seen = [initial]
  for (let i = 0; i < 6; i++) {
    const moves = legalMoves(g.state)
    assert.ok(play(g, moves[moves.length - 1]))
    seen.push(JSON.stringify(g.state))
  }
  while (g.history.length) {
    seen.pop()
    undo(g)
    assert.equal(JSON.stringify(g.state), seen[seen.length - 1])
  }
  assert.equal(JSON.stringify(g.state), initial)
})

test('cloneState is deep', () => {
  const a = newGame('clone')
  const b = cloneState(a)
  b.tableau[0][0].up = !b.tableau[0][0].up
  b.stock.pop()
  assert.notDeepEqual(a, b)
})

test('solvability sampler: 200 seeds, draw-1, bounded search', () => {
  let solved = 0
  const seeds = 200
  for (let i = 0; i < seeds; i++) {
    if (solveWithin(newGame(`sample-${i}`, 1), 6000)) solved++
  }
  const rate = solved / seeds
  console.log(
    `  solved ${solved}/${seeds} (${(rate * 100).toFixed(1)}%) within budget`,
  )
  // A collapse to ~0 means move generation or application broke.
  assert.ok(rate >= 0.2, `solvability sample too low: ${rate}`)
})

console.log(`\n${passed} solitaire engine checks passed`)
