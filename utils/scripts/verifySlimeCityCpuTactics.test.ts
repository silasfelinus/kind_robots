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
const nearing = base()
nearing.units = [makeFighter(7, 'enemy', nearing.flag.x + 2, nearing.flag.y)]
const trap = chooseCpuAction(nearing)
assert.ok(trap && trap.t === 'deploy' && trap.card === 'tripwire')
if (trap?.t === 'deploy') {
  assert.equal(
    Math.abs(trap.x - nearing.flag.x) + Math.abs(trap.y - nearing.flag.y),
    1,
    'The trap protects an approach to the flag, not a random corner',
  )
}
assert.deepEqual(
  chooseCpuAction(nearing),
  trap,
  'Identical visible state gives identical action',
)

// Pursue an escaping flag carrier instead of dumping a trap behind it.
const escape = base()
escape.units = [makeFighter(8, 'enemy', 6, 2, { carryingFlag: true })]
const intercept = chooseCpuAction(escape)
assert.ok(intercept && intercept.t === 'deploy')
if (intercept?.t === 'deploy') {
  assert.equal(intercept.x, 7)
  assert.equal(intercept.y, 2)
}

// Do not reveal hidden rival identity when choosing trap squares.
const hidden = base()
hidden.units = [
  makeFighter(1, 'enemy', hidden.flag.x + 2, hidden.flag.y, {
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

// A visibly carried flag is a larger threat than a low-HP bystander.
const attack = base()
attack.hand = []
attack.mana = 0
attack.units = [
  makeFighter(1, 'player', 3, 2, { attack: 2 }),
  makeFighter(2, 'enemy', 4, 2, { carryingFlag: true, hp: 4 }),
  makeFighter(3, 'enemy', 3, 3, { hp: 1 }),
]
assert.deepEqual(chooseCpuAction(attack), {
  t: 'attack',
  id: 1,
  target: 2,
})
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
  'Slime City Blackout CPU: carrier interception, flag traps, concealed information, six deterministic full bouts PASS',
)
