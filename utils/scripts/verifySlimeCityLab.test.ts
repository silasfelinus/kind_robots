// Slime City comparison lab contract (conductor slime-city t-001, t-002):
// square-grid topology, fog of war, AP, mana and card timing, simultaneous
// combat, flag drops, lane flow, BLOODRUSH ticks, seeded command replay, a
// CPU that plays every card type from its redacted view, and no hidden-info
// leaks. Store timer behaviour lives in verifySlimeCityStore.test.ts.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  advance,
  ALTERNATING_INITIATIVE,
  cardById,
  cardReady,
  CARDS,
  cpuTurn,
  createMatch,
  deploy,
  deployAs,
  DISTRICTS,
  FIELD_CAP,
  legalNeighbor,
  LOG_LIMIT,
  MODE_GUIDES,
  MODES,
  move,
  moveAs,
  neighbors,
  normalizeSeed,
  observe,
  replayMatch,
  reveal,
  ROUND_LIMITS,
  RUSH_COOLDOWN,
  RUSH_MANA_EVERY,
  RUSH_MOVE_EVERY,
  TEAMS,
  TRAP_CAP,
  type Fighter,
  type MatchState,
  type ModeId,
  type Side,
} from '../slimeCity/prototypes'
import { chooseCpuAction } from '../slimeCity/cpu'
import { playHeadless } from '../slimeCity/playtest'

const classicBlackout = (
  team: Parameters<typeof createMatch>[1],
  foe: Parameters<typeof createMatch>[2],
  seed: number,
) => createMatch('blackout', team, foe, seed, { classicFog: true })

function fighter(
  over: Partial<Fighter> & Pick<Fighter, 'id' | 'side' | 'x' | 'y'>,
): Fighter {
  return {
    cardId: over.side === 'player' ? 'rat' : 'sprite',
    hp: 2,
    maxHp: 2,
    attack: 1,
    armor: 0,
    ap: 1,
    maxAp: 1,
    hidden: false,
    carryingFlag: false,
    ...over,
  }
}

/** Stop the CPU from moving or playing so a fixture resolves only its rules. */
function freezeEnemy(state: MatchState): MatchState {
  for (const u of state.units)
    if (u.side === 'enemy') {
      u.ap = 0
      u.maxAp = 0
    }
  state.cooldowns.enemy = Object.fromEntries(CARDS.map((c) => [c.id, 999]))
  return state
}

function unitOf(state: MatchState, id: number): Fighter {
  const found = state.units.find((u) => u.id === id)
  assert.ok(found, 'unit ' + id + ' exists')
  return found
}

// --- Data: six crews, five colours, sixty cards (ten per crew deck; the
// deck rules themselves are in verifySlimeCityCrews), seven districts
assert.equal(TEAMS.length, 6)
assert.equal(new Set(TEAMS.map((team) => team.id)).size, 6)
assert.equal(new Set(TEAMS.map((team) => team.color)).size, 5)
assert.ok(
  TEAMS.some((team) => team.id === 'catgirls' && team.hook.includes('genetic')),
)
assert.ok(
  TEAMS.some(
    (team) => team.id === 'bloodfairies' && team.name.includes('BLOODFAIRIES'),
  ),
)
assert.ok(
  TEAMS.some((team) => team.id === 'ironjaw' && team.name.includes('OGRES')),
)
assert.equal(CARDS.length, 108)
assert.equal(DISTRICTS.length, 7)
assert.equal(MODES.length, 3)
assert.deepEqual(
  MODES.map((mode) => mode.size),
  ['10 × 6', '12 × 6', '14 × 6'],
)
for (const team of TEAMS) {
  assert.equal(team.creatures.length, 4)
  assert.equal(team.special.length, 6)
  for (const id of [...team.creatures, ...team.special]) {
    const card = CARDS.find((item) => item.id === id)
    assert.ok(card, team.id + ' missing ' + id)
    assert.equal(card.team, team.id)
  }
  assert.ok(team.special.some((id) => cardById(id).kind === 'trap'))
  assert.ok(team.special.some((id) => cardById(id).kind !== 'trap'))
}

