// Memory Dungeon Minefield Archives (conductor memory-dungeon t-016;
// projects/memory-dungeon/COMBAT-PATTERNS.md): seeded 8x8 and 10x10 danger
// floors that a deduction solver clears from the opening reveal without one
// forced guess, truthful clues, recoverable missteps, exact one-cell disarms,
// and screen-reader text that never leaks what a hidden cell holds.
import assert from 'node:assert/strict'
import {
  coordinate,
  createMinefield,
  describeCell,
  disarm,
  neighbours,
  provenCells,
  solveWithoutGuessing,
  step,
  toggleFlag,
  type Cell,
  type MinefieldState,
  type Tile,
} from '../memoryDungeon/minefield'

import {
  advanceMinefieldRun,
  createMinefieldRun,
  minefieldRewardKey,
  playMinefieldRun,
  restoreMinefieldRun,
} from '../memoryDungeon/minefieldRun'

const idx = (s: MinefieldState, c: Cell) => c.row * s.cols + c.col
const cellAt = (s: MinefieldState, i: number): Cell => ({
  row: Math.floor(i / s.cols),
  col: i % s.cols,
})

// 1. Generation: every floor is guess-free, truthful and opens on real information.
const FLOORS = [
  { rows: 8, cols: 8, hazards: 10 },
  { rows: 10, cols: 10, hazards: 16 },
]
const SEEDS = 80
const started = Date.now()
for (const floor of FLOORS) {
  let rounds = 0
  let rejected = 0
  for (let seed = 1; seed <= SEEDS; seed++) {
    const s = createMinefield({ seed, ...floor })
    const name = `${floor.rows}x${floor.cols} seed ${seed}`
    assert.equal(s.tiles.filter((t) => t.hazard).length, floor.hazards, name)
    s.tiles.forEach((t, i) =>
      assert.equal(
        t.clue,
        neighbours(s.rows, s.cols, i).filter((n) => s.tiles[n]!.hazard).length,
        `${name}: clue at ${coordinate(cellAt(s, i))} is truthful`,
      ),
    )
    const entrance = idx(s, s.entrance)
    assert.ok(
      !s.tiles[entrance]!.hazard && s.tiles[entrance]!.clue === 0,
      `${name}: the entrance opens a clearing`,
    )
    assert.ok(!s.tiles[idx(s, s.exit)]!.hazard, `${name}: the far door is safe`)
    assert.ok(
      s.tiles.filter((t) => t.revealed).length > 1,
      `${name}: the opening reveal shows more than one cell`,
    )
    const result = solveWithoutGuessing(s)
    assert.ok(result.solved, `${name}: solvable without a forced guess`)
    rounds += result.rounds
    if (s.seed !== seed * 1009) rejected++
  }
  assert.ok(
    rejected > 0,
    `${floor.rows}x${floor.cols}: some random draws needed a guess and were redrawn`,
  )
  assert.ok(
    rounds / SEEDS > 2,
    `${floor.rows}x${floor.cols}: floors take several rounds of deduction, not one sweep`,
  )
}
assert.deepEqual(
  createMinefield({ seed: 7, rows: 8, cols: 8, hazards: 10 }),
  createMinefield({ seed: 7, rows: 8, cols: 8, hazards: 10 }),
  'same seed, same floor',
)
assert.ok(
  Date.now() - started < 60_000,
  'generation stays fast enough for a page load',
)

// 2. The checker rejects a forced guess: on a 2x2 with one hazard, one revealed
// "1" cannot say which of the other three cells holds it.
const tile = (hazard: boolean, clue: number, revealed = false): Tile => ({
  hazard,
  clue,
  revealed,
  flagged: false,
  sprung: false,
  disarmed: false,
})
const coinFlip: MinefieldState = {
  version: 1,
  seed: 0,
  rows: 2,
  cols: 2,
  hazards: 1,
  tiles: [tile(false, 1, true), tile(false, 1), tile(false, 1), tile(true, 0)],
  entrance: { row: 0, col: 0 },
  exit: { row: 1, col: 0 },
  hearts: 3,
  disarms: 0,
  log: [],
  outcome: 'exploring',
}
const verdict = solveWithoutGuessing(coinFlip)
assert.equal(
  verdict.solved,
  false,
  'a three-way guess is not counted as solvable',
)
assert.equal(verdict.safeLeft, 2)

