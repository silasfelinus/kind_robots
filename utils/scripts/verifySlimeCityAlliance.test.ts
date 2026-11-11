// Slime City ALLIANCE: two-crew 20-card decks and one-time faction powers in
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
  SOLO_DECK_SIZE,
  soloCardPool,
  soloProblems,
  soloStarter,
  swapGeneral,
  validAllianceDeck,
  validSoloDeck,
  type AllianceDeck,
} from '../slimeCity/alliance'
import {
  applyClashCommand,
  canClashPlay,
  canClashPower,
  chooseClashCpu,
  clashOvercharged,
  clashPowers,
  CLASH_BOSS_RANGE,
  clashBossCap,
  clashBossMax,
  createClash,
  passClash,
  replayClash,
  useClashPower,
  type ClashState,
  type ClashUnit,
} from '../slimeCity/clash'
import { validSlimeCityStory, newSlimeCityStory } from '../slimeCity/storySave'
import {
  LIBRARY_MAX_DECKS,
  libraryDeck,
  libraryDeckProblem,
  validLibrary,
} from '../slimeCity/alliance'
import { sweepAlliance } from './slimeCityAllianceBalanceReport'
import { clashBossesFromTerms } from '../slimeCity/clashBouts'
import {
  clashBoutProblem,
  clashOutcome,
  clashRewardMode,
  clashRewardSetupProblem,
  clashRewardStart,
  replayClashTranscript,
  type ClashRewardSetup,
} from '../slimeCity/clashRewards'
import { awardOutcome, newProgression } from '../slimeCity/progression'

const ids = TEAMS.map((t) => t.id)

// Every general x second-faction starter is a legal 20-card deck.
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

// Silas, 2026-11-07 PT: two factions, any cards from either or the mercs
// (30 at first; 20 since Silas, 2026-11-09 PT).
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
problem({ ...base, cards: base.cards.slice(1) }, 'exactly 20')
problem({ ...base, ally: 'catgirls' }, 'two different factions')
problem({ ...base, ally: undefined as unknown as TeamId }, 'second faction')
const outsider = allianceCardPool('riot', 'ironjaw').find(
  (c) => c.team === 'riot',
)!.id
problem(
  {
    ...base,
    cards: [...base.cards.slice(0, ALLIANCE_DECK_SIZE - 1), outsider],
  },
  'come from',
)
problem(
  {
    ...base,
    cards: [...base.cards.slice(0, ALLIANCE_DECK_SIZE - 1), base.cards[0]!],
  },
  'repeat',
)
// Mostly the second faction: legal, the general still owns the power.
const allyHeavy: AllianceDeck = {
  general: 'catgirls',
  ally: 'undertow',
  cards: [
    ...creaturesFirst('undertow').slice(0, 18),
    ...creaturesFirst('catgirls').slice(0, 2),
  ].map((c) => c.id),
}
assert.deepEqual(allianceProblems(allyHeavy), [], 'ally-heavy is legal')
// No signature needed and mercenaries are uncapped.
const mercHeavy: AllianceDeck = {
  general: 'catgirls',
  ally: 'undertow',
  cards: [
    ...creaturesFirst('mercenary').slice(0, 14),
    ...creaturesFirst('undertow').slice(0, 6),
  ].map((c) => c.id),
}
assert.deepEqual(allianceProblems(mercHeavy), [], 'merc-heavy is legal')
// Silas, 2026-11-08 PT: "drop the 12 creature minimum." All-specials is legal.
const allSpells: AllianceDeck = {
  ...base,
  cards: [
    ...pool('catgirls').filter((c) => c.kind !== 'creature'),
    ...pool('undertow').filter((c) => c.kind !== 'creature'),
    ...pool('mercenary').filter((c) => c.kind !== 'creature'),
  ]
    .slice(0, ALLIANCE_DECK_SIZE)
    .map((c) => c.id),
}
assert.deepEqual(allianceProblems(allSpells), [], 'no creature minimum')
assert.ok(validAllianceDeck(allSpells))
const outsiderDeck: AllianceDeck = {
  ...base,
  cards: [...base.cards.slice(0, ALLIANCE_DECK_SIZE - 1), outsider],
}
assert.ok(!validAllianceDeck(outsiderDeck))

