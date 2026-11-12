import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { achievementsForGame } from '../achievements/gameAchievements'
import type { TrialResult } from '../shiftingLands/authoredBosses'
import {
  FENNEC_SIBLINGS,
  JEFFERY_MITTENS,
  ZUZU,
  makeCustomCharacter,
  type ShiftingCharacter,
} from '../shiftingLands/characters'
import { choiceSpends, v6Card } from '../shiftingLands/deckV6'
import { JOURNEY_WORLD, type JourneyRoll } from '../shiftingLands/journey'
import {
  journeyDeedCodes,
  type DeedLedger,
} from '../shiftingLands/journeyDeeds'
import { newJourneyLedgerV7 } from '../shiftingLands/saveLedgerV7'
import {
  newJourneyLedgerV10,
  restoreJourneyLedgerV10,
  type JourneyLedgerV10,
} from '../shiftingLands/saveLedgerV10'
import type { FollowerOutcomeV9 } from '../shiftingLands/saveLedgerV9'
import { trialForLandV7 } from '../shiftingLands/trialRulesV7'

// zuzu-shifting-lands/t-051: achievements come from the difference one played
// step makes to the journey ledger, and from nothing else.

const read = (path: string) =>
  readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')
const P = 'zuzu-shifting-lands-'
const lands = JOURNEY_WORLD.lands

function trial(
  index: number,
  choiceId: string,
  character: ShiftingCharacter = ZUZU,
  dice: [number, number] = [6, 6],
) {
  const land = lands[index]!
  const choice = trialForLandV7(land.id)!.choices.find(
    (entry) => entry.id === choiceId,
  )!
  assert.ok(choice, `${land.id}/${choiceId} exists`)
  const modifier = character.skills[choice.skill]
  const total = dice[0] + dice[1] + modifier
  const roll: JourneyRoll = {
    landId: land.id,
    locationId: land.boss.id,
    dice,
    skill: choice.skill,
    modifier,
    difficulty: choice.target,
    total,
    success: total >= choice.target,
  }
  const turn = index * 10 + 8
  return {
    boss: {
      landId: land.id,
      id: land.boss.id,
      turn,
      approach: (choiceId === 'confront' ? 'challenge' : 'parley') as
        | 'challenge'
        | 'parley',
      roll,
    },
    result: {
      landId: land.id,
      bossId: land.boss.id,
      choiceId,
      turn,
      roll,
      resultText: 'Recorded result',
      hpChange: 0,
      provisionChange: 0,
    } satisfies TrialResult,
  }
}

type Run = {
  character?: ShiftingCharacter
  approaches?: string[]
  phase?: 'explore' | 'boss' | 'complete' | 'fallen' | 'retired'
  mercy?: number
  honesty?: number
  follower?: FollowerOutcomeV9['choiceId'][]
  rewards?: string[]
  failedTrials?: string[]
}

// A V10 ledger at a chosen point of a journey. Only the fields the deed
// reader looks at are shaped; everything else is a real new ledger.
function run(opts: Run = {}): JourneyLedgerV10 {
  const character = opts.character ?? ZUZU
  const base = newJourneyLedgerV10(4242, character)
  const passed = (opts.approaches ?? []).map((choiceId, index) =>
    trial(index, choiceId, character),
  )
  const failed = (opts.failedTrials ?? []).map(
    (choiceId) => trial(passed.length, choiceId, character, [1, 1]).result,
  )
  const terminal = ['complete', 'fallen', 'retired'].includes(opts.phase ?? '')
  return {
    ...base,
    trialResults: [...passed.map((item) => item.result), ...failed],
    usedRewards: opts.rewards ?? [],
    followerHistory: (opts.follower ?? []).map((choiceId, turn) => ({
      choiceId,
      turn,
      landId: 'cave',
      text: 'Recorded',
    })),
    current: {
      ...base.current,
      marks: {
        ...base.current.marks,
        mercy: opts.mercy ?? 0,
        honesty: opts.honesty ?? 0,
      },
      journey: {
        ...base.current.journey,
        landIndex: terminal ? 4 : Math.min(passed.length, 4),
        phase: opts.phase ?? 'explore',
        bosses: passed.map((item) => item.boss),
      },
    },
  }
}

