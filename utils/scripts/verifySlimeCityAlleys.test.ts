// FIVE ALLEYS (Silas, 2026-11-05 PT, slime-city/t-027): five lanes, attack or
// defend only in your own alley unless a keyword says otherwise, Hearthstone
// chosen attacks, 20-card decks. Rules, CPU games and exact replays.
import assert from 'node:assert/strict'
import { TEAMS, cardById, teamById, type TeamId } from '../slimeCity/prototypes'
import {
  ALLEY_BOSS_HP,
  ALLEY_DECK_SIZE,
  ALLEY_LANES,
  ALLEY_START_HAND,
  alleyDeck,
  attack,
  attackTargets,
  createAlleys,
  endTurn,
  playCard,
  replayAlleys,
  unitAt,
  type AlleyState,
  type AlleyUnit,
} from '../slimeCity/alleys'
import { alleyCpuTurn } from '../slimeCity/alleysCpu'

// --- 20-card crew decks: the ten founders plus ten from the crew's own pool.
for (const team of TEAMS) {
  const deck = alleyDeck(team.id)
  assert.equal(deck.length, ALLEY_DECK_SIZE, team.id + ' deck is 20 cards')
  assert.equal(new Set(deck).size, ALLEY_DECK_SIZE, 'no duplicates')
  for (const id of [...team.creatures, ...team.special])
    assert.ok(deck.includes(id), team.id + ' keeps founder ' + id)
  assert.ok(deck.every((id) => cardById(id).team === team.id))
  assert.equal(deck.filter((id) => cardById(id).kind === 'creature').length, 10)
}

// --- Setup: 20 HP bosses, four-card hands, the second seat draws one more.
const fresh = createAlleys('ironjaw', 'catgirls', 11)
assert.equal(fresh.boss.player, ALLEY_BOSS_HP)
assert.equal(fresh.boss.enemy, ALLEY_BOSS_HP)
assert.equal(
  fresh.hands.player.length,
  ALLEY_START_HAND + 1,
  'drew on turn one',
)
assert.equal(fresh.hands.enemy.length, ALLEY_START_HAND + 1)
assert.equal(fresh.maxMana.player, 1)
assert.equal(fresh.active, 'player')

/** A board with chosen units and plenty of mana, on the player's turn. */
function rigged(units: Partial<AlleyUnit>[], hand: string[] = []): AlleyState {
  const s = createAlleys('ironjaw', 'catgirls', 7)
  let uid = 100
  s.units = units.map((u) => ({
    uid: uid++,
    cardId: 'scrapper',
    side: 'player',
    lane: 0,
    hp: 3,
    maxHp: 3,
    attack: 2,
    armor: 0,
    keywords: [],
    range: 1,
    fresh: false,
    spent: false,
    struck: false,
    rootedAt: null,
    surge: 0,
    ...u,
  }))
  s.hands.player = hand
  s.mana.player = 10
  s.maxMana.player = 10
  s.traps = []
  return s
}

// --- The alley rule: a blocker must be fought; an empty alley opens the boss.
const blocked = rigged([
  { side: 'player', lane: 2 },
  { side: 'enemy', lane: 2, cardId: 'lynx' },
])
const [mine, theirs] = blocked.units
assert.deepEqual(
  attackTargets(blocked, mine!.uid),
  [theirs!.uid],
  'Blocked: fight it',
)
assert.equal(
  attack(blocked, 'player', mine!.uid, 'boss'),
  blocked,
  'no boss past a blocker',
)
const open = rigged([
  { side: 'player', lane: 2 },
  { side: 'enemy', lane: 3 },
])
assert.deepEqual(
  attackTargets(open, open.units[0]!.uid),
  ['boss'],
  'Empty alley: the boss',
)
const hit = attack(open, 'player', open.units[0]!.uid, 'boss')
assert.equal(hit.boss.enemy, ALLEY_BOSS_HP - 2)
assert.deepEqual(
  attackTargets(hit, open.units[0]!.uid),
  [],
  'One attack a turn',
)

// --- Combat: both strike at once; armor soaks; the dead leave the alley.
const duel = rigged([
  { side: 'player', lane: 1, attack: 3, hp: 3 },
  { side: 'enemy', lane: 1, attack: 2, hp: 4, armor: 1 },
])
const after = attack(duel, 'player', duel.units[0]!.uid, duel.units[1]!.uid)
assert.equal(after.units.find((u) => u.side === 'enemy')!.hp, 2, '3 - 1 armor')
assert.equal(
  after.units.find((u) => u.side === 'player')!.hp,
  1,
  'struck back for 2',
)
const kill = rigged([
  { side: 'player', lane: 1, attack: 4 },
  { side: 'enemy', lane: 1, hp: 3, attack: 1 },
])
const killed = attack(kill, 'player', kill.units[0]!.uid, kill.units[1]!.uid)
assert.equal(unitAt(killed, 'enemy', 1), undefined, 'The defender falls')

