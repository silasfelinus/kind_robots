// TURF (Silas, 2026-11-03): "a new version of this game, modeled after go.
// each turn you play a single token, but go rules apply." Captures, suicide,
// ko, one token a turn, every card's TURF effect, area scoring and replay.
import assert from 'node:assert/strict'
import {
  advance,
  cardById,
  CARDS,
  createMatch,
  deploy,
  deployAs,
  observe,
  replayMatch,
  turfTerritory,
  turfText,
  TURF_KOMI,
  TURF_SWARM_WORTH,
  TURF_TRAP_CAP,
  type Fighter,
  type MatchState,
  type Side,
} from '../slimeCity/prototypes'
import { playHeadless } from '../slimeCity/playtest'

let nextId = 500
function stone(side: Side, x: number, y: number, extra: Partial<Fighter> = {}) {
  return {
    id: nextId++,
    cardId: side === 'player' ? 'rat' : 'lynx',
    side,
    x,
    y,
    hp: 3,
    maxHp: 3,
    attack: 1,
    armor: 0,
    ap: 1,
    maxAp: 1,
    hidden: false,
    carryingFlag: false,
    keywords: [],
    ...extra,
  } satisfies Fighter
}

/** An ironjaw-vs-catgirls TURF board with a chosen hand and stones. */
function board(units: Fighter[], hand: string[], enemyHand: string[] = []) {
  const state = createMatch('turf', 'ironjaw', 'catgirls', 4242)
  state.units = units
  state.hands = { player: [...hand], enemy: [...enemyHand] }
  state.piles = { player: [], enemy: [] }
  state.discards = { player: [], enemy: [] }
  state.mana = 10
  state.enemyMana = 10
  state.nextId = 900
  return state
}
// Ironjaw's Chrome Scrapper is a plain stone; mercenaries serve the enemy.
const plain = 'scrapper'
const enemyPlain = 'merc-bus-driver'
const ambusher = 'lynx'
const at = (s: MatchState, x: number, y: number) =>
  s.units.find((u) => u.x === x && u.y === y)

// --- Setup: 9 × 9, a dealt hand, no bases, flags or monster.
const fresh = createMatch('turf', 'riot', 'catgirls', 7)
assert.deepEqual([fresh.width, fresh.height], [9, 9])
assert.equal(fresh.hands.player.length, 5)
assert.equal(fresh.units.length, 0)
assert.equal(observe(fresh, 'player').dealt, true)
assert.equal(
  createMatch('turf', 'riot', 'catgirls', 7, { monster: true }).monster,
  null,
)

// --- One token a turn, anywhere empty.
const one = board([], [plain, 'welder'])
const placed = deploy(one, plain, 4, 4)
assert.notEqual(placed, one)
assert.equal(at(placed, 4, 4)?.side, 'player')
assert.equal(
  deploy(placed, placed.hands.player[0]!, 5, 5),
  placed,
  'A second token in the same turn is refused',
)
assert.equal(
  deploy(board([stone('enemy', 4, 4)], [plain]), plain, 4, 4).units.length,
  1,
)

// --- Capture: filling the last liberty takes the stone (a prisoner).
const corner = board([stone('enemy', 0, 0), stone('player', 1, 0)], [plain])
const took = deploy(corner, plain, 0, 1)
assert.equal(at(took, 0, 0), undefined, 'Surrounded stone is captured')
assert.equal(took.prisoners.player, 1)
// A group is captured together.
const pair = board(
  [
    stone('enemy', 0, 0),
    stone('enemy', 1, 0),
    stone('player', 2, 0),
    stone('player', 0, 1),
  ],
  [plain],
)
const both = deploy(pair, plain, 1, 1)
assert.equal(both.units.filter((u) => u.side === 'enemy').length, 0)
assert.equal(both.prisoners.player, 2)