// SOLO CLASH: its own format, one faction's 20 cards plus mercenaries.
for (const team of ids) {
  const deck = soloStarter(team)
  assert.equal(deck.length, SOLO_DECK_SIZE)
  assert.deepEqual(soloProblems(team, deck), [], team)
  assert.ok(validSoloDeck(team, deck))
  assert.ok(
    soloCardPool(team).every((c) => c.team === team || c.team === 'mercenary'),
  )
}
const soloMercs = soloCardPool('riot')
  .filter((c) => c.team === 'mercenary')
  .slice(0, 20)
  .map((c) => c.id)
assert.deepEqual(soloProblems('riot', soloMercs), [], 'any mix is legal')
const notRiot = soloCardPool('undertow').find((c) => c.team === 'undertow')!.id
assert.ok(
  soloProblems('riot', [...soloStarter('riot').slice(0, 19), notRiot])
    .join()
    .includes('faction'),
)
assert.ok(
  soloProblems('riot', soloStarter('riot').slice(1)).join().includes('20'),
)

// Clash: alliance decks, ally cards playable, standard Clash untouched.
const alliance = {
  player: allianceStarter('catgirls', 'undertow'),
  enemy: cpuAlliance('ironjaw', 5),
}
const s = createClash('riot', 'riot', 3, { alliance })
assert.equal(s.format, 'alliance')
assert.deepEqual(s.teams, { player: 'catgirls', enemy: 'ironjaw' })
assert.equal(s.decks.player.length + s.hands.player.length, ALLIANCE_DECK_SIZE)
assert.deepEqual(s.powersUsed, { player: [], enemy: [] })
// Silas, 2026-11-10 PT: "two powers in alliance, and a single one shot in solo".
assert.deepEqual(clashPowers(s, 'player'), ['catgirls', 'undertow'])
assert.deepEqual(clashPowers(s, 'enemy'), ['ironjaw', alliance.enemy.ally])
const standard = createClash('catgirls', 'ironjaw', 3)
assert.equal(standard.format, undefined)
assert.deepEqual(clashPowers(standard, 'player'), ['catgirls'])
assert.equal(canClashPower(standard, 'player', 0), true, 'solo has its power')
assert.equal(
  canClashPower(standard, 'player', 0, 'undertow'),
  false,
  'solo has no second power',
)
assert.equal(useClashPower(standard, 'player', 0, 'undertow'), standard)
{
  const fired = useClashPower(standard, 'player', 0)
  assert.deepEqual(fired.powersUsed!.player, ['catgirls'])
  assert.equal(useClashPower(fired, 'player', 0), fired, 'solo: once')
}
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
  assert.deepEqual(used.powersUsed!.player, ['riot'])
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
  assert.equal(at(st, 102)!.guard, 2)
  assert.equal(at(st, 102)!.armor, 0, 'guard is temporary, armor unchanged')
}
{
  const st = useClashPower(board('riot'), 'player')
  assert.equal(at(st, 201)!.hp, 1)
  assert.equal(at(st, 202)!.hp, 7, 'armor softens the fuse box')
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
  assert.equal(st.boss.enemy, before.boss.enemy - 4)
  assert.equal(st.boss.player, clashBossMax('player'), 'capped at max')
}

