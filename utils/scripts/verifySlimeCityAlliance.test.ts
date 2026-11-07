// Slime City ALLIANCE: two-crew 30-card decks and one-time faction powers in
// Clash, plus the armory's alliance builder and story-save validation.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { TEAMS, cardById, type TeamId } from '../slimeCity/prototypes'
import {
  ALLIANCE_DECK_SIZE,
  FACTION_POWERS,
  allianceCardPool,
  allianceProblems,
  allianceStarter,
  cpuAlliance,
  swapGeneral,
  validAllianceDeck,
  type AllianceDeck,
} from '../slimeCity/alliance'
import {
  applyClashCommand,
  canClashPlay,
  canClashPower,
  chooseClashCpu,
  clashBossMax,
  createClash,
  passClash,
  replayClash,
  useClashPower,
  type ClashState,
  type ClashUnit,
} from '../slimeCity/clash'
import { validSlimeCityStory, newSlimeCityStory } from '../slimeCity/storySave'
import { sweepAlliance } from './slimeCityAllianceBalanceReport'

const ids = TEAMS.map((t) => t.id)

// Every general x second-faction starter is a legal 30-card deck.
for (const general of ids) {
  for (const ally of ids.filter((id) => id !== general)) {
    const deck = allianceStarter(general, ally)
    assert.deepEqual(allianceProblems(deck), [], general + '+' + ally)
    assert.equal(deck.cards.length, ALLIANCE_DECK_SIZE)
    assert.ok(deck.cards.some((id) => cardById(id).team === ally))
    assert.ok(validAllianceDeck(deck))
    // Swapping the general keeps the same two factions and cards legal.
    const swapped = swapGeneral(deck)
    assert.equal(swapped.general, ally)
    assert.equal(swapped.ally, general)
    assert.deepEqual(allianceProblems(swapped), [])
  }
  assert.equal(FACTION_POWERS[general].team, general)
  assert.ok(FACTION_POWERS[general].text.length > 10)
}

// Silas, 2026-11-07 PT: two factions, any 30 cards from either or the mercs.
const base = allianceStarter('catgirls', 'undertow')
const problem = (deck: AllianceDeck, text: string) =>
  assert.ok(
    allianceProblems(deck).some((p) => p.includes(text)),
    'expected "' + text + '" in ' + allianceProblems(deck).join(' | '),
  )
const pool = (team: string) =>
  allianceCardPool('catgirls', 'undertow').filter((c) => c.team === team)
const creaturesFirst = (team: string) =>
  [...pool(team)].sort(
    (a, b) => Number(b.kind === 'creature') - Number(a.kind === 'creature'),
  )
problem({ ...base, cards: base.cards.slice(1) }, 'exactly 30')
problem({ ...base, ally: 'catgirls' }, 'two different factions')
problem({ ...base, ally: undefined as unknown as TeamId }, 'second faction')
const outsider = allianceCardPool('riot', 'ironjaw').find(
  (c) => c.team === 'riot',
)!.id
problem({ ...base, cards: [...base.cards.slice(0, 29), outsider] }, 'come from')
problem(
  { ...base, cards: [...base.cards.slice(0, 29), base.cards[0]!] },
  'repeat',
)
// Mostly the second faction: legal, the general still owns the power.
const allyHeavy: AllianceDeck = {
  general: 'catgirls',
  ally: 'undertow',
  cards: [
    ...creaturesFirst('undertow').slice(0, 28),
    ...creaturesFirst('catgirls').slice(0, 2),
  ].map((c) => c.id),
}
assert.deepEqual(allianceProblems(allyHeavy), [], 'ally-heavy is legal')
// No signature needed and mercenaries are uncapped.
const mercHeavy: AllianceDeck = {
  general: 'catgirls',
  ally: 'undertow',
  cards: [
    ...creaturesFirst('mercenary').slice(0, 20),
    ...creaturesFirst('undertow').slice(0, 10),
  ].map((c) => c.id),
}
assert.deepEqual(allianceProblems(mercHeavy), [], 'merc-heavy is legal')
// A deck with almost no fighters cannot hold the alleys.
const allSpells: AllianceDeck = {
  ...base,
  cards: [
    ...pool('catgirls').filter((c) => c.kind !== 'creature'),
    ...pool('undertow').filter((c) => c.kind !== 'creature'),
    ...pool('mercenary').filter((c) => c.kind !== 'creature'),
  ]
    .slice(0, 30)
    .map((c) => c.id),
}
problem(allSpells, 'creatures')
assert.ok(!validAllianceDeck(allSpells))