const deeds = (before: DeedLedger, after: DeedLedger, type = 'TRIAL') =>
  journeyDeedCodes(before, after, { type }).map((code) => code.slice(P.length))

// Every catalog entry is awarded by the deed reader, and nothing else is.
const catalog = achievementsForGame('zuzu-shifting-lands')
const deedSource = read('../shiftingLands/journeyDeeds.ts')
const awarded = new Set(
  [...deedSource.matchAll(/'zuzu-shifting-lands-([a-z-]+)'/g)].map(
    (match) => match[1]!,
  ),
)
assert.deepEqual(
  [...awarded].sort(),
  catalog.map((entry) => entry.key).sort(),
  'journeyDeeds.ts awards exactly the Shifting Lands catalog',
)
assert.ok(catalog.length >= 12 && catalog.length <= 30)
for (const entry of catalog) {
  assert.doesNotMatch(
    entry.message + ' ' + entry.tooltip,
    /\bZuzu\b/,
    `${entry.key}: anyone can walk the road now, so speak to "you"`,
  )
}

// Nothing happens without a change: a restored or reloaded ledger compared
// with itself earns nothing, however much of the journey it holds.
const finished = run({
  approaches: ['solidarity', 'solidarity', 'witness', 'scout', 'confront'],
  phase: 'complete',
  mercy: 4,
  honesty: 2,
  follower: ['stand-as-witness'],
  rewards: ['willow-bark-dose'],
})
assert.deepEqual(deeds(finished, finished), [])
const restored = restoreJourneyLedgerV10(
  JSON.parse(JSON.stringify(newJourneyLedgerV10(77, JEFFERY_MITTENS))),
)!
assert.ok(restored)
assert.deepEqual(deeds(restored, restored), [])

// Land trials, in order. Dustwater and the Storm-Crow Depths are new; the
// Homestead and the Tablelands keep their live codes.
assert.deepEqual(deeds(run(), run({ approaches: ['parley'] })), ['open-door'])
assert.deepEqual(
  deeds(
    run({ approaches: ['parley'] }),
    run({ approaches: ['parley', 'parley'] }),
  ),
  ['crossing-gate'],
)
assert.deepEqual(
  deeds(
    run({ approaches: ['parley', 'parley'] }),
    run({ approaches: ['parley', 'parley', 'parley'] }),
  ),
  ['canyon-warden'],
)
assert.deepEqual(
  deeds(
    run({ approaches: ['parley', 'parley', 'parley'] }),
    run({ approaches: ['parley', 'parley', 'parley', 'parley'] }),
  ),
  ['storm-crow-depths'],
)

// Trial routes: witness and scout count only when they succeed.
assert.deepEqual(deeds(run(), run({ approaches: ['witness'] })), [
  'open-door',
  'witness-trial',
])
assert.deepEqual(deeds(run(), run({ failedTrials: ['witness'] })), [])
assert.deepEqual(deeds(run(), run({ approaches: ['scout'] })), [
  'open-door',
  'scouted',
])

// Travelers: Jeffery and the fennec siblings earn their own trial deeds.
assert.deepEqual(
  deeds(
    run({ character: JEFFERY_MITTENS }),
    run({ character: JEFFERY_MITTENS, approaches: ['parley'] }),
  ),
  ['open-door', 'mittens-road'],
)
assert.deepEqual(
  deeds(
    run({ character: JEFFERY_MITTENS }),
    run({ character: JEFFERY_MITTENS, failedTrials: ['parley'] }),
  ),
  [],
)
assert.deepEqual(
  deeds(
    run({ character: FENNEC_SIBLINGS }),
    run({ character: FENNEC_SIBLINGS, approaches: ['parley'] }),
  ),
  ['open-door', 'fennec-road'],
)

