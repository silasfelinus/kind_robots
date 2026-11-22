import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'
import * as sourceEngine from '../chessweeper/seededEngine'
import * as chessSource from '../chessweeper/chessEngine'

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

const chessText = readFileSync(
  fileURLToPath(
    new URL('../../public/chessweeper/chess-engine.js', import.meta.url),
  ),
  'utf8',
)
const chessWindow: Record<string, unknown> = {}
runInNewContext(chessText, { window: chessWindow })
const chessBrowser = chessWindow.ChessweeperChess as typeof chessSource
assert.ok(chessBrowser, 'browser chess rules are extracted and loadable')
const move = (position: chessSource.ChessPosition, uci: string) => {
  const found = chessSource
    .legalMoves(position)
    .find((candidate) => chessSource.moveKey(candidate) === uci)
  assert.ok(found, 'legal move must exist: ' + uci)
  return chessSource.makePosition(position, found)
}
let chess = chessSource.initialPosition()
assert.equal(
  chessSource.legalMoves(chess).length,
  20,
  'opening has twenty moves',
)
for (const uci of ['f2f3', 'e7e5', 'g2g4', 'd8h4']) {
  chess = move(chess, uci)
}
assert.equal(chessSource.inCheck(chess), true, 'Fools Mate is check')
assert.equal(chessSource.legalMoves(chess).length, 0, 'Fools Mate is mate')
assert.equal(chessBrowser.inCheck(chess), true)
assert.equal(chessBrowser.legalMoves(chess).length, 0)

const empty = () => ({
  ...chessSource.initialPosition(),
  b: Array<string>(128).fill('.'),
  c: 0,
  ep: -1,
})
const square = chessSource.squareIdx
const castle = empty()
castle.t = 1
castle.c = 3
castle.b[square('e1')] = 'K'
castle.b[square('h1')] = 'R'
castle.b[square('a1')] = 'R'
castle.b[square('e8')] = 'k'
const castleMoves = chessSource.legalMoves(castle)
assert.ok(castleMoves.some((m) => m[3] === 'castle' && m[1] === square('g1')))
assert.ok(castleMoves.some((m) => m[3] === 'castle' && m[1] === square('c1')))
const castled = move(castle, 'e1g1')
assert.equal(castled.b[square('f1')], 'R', 'castling relocates rook')
assert.equal(castled.b[square('h1')], '.', 'castling vacates rook')
assert.equal(castled.c & 3, 0, 'castling consumes white rights')
const attackedCastle = { ...castle, b: castle.b.slice() }
attackedCastle.b[square('f8')] = 'r'
assert.ok(
  !chessSource
    .legalMoves(attackedCastle)
    .some((m) => m[3] === 'castle' && m[1] === square('g1')),
  'castling cannot cross an attacked transit square',
)

const enPassant = empty()
enPassant.t = -1
enPassant.b[square('e1')] = 'K'
enPassant.b[square('e8')] = 'k'
enPassant.b[square('e5')] = 'P'
enPassant.b[square('d7')] = 'p'
const pushed = move(enPassant, 'd7d5')
const ephemeral = chessSource
  .legalMoves(pushed)
  .find((m) => chessSource.moveKey(m) === 'e5d6')
assert.equal(ephemeral?.[3], 'ep', 'en passant is legal after double push')
assert.ok(ephemeral)
const captured = chessSource.makePosition(pushed, ephemeral)
assert.equal(captured.b[square('d5')], '.', 'en passant removes skipped pawn')
assert.equal(captured.b[square('d6')], 'P')
assert.equal(captured.ep, -1, 'en passant right expires after moving')

const promotion = empty()
promotion.t = 1
promotion.b[square('e1')] = 'K'
promotion.b[square('h8')] = 'k'
promotion.b[square('a7')] = 'P'
const promotions = chessSource
  .legalMoves(promotion)
  .filter((m) => m[0] === square('a7') && m[1] === square('a8'))
assert.equal(promotions.length, 4, 'pawn promotion has four legal choices')
assert.deepEqual(promotions.map((m) => m[2]).sort(), ['b', 'n', 'q', 'r'])
assert.equal(move(promotion, 'a7a8n').b[square('a8')], 'N')

const stalemate = empty()
stalemate.t = -1
stalemate.b[square('a8')] = 'k'
stalemate.b[square('c6')] = 'K'
stalemate.b[square('b6')] = 'Q'
assert.equal(chessSource.inCheck(stalemate), false)
assert.equal(chessSource.legalMoves(stalemate).length, 0)
const loneKings = empty()
loneKings.b[square('e1')] = 'K'
loneKings.b[square('e8')] = 'k'
assert.equal(chessSource.drawByMaterial(loneKings), true)
assert.equal(chessSource.drawByMaterial(chess), false)

for (const position of [castle, pushed, promotion, stalemate, chess]) {
  assert.equal(
    JSON.stringify(chessSource.legalMoves(position)),
    JSON.stringify(chessBrowser.legalMoves(position)),
    'canonical TypeScript and browser chess rules must agree',
  )
  assert.equal(chessSource.inCheck(position), chessBrowser.inCheck(position))
  assert.equal(
    chessSource.repetitionKey(position),
    chessBrowser.repetitionKey(position),
  )
}
assert.ok(
  page.includes('src="/chessweeper/chess-engine.js"'),
  'chess engine loads before the playable inline game',
)
assert.ok(page.includes('const chess = window.ChessweeperChess'))
assert.ok(!page.includes('function pseudoMoves(s)'))

console.log('chessweeper seeded mine/disc engine: ok')