// Clash: alliance decks, ally cards playable, standard Clash untouched.
const alliance = {
  player: allianceStarter('catgirls', 'undertow'),
  enemy: cpuAlliance('ironjaw', 5),
}
const s = createClash('riot', 'riot', 3, { alliance })
assert.equal(s.format, 'alliance')
assert.deepEqual(s.teams, { player: 'catgirls', enemy: 'ironjaw' })
assert.equal(s.decks.player.length + s.hands.player.length, ALLIANCE_DECK_SIZE)
assert.deepEqual(s.powerUsed, { player: false, enemy: false })
const standard = createClash('catgirls', 'ironjaw', 3)
assert.equal(standard.format, undefined)
assert.equal(canClashPower(standard, 'player', 0), false)
assert.equal(useClashPower(standard, 'player', 0), standard)
// An ally card in hand can be played.
const allyCard = alliance.player.cards.find(
  (id) => cardById(id).team === 'undertow' && cardById(id).kind === 'creature',
)!
s.hands.player = [allyCard, ...s.hands.player.slice(1)]
assert.ok(canClashPlay(s, 'player', allyCard, 0))
const solo = createClash('catgirls', 'ironjaw', 3)
solo.hands.player = [allyCard]
assert.equal(canClashPlay(solo, 'player', allyCard, 0), false)