// --- Square topology: exactly the orthogonal neighbours, never diagonals
assert.equal(legalNeighbor({ x: 1, y: 1 }, { x: 2, y: 1 }), true)
assert.equal(legalNeighbor({ x: 1, y: 1 }, { x: 2, y: 2 }), false)
for (const [w, h] of [
  [8, 8],
  [12, 6],
  [14, 6],
] as const) {
  const board = { width: w, height: h }
  assert.equal(neighbors(board, 0, 0).length, 2, 'corner')
  assert.equal(neighbors(board, 3, 0).length, 3, 'edge')
  assert.equal(neighbors(board, 3, 3).length, 4, 'interior')
  for (let x = 0; x < w; x++)
    for (let y = 0; y < h; y++)
      for (const n of neighbors(board, x, y))
        assert.equal(Math.abs(n.x - x) + Math.abs(n.y - y), 1)
}
// The superseded pentagon design must not survive in this game's code.
for (const file of [
  'utils/slimeCity/prototypes.ts',
  'utils/slimeCity/cpu.ts',
  'stores/slimeCity.ts',
  'pages/admin/slime-city.vue',
]) {
  const src = readFileSync(new URL('../../' + file, import.meta.url), 'utf8')
  assert.doesNotMatch(src, /pentagon|facing|72-degree|twist/i, file)
}

// --- Seeds: chosen per match, normalised, and they change the setup
assert.equal(normalizeSeed(undefined), 4817)
assert.equal(normalizeSeed(-12.7), 12)
assert.equal(normalizeSeed(Number.NaN), 4817)
const seedA = classicBlackout('catgirls', 'bloodfairies', 11)
const seedB = classicBlackout('catgirls', 'bloodfairies', 12)
assert.equal(seedA.seed, 11)
assert.deepEqual(
  classicBlackout('catgirls', 'bloodfairies', 11),
  seedA,
  'Same seed, same setup',
)
const layouts = new Set(
  [1, 2, 3, 4, 5, 6, 7, 8].map((seed) =>
    JSON.stringify(
      classicBlackout('catgirls', 'bloodfairies', seed).units.map((u) => [
        u.x,
        u.y,
      ]),
    ),
  ),
)
assert.ok(layouts.size > 4, 'Hidden armies are placed by seed')
assert.notDeepEqual(seedA.units, seedB.units)

// --- BLACKOUT setup: two concealed armies, flag in the centre four squares
const fog = classicBlackout('catgirls', 'bloodfairies', 4817)
assert.equal(fog.width, 8)
assert.equal(fog.height, 8)
assert.equal(fog.units.length, 10)
assert.equal(fog.units.filter((unit) => unit.hidden).length, 10)
assert.ok(fog.units.every((u) => (u.side === 'player' ? u.x <= 1 : u.x >= 6)))
assert.ok([3, 4].includes(fog.flag.x) && [3, 4].includes(fog.flag.y))
assert.equal(fog.mana, 1)
assert.equal(fog.enemyMana, 1)

// Movement: one orthogonal empty square per AP, reveals, never mutates input
const runner = fog.units.find((u) => u.side === 'player' && u.maxAp === 2)!
const free = neighbors(fog, runner.x, runner.y).filter(
  (c) => !fog.units.some((u) => u.x === c.x && u.y === c.y),
)
assert.ok(free.length > 0)
assert.equal(
  move(fog, runner.id, runner.x + 2, runner.y),
  fog,
  'No double-square teleports',
)
assert.equal(
  move(fog, runner.id, runner.x + 1, runner.y + 1),
  fog,
  'No diagonal moves',
)
const blocker = fog.units.find(
  (u) => u.id !== runner.id && legalNeighbor(u, runner),
)
if (blocker)
  assert.equal(
    move(fog, runner.id, blocker.x, blocker.y),
    fog,
    'Occupied squares block movement',
  )
const step1 = move(fog, runner.id, free[0]!.x, free[0]!.y)
assert.notEqual(step1, fog)
const moved = step1.units.find((u) => u.id === runner.id)!
assert.equal(moved.hidden, false, 'Moving reveals')
assert.equal(moved.ap, 1, 'Moving spends AP')
assert.equal(fog.units.find((u) => u.id === runner.id)!.hidden, true)
const spent = (() => {
  let s = step1
  for (const c of neighbors(s, moved.x, moved.y)) {
    const next = move(s, runner.id, c.x, c.y)
    if (next !== s) {
      s = next
      break
    }
  }
  return s
})()
const tired = spent.units.find((u) => u.id === runner.id)!
assert.equal(tired.ap, 0)
for (const c of neighbors(spent, tired.x, tired.y))
  assert.equal(
    move(spent, runner.id, c.x, c.y),
    spent,
    'No move without AP left',
  )
const apFix = classicBlackout('catgirls', 'exchange', 4817)
apFix.units = [
  fighter({ id: 1, side: 'player', x: 0, y: 0, ap: 0, maxAp: 2, hp: 9 }),
  fighter({ id: 2, side: 'enemy', x: 7, y: 7, ap: 0, maxAp: 0, hp: 9 }),
]
assert.equal(
  advance(apFix).units.find((u) => u.id === 1)!.ap,
  2,
  'AP refills each round',
)
assert.equal(
  reveal(fog, runner.id).units.find((u) => u.id === runner.id)!.hidden,
  false,
)
const foeUnit = fog.units.find((u) => u.side === 'enemy')!
assert.equal(
  move(fog, foeUnit.id, foeUnit.x - 1, foeUnit.y),
  fog,
  'The human cannot move enemy fighters',
)