// ALLIANCE: the ally's power is a second, separate one-shot.
{
  const st = board('riot')
  assert.deepEqual(clashPowers(st, 'player'), ['riot', 'ironjaw'])
  const general = useClashPower(st, 'player')
  const both = useClashPower(general, 'player', 0, 'ironjaw')
  assert.notEqual(both, general, 'ally power still available')
  assert.equal(at(both, 102)!.guard, 2)
  assert.deepEqual(both.powersUsed!.player, ['riot', 'ironjaw'])
  assert.deepEqual(both.commands.at(-1), {
    t: 'power',
    side: 'player',
    lane: 0,
    team: 'ironjaw',
  })
  assert.equal(useClashPower(both, 'player', 0, 'ironjaw'), both, 'once each')
  assert.equal(canClashPower(st, 'player', 0, 'exchange'), false, 'not mine')
  const again = replayClash('riot', 'riot', 9, both.commands, {
    alliance: {
      player: allianceStarter('riot', 'ironjaw'),
      enemy: allianceStarter('riot', 'undertow'),
    },
  })
  assert.deepEqual(again.powersUsed, both.powersUsed, 'ally power replays')
}
// OVERCHARGED: boss at half life or less, or all five alleys filled.
{
  const calm = board('riot')
  assert.equal(clashOvercharged(calm, 'player'), false)
  const low = board('riot')
  low.boss.player = Math.floor(clashBossCap(low, 'player') / 2)
  assert.equal(clashOvercharged(low, 'player'), true, 'half life')
  assert.equal(
    at(useClashPower(low, 'player'), 201),
    undefined,
    'fuse box 4 kills',
  )
  assert.equal(at(useClashPower(low, 'player'), 202)!.hp, 6, 'armor still 1')
  const full = board('bloodfairies')
  full.units = [
    ...full.units.filter((u) => u.side === 'enemy'),
    ...[0, 1, 2, 3, 4].map((lane) => unit('player', lane, 300 + lane)),
  ]
  assert.equal(clashOvercharged(full, 'player'), true, 'five alleys')
  assert.equal(at(useClashPower(full, 'player'), 302)!.surge, 5, 'mosh 5')
  const debt = board('exchange')
  debt.boss.player = 10
  const drained = useClashPower(debt, 'player')
  assert.equal(drained.boss.enemy, debt.boss.enemy - 7, 'debt drains 7')
  assert.match(drained.log.at(-1)!.text, /OVERCHARGE/)
}

// Seeded replay reproduces an alliance match, powers included, and the CPU
// fires each power at most once.
{
  let g = createClash('catgirls', 'ironjaw', 77, { alliance })
  for (let i = 0; !g.victor && i < 800; i++)
    g = applyClashCommand(g, chooseClashCpu(g, g.active))
  assert.ok(g.victor, 'CPU alliance match finishes')
  const powers = g.commands.filter((c) => c.t === 'power')
  assert.ok(powers.length <= 4)
  assert.equal(
    new Set(powers.map((c) => c.side + ':' + (c.team ?? g.teams[c.side]))).size,
    powers.length,
    'each power fires at most once',
  )
  const again = replayClash('catgirls', 'ironjaw', 77, g.commands, {
    alliance,
  })
  assert.deepEqual(again.boss, g.boss)
  assert.equal(again.victor, g.victor)
}

// Balance: no general dominates, the powers actually get used. 30 seeds
// (900 games): the first 6 alone leaned 57% first-seat even before ALLIANCE
// gained its second power, so a 6-seed sample could not hold the 38-62% band.
{
  const r = sweepAlliance(30)
  console.log(
    'CLASH Alliance general win rates (30 acceptance seeds):',
    Object.fromEntries(
      Object.entries(r.generals).map(([crew, record]) => [
        crew,
        ((100 * record.wins) / record.games).toFixed(1) + '%',
      ]),
    ),
  )
  assert.equal(r.roundLimit, 0)
  const first = r.firstSeatWins / r.games
  assert.ok(first > 0.38 && first < 0.62, 'first seat ' + first)
  for (const [id, g] of Object.entries(r.generals)) {
    const rate = g.wins / g.games
    assert.ok(rate >= 0.3 && rate <= 0.7, id + ' wins ' + rate)
    assert.ok(r.powers[id]!.used / g.games > 0.4, id + ' power rarely used')
  }
}

// Story saves keep legal alliances and refuse illegal ones.
{
  const story = { ...newSlimeCityStory(), alliances: { catgirls: base } }
  assert.ok(validSlimeCityStory(JSON.parse(JSON.stringify(story))))
  assert.ok(
    !validSlimeCityStory({ ...story, alliances: { catgirls: outsiderDeck } }),
  )
  const solo = { ...newSlimeCityStory(), soloDecks: { riot: soloMercs } }
  assert.ok(validSlimeCityStory(JSON.parse(JSON.stringify(solo))))
  assert.ok(
    !validSlimeCityStory({
      ...solo,
      soloDecks: { undertow: soloStarter('riot') },
    }),
    'solo deck must match its faction',
  )
  assert.ok(
    !validSlimeCityStory({ ...story, alliances: { riot: base } }),
    'keyed by its general',
  )
}