// --- Suicide is illegal, unless the move captures.
const eye = board([stone('enemy', 1, 0), stone('enemy', 0, 1)], [plain])
assert.equal(deploy(eye, plain, 0, 0), eye, 'No filling your own last liberty')
const snap = board(
  [
    stone('enemy', 1, 0),
    stone('enemy', 0, 1),
    stone('player', 2, 0),
    stone('player', 1, 1),
  ],
  [plain],
)
assert.notEqual(
  deploy(snap, plain, 0, 0),
  snap,
  'Suicide that captures is legal',
)

// --- Ko: the position you just left cannot be repeated at once.
//   . X O .        X = player, O = enemy
//   X O . O
//   . X O .
const koBoard = board(
  [
    stone('player', 1, 0),
    stone('enemy', 2, 0),
    stone('player', 0, 1),
    stone('enemy', 1, 1),
    stone('enemy', 3, 1),
    stone('player', 1, 2),
    stone('enemy', 2, 2),
  ],
  [plain],
  [enemyPlain],
)
const koTake = deploy(koBoard, plain, 2, 1)
assert.equal(at(koTake, 1, 1), undefined, 'Player takes the ko')
const retake = deployAs(
  { ...koTake, playedThisRound: { player: [], enemy: [] } },
  'enemy',
  koTake.hands.enemy[0]!,
  1,
  1,
)
assert.equal(at(retake, 1, 1), undefined, 'Immediate ko retake is refused')
// AMBUSH may retake a ko at once.
const ambushRetake = deployAs(
  {
    ...koTake,
    hands: { ...koTake.hands, enemy: [ambusher] },
    playedThisRound: { player: [], enemy: [] },
  },
  'enemy',
  ambusher,
  1,
  1,
)
assert.equal(at(ambushRetake, 1, 1)?.side, 'enemy', 'AMBUSH ignores ko')

// --- TURF effects: every card is a token with a Go-native effect.
for (const card of CARDS) assert.ok(turfText(card).length > 10, card.id)
// Attack spells slime one enemy liberty, never the last one.
const zap = cardById('slap')
const slimeBoard = board(
  [stone('enemy', 0, 0), stone('player', 1, 0)],
  [zap.id],
)
// Beside no enemy, the spell fizzles but still lands as a stone.
const fizzle = deploy(slimeBoard, zap.id, 3, 3)
assert.equal(fizzle.puddles.length, 0)
assert.equal(at(fizzle, 3, 3)?.cardId, zap.id)
// Beside a two-liberty group: the slime fills one and leaves it in atari.
const atari = board(
  [stone('enemy', 0, 0), stone('player', 1, 0), stone('enemy', 1, 1)],
  [zap.id],
)
const slimed = deploy(atari, zap.id, 2, 1)
assert.ok(slimed.puddles.length >= 1, 'Slime fills a liberty')
assert.ok(
  slimed.puddles.every((p) => p.until >= slimed.round),
  'Slime lasts at least this round',
)
// Slime dries up over the rounds.
let dried = slimed
for (let i = 0; i < 4 && !dried.victor; i++)
  dried = advance({
    ...dried,
    enemyMana: 10,
    hands: { ...dried.hands, enemy: [enemyPlain] },
  })