// --- Modifiers break the alley rule. Range 2 reaches the next alley and
// takes no strike back from there; BULLDOZE tramples the excess to the boss.
const reach = rigged([
  { side: 'player', lane: 2, range: 2 },
  { side: 'enemy', lane: 3, attack: 5 },
])
assert.deepEqual(attackTargets(reach, reach.units[0]!.uid), [
  'boss',
  reach.units[1]!.uid,
])
const reached = attack(
  reach,
  'player',
  reach.units[0]!.uid,
  reach.units[1]!.uid,
)
assert.equal(
  reached.units.find((u) => u.side === 'player')!.hp,
  3,
  'no strike back',
)
const trample = rigged([
  { side: 'player', lane: 0, attack: 5, keywords: ['bulldoze'] },
  { side: 'enemy', lane: 0, hp: 2, attack: 0 },
])
const trampled = attack(
  trample,
  'player',
  trample.units[0]!.uid,
  trample.units[1]!.uid,
)
assert.equal(
  trampled.boss.enemy,
  ALLEY_BOSS_HP - 3,
  'BULLDOZE: 3 tramples through',
)
const pounce = rigged([
  { side: 'player', lane: 0, attack: 1, keywords: ['ambush'] },
])
const pounced = attack(pounce, 'player', pounce.units[0]!.uid, 'boss')
assert.equal(
  pounced.boss.enemy,
  ALLEY_BOSS_HP - 3,
  'AMBUSH: +2 on the first blow',
)

// --- A creature waits a turn after it lands; the slot must be empty.
const hand = rigged([], ['scrapper', 'welder'])
const landed = playCard(hand, 'player', 'scrapper', 4)
const lander = unitAt(landed, 'player', 4)!
assert.ok(lander.fresh)
assert.deepEqual(attackTargets(landed, lander.uid), [], 'Waits a turn')
assert.equal(
  playCard(landed, 'player', 'welder', 4),
  landed,
  'One fighter an alley',
)
assert.equal(landed.mana.player, 10 - cardById('scrapper').cost)

// --- Traps spring on the next enemy creature to land in that alley.
const trapped = rigged([])
trapped.traps = [{ side: 'enemy', lane: 3, cardId: 'scentmine' }]
trapped.hands.player = ['juggernaut']
const sprung = playCard(trapped, 'player', 'juggernaut', 3)
assert.equal(sprung.traps.length, 0)
assert.ok(unitAt(sprung, 'player', 3)!.rootedAt !== null, 'Scent Mine roots it')
assert.ok(sprung.log.some((l) => l.kind === 'trap'))

// --- Going second: the enemy's first turn starts one mana crystal up.
const second = endTurn(fresh, 'player')
assert.equal(second.active, 'enemy')
assert.equal(second.maxMana.enemy, 2, "the second seat's coin")

// --- Whole CPU games: every crew pairing ends, replays exactly, and fights.
let bossHits = 0
let deaths = 0
let firstSeat = 0
let games = 0
for (const a of TEAMS)
  for (const b of TEAMS) {
    if (a.id === b.id) continue
    for (const seed of [3, 17]) {
      let s = createAlleys(a.id, b.id, seed)
      for (let i = 0; i < 200 && !s.victor; i++) s = alleyCpuTurn(s, s.active)
      assert.ok(s.victor, a.id + ' v ' + b.id + ' ends')
      assert.deepEqual(
        replayAlleys(a.id as TeamId, b.id as TeamId, seed, s.commands),
        s,
      )
      games++
      if (s.victor === 'player') firstSeat++
      bossHits += s.log.filter((l) => l.kind === 'boss').length
      deaths += s.log.filter((l) => l.kind === 'death').length
      for (const unit of s.units)
        assert.ok(unit.lane >= 0 && unit.lane < ALLEY_LANES)
    }
  }
assert.ok(bossHits / games > 4, 'bosses take hits')
assert.ok(deaths / games > 4, 'creatures trade in the alleys')
assert.ok(firstSeat / games < 0.65, 'the first seat does not run away')
assert.ok(teamById('ironjaw'))

console.log(
  'Slime City FIVE ALLEYS: 20-card decks, alley rule, chosen attacks, reach, trample, ambush, traps, coin, ' +
    games +
    ' CPU games replay PASS',
)
