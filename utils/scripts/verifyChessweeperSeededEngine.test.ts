import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'
import * as sourceEngine from '../chessweeper/seededEngine'

const source = readFileSync(
  fileURLToPath(
    new URL('../../public/chessweeper/seeded-engine.js', import.meta.url),
  ),
  'utf8',
)
const sandbox: Record<string, unknown> = {}
runInNewContext(source, sandbox)
type Roll = { state: number; value: number }
type Engine = {
  nextRandom: (state: number) => Roll
  nextInt: (state: number, max: number) => Roll
  minefield: (
    count: number,
    seed: number,
  ) => { mines: Set<number>; state: number }
  firstProbeSafe: (
    probe: number,
    mines: Set<number>,
    shown: Set<number>,
    state: number,
  ) => { mines: Set<number>; state: number; moved: boolean }
  stepDisc: (disc: {
    id: number
    x: number
    y: number
    dx: number
    dy: number
    active: boolean
  }) => { x: number; y: number; dx: number; dy: number }
}
const engine = sandbox.ChessweeperSeeded as Engine
assert.ok(engine, 'the compiled TypeScript engine exposes a browser namespace')
for (const seed of [0, 1, 42, 123456789, 0xffffffff]) {
  const sourceField = sourceEngine.minefield(10, seed)
  const first = engine.minefield(10, seed)
  assert.deepEqual(
    [...first.mines],
    [...sourceField.mines],
    'browser runtime must match canonical typed implementation',
  )
  assert.equal(first.state, sourceField.state)
  assert.deepEqual(
    engine.nextRandom(seed).value,
    sourceEngine.nextRandom(seed).value,
  )
  const again = engine.minefield(10, seed)
  assert.deepEqual([...first.mines], [...again.mines])
  assert.equal(first.state, again.state)
  assert.equal(first.mines.size, 10)
  for (const square of first.mines) {
    const x = square & 7
    const y = square >> 4
    assert.ok(x >= 0 && x < 8 && y >= 2 && y <= 5)
  }
  const sourceMine = [...first.mines][0]!
  const original = new Set(first.mines)
  const relocated = engine.firstProbeSafe(
    sourceMine,
    original,
    new Set(),
    first.state,
  )
  assert.equal(relocated.moved, true)
  assert.equal(relocated.mines.size, 10)
  assert.ok(!relocated.mines.has(sourceMine))
  assert.ok(original.has(sourceMine), 'the pure engine cannot mutate inputs')
  const replay = engine.firstProbeSafe(
    sourceMine,
    original,
    new Set(),
    first.state,
  )
  assert.deepEqual([...relocated.mines], [...replay.mines])
  assert.equal(relocated.state, replay.state)
}
assert.notDeepEqual(
  [...engine.minefield(10, 7).mines],
  [...engine.minefield(10, 8).mines],
)
assert.equal(engine.minefield(0, 9).mines.size, 0)
assert.equal(engine.minefield(32, 9).mines.size, 32)
assert.throws(() => engine.minefield(33, 2), /middle four ranks/)
assert.throws(() => engine.nextInt(23, 0), /positive integer/)
const firstRoll = engine.nextInt(71, 500)
const resumedRoll = engine.nextInt(firstRoll.state, 500)
assert.deepEqual(resumedRoll, engine.nextInt(firstRoll.state, 500))
assert.notEqual(resumedRoll.state, firstRoll.state)

const disc = { id: 1, x: 7, y: 7, dx: 1, dy: 1, active: true }
const reflected = engine.stepDisc(disc)
assert.deepEqual(
  [reflected.x, reflected.y, reflected.dx, reflected.dy],
  [6, 6, -1, -1],
)
assert.equal(disc.x, 7, 'original disc is not mutated')
const page = readFileSync(
  fileURLToPath(
    new URL('../../public/chessweeper/index.html', import.meta.url),
  ),
  'utf8',
)
assert.ok(page.includes('src="/chessweeper/seeded-engine.js"'))
assert.ok(page.includes('rngState: seedBeforeGame'))
assert.ok(page.includes('seeded.minefield(config.mines, runSeed)'))
assert.ok(page.includes('seeded.firstProbeSafe('))
assert.ok(page.includes('const stepDisc = seeded.stepDisc'))
assert.ok(!page.includes('Math.random()'), 'bot ties must be seed-driven')
console.log('chessweeper seeded mine/disc engine: ok')