// Against the odds: the dice alone had to show 10 or more.
const longShot = (dice: [number, number]) => {
  const before = run({ approaches: ['parley', 'parley', 'parley', 'parley'] })
  const verge = trial(4, 'confront', ZUZU, dice)
  return deeds(before, {
    ...before,
    trialResults: [...before.trialResults, verge.result],
    current: {
      ...before.current,
      journey: {
        ...before.current.journey,
        bosses: [...before.current.journey.bosses, verge.boss],
      },
    },
  })
}
assert.deepEqual(longShot([5, 5]), ['hard-roll'], 'needed 10 of 13 - 3')
assert.deepEqual(longShot([4, 5]), [], 'a failed long shot is just a failure')

// Rewards and the kitchen sister.
assert.deepEqual(
  deeds(run(), run({ rewards: ['willow-bark-dose'] }), 'USE_REWARD'),
  ['healer'],
)
assert.deepEqual(
  deeds(run(), run({ follower: ['stand-as-witness'] }), 'FOLLOWER'),
  ['kitchen-loyal'],
)
assert.deepEqual(
  deeds(
    run({ follower: ['sell-family-ledger'] }),
    run({ follower: ['sell-family-ledger', 'offer-restitution'] }),
    'FOLLOWER',
  ),
  ['restitution'],
)
assert.deepEqual(
  deeds(run(), run({ follower: ['sell-family-ledger'] }), 'FOLLOWER'),
  [],
  'selling the ledger is never an achievement',
)

// Endings fire once, on the step that ends the journey.
const road = ['solidarity', 'solidarity', 'witness', 'parley', 'parley']
const almost = run({ approaches: road.slice(0, 4), mercy: 4, honesty: 2 })
const ended = run({ approaches: road, phase: 'complete', mercy: 4, honesty: 2 })
assert.deepEqual(deeds(almost, ended), [
  'beyond-the-verge',
  'honest-road',
  'wide-road',
  'constellation',
])
assert.deepEqual(deeds(ended, ended), [])
assert.deepEqual(
  deeds(
    run({ approaches: ['witness', 'witness', 'evidence'], honesty: 3 }),
    run({
      approaches: ['witness', 'witness', 'evidence'],
      honesty: 3,
      phase: 'retired',
    }),
    'RETREAT',
  ),
  ['turn-back', 'constellation'],
  'a retired journey can still be star-read',
)
assert.deepEqual(
  deeds(
    run({ approaches: ['coerce', 'tribute', 'solidarity', 'parley'] }),
    run({
      approaches: ['coerce', 'tribute', 'solidarity', 'parley', 'parley'],
      phase: 'complete',
      mercy: 4,
      honesty: 2,
    }),
  ),
  ['beyond-the-verge', 'debt-carried'],
  'a bridge without forgiveness is reckoning, not a hopeful constellation',
)
assert.deepEqual(
  deeds(
    run({ approaches: ['tribute', 'tribute', 'tribute', 'parley'] }),
    run({
      approaches: ['tribute', 'tribute', 'tribute', 'parley', 'parley'],
      phase: 'complete',
    }),
  ),
  ['beyond-the-verge'],
  'the franchise of hunger earns no honour',
)
assert.deepEqual(
  deeds(
    run({ approaches: ['parley'] }),
    run({ approaches: ['parley'], phase: 'fallen' }),
  ),
  [],
  'falling on the road is not an achievement',
)