// City and Story terms move the bosses' starting life, clamped to the band.
{
  assert.deepEqual(clashBossesFromTerms({}), { player: 40, enemy: 40 })
  assert.deepEqual(clashBossesFromTerms({ playerHp: 2, enemyArmor: 1 }), {
    player: 46,
    enemy: 43,
  })
  assert.equal(
    clashBossesFromTerms({ fewerRivals: 9 }).enemy,
    CLASH_BOSS_RANGE[0],
  )
  const st = createClash('exchange', 'riot', 4, {
    bosses: { player: 52, enemy: 30 },
  })
  assert.deepEqual(st.boss, { player: 52, enemy: 30 })
  assert.equal(clashBossCap(st, 'player'), 52)
  assert.equal(clashBossCap(createClash('riot', 'exchange', 4), 'player'), 40)
  const solo = createClash('riot', 'exchange', 4, {
    decks: { player: soloMercs },
  })
  assert.ok(
    [...solo.decks.player, ...solo.hands.player].every((id) =>
      soloMercs.includes(id),
    ),
  )
}

// Reward matches: the server replays the transcript from the issued setup.
{
  const setups: ClashRewardSetup[] = [
    { format: 'solo', cards: soloStarter('riot') },
    { format: 'alliance', deck: allianceStarter('riot', 'exchange') },
  ]
  for (const setup of setups) {
    assert.equal(clashRewardSetupProblem('riot', setup), '')
    let g = clashRewardStart('riot', 'undertow', 4242, setup)
    for (let i = 0; !g.victor && i < 1500; i++)
      g = applyClashCommand(g, chooseClashCpu(g, g.active))
    const transcript = JSON.parse(JSON.stringify(g.commands))
    const ok = replayClashTranscript(
      clashRewardStart('riot', 'undertow', 4242, setup),
      transcript,
    )
    assert.ok('state' in ok, setup.format + ' transcript replays')
    if ('state' in ok) {
      assert.equal(ok.state.victor, g.victor)
      const outcome = clashOutcome('m-1', ok.state)
      assert.equal(outcome.mode, 'clash')
      assert.equal(outcome.teamId, 'riot')
      assert.ok(outcome.plays.length > 0)
    }
    // A forged CPU move is rejected.
    const forged = JSON.parse(JSON.stringify(transcript))
    const cpuAt = forged.findIndex(
      (c: { side: string; t: string }) => c.side === 'enemy' && c.t === 'play',
    )
    forged[cpuAt] = { t: 'pass', side: 'enemy' }
    assert.ok(
      'error' in
        replayClashTranscript(
          clashRewardStart('riot', 'undertow', 4242, setup),
          forged,
        ),
    )
    // A different seed (or deck) does not replay.
    assert.ok(
      'error' in
        replayClashTranscript(
          clashRewardStart('riot', 'undertow', 4243, setup),
          transcript,
        ),
    )
    // Unfinished or padded transcripts are rejected.
    assert.ok(
      'error' in
        replayClashTranscript(
          clashRewardStart('riot', 'undertow', 4242, setup),
          transcript.slice(0, -3),
        ),
    )
    assert.ok(
      'error' in
        replayClashTranscript(
          clashRewardStart('riot', 'undertow', 4242, setup),
          [...transcript, { t: 'end', side: 'player' }],
        ),
    )
  }
  assert.ok(clashRewardSetupProblem('riot', { format: 'solo', cards: [] }))
  assert.ok(
    clashRewardSetupProblem('riot', {
      format: 'alliance',
      deck: allianceStarter('exchange', 'riot'),
    }),
    'general must be the issuing crew',
  )
  assert.ok(clashRewardSetupProblem('riot', { format: 'blackout' }))
  // A verified Clash win pays like before and counts toward "Win a Clash battle".
  const now = new Date('2026-11-08T12:00:00Z')
  const paid = awardOutcome(
    newProgression(now),
    {
      victor: 'player',
      receipt: '["clash","m-2"]',
      mode: 'clash',
      teamId: 'riot',
      plays: ['bomber'],
    },
    now,
  )
  assert.equal(paid.meat - newProgression(now).meat, 45)
  assert.equal(paid.daily.blackoutWins, 1)
  assert.equal(
    awardOutcome(
      paid,
      {
        victor: 'player',
        receipt: '["clash","m-2"]',
        mode: 'clash',
        teamId: 'riot',
        plays: [],
      },
      now,
    ),
    paid,
    'same receipt never pays twice',
  )
}