assert.equal(dried.puddles.length, 0, 'Slime dries up')
// Weaker slime (Silas, 2026-11-03): it never fills a group's last liberty,
// so slime threatens and a stone has to make the capture.
const lastGasp = board(
  [stone('enemy', 4, 4), stone('player', 3, 4), stone('player', 5, 4)],
  [zap.id],
)
const gasped = deploy(lastGasp, zap.id, 4, 3)
assert.ok(at(gasped, 4, 4), 'Slime cannot capture')
assert.equal(gasped.puddles.length, 0, 'The last liberty stays open')
const blaster = CARDS.find((c) => c.effect === 'blast')!
assert.ok(!turfText(blaster).includes('two liberties'), 'Blast slimes one')
// Wards (Silas, 2026-11-03: "Stronger wards and traps"): a warded group
// cannot be captured, and its liberties are closed to enemy stones.
const ward = CARDS.find((c) => c.effect === 'heal')!
const guarded = board(
  [stone('enemy', 0, 0, { wardedUntil: 99 }), stone('player', 1, 0)],
  [plain],
)
assert.equal(
  deploy(guarded, plain, 0, 1),
  guarded,
  'A warded group’s liberties are a no-go zone',
)
assert.ok(at(deploy(guarded, plain, 4, 4), 4, 4), 'Elsewhere is still open')
// A ward card lands as a stone and wards its own group for three turns.
const wardCard = CARDS.find(
  (c) => c.kind === 'equipment' && c.effect === 'armor' && c.team === 'ironjaw',
)!
const fenced = deploy(
  board([stone('player', 3, 3)], [wardCard.id]),
  wardCard.id,
  3,
  4,
)
assert.notEqual(fenced.units.length, 1, 'The ward lands as a stone')
assert.ok(
  fenced.units.every((u) => (u.wardedUntil ?? 0) >= fenced.round + 2),
  'The whole group is warded for three turns',
)
assert.ok(turfText(wardCard).includes('cannot be played on its liberties'))
// SNARE may land in a no-go zone to strip the ward.
const snarer = CARDS.find(
  (c) =>
    c.kind === 'creature' &&
    c.team === 'mercenary' &&
    (c.keywords ?? []).includes('snare'),
)
if (snarer) {
  const stripped = deploy(
    board(
      [stone('enemy', 0, 0, { wardedUntil: 99 }), stone('player', 1, 0)],
      [snarer.id],
    ),
    snarer.id,
    0,
    1,
  )
  assert.equal(at(stripped, 0, 0), undefined, 'SNARE strips the ward')
}
const piercer = CARDS.find(
  (c) =>
    c.kind === 'creature' &&
    c.team === 'mercenary' &&
    (c.keywords ?? []).includes('pierce'),
)!
const pierced = board(
  [stone('enemy', 0, 0, { wardedUntil: 99 }), stone('player', 1, 0)],
  [piercer.id],
)
assert.equal(
  at(deploy(pierced, piercer.id, 0, 1), 0, 0),
  undefined,
  'PIERCE breaks wards',
)
assert.ok(turfText(ward).includes('ward'))
// REGEN survives its first capture; VOLATILE explodes when captured.
const regen = board(
  [stone('enemy', 0, 0, { keywords: ['regen'] }), stone('player', 1, 0)],
  [plain],
)
const clung = deploy(regen, plain, 0, 1)
assert.ok(at(clung, 0, 0)?.revived, 'REGEN clings on once')
const bomb = board(
  [stone('enemy', 0, 0, { keywords: ['volatile'] }), stone('player', 1, 0)],
  [plain],
)
const blown = deploy(bomb, plain, 0, 1)
assert.equal(at(blown, 0, 0), undefined)
assert.equal(
  at(blown, 0, 1),
  undefined,
  'VOLATILE takes the stone that captured it',
)
assert.ok(at(blown, 1, 0), 'but not the rest of the surround')
assert.equal(blown.prisoners.enemy, 1)
// Traps (Silas, 2026-11-03: "Stronger wards and traps") land as a concealed
// stone wired with a tripwire: the first enemy stone beside it is captured.
const trapCard = CARDS.find((c) => c.kind === 'trap' && c.team === 'ironjaw')!
const rigged = deploy(board([], [trapCard.id]), trapCard.id, 4, 4)
assert.equal(rigged.traps.length, 1)
assert.equal(at(rigged, 4, 4)?.side, 'player', 'A trap lands as a stone')
assert.equal(
  observe(rigged, 'enemy').traps.length,
  0,
  'The enemy never sees the wire',
)
const seen = observe(rigged, 'enemy').units.find((u) => u.x === 4 && u.y === 4)!
assert.equal(seen.known, false, 'and sees only a concealed stone')
assert.equal(seen.cardId, null)
const tripped = deployAs(
  { ...rigged, hands: { ...rigged.hands, enemy: [enemyPlain] } },
  'enemy',
  enemyPlain,
  4,
  5,
)
assert.equal(at(tripped, 4, 5), undefined, 'A stone beside the trap is caught')
assert.equal(tripped.prisoners.player, 1)
assert.equal(tripped.traps.length, 0, 'The wire is spent')
assert.ok(at(tripped, 4, 4), 'but the trap stone stays')
const clear = deployAs(
  { ...rigged, hands: { ...rigged.hands, enemy: [enemyPlain] } },
  'enemy',
  enemyPlain,
  5,
  5,
)
assert.ok(at(clear, 5, 5), 'A diagonal is safe')
// A trap stone captured with its group, from out of the wire's reach,
// takes the wire with it.
const doomed = board(
  [stone('player', 0, 1), stone('enemy', 1, 0), stone('enemy', 1, 1)],
  [trapCard.id],
  [enemyPlain],
)
const cornered = deploy(doomed, trapCard.id, 0, 0)
assert.equal(cornered.traps.length, 1)
const swept = deployAs(cornered, 'enemy', enemyPlain, 0, 2)
assert.equal(at(swept, 0, 0), undefined, 'The trap stone is captured')
assert.equal(swept.prisoners.enemy, 2)
assert.equal(swept.traps.length, 0, 'and its wire goes with it')
// Up to three tripwires may be armed at once in TURF.
let wired = board([], [trapCard.id])
for (const [x, y] of [
  [1, 1],
  [4, 4],
  [7, 7],
  [1, 7],
]) {
  wired.hands.player = [trapCard.id]
  wired.playedThisRound.player = []
  wired = deploy(wired, trapCard.id, x!, y!)
}
assert.equal(wired.traps.length, TURF_TRAP_CAP, 'TURF arms three tripwires')
assert.equal(wired.units.length, TURF_TRAP_CAP, 'and no fourth trap stone')
assert.ok(turfText(trapCard).includes('beside it'))
assert.ok(turfText(trapCard).includes('concealed stone'))
// A ward washes the slime off its group's liberties.
const washer = board([stone('player', 3, 3)], [wardCard.id])
washer.puddles = [{ x: 2, y: 3, until: 99 }]
const washed = deploy(washer, wardCard.id, 3, 4)
assert.equal(washed.puddles.length, 0, 'A ward washes its slime away')

