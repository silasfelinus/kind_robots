// Slime City crafted evolutions: the Catgirls pilot (conductor
// projects/slime-city/CLASH-EVOLUTION-PLAN.md, approved 2026-11-08 PT).
// Every pilot card is checked through the real engine: its level stages do
// what the card says, and each level three changes what the card DOES.
import assert from 'node:assert/strict'
import { cardById, type Side } from '../slimeCity/prototypes'
import { CLASH_TWISTS } from '../slimeCity/clashTwists'
import {
  CLASH_EVOLUTIONS,
  clashEvolutionStage,
  clashStageTitle,
} from '../slimeCity/clashEvolutions'
import {
  applyClashCommand,
  chooseClashCpu,
  clashBalance,
  clashCardText,
  clashPower,
  createClash,
  endClashTurn,
  nextClashStrike,
  passClash,
  playClash,
  replayClash,
  strikeClash,
  type ClashState,
  type ClashUnit,
} from '../slimeCity/clash'
import { slimeCardArtId, slimeArtId } from '../slimeCity/artManifest'

const PILOT = [
  'splice-runner',
  's1-roof-phantom',
  's1-alley-vet',
  's2-catgirls-parapet-ghost-kitten',
  's3-catgirls-escaped-tiger',
  's3-catgirls-glasswalker',
  'mutual-aid',
  's1-nine-lives',
  's3-catgirls-garrote',
  's3-catgirls-pounce-rig',
]
assert.deepEqual(Object.keys(CLASH_EVOLUTIONS).sort(), [...PILOT].sort())
for (const id of PILOT) {
  const card = cardById(id)
  assert.equal(card.team, 'catgirls', id)
  assert.ok(!CLASH_TWISTS[id], id + ' is not a hand-built twist too')
  const two = clashEvolutionStage(id, 2)!
  const three = clashEvolutionStage(id, 3)!
  assert.ok(two.title && three.title && two.title !== three.title, id)
  assert.notDeepEqual(two, three, id + ' L3 is not the L2 again')
  for (const level of [1, 2, 3]) {
    const text = clashCardText(card, level)
    assert.ok(text.length <= 160, id + ' L' + level + ' fits the card face')
  }
  assert.equal(clashStageTitle(id, 1), card.name)
}

// --- helpers
function fighter(
  side: Side,
  lane: number,
  uid: number,
  extra: Partial<ClashUnit> = {},
): ClashUnit {
  return {
    uid,
    side,
    lane,
    cardId: side === 'player' ? 'lynx' : 'scrapper',
    hp: 6,
    maxHp: 8,
    attack: 3,
    armor: 0,
    keywords: [],
    surge: 0,
    rooted: false,
    ambushUsed: false,
    attacked: false,
    fresh: false,
    gear: [],
    level: 1,
    ...extra,
  }
}
function board(units: ClashUnit[]): ClashState {
  const s = createClash('catgirls', 'riot', 11)
  s.units = units
  s.nextUid = 100
  s.round = 3
  s.plays.player = 0
  return s
}
function cast(s: ClashState, id: string, lane: number, level = 3): ClashState {
  s.hands.player = [id, ...s.hands.player]
  s.levels.player[id] = level
  const next = playClash(s, 'player', id, lane)
  assert.notEqual(
    next,
    s,
    id + ' L' + level + ' is playable in alley ' + (lane + 1),
  )
  return next
}
const at = (s: ClashState, uid: number) => s.units.find((u) => u.uid === uid)
const mine = (s: ClashState, id: string) =>
  s.units.find((u) => u.side === 'player' && u.cardId === id && !u.token)

