import assert from 'node:assert/strict'
import { chooseCpuAction } from '../slimeCity/cpu'
import { playHeadless } from '../slimeCity/playtest'
import {
  cardById,
  createMatch,
  observe,
  type MatchView,
  type ViewFighter,
} from '../slimeCity/prototypes'

const makeFighter = (
  id: number,
  side: ViewFighter['side'],
  x: number,
  y: number,
  options: Partial<ViewFighter> = {},
): ViewFighter => ({
  id,
  side,
  x,
  y,
  known: true,
  hidden: false,
  cardId: side === 'player' ? 'eel' : 'rat',
  hp: 3,
  maxHp: 3,
  attack: 2,
  armor: 0,
  ap: 2,
  maxAp: 2,
  keywords: [],
  ambushReady: false,
  carryingFlag: false,
  range: 1,
  attackStyle: 'sword',
  summonedRound: 0,
  attackedRound: 0,
  rooted: false,
  stance: 'attack',
  ...options,
})

const base = (): MatchView => {
  const view = observe(
    createMatch('blackout', 'undertow', 'riot', 199),
    'player',
  )
  view.mana = 6
  view.hand = [cardById('tripwire')]
  view.trapCap = 2
  return view
}
// Arena CPU (Silas, 2026-11-02): no manual moves or attacks, only cards and
// battle orders. Traps go in the path of a raider closing on our base.
const ownBase = (view: MatchView) =>
  view.side === 'player' ? 0 : view.width - 1
const nearing = base()
nearing.units = [makeFighter(7, 'enemy', 4, 2)]
const trap = chooseCpuAction(nearing)
assert.ok(trap && trap.t === 'deploy' && trap.card === 'tripwire')
if (trap?.t === 'deploy') {
  assert.equal(trap.y, 2, 'The trap sits in the raider’s row')
  assert.ok(
    trap.x < 4 && trap.x > ownBase(nearing),
    'The trap lies between the raider and our base',
  )
}
assert.deepEqual(
  chooseCpuAction(nearing),
  trap,
  'Identical visible state gives identical action',
)

// Do not reveal hidden rival identity when choosing trap squares.
const hidden = base()
hidden.units = [
  makeFighter(1, 'enemy', 4, 2, {
    hidden: true,
    known: false,
    cardId: null,
    hp: null,
    maxHp: null,
    attack: null,
    armor: null,
    ap: null,
    maxAp: null,
    keywords: null,
    ambushReady: null,
    range: null,
    attackStyle: null,
    summonedRound: null,
    attackedRound: null,
  }),
]
const unknown = chooseCpuAction(hidden)
assert.deepEqual(chooseCpuAction(hidden), unknown)

// A stolen flag pulls the creature closest to home back on DEFEND.
const orders = base()
orders.hand = []
orders.mana = 0
orders.flags[0] = { x: 3, y: 2, carrier: 9 }
orders.units = [
  makeFighter(1, 'player', 1, 1),
  makeFighter(2, 'player', 5, 1),
  makeFighter(3, 'player', 6, 4),
  makeFighter(9, 'enemy', 3, 2, { carryingFlag: true }),
]
assert.deepEqual(chooseCpuAction(orders), {
  t: 'stance',
  id: 1,
  stance: 'defend',
})
// With nothing to answer, everyone keeps attacking: the CPU passes.
const calm = base()
calm.hand = []
calm.units = [makeFighter(1, 'player', 1, 1), makeFighter(2, 'player', 2, 4)]
assert.equal(chooseCpuAction(calm), null)
// It never issues a manual move in the arena.
for (const view of [nearing, hidden, orders, calm])
  assert.notEqual(chooseCpuAction(view)?.t, 'move')

// Exercise the real controller and settlement loop for all six authored crews.
// Comparisons are reproducible, not win-rate claims from an inadequate sample.
for (const [index, team] of [
  'catgirls',
  'bloodfairies',
  'ironjaw',
  'riot',
  'undertow',
  'exchange',
].entries()) {
  const foe = team === 'riot' ? 'undertow' : 'riot'
  const first = playHeadless(
    'blackout',
    team as Parameters<typeof playHeadless>[1],
    foe,
    5180 + index,
  )
  const again = playHeadless(
    'blackout',
    team as Parameters<typeof playHeadless>[1],
    foe,
    5180 + index,
  )
  assert.ok(first.state.victor, team + ' match must resolve')
  assert.deepEqual(
    first.state,
    again.state,
    team + ' match replays from the same seed',
  )
}
console.log(
  'Slime City arena CPU: raider traps, flag-thief orders, concealed information, six deterministic full bouts PASS',
)
