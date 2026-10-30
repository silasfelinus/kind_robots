// Blackout-first round-hand contract: visible deployment, four seeded cards,
// hidden legacy only by explicit fixture opt-in, and no infinite card menu.
import assert from 'node:assert/strict'
import { chooseCpuAction } from '../slimeCity/cpu'
import {
  advance,
  attack,
  mayAttack,
  BLACKOUT_HAND_SIZE,
  cardById,
  createMatch,
  cardAttackRange,
  DECK_SIZE,
  deckOf,
  deploy,
  observe,
  TEAMS,
  type MatchState,
} from '../slimeCity/prototypes'

for (const team of TEAMS) {
  const fresh = createMatch('blackout', team.id, 'exchange', 40817)
  assert.equal(fresh.width, 10)
  assert.equal(fresh.height, 6)
  assert.equal(fresh.units.length, 0, 'Open deployment, no forced secret army')
  assert.equal(fresh.mana, 1)
  assert.equal(fresh.hands.player.length, BLACKOUT_HAND_SIZE)
  assert.equal(fresh.hands.enemy.length, BLACKOUT_HAND_SIZE)
  assert.equal(fresh.piles.player.length, DECK_SIZE - BLACKOUT_HAND_SIZE)
  assert.equal(fresh.piles.enemy.length, DECK_SIZE - BLACKOUT_HAND_SIZE)
  assert.equal(fresh.discards.player.length, 0)
  assert.equal(new Set(fresh.hands.player).size, BLACKOUT_HAND_SIZE)
  assert.ok(fresh.hands.player.every((id) => cardById(id).team === team.id))
  assert.equal(observe(fresh, 'player').hand.length, BLACKOUT_HAND_SIZE)
  assert.deepEqual(
    createMatch('blackout', team.id, 'exchange', 40817),
    fresh,
    'Same seed deals the same hands',
  )
  const rival = createMatch('blackout', team.id, 'exchange', 40818)
  assert.notDeepEqual(rival.hands.player, fresh.hands.player)
  const unavailable = deckOf(team.id).find((c) => !fresh.hands.player.includes(c.id))!
  const illegal = { ...fresh, mana: 10 }
  assert.equal(deploy(illegal, unavailable.id, 0, 0), illegal, 'Cards outside the hand never play')
  assert.notEqual(fresh.hands.player.join(','), fresh.hands.enemy.join(','), 'Each side has its own hand')
  const fog = createMatch('blackout', team.id, 'exchange', 40817, { classicFog: true })
  assert.equal(fog.width, 8)
  assert.equal(fog.units.length, 10)
  assert.equal(fog.units.filter((u) => u.hidden).length, 10, 'Legacy fixture remains opt-in')
}

let candidate: MatchState | null = null
for (let seed = 1; seed < 50; seed++) {
  const test = createMatch('blackout', 'riot', 'exchange', seed)
  if (test.hands.player.some((id) => cardById(id).kind === 'creature')) {
    candidate = test
    break
  }
}
assert.ok(candidate)
const starter = candidate.hands.player.find((id) => cardById(id).kind === 'creature')!
candidate.mana = 10
const deployed = deploy(candidate, starter, 0, 0)
assert.notEqual(deployed, candidate)
assert.equal(deployed.units.length, 1)
assert.equal(deployed.units[0]!.hidden, false)
assert.ok(!deployed.hands.player.includes(starter))
assert.ok(deployed.discards.player.includes(starter))
assert.equal(deploy(deployed, starter, 0, 1), deployed, 'Spent card cannot be replayed')
assert.equal(candidate.units.length, 0, 'Pure engine does not mutate old state')