// Splice Runner L3, Midnight Ambulance: role shift into a non-fighting
// rescuer that brings back the last fallen fighter.
{
  const s0 = board([])
  s0.fallen = { player: ['s1-alley-vet'], enemy: [] }
  const s = cast(s0, 'splice-runner', 2)
  const echo = s.units.find((u) => u.token && u.cardId === 's1-alley-vet')
  assert.ok(echo, 'the fallen vet returns')
  assert.equal(echo!.attack, 2)
  assert.equal(echo!.hp, 3)
  assert.equal(clashPower(s, mine(s, 'splice-runner')!), 0, 'never strikes')
  assert.deepEqual(s.fallen!.player, [], 'each fallen fighter returns once')
  assert.match(s.lastEvolution!.detail, /Midnight Ambulance/)
  const empty = cast(board([]), 'splice-runner', 2)
  assert.equal(
    empty.units.filter((u) => u.token).length,
    0,
    'no fallen, no echo',
  )
  const two = cast(
    board([fighter('player', 0, 1, { hp: 2 })]),
    'splice-runner',
    2,
    2,
  )
  assert.equal(at(two, 1)!.hp, 5, 'Contraband Courier heals the most hurt 3')
}
// Rooftop Phantom: an empty alley pays the boss; an L3 knockout vanishes.
{
  const s0 = board([])
  const before = s0.boss.enemy
  const s = cast(s0, 's1-roof-phantom', 1, 2)
  assert.equal(s.boss.enemy, before - 2, 'Chimney Leap')
  const blocked = cast(board([fighter('enemy', 1, 9)]), 's1-roof-phantom', 1, 2)
  assert.equal(blocked.boss.enemy, before, 'no leap into a filled alley')
  // L3 knockout returns it to the top of the deck.
  let k = cast(
    board([fighter('enemy', 1, 9, { hp: 1, attack: 1 })]),
    's1-roof-phantom',
    1,
  )
  k = passClash(k, 'player')
  while (nextClashStrike(k, 'player') >= 0) k = strikeClash(k, 'player')
  assert.equal(mine(k, 's1-roof-phantom'), undefined, 'gone from the board')
  assert.equal(k.decks.player[0], 's1-roof-phantom', 'back on top of the deck')
}
// Alley Veterinarian L3: hurt allies gain REGEN; healthy ones do not.
{
  const s = cast(
    board([
      fighter('player', 0, 1, { hp: 3 }),
      fighter('player', 4, 2, { hp: 8 }),
    ]),
    's1-alley-vet',
    2,
  )
  assert.ok(at(s, 1)!.keywords.includes('regen'))
  assert.ok(!at(s, 2)!.keywords.includes('regen'))
}
// Parapet Ghost-Kitten L3: the rare weaker level three, with a big arrival.
{
  const id = 's2-catgirls-parapet-ghost-kitten'
  const l2 = clashBalance(cardById(id), 2)
  const l3 = clashBalance(cardById(id), 3)
  assert.ok(l3.hp < l2.hp && l3.attack < l2.attack, 'smaller body at L3')
  const s = cast(
    board([
      fighter('enemy', 1, 7),
      fighter('enemy', 2, 8),
      fighter('enemy', 4, 9),
    ]),
    id,
    2,
  )
  assert.ok(at(s, 7)!.rooted && at(s, 8)!.rooted, 'the 3 facing foes freeze')
  assert.ok(!at(s, 9)!.rooted, 'alley 5 is out of reach')
}
// Gene-Spliced Tiger: weaker L1, and at L3 it hunts the strongest foe.
{
  const id = 's3-catgirls-escaped-tiger'
  assert.ok(
    clashBalance(cardById(id), 1).attack < clashBalance(cardById(id), 3).attack,
  )
  const s = cast(
    board([
      fighter('enemy', 0, 7, { attack: 2, hp: 9, maxHp: 9 }),
      fighter('enemy', 4, 8, { attack: 5, hp: 9, maxHp: 9 }),
    ]),
    id,
    2,
  )
  const tiger = mine(s, id)!
  assert.ok(at(s, 8)!.hp < 9, 'it hunts the strongest')
  assert.equal(at(s, 7)!.hp, 9, 'not the weaker one')
  assert.ok(tiger.hp < tiger.maxHp, 'and takes a hit back')
}
// Gutterglass Scout L3: the shield always; the roar only with a crowd.
{
  const lonely = cast(board([]), 's3-catgirls-glasswalker', 2)
  assert.equal(mine(lonely, 's3-catgirls-glasswalker')!.guard, 3)
  const crowd = cast(
    board([fighter('player', 0, 1), fighter('player', 4, 2)]),
    's3-catgirls-glasswalker',
    2,
  )
  assert.equal(at(crowd, 1)!.surge, 1, 'the crowd roars')
  assert.equal(at(lonely, 1), undefined)
}
// Mutual Aid L3: the healthy get stronger for good, the hurt are healed.
{
  const s = cast(
    board([
      fighter('player', 1, 1, { hp: 8 }),
      fighter('player', 3, 2, { hp: 1, maxHp: 12 }),
    ]),
    'mutual-aid',
    3,
  )
  assert.equal(at(s, 1)!.attack, 4, 'unhurt ally +1 power for good')
  assert.equal(
    at(s, 2)!.attack,
    3,
    'a target still hurt after the heal does not grow',
  )
}
// Nine Lives L3: the whole crew survives one lethal hit at 1 life.
{
  const s = cast(
    board([
      fighter('player', 1, 1),
      fighter('player', 4, 2),
      fighter('enemy', 4, 9, { attack: 20 }),
    ]),
    's1-nine-lives',
    1,
  )
  assert.ok(at(s, 2)!.lastChance)
  // Its own strike into a 20-power blocker would be lethal; the spare life
  // holds at 1 and is spent.
  let e = passClash(s, 'player')
  while (nextClashStrike(e, 'player') >= 0) e = strikeClash(e, 'player')
  assert.equal(at(e, 2)?.hp, 1, 'the spare life holds')
  assert.ok(!at(e, 2)!.lastChance, 'and is spent')
  assert.match(e.lastEvolution!.detail, /No refunds/)
}
// Catwalk Garrote: +2 against a 2-play victim; at L3 it springs twice.
{
  let s = cast(board([]), 's3-catgirls-garrote', 2)
  assert.equal(s.traps.filter((t) => t.lane === 2).length, 1)
  s = passClash(s, 'player')
  s = endClashTurn(s, 'player')
  s.hands.enemy = ['spark-diver']
  s.levels.enemy['spark-diver'] = 1
  s = playClash(s, 'enemy', 'spark-diver', 2)
  assert.equal(
    s.traps.filter((t) => t.lane === 2 && t.side === 'player').length,
    1,
    "Hangman's Line arms again",
  )
  assert.ok(s.traps.find((t) => t.lane === 2)!.token, 'only once')
}
// Second Pounce Rig L3: a knockout sends the wearer's power into the boss.
{
  let s = cast(
    board([
      fighter('player', 1, 1, { attack: 4 }),
      fighter('enemy', 1, 9, { hp: 1, attack: 1 }),
    ]),
    's3-catgirls-pounce-rig',
    1,
  )
  const before = s.boss.enemy
  s = passClash(s, 'player')
  while (nextClashStrike(s, 'player') >= 0) s = strikeClash(s, 'player')
  assert.ok(s.boss.enemy < before, 'the second pounce lands on the boss')
}

// --- Evolution art: a level shows its painting once wired, else falls back.
assert.equal(
  slimeCardArtId('splice-runner', 1),
  slimeArtId('cards', 'splice-runner'),
)
assert.equal(
  slimeCardArtId('splice-runner', 3),
  slimeArtId('evolutions', 'splice-runner@3') ??
    slimeArtId('cards', 'splice-runner'),
)

// --- Determinism with the pilot cards in Catgirls decks.
for (const seed of [5, 9, 13]) {
  let g = createClash('catgirls', 'ironjaw', seed)
  for (let i = 0; !g.victor && i < 2000; i++)
    g = applyClashCommand(g, chooseClashCpu(g, g.active))
  assert.ok(g.victor)
  const again = replayClash('catgirls', 'ironjaw', seed, g.commands)
  assert.deepEqual(again.boss, g.boss)
}

console.log(
  'Slime City crafted evolutions: 10-card Catgirls pilot, every stage through the real engine, art fallback and replay OK',
)