// --- Card timing, mana and targeting
assert.equal(deploy(fog, 'sprite', 0, 0), fog, 'Cannot deploy enemy faction')
assert.equal(deploy(fog, 'mau', 0, 0), fog, 'Cannot overspend mana')
const openHome = [0, 1, 2, 3, 4, 5, 6, 7].find(
  (y) => !fog.units.some((u) => u.x === 0 && u.y === y),
)!
assert.equal(deploy(fog, 'lynx', 5, 2), fog, 'Cannot deploy in enemy zone')
const recruited = deploy(fog, 'lynx', 0, openHome)
assert.equal(recruited.units.length, 11)
assert.equal(recruited.mana, 0)
assert.equal(
  recruited.units.at(-1)!.hidden,
  true,
  'BLACKOUT reinforcements arrive face-down',
)
assert.equal(advance(fog).mana, 2)
const twice = classicBlackout('catgirls', 'bloodfairies', 4817)
twice.mana = 5
const once = deploy(twice, 'lynx', 0, openHome)
assert.equal(cardReady(once, 'player', 'lynx'), false)
const again = [0, 1, 2, 3, 4, 5, 6, 7].find(
  (y) => !once.units.some((u) => u.x === 0 && u.y === y),
)!
assert.equal(deploy(once, 'lynx', 0, again), once, 'Each card once per round')
assert.equal(cardReady(advance(once), 'player', 'lynx'), true)

const gr = createMatch('gridiron', 'catgirls', 'ironjaw', 4817)
const rr = createMatch('bloodrush', 'catgirls', 'ironjaw', 4817)
assert.deepEqual([gr.width, gr.height, rr.width, rr.height], [12, 6, 14, 6])
const startLane = gr.units.find((u) => u.side === 'player')!.y
const otherLane = (startLane + 1) % 6
assert.equal(deploy(gr, 'lynx', 2, otherLane), gr, 'Only home edge deploys')
assert.equal(deploy(gr, 'lynx', 0, startLane), gr, 'Occupied home tile')
const placed = deploy(gr, 'lynx', 0, otherLane)
assert.equal(placed.mana, 0)
assert.equal(placed.units.filter((unit) => unit.side === 'player').length, 2)
assert.equal(
  move(gr, gr.units[0]!.id, 1, startLane),
  gr,
  'Lane mode is auto-run, not manual move',
)
assert.equal(advance(gr).round, 2)
assert.equal(advance(gr).mana, 2)
// MEATBALL round 2 is the CPU's initiative: it has already spent from 2.
assert.ok(advance(gr).enemyMana < 2)
assert.ok(advance(fog).log.includes('The CPU has the initiative this round.'))

const spellState = createMatch('gridiron', 'catgirls', 'bloodfairies', 4817)
spellState.mana = 2
const enemyUnit = spellState.units.find((unit) => unit.side === 'enemy')!
const own = spellState.units.find((unit) => unit.side === 'player')!
assert.equal(
  deploy(spellState, 'pounce', enemyUnit.x, enemyUnit.y),
  spellState,
  'Friendly boost cannot target opponents',
)
assert.equal(
  deploy(spellState, 'reknit', own.x, own.y),
  spellState,
  'Healing a full-HP fighter is refused',
)
own.hp = 1
const healed = deploy(spellState, 'reknit', own.x, own.y)
assert.equal(
  healed.units.find((u) => u.id === own.id)!.hp,
  own.maxHp,
  'Healing caps at max HP',
)

// Equipment is permanent, a boost spell lasts one round
const kit = classicBlackout('bloodfairies', 'riot', 4817)
kit.mana = 10
const kitUnit = kit.units.find((u) => u.side === 'player')!
const spurred = deploy(kit, 'spurs', kitUnit.x, kitUnit.y)
const spurredUnit = spurred.units.find((u) => u.id === kitUnit.id)!
assert.equal(spurredUnit.maxAp, kitUnit.maxAp + 1)
assert.equal(
  advance(spurred).units.find((u) => u.id === kitUnit.id)?.ap ??
    kitUnit.maxAp + 1,
  kitUnit.maxAp + 1,
)
const cats = classicBlackout('catgirls', 'riot', 4817)
cats.mana = 10
const cat = cats.units.find((u) => u.side === 'player')!
const boosted = deploy(cats, 'pounce', cat.x, cat.y)
assert.equal(boosted.units.find((u) => u.id === cat.id)!.ap, cat.ap + 2)