// 3. Play: a careful player who sees only the screen (provenCells reads clues
// of revealed cells, never a hidden one) steps on proven-safe cells, never
// springs a hazard, and reaches the far door on every floor.
for (const floor of FLOORS)
  for (let seed = 1; seed <= 30; seed++) {
    let s = createMinefield({ seed, ...floor })
    let flagged = 0
    for (let guard = 0; s.outcome === 'exploring' && guard < 400; guard++) {
      const proof = provenCells(s)
      for (const h of proof.hazards) {
        assert.ok(
          s.tiles[idx(s, h)]!.hazard,
          `seed ${seed}: a proven hazard is a hazard`,
        )
        if (!s.tiles[idx(s, h)]!.flagged) {
          s = toggleFlag(s, h)
          flagged++
        }
      }
      const next = proof.safe.find((c) => !s.tiles[idx(s, c)]!.revealed)
      assert.ok(
        next,
        `${floor.rows}x${floor.cols} seed ${seed}: the screen always proves a next safe step`,
      )
      assert.ok(
        !s.tiles[idx(s, next)]!.hazard,
        `seed ${seed}: a proven safe cell is safe`,
      )
      s = step(s, next)
    }
    assert.equal(
      s.outcome,
      'escaped',
      `${floor.rows}x${floor.cols} seed ${seed}: the far door opens`,
    )
    assert.equal(s.hearts, 3, 'without spending a heart')
    assert.ok(
      flagged > 0,
      'and the route needed hazards worked out along the way',
    )
  }

// 4. Missteps cost a heart, stay visible and leave the floor solvable.
{
  let s = createMinefield({ seed: 3, rows: 8, cols: 8, hazards: 10 })
  const hazards = s.tiles.flatMap((t, i) => (t.hazard ? [cellAt(s, i)] : []))
  s = step(s, hazards[0]!)
  assert.equal(s.hearts, 2)
  assert.ok(s.tiles[idx(s, hazards[0]!)]!.sprung)
  assert.deepEqual(s.log.at(-1), {
    type: 'sprung',
    cell: hazards[0],
    hearts: 2,
  })
  assert.ok(
    solveWithoutGuessing(s).solved,
    'a sprung hazard only adds information',
  )
  assert.equal(
    step(s, hazards[0]!),
    s,
    'a sprung hazard cannot be stepped on twice',
  )
  s = step(step(s, hazards[1]!), hazards[2]!)
  assert.equal(s.outcome, 'defeated', 'three missteps end the floor')
  assert.equal(step(s, s.exit), s, 'and nothing moves after defeat')
}

// 5. Flags are notes, disarms are exact and cost a charge either way.
{
  let s = createMinefield({
    seed: 5,
    rows: 8,
    cols: 8,
    hazards: 10,
    disarms: 2,
  })
  const hazard = cellAt(
    s,
    s.tiles.findIndex((t) => t.hazard),
  )
  const safe = cellAt(
    s,
    s.tiles.findIndex((t) => !t.hazard && !t.revealed),
  )
  s = toggleFlag(s, hazard)
  assert.ok(s.tiles[idx(s, hazard)]!.flagged)
  assert.equal(
    step(s, hazard),
    s,
    'a flagged cell is not stepped on by accident',
  )
  s = disarm(s, hazard)
  assert.ok(
    s.tiles[idx(s, hazard)]!.disarmed && !s.tiles[idx(s, hazard)]!.flagged,
  )
  assert.equal(s.disarms, 1)
  const clueNear = neighbours(s.rows, s.cols, idx(s, hazard))[0]!
  assert.equal(
    s.tiles[clueNear]!.clue,
    neighbours(s.rows, s.cols, clueNear).filter((n) => s.tiles[n]!.hazard)
      .length,
    'clues keep counting a disarmed hazard, so earlier deductions stay true',
  )
  s = disarm(s, safe)
  assert.equal(s.disarms, 0, 'disarming a safe cell spends the charge')
  assert.ok(s.tiles[idx(s, safe)]!.revealed, 'and reveals it')
  const other = cellAt(
    s,
    s.tiles.findIndex((t) => t.hazard && !t.disarmed),
  )
  assert.equal(disarm(s, other), s, 'no charges, no disarm')
  assert.ok(solveWithoutGuessing(s).solved)
}