// Silas, 2026-11-10 PT ("Do it"): SOLO story, CAMPAIGN and TOWER bouts are
// server-issued too. Their terms ride with the deck and replay exactly.
{
  const story: ClashRewardSetup = {
    format: 'solo',
    cards: soloStarter('riot'),
    bout: { kind: 'campaign', bosses: { player: 46, enemy: 34 } },
  }
  const allianceChapter: ClashRewardSetup = {
    format: 'alliance',
    deck: allianceStarter('riot', 'ironjaw'),
    bout: { kind: 'campaign', bosses: { player: 46, enemy: 34 } },
  }
  const tower: ClashRewardSetup = {
    format: 'alliance',
    deck: allianceStarter('riot', 'exchange'),
    bout: { kind: 'tower', bosses: { player: 40, enemy: 38 } },
  }
  assert.equal(clashRewardMode(story), 'clash-campaign')
  assert.equal(clashRewardMode(tower), 'clash-tower')
  assert.equal(clashRewardMode({ format: 'solo', cards: [] }), 'clash')
  for (const setup of [story, allianceChapter, tower]) {
    assert.equal(clashRewardSetupProblem('riot', setup), '')
    const start = clashRewardStart('riot', 'undertow', 777, setup)
    assert.deepEqual(start.boss, setup.bout!.bosses, 'terms move the bosses')
    let g = start
    for (let i = 0; !g.victor && i < 1500; i++)
      g = applyClashCommand(g, chooseClashCpu(g, g.active))
    const transcript = JSON.parse(JSON.stringify(g.commands))
    const ok = replayClashTranscript(
      clashRewardStart('riot', 'undertow', 777, setup),
      transcript,
    )
    assert.ok('state' in ok, setup.bout!.kind + ' bout replays')
    // The same moves under different terms are not the same fight.
    const { bout: _bout, ...plain } = setup
    const plainStart = clashRewardStart(
      'riot',
      'undertow',
      777,
      plain as ClashRewardSetup,
    )
    assert.notDeepEqual(plainStart.boss, start.boss)
  }
  const bad = (bout: unknown, format = 'solo') => clashBoutProblem(format, bout)
  assert.ok(bad(null))
  assert.ok(bad({ kind: 'practice', bosses: { player: 40, enemy: 40 } }))
  assert.ok(bad({ kind: 'rival', bosses: { player: 61, enemy: 40 } }))
  assert.ok(bad({ kind: 'rival', bosses: { player: 40, enemy: 19 } }))
  assert.ok(bad({ kind: 'rival', bosses: { player: 40.5, enemy: 40 } }))
  assert.ok(bad({ kind: 'rival' }))
  assert.ok(
    bad({ kind: 'tower', bosses: { player: 40, enemy: 40 } }),
    'tower fights are Alliance',
  )
  assert.equal(
    bad({ kind: 'campaign', bosses: { player: 40, enemy: 40 } }, 'alliance'),
    '',
    'One journey accepts Solo or Alliance chapters',
  )
  assert.equal(
    bad({ kind: 'contract', bosses: { player: 20, enemy: 60 } }, 'alliance'),
    '',
  )
  assert.ok(
    clashRewardSetupProblem('riot', {
      ...story,
      bout: { kind: 'campaign', bosses: { player: 99, enemy: 20 } },
    }),
  )
}