// Traps: empty legal squares, one armed per side, triggered on entry
const trapState = classicBlackout('catgirls', 'bloodfairies', 4817)
trapState.mana = 3
const trap = deploy(trapState, 'scentmine', 3, 2)
assert.equal(trap.traps.length, 1)
assert.equal(trap.mana, 2)
assert.equal(TRAP_CAP, 1)
const rearm = { ...trap, mana: 5, cooldowns: { player: {}, enemy: {} } }
assert.equal(deploy(rearm, 'scentmine', 3, 5), rearm, 'One armed trap per side')
assert.equal(
  deploy(trapState, 'scentmine', 7, 2),
  trapState,
  'No traps in the enemy deploy zone',
)

// --- Simultaneous combat: attack minus armor, double knockouts legal
const duel = classicBlackout('riot', 'bloodfairies', 4817)
duel.round = 5
duel.units = [
  fighter({ id: 90, side: 'player', x: 3, y: 2, hp: 1, attack: 2 }),
  fighter({ id: 91, side: 'enemy', x: 4, y: 2, hp: 1, attack: 2, ap: 0 }),
]
duel.mana = 0
duel.enemyMana = 0
const resolved = advance(duel)
assert.equal(resolved.units.length, 0, 'Mutual knockout')
assert.equal(resolved.victor, 'draw')
assert.equal(resolved.winPath, 'rout')
const armored = classicBlackout('riot', 'ironjaw', 4817)
armored.units = [
  fighter({ id: 1, side: 'player', x: 0, y: 0, hp: 5, maxHp: 5, attack: 3 }),
  fighter({
    id: 2,
    side: 'enemy',
    x: 1,
    y: 0,
    hp: 9,
    maxHp: 9,
    armor: 2,
    ap: 0,
  }),
  fighter({ id: 3, side: 'enemy', x: 7, y: 7, hp: 9, maxHp: 9, ap: 0 }),
]
armored.enemyMana = 0
armored.mana = 0
// Ironjaw now carries a heal: rest the CPU's cards so only blows resolve.
freezeEnemy(armored)
const clash = advance(armored)
assert.equal(clash.units.find((u) => u.id === 2)!.hp, 8, '3 attack - 2 armor')
assert.equal(clash.units.find((u) => u.id === 1)!.hp, 4, '1 attack - 0 armor')
// Hidden fighters fight back, and fighting reveals both sides
const ambush = classicBlackout('riot', 'ironjaw', 4817)
ambush.units = [
  fighter({ id: 1, side: 'player', x: 3, y: 3, hidden: true, hp: 4 }),
  fighter({ id: 2, side: 'enemy', x: 4, y: 3, hidden: true, hp: 4, ap: 0 }),
]
ambush.enemyMana = 0
const sprung = advance(ambush)
assert.ok(sprung.units.every((u) => !u.hidden))
assert.ok(sprung.units.every((u) => u.hp === 3))

// --- Flag: pickup at end of round, carriers lumber, death drops it in place
const flagGame = classicBlackout('catgirls', 'riot', 4817)
flagGame.flag = { x: 3, y: 3 }
flagGame.units = [
  fighter({ id: 1, side: 'player', x: 2, y: 3, ap: 2, maxAp: 2, hp: 3 }),
  fighter({ id: 2, side: 'enemy', x: 7, y: 7, hp: 3 }),
]
freezeEnemy(flagGame)
const stepped = move(flagGame, 1, 3, 3)
assert.equal(
  unitOf(stepped, 1).carryingFlag,
  false,
  'Pickup waits for the end of the round',
)
const grabbed = advance(stepped)
assert.equal(unitOf(grabbed, 1).carryingFlag, true)
assert.equal(grabbed.stats.flagPickups, 1)
assert.equal(unitOf(grabbed, 1).ap, 1, 'Carriers walk one square per round')
const walked = move(grabbed, 1, 2, 3)
assert.deepEqual(walked.flag, { x: 2, y: 3 }, 'The flag follows its carrier')
assert.equal(move(walked, 1, 1, 3), walked, 'Carrier AP is spent')
const dropGame = classicBlackout('catgirls', 'riot', 4817)
dropGame.flag = { x: 5, y: 2 }
dropGame.units = [
  fighter({ id: 1, side: 'player', x: 5, y: 2, hp: 1, carryingFlag: true }),
  fighter({ id: 2, side: 'enemy', x: 6, y: 2, hp: 4, attack: 3 }),
  fighter({ id: 3, side: 'player', x: 0, y: 7, hp: 4 }),
  fighter({ id: 4, side: 'enemy', x: 7, y: 6, hp: 4 }),
]
freezeEnemy(dropGame)
dropGame.mana = 0
const dropped = advance(dropGame)
assert.ok(!dropped.units.some((u) => u.id === 1), 'Carrier fell')
assert.equal(dropped.stats.flagDrops, 1)
assert.ok(
  (dropped.flag.x === 5 && dropped.flag.y === 2) ||
    dropped.units.some(
      (u) => u.carryingFlag && u.side === 'enemy' && u.id === 2,
    ),
  'The flag drops where the carrier fell, not at the centre',
)
assert.notDeepEqual(dropped.flag, { x: 4, y: 4 })
// Stepping on a dropped flag picks it up for whoever arrives
const loose = classicBlackout('catgirls', 'riot', 4817)
loose.flag = { x: 5, y: 2 }
loose.units = [
  fighter({ id: 1, side: 'player', x: 5, y: 3, ap: 1 }),
  fighter({ id: 2, side: 'enemy', x: 7, y: 7 }),
]
freezeEnemy(loose)
const regrab = advance(move(loose, 1, 5, 2))
assert.equal(unitOf(regrab, 1).carryingFlag, true)
// Carrying the flag to your back column wins at once, not one square short
const home = classicBlackout('catgirls', 'riot', 4817)
home.flag = { x: 2, y: 2 }
home.units = [
  fighter({ id: 1, side: 'player', x: 2, y: 2, carryingFlag: true, ap: 2 }),
  fighter({ id: 2, side: 'enemy', x: 7, y: 7 }),
]
const short = move(home, 1, 1, 2)
assert.equal(short.victor, null, 'Column 2 is not home')
const won = move(short, 1, 0, 2)
assert.equal(won.victor, 'player')
assert.equal(won.winPath, 'flag')