// 6. Screen-reader text comes from visible state only.
{
  const s = createMinefield({ seed: 9, rows: 8, cols: 8, hazards: 10 })
  const hiddenHazard = cellAt(
    s,
    s.tiles.findIndex((t) => t.hazard),
  )
  const hiddenSafe = cellAt(
    s,
    s.tiles.findIndex((t) => !t.hazard && !t.revealed),
  )
  const strip = (text: string) => text.replace(/^[A-Z]\d+: /, '')
  assert.equal(
    strip(describeCell(s, hiddenHazard)),
    strip(describeCell(s, hiddenSafe)),
    'hidden cells read the same',
  )
  assert.equal(describeCell(s, { row: 0, col: 0 }), 'A1: clear, nothing nearby')
  assert.match(describeCell(s, s.exit), /H8: hidden, the far door/)
  const flagged = toggleFlag(s, hiddenSafe)
  assert.match(describeCell(flagged, hiddenSafe), /hidden, flagged/)
  assert.equal(coordinate({ row: 9, col: 9 }), 'J10')
}

// 7. Replays: same seed and actions, same floor state; JSON round trip.
{
  const run = () => {
    let s = createMinefield({ seed: 11, rows: 10, cols: 10, hazards: 16 })
    s = toggleFlag(s, { row: 5, col: 5 })
    s = step(s, { row: 4, col: 6 })
    s = disarm(s, { row: 7, col: 2 })
    return s
  }
  assert.deepEqual(run(), run())
  assert.deepEqual(JSON.parse(JSON.stringify(run())), run())
}

console.log(
  `Memory Dungeon Minefield: ${SEEDS * FLOORS.length} guess-free floors on 8x8 and 10x10,`,
  'forced guesses rejected, missteps recoverable, exact disarms, leak-free screen-reader text',
)

// 5. In-game archive: 8x8 and 10x10 stage saves store moves, not hidden hazards.
for (const size of [8, 10] as const) {
  const run = createMinefieldRun(1307 + size, size)
  const floor = playMinefieldRun(run)
  assert.equal(floor.rows, size)
  assert.equal(floor.cols, size)
  assert.ok(solveWithoutGuessing(floor).solved)
  const safe = provenCells(floor).safe[0]
  assert.ok(safe, `${size}x${size} offers an initially provable move`)
  const advanced = advanceMinefieldRun(run, { action: 'step', ...safe! })
  assert.equal(advanced.moves.length, 1)
  const restored = restoreMinefieldRun(JSON.parse(JSON.stringify(advanced)))
  assert.deepEqual(restored, advanced)
  assert.deepEqual(playMinefieldRun(restored!), playMinefieldRun(advanced))
  assert.equal(minefieldRewardKey(size), `2,7:archive-${size}`)
}
assert.equal(restoreMinefieldRun({ version: 1, seed: 1, size: 8, moves: [{ action: 'step', row: 7, col: 8 }] }), null)
assert.equal(restoreMinefieldRun({ version: 1, seed: 1, size: 8, moves: [{ action: 'step', row: 0, col: 0, hazard: true }] })?.moves[0]?.action, 'step')
assert.equal(restoreMinefieldRun({ version: 1, seed: 1, size: 10, moves: [{ action: 'teleport', row: 2, col: 2 }] }), null)
const bogusMoves = Array.from({ length: 601 }, () => ({ action: 'flag', row: 1, col: 1 }))
assert.equal(restoreMinefieldRun({ version: 1, seed: 1, size: 8, moves: bogusMoves }), null)
const archiveComponent = readFileSync('components/memory-dungeon/minefield-stage.vue', 'utf8')
const overworldComponent = readFileSync('components/pages/memory-dungeon-overworld.vue', 'utf8')
assert.match(archiveComponent, /data-testid="memory-minefield-stage"/)
assert.match(archiveComponent, /@keydown="handleKey/)
assert.match(archiveComponent, /aria-label="Minefield tools"/)
assert.match(overworldComponent, /world\.openMinefield\(8\)/)
assert.match(overworldComponent, /world\.openMinefield\(10\)/)
