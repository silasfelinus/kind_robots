// Blackout-first round-hand contract: visible deployment, five seeded cards,
// hidden legacy only by explicit fixture opt-in, and no infinite card menu.
import assert from 'node:assert/strict'
import { chooseCpuAction } from '../slimeCity/cpu'
import {
  advance,
  attack,
  replayMatch,
  toggleHandDiscard,
  BLACKOUT_MANA_GAIN,
  MANA_CAP,
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
  assert.equal(fresh.mana, BLACKOUT_MANA_GAIN)
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
  const unavailable = deckOf(team.id).find(
    (c) => !fresh.hands.player.includes(c.id),
  )!
  const illegal = { ...fresh, mana: 10 }
  assert.equal(
    deploy(illegal, unavailable.id, 0, 0),
    illegal,
    'Cards outside the hand never play',
  )
  assert.notEqual(
    fresh.hands.player.join(','),
    fresh.hands.enemy.join(','),
    'Each side has its own hand',
  )
  const fog = createMatch('blackout', team.id, 'exchange', 40817, {
    classicFog: true,
  })
  assert.equal(fog.width, 8)
  assert.equal(fog.units.length, 10)
  assert.equal(
    fog.units.filter((u) => u.hidden).length,
    10,
    'Legacy fixture remains opt-in',
  )
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
const starter = candidate.hands.player.find(
  (id) => cardById(id).kind === 'creature',
)!
candidate.mana = 10
const deployed = deploy(candidate, starter, 0, 0)
assert.notEqual(deployed, candidate)
assert.equal(deployed.units.length, 1)
assert.ok(deployed.playedThisRound.player.includes(starter))
assert.equal(deployed.units[0]!.hidden, false)
assert.ok(!deployed.hands.player.includes(starter))
assert.ok(deployed.discards.player.includes(starter))
assert.equal(
  deploy(deployed, starter, 0, 1),
  deployed,
  'Spent card cannot be replayed',
)
assert.equal(candidate.units.length, 0, 'Pure engine does not mutate old state')
const nextDraw = advance(deployed)
assert.ok(!nextDraw.hands.player.includes(starter), 'Played card not dealt immediately next round')

const fixture = createMatch('blackout', 'catgirls', 'bloodfairies', 777)
fixture.units = [
  {
    id: 900,
    cardId: 'lynx',
    side: 'player',
    x: 0,
    y: 0,
    hp: 200,
    maxHp: 200,
    attack: 0,
    armor: 200,
    ap: 0,
    maxAp: 0,
    hidden: false,
    carryingFlag: false,
  },
  {
    id: 901,
    cardId: 'sprite',
    side: 'enemy',
    x: 9,
    y: 5,
    hp: 200,
    maxHp: 200,
    attack: 0,
    armor: 200,
    ap: 0,
    maxAp: 0,
    hidden: false,
    carryingFlag: false,
  },
]
fixture.nextId = 902
let current = fixture
for (let round = 2; round <= 9; round++) {
  const held = current.hands.player.slice(2)
  const marked = toggleHandDiscard(
    toggleHandDiscard(current, current.hands.player[0]!),
    current.hands.player[1]!,
  )
  const next = advance(marked)
  assert.equal(next.round, round)
  assert.equal(next.hands.player.length, BLACKOUT_HAND_SIZE)
  assert.ok(
    held.every((id) => next.hands.player.includes(id)),
    'Unplayed unmarked cards remain in hand',
  )
  assert.equal(next.markedDiscards.player.length, 0)
  assert.equal(
    new Set([
      ...next.piles.player,
      ...next.hands.player,
      ...next.discards.player,
    ]).size,
    DECK_SIZE,
  )
  assert.equal(
    next.piles.player.length +
      next.hands.player.length +
      next.discards.player.length,
    DECK_SIZE,
  )
  assert.deepEqual(
    next,
    advance(marked),
    'Deck and CPU actions replay from the same state',
  )
  current = next
}
assert.ok(current.shuffles.player >= 1, 'Marked discards eventually reshuffle')


// Unmarked cards persist, and unused mana banks to the cap.
const banker = createMatch('blackout', 'riot', 'exchange', 371)
const hold = advance(banker)
assert.deepEqual(hold.hands.player, banker.hands.player)
assert.equal(hold.mana, 2 * BLACKOUT_MANA_GAIN)
const holdAgain = advance(hold)
assert.deepEqual(holdAgain.hands.player, banker.hands.player)
assert.equal(holdAgain.mana, 3 * BLACKOUT_MANA_GAIN)
assert.equal(advance(holdAgain).mana, MANA_CAP)

// Invalid toggles are no-ops; valid toggles have exact server-replay parity.
const toggled = toggleHandDiscard(banker, banker.hands.player[0]!)
const untoggled = toggleHandDiscard(toggled, banker.hands.player[0]!)
assert.deepEqual(untoggled.markedDiscards.player, [])
assert.equal(toggleHandDiscard(banker, 'not-a-card'), banker)
assert.deepEqual(
  replayMatch({ mode: 'blackout', teamId: 'riot', foeId: 'exchange', seed: 371 }, untoggled.commands),
  untoggled,
)
const markedBanker = toggleHandDiscard(banker, banker.hands.player[0]!)
const cycledBanker = advance(markedBanker)
assert.equal(cycledBanker.mana, 2 * BLACKOUT_MANA_GAIN)
assert.equal(cycledBanker.hands.player.length, BLACKOUT_HAND_SIZE)
assert.deepEqual(
  replayMatch({ mode: 'blackout', teamId: 'riot', foeId: 'exchange', seed: 371 }, cycledBanker.commands),
  cycledBanker,
  'Selective redraw and CPU choices must reproduce exactly',
)
// Five debt cannot wipe out saved mana; the remainder carries into round three.
const indebted = createMatch('blackout', 'riot', 'exchange', 88)
indebted.debt.player = 5
const firstBill = advance(indebted)
assert.equal(firstBill.mana, BLACKOUT_MANA_GAIN)
assert.equal(firstBill.debt.player, 2)
const secondBill = advance(firstBill)
assert.equal(secondBill.mana, BLACKOUT_MANA_GAIN + 1)
assert.equal(secondBill.debt.player, 0)

// The 6-mana marquee creature is a viable two-turn savings decision.
const expensiveDeck = deckOf('riot').map((card) => card.id)
const swapSlot = expensiveDeck.findIndex(
  (id) => cardById(id).kind === 'creature' && !cardById(id).signature,
)
assert.ok(swapSlot >= 0)
expensiveDeck[swapSlot] = 'merc-auction-golem'
const expensiveSeed = Array.from({ length: 80 }, (_, i) => i + 1).find(
  (seed) =>
    createMatch('blackout', 'riot', 'exchange', seed, {}, expensiveDeck)
      .hands.player.includes('merc-auction-golem'),
)
assert.ok(expensiveSeed)
const investment = createMatch(
  'blackout',
  'riot',
  'exchange',
  expensiveSeed!,
  {},
  expensiveDeck,
)
assert.equal(investment.mana, 3)
const funded = advance(investment)
assert.equal(funded.mana, 6)
const marquee = deploy(funded, 'merc-auction-golem', 0, 1)
assert.notEqual(marquee, funded, 'Banking unlocks expensive cards on round two')
assert.equal(marquee.mana, 0)

assert.equal(createMatch('gridiron', 'riot').mana, 1)
assert.equal(createMatch('bloodrush', 'riot').mana, 3)

const open = createMatch('blackout', 'riot', 'ironjaw', 1)
assert.notEqual(
  advance(open).victor,
  'enemy',
  'First empty round is not instant defeat',
)

const combatFixture = createMatch('blackout', 'riot', 'catgirls', 104)
combatFixture.round = 2
combatFixture.units = [
  {
    id: 401,
    cardId: 'rat',
    side: 'player',
    x: 4,
    y: 2,
    hp: 6,
    maxHp: 6,
    attack: 2,
    armor: 0,
    ap: 1,
    maxAp: 1,
    hidden: false,
    carryingFlag: false,
    summonedRound: 1,
    attackedRound: 0,
    range: 1,
    attackStyle: 'claw',
  },
  {
    id: 402,
    cardId: 'lynx',
    side: 'enemy',
    x: 5,
    y: 2,
    hp: 9,
    maxHp: 9,
    attack: 1,
    armor: 0,
    ap: 0,
    maxAp: 0,
    hidden: false,
    carryingFlag: false,
    summonedRound: 1,
    attackedRound: 0,
    range: 1,
    attackStyle: 'claw',
  },
]
combatFixture.cooldowns.enemy = Object.fromEntries(
  deckOf('catgirls').map((c) => [c.id, 999]),
)
const peaceful = advance(combatFixture)
assert.equal(
  peaceful.units[1]!.hp,
  9,
  'Normal Blackout does not auto-attack at end of round',
)
assert.equal(
  mayAttack(combatFixture, combatFixture.units[0]!, combatFixture.units[1]!),
  true,
)
const struck = attack(combatFixture, 401, 402)
assert.equal(struck.units[1]!.hp, 7)
assert.equal(struck.units[0]!.attackedRound, 2)
assert.equal(
  attack(struck, 401, 402),
  struck,
  'One deliberate attack per fighter per round',
)
assert.ok(struck.log[0]?.includes('2 damage'))
assert.equal(
  attack(combatFixture, 401, 401),
  combatFixture,
  'No friendly fire by normal attacks',
)
const tooFar = structuredClone(combatFixture)
tooFar.units[1]!.x = 6
assert.equal(
  attack(tooFar, 401, 402),
  tooFar,
  'Range 1 does not reach two squares',
)
assert.equal(cardAttackRange(cardById('mau')), 2)
const range = structuredClone(tooFar)
range.units[0]!.range = 2
assert.equal(attack(range, 401, 402).units[1]!.hp, 7)
const freshlySummoned = structuredClone(combatFixture)
freshlySummoned.units[0]!.summonedRound = freshlySummoned.round
assert.equal(
  attack(freshlySummoned, 401, 402),
  freshlySummoned,
  'Summoning sickness stops same-turn attacks',
)
assert.equal(
  chooseCpuAction({
    ...observe(combatFixture, 'enemy'),
    hand: [],
  })?.t,
  'attack',
  'CPU must choose its own deliberate attack',
)
const replay = createMatch('blackout', 'riot', 'catgirls', 104)
assert.deepEqual(
  replay.hands,
  createMatch('blackout', 'riot', 'catgirls', 104).hands,
)

console.log(
  'Slime City Blackout hands: six seeded decks, 5-card retention, banked mana and selective cycling PASS',
)