// A custom traveler who completes the road writes their own legend.
const custom = makeCustomCharacter({
  name: 'Ash Wren',
  species: 'hare',
  pronouns: 'they',
  skills: {
    steel: 2,
    awareness: 3,
    wits: 2,
    bearing: 2,
    resolve: 2,
    insight: 2,
  },
})!
assert.ok(custom)
assert.ok(
  deeds(
    run({
      character: custom,
      approaches: ['parley', 'parley', 'parley', 'parley'],
    }),
    run({
      character: custom,
      approaches: ['parley', 'parley', 'parley', 'parley', 'parley'],
      phase: 'complete',
    }),
  ).includes('own-legend'),
)
assert.ok(
  !deeds(almost, ended).includes('own-legend'),
  'Zuzu is not a custom traveler',
)

// Older saves still earn trial and completion deeds, and nothing a V7 moral
// ending would decide before that version existed.
const v7 = newJourneyLedgerV7(9)
const v7Passed = trial(0, 'parley')
assert.deepEqual(
  journeyDeedCodes(
    v7,
    {
      ...v7,
      trialResults: [v7Passed.result],
      current: {
        ...v7.current,
        journey: { ...v7.current.journey, bosses: [v7Passed.boss] },
      },
    },
    { type: 'TRIAL' },
  ),
  [P + 'open-door'],
)

// Spending a deed: the card in front of you offers a route that uses up the
// medicine you carry. Taking it (and only it) is "Paid in Deeds".
const fever = v6Card('no-fever-past-the-rope')!
const brew = fever.choices.find(
  (choice) => choice.id === 'brew-a-fever-draught',
)!
assert.deepEqual(choiceSpends(fever.id, brew), ['deed-carries-medicine'])
const plain = fever.choices.find(
  (choice) => !choiceSpends(fever.id, choice).length,
)!
assert.ok(plain, 'the fever card also has a route that spends nothing')
const atFever = (() => {
  const base = run()
  return {
    ...base,
    current: {
      ...base.current,
      flags: ['deed-carries-medicine'],
      drawn: { [fever.locationId]: fever.id },
      journey: { ...base.current.journey, active: fever.locationId },
    },
  }
})()
const afterChoosing = (choiceId: string) => ({
  ...atFever,
  current: {
    ...atFever.current,
    outcomes: [
      ...atFever.current.outcomes,
      {
        locationId: fever.locationId,
        encounterId: fever.id,
        choiceId,
        turn: 1,
        roll: null,
        success: true,
        resultText: '',
        hpChange: 0,
        provisionChange: 0,
        flags: [],
        marks: {},
      },
    ],
  },
})
assert.deepEqual(
  journeyDeedCodes(atFever, afterChoosing(brew.id), {
    type: 'CHOOSE',
    choiceId: brew.id,
  }),
  [P + 'spent-deed'],
)
assert.deepEqual(
  journeyDeedCodes(atFever, afterChoosing(plain.id), {
    type: 'CHOOSE',
    choiceId: plain.id,
  }),
  [],
  'an ordinary route spends nothing',
)
assert.deepEqual(
  journeyDeedCodes(atFever, atFever, { type: 'CHOOSE', choiceId: brew.id }),
  [],
  'a refused choice spends nothing',
)

// The store awards only from dispatch, never from initialize() or fresh().
const store = read('../../stores/shiftingLandsJourneyStore.ts')
assert.equal(
  (store.match(/awardJourneyDeeds\(/g) ?? []).length,
  2,
  'awardJourneyDeeds is declared once and called once',
)
assert.match(
  store,
  /persist\(\)\s*awardJourneyDeeds\(active, next, action\)\s*return true/,
)
const initialize = store.slice(
  store.indexOf('function initialize()'),
  store.indexOf('function persist()'),
)
assert.doesNotMatch(initialize, /awardJourneyDeeds|rewardAchievement/)
const rail = read('../../components/shifting-lands-character-rail.vue')
assert.match(
  rail,
  /<GameAchievementStrip\s+game="zuzu-shifting-lands"\s+layout="icons"/,
  'the character sheet shows the road achievements',
)

console.log(
  `Shifting Lands journey deeds verified: ${catalog.length} achievements, awarded only by played steps.`,
)