// --- Round limit: BLACKOUT can no longer stall forever
const stall = classicBlackout('riot', 'ironjaw', 4817)
stall.units = [
  fighter({ id: 1, side: 'player', x: 0, y: 0, hp: 5, maxHp: 5 }),
  fighter({ id: 2, side: 'enemy', x: 7, y: 7, hp: 3, maxHp: 3 }),
]
// Freeze the CPU: no AP and every card resting, so nothing can happen.
stall.units[1]!.maxAp = 0
stall.units[1]!.ap = 0
const resting = Object.fromEntries(CARDS.map((c) => [c.id, 999]))
stall.cooldowns = { player: { ...resting }, enemy: { ...resting } }
let frozen = stall
for (let i = 0; i < 40 && !frozen.victor; i++) frozen = advance(frozen)
assert.equal(frozen.round, ROUND_LIMITS.blackout)
assert.equal(frozen.victor, 'player', 'More HP left wins on the clock')
assert.equal(frozen.winPath, 'time')
for (const mode of MODES) assert.ok(ROUND_LIMITS[mode.id] > 0)

// --- Lanes: front-to-back flow, teammates sidestep instead of piling up
const jam = createMatch('gridiron', 'ironjaw', 'exchange', 4817)
// Round 2: the CPU's initiative turn is spent, so nothing interrupts.
jam.round = 2
jam.mana = 0
jam.enemyMana = 0
jam.units = [
  fighter({ id: 1, side: 'player', x: 5, y: 2, hp: 9, maxHp: 9 }),
  fighter({ id: 2, side: 'player', x: 4, y: 2, hp: 9, maxHp: 9 }),
  fighter({ id: 3, side: 'player', x: 3, y: 2, hp: 9, maxHp: 9 }),
  fighter({ id: 9, side: 'enemy', x: 6, y: 2, hp: 30, maxHp: 30, attack: 0 }),
]
const flowed = advance(jam)
const at = (s: MatchState, id: number) => s.units.find((u) => u.id === id)!
assert.notDeepEqual(
  [at(flowed, 2).x, at(flowed, 2).y],
  [4, 2],
  'Blocked runner moves (sidestep or juke) rather than queueing',
)
assert.ok(flowed.stats.sidesteps >= 1)
const queue = createMatch('gridiron', 'ironjaw', 'exchange', 4817)
queue.round = 2
queue.mana = 0
queue.enemyMana = 0
queue.units = [
  fighter({ id: 1, side: 'player', x: 3, y: 0 }),
  fighter({ id: 2, side: 'player', x: 2, y: 0 }),
  fighter({ id: 3, side: 'player', x: 1, y: 0 }),
  fighter({ id: 9, side: 'enemy', x: 11, y: 5, attack: 0 }),
]
const rolled = advance(queue)
assert.deepEqual(
  [1, 2, 3].map((id) => at(rolled, id).x),
  [4, 3, 2],
  'A queue advances together, front first',
)
assert.equal(rolled.stats.clogs, 0)
// Sprinters (3+ AP) cover two squares; scoring removes the runner
const sprint = createMatch('gridiron', 'bloodfairies', 'exchange', 4817)
sprint.round = 2
sprint.mana = 0
sprint.enemyMana = 0
sprint.units = [
  fighter({ id: 1, side: 'player', x: 2, y: 0, ap: 3, maxAp: 3 }),
  fighter({ id: 9, side: 'enemy', x: 11, y: 5, attack: 0 }),
]
assert.equal(at(advance(sprint), 1).x, 4)
const score: MatchState = createMatch('gridiron', 'catgirls', 'bloodfairies')
score.score = [2, 0]
score.round = 2
score.mana = 0
score.enemyMana = 0
score.units = [
  fighter({ id: 50, side: 'player', x: score.width - 2, y: 0, hp: 3 }),
]
assert.equal(advance(score).score[0], 3)
assert.equal(advance(score).victor, 'player')
assert.equal(advance(score).winPath, 'score')
// Initiative alternates in the turn formats so neither side always acts first
assert.equal(ALTERNATING_INITIATIVE.gridiron, true)
assert.equal(ALTERNATING_INITIATIVE.blackout, true)
assert.equal(ALTERNATING_INITIATIVE.bloodrush, false)