const fixture = createMatch('blackout', 'catgirls', 'bloodfairies', 777)
fixture.units = [
  {
    id: 900, cardId: 'lynx', side: 'player', x: 0, y: 0, hp: 200, maxHp: 200,
    attack: 0, armor: 200, ap: 0, maxAp: 0, hidden: false, carryingFlag: false,
  },
  {
    id: 901, cardId: 'sprite', side: 'enemy', x: 9, y: 5, hp: 200, maxHp: 200,
    attack: 0, armor: 200, ap: 0, maxAp: 0, hidden: false, carryingFlag: false,
  },
]
fixture.nextId = 902
let current = fixture
let pastHand = current.hands.player.join(',')
for (let round = 2; round <= 9; round++) {
  const next = advance(current)
  assert.equal(next.round, round)
  assert.equal(next.hands.player.length, BLACKOUT_HAND_SIZE)
  assert.notEqual(next.hands.player.join(','), pastHand, 'Hand refreshes each round')
  assert.equal(new Set([...next.piles.player, ...next.hands.player, ...next.discards.player]).size, DECK_SIZE)
  assert.equal(next.piles.player.length + next.hands.player.length + next.discards.player.length, DECK_SIZE)
  assert.deepEqual(next, advance(current), 'Deck and CPU actions replay from the same state')
  pastHand = next.hands.player.join(',')
  current = next
}
assert.ok(current.shuffles.player >= 1, 'Draw pile recycles when exhausted')

const open = createMatch('blackout', 'riot', 'ironjaw', 1)
assert.notEqual(advance(open).victor, 'enemy', 'First empty round is not instant defeat')

const combatFixture = createMatch('blackout', 'riot', 'catgirls', 104)
combatFixture.round = 2
combatFixture.units = [
  { id: 401, cardId: 'rat', side: 'player', x: 4, y: 2, hp: 6, maxHp: 6,
    attack: 2, armor: 0, ap: 1, maxAp: 1, hidden: false, carryingFlag: false,
    summonedRound: 1, attackedRound: 0, range: 1, attackStyle: 'claw' },
  { id: 402, cardId: 'lynx', side: 'enemy', x: 5, y: 2, hp: 9, maxHp: 9,
    attack: 1, armor: 0, ap: 0, maxAp: 0, hidden: false, carryingFlag: false,
    summonedRound: 1, attackedRound: 0, range: 1, attackStyle: 'claw' },
]
combatFixture.cooldowns.enemy = Object.fromEntries(deckOf('catgirls').map((c) => [c.id, 999]))
const peaceful = advance(combatFixture)
assert.equal(peaceful.units[1]!.hp, 9, 'Normal Blackout does not auto-attack at end of round')
assert.equal(mayAttack(combatFixture, combatFixture.units[0]!, combatFixture.units[1]!), true)
const struck = attack(combatFixture, 401, 402)
assert.equal(struck.units[1]!.hp, 7)
assert.equal(struck.units[0]!.attackedRound, 2)
assert.equal(attack(struck, 401, 402), struck, 'One deliberate attack per fighter per round')
assert.ok(struck.log[0]?.includes('2 damage'))
assert.equal(attack(combatFixture, 401, 401), combatFixture, 'No friendly fire by normal attacks')
const tooFar = structuredClone(combatFixture)
tooFar.units[1]!.x = 6
assert.equal(attack(tooFar, 401, 402), tooFar, 'Range 1 does not reach two squares')
assert.equal(cardAttackRange(cardById('mau')), 2)
const range = structuredClone(tooFar)
range.units[0]!.range = 2
assert.equal(attack(range, 401, 402).units[1]!.hp, 7)
const freshlySummoned = structuredClone(combatFixture)
freshlySummoned.units[0]!.summonedRound = freshlySummoned.round
assert.equal(attack(freshlySummoned, 401, 402), freshlySummoned, 'Summoning sickness stops same-turn attacks')
assert.equal(chooseCpuAction({
  ...observe(combatFixture, 'enemy'),
  hand: [],
})?.t, 'attack', 'CPU must choose its own deliberate attack')
const replay = createMatch('blackout', 'riot', 'catgirls', 104)
assert.deepEqual(replay.hands, createMatch('blackout', 'riot', 'catgirls', 104).hands)

console.log('Slime City Blackout hands: six seeded 10-card decks, 4-card refresh, hand-only play and open arena PASS')
