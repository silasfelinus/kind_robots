// Slime City Clash evolutions (Silas, 2026-11-08 PT): every card evolves at
// level 2 and 3 with real gameplay, not only stats, and every level three
// does something immediate and announces itself.
import assert from 'node:assert/strict'
import { CARDS, cardById, type Side } from '../slimeCity/prototypes'
import { CLASH_TWISTS } from '../slimeCity/clashTwists'
import {
  CLASH_EVOLUTIONS,
  clashEvolutionStage,
  clashEvolutionText,
  clashStageTitle,
} from '../slimeCity/clashEvolutions'
import {
  applyClashCommand,
  chooseClashCpu,
  clashCardText,
  clashPower,
  createClash,
  endClashTurn,
  passClash,
  playClash,
  replayClash,
  strikeClash,
  type ClashState,
  type ClashUnit,
} from '../slimeCity/clash'
import { sweepClash } from './slimeCityClashBalanceReport'

// --- Coverage: all 300 cards evolve, by hand-built twist or data stage.
assert.equal(CARDS.length, 300)
const missing = CARDS.filter(
  (c) => !CLASH_TWISTS[c.id] && !CLASH_EVOLUTIONS[c.id],
)
assert.deepEqual(
  missing.map((c) => c.id),
  [],
  'every card evolves',
)
for (const id of Object.keys(CLASH_EVOLUTIONS)) {
  assert.ok(cardById(id), id + ' is a real card')
  assert.ok(!CLASH_TWISTS[id], id + ' is not also a hand-built twist')
}
assert.equal(
  Object.keys(CLASH_EVOLUTIONS).length + Object.keys(CLASH_TWISTS).length,
  300,
)

// --- Authoring contract for each data evolution.
const titles = new Set<string>()
for (const [id, evo] of Object.entries(CLASH_EVOLUTIONS)) {
  const card = cardById(id)
  for (const level of [2, 3] as const) {
    const st = evo[level]
    assert.ok(st.title.length >= 4, id + ' L' + level + ' has a stage name')
    assert.ok(!titles.has(st.title), 'stage names are unique: ' + st.title)
    titles.add(st.title)
    assert.ok(
      st.abilities.length || st.static,
      id + ' L' + level + ' changes gameplay',
    )
    const text = clashEvolutionText(card, level)
    assert.ok(text.length > 10, id + ' L' + level + ' has generated text')
    assert.ok(clashCardText(card, level).includes(text), id + ' card text')
    assert.equal(clashStageTitle(id, level), st.title)
  }
  // Level three always does something right away: on entry / cast / install,
  // or on spring for a trap.
  const now = card.kind === 'trap' ? 'spring' : 'enter'
  assert.ok(
    evo[3].abilities.some((ab) => ab.when === now),
    id + ' L3 has an immediate ' + now + ' payoff',
  )
  assert.equal(
    clashEvolutionStage(id, 1),
    undefined,
    id + ' L1 is the base card',
  )
  assert.equal(clashEvolutionText(card, 1), '')
  assert.equal(clashStageTitle(id, 1), card.name)
}

// --- Behavior: real effects through the engine's own hooks.
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
function board(
  units: ClashUnit[],
  team: 'catgirls' | 'bloodfairies' | 'undertow' = 'catgirls',
): ClashState {
  const s = createClash(team, 'riot', 11)
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
  assert.notEqual(next, s, id + ' is playable in alley ' + (lane + 1))
  return next
}
const at = (s: ClashState, uid: number) => s.units.find((u) => u.uid === uid)