// --- BLOODRUSH: fixed ticks, banked mana, beat movement, card rest
const rush = createMatch('bloodrush', 'catgirls', 'ironjaw', 4817)
assert.equal(rush.mana, 3)
let rushed = rush
const manaTrace: number[] = []
for (let i = 0; i < 6; i++) {
  rushed = advance({ ...rushed, enemyMana: 0 })
  manaTrace.push(rushed.mana)
}
assert.deepEqual(
  manaTrace,
  [4, 4, 5, 5, 6, 6],
  '+1 mana every ' + RUSH_MANA_EVERY + ' ticks, banked',
)
const beat = createMatch('bloodrush', 'catgirls', 'ironjaw', 4817)
beat.enemyMana = 0
beat.units = [fighter({ id: 1, side: 'player', x: 3, y: 0, hp: 3 })]
const tick1 = advance(beat)
const tick2 = advance({ ...tick1, enemyMana: 0 })
assert.equal(RUSH_MOVE_EVERY, 2)
assert.equal(at(tick1, 1).x, 3, 'Odd tick: no step')
assert.equal(at(tick2, 1).x, 4, 'Beat tick: step')
const rest = createMatch('bloodrush', 'catgirls', 'ironjaw', 4817)
const restOpen = [0, 1, 2, 3, 4, 5].find(
  (y) => !rest.units.some((u) => u.x === 0 && u.y === y),
)!
const rested = deploy(rest, 'lynx', 0, restOpen)
let wait = rested
for (let i = 0; i < RUSH_COOLDOWN; i++) {
  assert.equal(cardReady(wait, 'player', 'lynx'), false)
  wait = advance(wait)
}
assert.equal(cardReady(wait, 'player', 'lynx'), true, 'Card rests 4 ticks')

// Between-tick deploys: commands interleaved with ticks replay exactly
let live = createMatch('bloodrush', 'riot', 'undertow', 777)
const lanes = [0, 1, 2, 3, 4, 5]
for (let t = 0; t < 40 && !live.victor; t++) {
  if (t % 3 === 0) {
    const y = lanes.find((l) => !live.units.some((u) => u.x === 0 && u.y === l))
    if (y !== undefined) live = deploy(live, 'rat', 0, y)
  }
  live = advance(live)
}
assert.deepEqual(
  replayMatch(
    { mode: 'bloodrush', teamId: 'riot', foeId: 'undertow', seed: 777 },
    live.commands,
  ),
  live,
  'BLOODRUSH replays from its command record',
)

// --- Log and replay record
const long = playHeadless('blackout', 'exchange', 'undertow', 31).state
assert.ok(long.log.length > 5 && long.log.length <= LOG_LIMIT)
const ends = long.commands.filter((c) => c.t === 'end').length
// A match can end inside a round (flag run) before that round's END.
assert.ok(ends === long.round || ends === long.round - 1)