// COLLECTION's deck library (Silas, 2026-11-10 PT): named Alliance decks
// that may be unfinished while being built, but never break the format.
{
  const starter = allianceStarter('catgirls', 'riot')
  const deck = libraryDeck(starter, 'd1', '  Cat Riot  ')
  assert.equal(deck.name, 'Cat Riot')
  assert.equal(libraryDeckProblem(deck), '')
  assert.equal(
    libraryDeckProblem({ ...deck, cards: deck.cards.slice(0, 7) }),
    '',
    'an unfinished deck is a valid library entry',
  )
  assert.notEqual(libraryDeckProblem({ ...deck, ally: 'catgirls' }), '')
  assert.notEqual(
    libraryDeckProblem({ ...deck, cards: [...deck.cards, deck.cards[0]!] }),
    '',
  )
  const outsider = TEAMS.map((t) => t.id).find(
    (id) => id !== 'catgirls' && id !== 'riot',
  )!
  const foreign = allianceStarter(outsider, 'catgirls').cards.find(
    (id) => cardById(id).team === outsider,
  )!
  assert.notEqual(
    libraryDeckProblem({ ...deck, cards: [...deck.cards.slice(1), foreign] }),
    '',
    'cards outside the two crews and mercenaries are refused',
  )
  assert.equal(validLibrary([deck, { ...deck, id: 'd2' }]), true)
  assert.equal(validLibrary([deck, deck]), false, 'ids are unique')
  assert.equal(
    validLibrary(
      Array.from({ length: LIBRARY_MAX_DECKS + 1 }, (_, i) => ({
        ...deck,
        id: 'd' + i,
      })),
    ),
    false,
  )
  const story = { ...newSlimeCityStory(), library: [deck] }
  assert.equal(validSlimeCityStory(JSON.parse(JSON.stringify(story))), true)
  assert.equal(
    validSlimeCityStory({ ...story, library: [{ ...deck, name: '' }] }),
    false,
  )
}

// The armory and Clash expose the format.
const page = readFileSync('pages/admin/slime-city.vue', 'utf8')
const view = readFileSync('components/slime-city-clash.vue', 'utf8')
const store = readFileSync('stores/slimeCity.ts', 'utf8')
for (const id of [
  // Silas, 2026-11-10 PT: the collection is an Alliance deck library; SOLO
  // story decks open from the SOLO story, not a format switch.
  'slime-deck-library',
  'slime-library-new',
  'slime-library-copy',
  'slime-library-delete',
  'slime-library-name',
  'slime-solo-deck-back',
  'slime-alliance-workbench',
  'slime-ally-picker',
  // Silas, 2026-11-11 PT: faction pictures for general and second faction,
  // and prebuilt starter decks on the shelf.
  'slime-general-picker',
  'slime-starter-',
  'slime-alliance-power',
  'slime-alliance-play',
  'slime-alliance-grid',
  'slime-solo-workbench',
  'slime-solo-grid',
  'slime-solo-play',
  'PLAY CLASH FOR REWARDS',
  // Silas, 2026-11-08 PT: "deck display still doesn't have support for
  // evolutions." Collection and pack cards are Clash faces at LV 1-3.
  'slime-evolution-levels',
  ':level="evolutionLevel"',
  '<SlimeCityClashCardFace :card-id="id" />',
])
  assert.ok(page.includes(id), id)
// The legacy <SlimeCityCard> face, not <SlimeCityCardEvolutions> and the like.
assert.ok(!/<SlimeCityCard[\s/>]/.test(page), 'no legacy card faces left')
for (const id of [
  'clash-format-solo',
  'clash-format-alliance',
  'clash-power',
  'clash-rival-power',
  'clash-kind',
  'clash-back',
  'clash-reward-note',
])
  assert.ok(view.includes(id), id)
// Legacy formats are gone from the game: no LEGACY menu, arena or alleys view.
for (const gone of [
  'slime-legacy-toggle',
  '<SlimeCityArena',
  '<SlimeCityAlleys',
  'slime-format-classic',
])
  assert.ok(!page.includes(gone), gone)
assert.ok(!view.includes('clash-format-standard'))
assert.ok(store.includes('soloDecks: savedSolo.value'))
assert.ok(store.includes('alliances: savedAlliances.value'))

console.log('Slime City ALLIANCE: decks, powers, replay, balance and saves OK')