// Entry heal: Splice Runner L3 heals every friendly fighter 3, and announces it.
{
  const s = cast(
    board([
      fighter('player', 0, 1, { hp: 2 }),
      fighter('player', 4, 2, { hp: 4 }),
    ]),
    'splice-runner',
    2,
  )
  assert.equal(at(s, 1)!.hp, 5)
  assert.equal(at(s, 2)!.hp, 7)
  assert.equal(s.lastEvolution?.cardId, 'splice-runner')
  assert.match(s.lastEvolution!.detail, /Midnight Ambulance/)
  assert.equal(s.lastEvolution!.effect, 'heal')
}
// Summons: Pocket-Sized Problem L3 fills every empty alley with swarm echoes.
{
  const s = cast(
    board([fighter('player', 0, 1)], 'bloodfairies'),
    's1-pocket-punk',
    2,
  )
  assert.equal(s.units.filter((u) => u.side === 'player').length, 5)
  assert.ok(
    s.units.filter((u) => u.token).every((u) => u.keywords.includes('swarm')),
  )
}
// Precision: Drainpipe Sniper L3 hits the strongest rival for 4 through armor.
{
  const s = cast(
    board(
      [
        fighter('enemy', 1, 7, { attack: 2, armor: 2, hp: 9, maxHp: 9 }),
        fighter('enemy', 3, 8, { attack: 6, armor: 2, hp: 9, maxHp: 9 }),
      ],
      'undertow',
    ),
    's3-undertow-drain-sniper',
    0,
  )
  assert.equal(at(s, 8)!.hp, 5, 'strongest rival, armor ignored')
  assert.equal(at(s, 7)!.hp, 9)
}
// Spell rider: Garrote L3 (trap) springs for boss damage on an arriving rival.
{
  let s = cast(board([], 'catgirls'), 's3-catgirls-garrote', 2)
  const before = s.boss.enemy
  s = passClash(s, 'player')
  s = endClashTurn(s, 'player')
  s.hands.enemy = ['spark-diver']
  s.levels.enemy['spark-diver'] = 1
  s = playClash(s, 'enemy', 'spark-diver', 2)
  assert.equal(
    s.boss.enemy,
    before - 2,
    'Hangman’s Catwalk takes 2 from the rival boss',
  )
}
// Death trigger: Backstreet Organ Donor L2 heals neighbors 3 when it falls.
{
  const s0 = board([
    fighter('player', 1, 1, { hp: 2 }),
    fighter('player', 2, 2, {
      cardId: 's2-catgirls-backstreet-organ-donor',
      level: 2,
      hp: 1,
    }),
    fighter('enemy', 2, 9, { attack: 5 }),
  ])
  s0.active = 'enemy'
  s0.phase = 'attack'
  s0.cursor = 2
  const s = strikeClash(s0, 'enemy')
  assert.equal(at(s, 2), undefined, 'the donor falls')
  assert.equal(at(s, 1)!.hp, 5, 'Spare Parts heals the neighbor 3')
}
// Static aura and hex reach clashPower.
{
  const s = board([
    fighter('player', 1, 1),
    fighter('player', 2, 2, {
      cardId: 's3-catgirls-scalpel-captain',
      level: 2,
    }),
    fighter('enemy', 2, 9, { attack: 4 }),
  ])
  assert.equal(clashPower(s, at(s, 1)!), 4, 'Velvet Command: neighbor +1')
  const t = board(
    [
      fighter('player', 2, 2, { cardId: 's1-static-listener', level: 2 }),
      fighter('enemy', 2, 9, { attack: 4 }),
    ],
    'undertow',
  )
  assert.equal(
    clashPower(t, at(t, 9)!),
    3,
    'Tapped Streetlight: rival across -1',
  )
}
// Gear: an installed evolution rides on the wearer.
{
  const s = cast(
    board([fighter('player', 1, 1, { attack: 3 })]),
    's1-surgical-piercers',
    1,
  )
  assert.equal(at(s, 1)!.gearLevels?.['s1-surgical-piercers'], 3)
  assert.ok(at(s, 1)!.attack >= 3 + 2, 'Patent Breaker sharpens the wearer')
}

// --- Determinism: whole games with evolutions replay exactly.
for (const [a, b, seed] of [
  ['catgirls', 'riot', 5],
  ['undertow', 'exchange', 9],
  ['bloodfairies', 'ironjaw', 13],
] as const) {
  let g = createClash(a, b, seed)
  for (let i = 0; !g.victor && i < 2000; i++)
    g = applyClashCommand(g, chooseClashCpu(g, g.active))
  assert.ok(g.victor, a + ' v ' + b + ' finishes')
  const again = replayClash(a, b, seed, g.commands)
  assert.deepEqual(again.boss, g.boss)
  assert.equal(again.victor, g.victor)
}

// --- Balance: no crew runs away with evolutions on.
{
  const r = sweepClash(6, 501)
  assert.equal(r.roundLimit, 0)
  for (const [team, c] of Object.entries(r.crews)) {
    const rate = c.wins / c.games
    assert.ok(rate > 0.3 && rate < 0.7, team + ' wins ' + rate)
  }
}

console.log(
  'Slime City evolutions: ' +
    Object.keys(CLASH_EVOLUTIONS).length +
    ' data evolutions + ' +
    Object.keys(CLASH_TWISTS).length +
    ' twists cover all 300 cards; L3 payoffs, hooks, replay and balance OK',
)