// --- CPU: competent in every format, plays all card types, respects rules
const kinds: Record<ModeId, Record<string, number>> = {
  blackout: {},
  gridiron: {},
  bloodrush: {},
}
for (const mode of MODES) {
  const decided = { player: 0, enemy: 0, draw: 0 }
  for (const team of TEAMS) {
    for (const seed of [3, 9]) {
      const foe = TEAMS[(TEAMS.indexOf(team) + 1 + seed) % 6]!.id
      const { state, metrics } = playHeadless(mode.id, team.id, foe, seed)
      assert.ok(state.victor, mode.id + ' ends')
      assert.ok(state.round <= ROUND_LIMITS[mode.id])
      decided[state.victor!]++
      for (const kind of ['creature', 'spell', 'trap', 'equipment'] as const)
        kinds[mode.id][kind] =
          (kinds[mode.id][kind] || 0) + metrics.plays.enemy[kind]
      assert.ok(state.mana >= 0 && state.enemyMana >= 0)
      for (const side of ['player', 'enemy'] as Side[])
        assert.ok(
          state.units.filter((u) => u.side === side).length <=
            FIELD_CAP[mode.id],
        )
      assert.deepEqual(
        replayMatch(
          { mode: mode.id, teamId: team.id, foeId: foe, seed },
          state.commands,
        ),
        state,
        mode.id + '/' + team.id + ' replay drift',
      )
      assert.equal(
        new Set(state.units.map((unit) => unit.x + ':' + unit.y)).size,
        state.units.length,
        'No two fighters share a square',
      )
    }
  }
  assert.ok(decided.player > 0 && decided.enemy > 0, mode.id + ' both win')
  for (const kind of ['creature', 'spell', 'trap', 'equipment'])
    assert.ok(kinds[mode.id][kind]! > 0, mode.id + ' CPU plays ' + kind)
}
// The CPU pursues the win paths: flag runs in BLACKOUT, breakthroughs in lanes
const paths: Record<string, number> = {}
for (const seed of [1, 2, 3, 4, 5, 6]) {
  for (const mode of ['blackout', 'gridiron', 'bloodrush'] as ModeId[]) {
    const { state } = playHeadless(mode, 'riot', 'exchange', seed)
    const key = mode + ':' + state.winPath
    paths[key] = (paths[key] || 0) + 1
    // Breakthroughs happen even in matches the clock decides.
    if (state.score[0] + state.score[1] > 0)
      paths[mode + ':scored'] = (paths[mode + ':scored'] || 0) + 1
  }
}
assert.ok(paths['blackout:flag']! > 0, 'CPU wins BLACKOUT by flag runs')
assert.ok(paths['gridiron:scored']! > 0, 'CPU scores in MEATBALL')
assert.ok(paths['bloodrush:scored']! > 0, 'CPU scores in BLOODRUSH')

// The CPU's BLACKOUT moves never exceed AP (Undertow and Meat Exchange have
// no AP cards), whichever side it plays; advance() runs the same chooser.
for (const seed of [5, 6, 7, 8]) {
  let s = classicBlackout('undertow', 'exchange', seed)
  for (let r = 0; r < 8 && !s.victor; r++) {
    for (const side of ['enemy', 'player'] as Side[]) {
      const before = new Map(
        s.units.filter((u) => u.side === side).map((u) => [u.id, u]),
      )
      const after = cpuTurn(s, side)
      for (const u of after.units.filter((x) => x.side === side)) {
        const was = before.get(u.id)
        if (!was) continue
        const spentAp = was.ap - u.ap
        assert.ok(
          Math.abs(u.x - was.x) + Math.abs(u.y - was.y) <= spentAp,
          'CPU moved within AP',
        )
        assert.ok(u.ap >= 0)
      }
    }
    s = advance(cpuTurn(s, 'player'))
  }
}
// cpuTurn plays the human side by the same rules
const auto = cpuTurn(createMatch('gridiron', 'riot', 'ironjaw', 5))
assert.ok(auto.commands.some((c) => c.t === 'deploy' && c.side === 'player'))
assert.ok(auto.mana >= 0)

// --- Hidden information never reaches the CPU or the human's board
const secret = classicBlackout('catgirls', 'bloodfairies', 99)
secret.mana = 3
const withTrap = deploy(secret, 'scentmine', 4, 6)
const enemyView = observe(withTrap, 'enemy')
assert.equal(enemyView.traps.length, 0, 'CPU cannot see the player trap')
for (const u of enemyView.units.filter((x) => x.side === 'player')) {
  assert.equal(u.known, false)
  assert.equal(u.cardId, null)
  assert.equal(u.hp, null)
  assert.equal(u.attack, null)
}
assert.notEqual(enemyView.salt, withTrap.seed)
const playerView = observe(withTrap, 'player')
assert.equal(playerView.traps.length, 1)
for (const u of playerView.units.filter((x) => x.side === 'enemy'))
  assert.equal(u.cardId, null, 'The board cannot draw a concealed enemy')
// Perturb every hidden player identity and the trap: the CPU's view, and so
// its decisions, are byte-identical.
const twin = structuredClone(withTrap)
for (const u of twin.units)
  if (u.side === 'player' && u.hidden) {
    u.cardId = 'chimera'
    u.hp = 99
    u.maxHp = 99
    u.attack = 9
    u.armor = 5
  }