function unit(
  side: 'player' | 'enemy',
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
function board(general: TeamId): ClashState {
  const out = createClash(general, 'riot', 9, {
    alliance: {
      player: allianceStarter(
        general,
        general === 'ironjaw' ? 'exchange' : 'ironjaw',
      ),
      enemy: allianceStarter('riot', 'undertow'),
    },
  })
  out.units = [
    unit('player', 0, 101, { hp: 3, rooted: true }),
    unit('player', 1, 102, { hp: 8 }),
    unit('enemy', 0, 201, { hp: 4 }),
    unit('enemy', 2, 202, { hp: 9, maxHp: 9, armor: 1 }),
  ]
  return out
}
const at = (st: ClashState, uid: number) => st.units.find((u) => u.uid === uid)

// One-time use, and it does not spend a card play.
{
  const st = board('riot')
  const used = useClashPower(st, 'player')
  assert.notEqual(used, st)
  assert.equal(used.powerUsed!.player, true)
  assert.equal(used.plays.player, st.plays.player)
  assert.equal(useClashPower(used, 'player'), used, 'second use refused')
  assert.equal(canClashPower(used, 'player'), false)
  assert.deepEqual(used.commands.at(-1), {
    t: 'power',
    side: 'player',
    lane: 0,
  })
  // Not the rival's turn, not during attacks.
  assert.equal(canClashPower(st, 'enemy'), false)
  assert.equal(canClashPower(passClash(st, 'player'), 'player'), false)
}
// Each power does what its text says.
{
  const st = useClashPower(board('catgirls'), 'player')
  assert.equal(at(st, 101)!.hp, 8)
  assert.equal(at(st, 101)!.rooted, false)
  assert.equal(at(st, 102)!.hp, 8)
  assert.equal(at(st, 101)!.surge, 2)
  assert.equal(at(st, 101)!.fresh, false)
}
{
  const st = useClashPower(board('bloodfairies'), 'player')
  assert.equal(at(st, 101)!.surge, 3)
  assert.equal(at(st, 102)!.surge, 3)
  assert.equal(at(st, 201)!.surge, 0)
}
{
  const st = useClashPower(board('ironjaw'), 'player')
  assert.equal(at(st, 102)!.guard, 3)
  assert.equal(at(st, 102)!.armor, 0, 'guard is temporary, armor unchanged')
}
{
  const st = useClashPower(board('riot'), 'player')
  assert.equal(at(st, 201)!.hp, 2)
  assert.equal(at(st, 202)!.hp, 8, 'armor softens the fuse box')
  assert.equal(at(st, 101)!.hp, 3, 'friendly fighters untouched')
}
{
  const before = board('undertow')
  assert.equal(canClashPower(before, 'player', 1), false, 'needs a rival')
  const st = useClashPower(before, 'player', 2)
  assert.equal(at(st, 202)!.hp, 4, 'ignores armor')
  assert.equal(at(st, 202)!.rooted, true)
  assert.equal(at(useClashPower(before, 'player', 0), 201), undefined)
}
{
  const before = board('exchange')
  before.boss.player = clashBossMax('player') - 2
  const st = useClashPower(before, 'player')
  assert.equal(st.boss.enemy, before.boss.enemy - 5)
  assert.equal(st.boss.player, clashBossMax('player'), 'capped at max')
}

// Seeded replay reproduces an alliance match, powers included, and the CPU
// fires each power at most once.
{
  let g = createClash('catgirls', 'ironjaw', 77, { alliance })
  for (let i = 0; !g.victor && i < 800; i++)
    g = applyClashCommand(g, chooseClashCpu(g, g.active))
  assert.ok(g.victor, 'CPU alliance match finishes')
  const powers = g.commands.filter((c) => c.t === 'power')
  assert.ok(powers.length <= 2)
  assert.equal(
    new Set(powers.map((c) => c.side)).size,
    powers.length,
    'one power per side',
  )
  const again = replayClash('catgirls', 'ironjaw', 77, g.commands, {
    alliance,
  })
  assert.deepEqual(again.boss, g.boss)
  assert.equal(again.victor, g.victor)
}

// Balance: no general dominates, the powers actually get used.
{
  const r = sweepAlliance(6)
  assert.equal(r.roundLimit, 0)
  const first = r.firstSeatWins / r.games
  assert.ok(first > 0.38 && first < 0.62, 'first seat ' + first)
  for (const [id, g] of Object.entries(r.generals)) {
    const rate = g.wins / g.games
    assert.ok(rate > 0.3 && rate < 0.7, id + ' wins ' + rate)
    assert.ok(r.powers[id]!.used / g.games > 0.4, id + ' power rarely used')
  }
}

// Story saves keep legal alliances and refuse illegal ones.
{
  const story = { ...newSlimeCityStory(), alliances: { catgirls: base } }
  assert.ok(validSlimeCityStory(JSON.parse(JSON.stringify(story))))
  assert.ok(
    !validSlimeCityStory({ ...story, alliances: { catgirls: allSpells } }),
  )
  assert.ok(
    !validSlimeCityStory({ ...story, alliances: { riot: base } }),
    'keyed by its general',
  )
}

// The armory and Clash expose the format.
const page = readFileSync('pages/admin/slime-city.vue', 'utf8')
const view = readFileSync('components/slime-city-clash.vue', 'utf8')
const store = readFileSync('stores/slimeCity.ts', 'utf8')
for (const id of [
  'slime-format-alliance',
  'slime-alliance-workbench',
  'slime-ally-picker',
  'slime-alliance-swap',
  'slime-alliance-power',
  'slime-alliance-play',
  'slime-alliance-grid',
])
  assert.ok(page.includes(id), id)
for (const id of ['clash-format-alliance', 'clash-power', 'clash-rival-power'])
  assert.ok(view.includes(id), id)
assert.ok(store.includes('alliances: savedAlliances.value'))

console.log('Slime City ALLIANCE: decks, powers, replay, balance and saves OK')