// --- Area scoring with komi; two passes end the game.
const scored = board(
  [stone('player', 1, 0), stone('player', 0, 1), stone('enemy', 8, 8)],
  [],
)
const { score, owner } = turfTerritory(scored)
assert.equal(owner['0:0'], 'player', 'A point only you surround is yours')
assert.equal(score.player, 3)
assert.equal(score.enemy, 1 + TURF_KOMI)
// SWARM counts one and a half.
const swarmed = board(
  [stone('player', 4, 4, { keywords: ['swarm'] }), stone('enemy', 8, 8)],
  [],
)
assert.equal(turfTerritory(swarmed).score.player, TURF_SWARM_WORTH)
assert.equal(TURF_SWARM_WORTH, 1.5)
const passed = advance({ ...scored, enemyMana: 0 })
assert.equal(passed.victor, 'enemy')
assert.equal(passed.winPath, 'territory')

// --- Whole CPU games end, replay exactly, and capture stones.
let captures = 0
for (const [i, seed] of [3, 19, 77].entries()) {
  const teams = ['riot', 'undertow', 'exchange'] as const
  const { state } = playHeadless('turf', teams[i]!, 'catgirls', seed)
  assert.ok(state.victor && state.winPath === 'territory')
  assert.equal(
    new Set(state.units.map((u) => u.x + ':' + u.y)).size,
    state.units.length,
  )
  assert.deepEqual(
    replayMatch(
      { mode: 'turf', teamId: teams[i]!, foeId: 'catgirls', seed },
      state.commands,
    ),
    state,
  )
  captures += state.prisoners.player + state.prisoners.enemy
}
assert.ok(captures > 0, 'CPU games include captures')
assert.ok(cardById(plain))

console.log(
  'Slime City TURF: one token a turn, captures, suicide, ko, slime, wards, traps, keywords, area score, CPU replays PASS',
)