twin.traps = [{ x: 3, y: 1, side: 'player', damage: 2 }]
assert.deepEqual(observe(twin, 'enemy'), enemyView)
assert.deepEqual(
  chooseCpuAction(observe(twin, 'enemy')),
  chooseCpuAction(enemyView),
)
// Enemy secrets are not narrated in the shared log
const enemySecret = classicBlackout('catgirls', 'ironjaw', 99)
enemySecret.enemyMana = 9
const eOpen = [0, 1, 2, 3, 4, 5, 6, 7].find(
  (y) => !enemySecret.units.some((u) => u.x === 7 && u.y === y),
)!
const hiddenDrop = deployAs(enemySecret, 'enemy', 'bulldozer', 7, eOpen)
assert.notEqual(hiddenDrop, enemySecret)
assert.doesNotMatch(hiddenDrop.log[0]!, /Bulld-Ogre/)
const hiddenTrap = deployAs(enemySecret, 'enemy', 'shocktrap', 3, 3)
assert.notEqual(hiddenTrap, enemySecret)
assert.doesNotMatch(hiddenTrap.log[0]!, /3|4|Shock Plate/)
// A trap refused over an enemy trap would reveal it: placing one is allowed.
const stacked = { ...hiddenTrap, mana: 5 }
assert.notEqual(
  deploy(stacked, 'scentmine', 3, 3),
  stacked,
  'Your trap may share a square with an unseen enemy trap',
)
// Enemy moves in BLACKOUT trigger the player's hidden trap
const tripped = classicBlackout('catgirls', 'ironjaw', 99)
tripped.traps = [{ x: 5, y: 3, side: 'player', damage: 2 }]
tripped.units = [
  fighter({ id: 1, side: 'player', x: 0, y: 0, hp: 5 }),
  fighter({ id: 2, side: 'enemy', x: 6, y: 3, hp: 5, maxHp: 5 }),
]
const trippedAfter = moveAs(tripped, 'enemy', 2, 5, 3)
assert.equal(trippedAfter.units.find((u) => u.id === 2)!.hp, 3)
assert.equal(trippedAfter.traps.length, 0)

// --- First-time tester guidance exists for every format
for (const mode of MODES) {
  const guide = MODE_GUIDES[mode.id]
  assert.ok(guide.goal.length > 20)
  assert.ok(guide.steps.length >= 4)
  assert.ok(guide.limits.some((line) => /prototype/i.test(line)))
  assert.ok(guide.limits.some((line) => /Nothing is saved/.test(line)))
}
const page = readFileSync(
  new URL('../../pages/admin/slime-city.vue', import.meta.url),
  'utf8',
)
assert.match(page, /data-testid="slime-guide"/)
assert.match(page, /lab\.guide\.steps/)
assert.match(page, /lab\.guide\.limits/)
assert.match(page, /lab\.sight/, 'Board renders the redacted view')
// Silas 2026-11-01: the hand is a real card hand along the bottom of the
// arena (workspace-hand style), and the painted board shows through the grid.
assert.match(page, /<SlimeCityHand \/>\s*<div class="sc-battle-bottom">/)
assert.doesNotMatch(page, /class="sc-hand-card"/, 'No sidebar card list')
assert.match(page, /class="sc-board-floor"/)
const handUi = readFileSync(
  new URL('../../components/slime-city-hand.vue', import.meta.url),
  'utf8',
)
assert.match(handUi, /name="sch-deal"/, 'Cards deal in and fly out')
assert.match(handUi, /is-flipping/, 'Selection flips with sparkles')
assert.match(handUi, /prefers-reduced-motion/)
assert.match(
  page,
  /<header-page-bar[^>]*>[\s\S]*class="sc-tabs"[\s\S]*<\/header-page-bar>/,
  'Slime City title, view tabs and HUD live in the shell header page bar',
)
assert.doesNotMatch(
  page,
  /<header class="sc-header"/,
  'Slime City must not render a second persistent header',
)
const shellHeader = readFileSync(
  new URL('../../components/navigation/workspace-header.vue', import.meta.url),
  'utf8',
)
assert.match(shellHeader, /id="kr-header-page-bar"/)
assert.match(
  page,
  /<header-page-bar console-theme="slime-city">/,
  'Slime City skins the shell as its console system bar',
)
const shellCss = readFileSync(
  new URL('../../assets/css/tailwind.css', import.meta.url),
  'utf8',
)
assert.match(shellCss, /name: 'slime-city';/)

console.log(
  'Slime City: square topology, fog, AP, cards, combat, flag drops, lane flow, BLOODRUSH ticks, CPU, replays and hidden-info contract PASS',
)
