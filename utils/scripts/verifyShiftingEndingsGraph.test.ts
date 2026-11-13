import assert from 'node:assert/strict'
import { existsSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  PREMADE_CHARACTERS,
  makeCustomCharacter,
  type ShiftingCharacter,
} from '../shiftingLands/characters'
import { choiceLock, type V6Choice } from '../shiftingLands/deckV6'
import { authoredEndingV7 } from '../shiftingLands/endingsV7'
import { SHARED_ENDING_PLATES } from '../shiftingLands/endingPlates'
import { JOURNEY_WORLD, reachableLocations } from '../shiftingLands/journey'
import {
  ALL_PERSONAL_ENDINGS,
  personalEndingV10,
  personalThreadFlags,
} from '../shiftingLands/personalEndings'
import {
  canChooseTrialV7,
  canPrepareTrialV7,
} from '../shiftingLands/trialRulesV7'
import { trialForLandV8 } from '../shiftingLands/trialRulesV8'
import type { JourneyActionV9 } from '../shiftingLands/saveLedgerV9'
import {
  activeCardV10,
  newJourneyLedgerV10,
  restoreJourneyLedgerV10,
  stepJourneyLedgerV10,
  type JourneyLedgerV10,
} from '../shiftingLands/saveLedgerV10'

// zuzu-shifting-lands/t-045: the endings graph. Every shared ending title (each
// with its own painted plate) and every traveler's own three endings must be
// reachable in real play, and each is witnessed by a concrete traveler, seed
// and action list that replays exactly. A deterministic search over leaning
// policies finds the witnesses; `--write <path>` dumps the graph as JSON.

type Lean =
  | 'random'
  | 'mercy'
  | 'honesty'
  | 'courage'
  | 'cunning'
  | 'ruthlessness'
  | 'thread'
  | 'kind'
// A trial plan names the route to try at each land in turn; the moral
// constellations need mixes (two solidarities and a witness, and so on).
const TRIAL_PLANS = {
  any: [],
  solidarity: ['solidarity'],
  witness: ['witness'],
  tribute: ['tribute'],
  coerce: ['coerce'],
  commons: ['solidarity', 'witness', 'solidarity', 'witness', 'solidarity'],
  record: ['witness', 'evidence', 'witness', 'evidence', 'witness'],
  wayfinders: ['scout', 'evidence', 'scout', 'evidence', 'scout'],
  restitution: ['coerce', 'solidarity', 'tribute', 'solidarity', 'coerce'],
} as const satisfies Record<string, readonly string[]>
type TrialLean = keyof typeof TRIAL_PLANS
const LEANS: Lean[] = [
  'random',
  'mercy',
  'honesty',
  'courage',
  'cunning',
  'ruthlessness',
  'thread',
  'kind',
]
const TRIAL_LEANS = Object.keys(TRIAL_PLANS) as TrialLean[]

const rng = (seed: number) => {
  let state = seed >>> 0 || 1
  return (n: number) => {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0
    return state % n
  }
}

const markGain = (choice: V6Choice, lean: Lean): number =>
  lean === 'random' || lean === 'thread'
    ? 0
    : lean === 'kind'
      ? (choice.success.marks?.mercy ?? 0) +
        (choice.success.marks?.honesty ?? 0)
      : ((choice.success.marks as Record<string, number>)?.[lean] ?? 0)

function play(
  seed: number,
  character: ShiftingCharacter,
  lean: Lean,
  trialLean: TrialLean,
  wantFlags: ReadonlySet<string>,
): JourneyLedgerV10 {
  const roll = rng(seed * 31 + lean.length * 7 + trialLean.length)
  let ledger = newJourneyLedgerV10(seed, character, character.id !== 'custom')
  for (let turn = 0; turn < 160; turn++) {
    const state = ledger.current
    const journey = state.journey
    if (['complete', 'fallen', 'retired'].includes(journey.phase)) break
    let action: JourneyActionV9
    if (journey.phase === 'boss') {
      const land = JOURNEY_WORLD.lands[journey.landIndex]!
      const open = trialForLandV8(land.id)!.choices.filter((choice) =>
        canChooseTrialV7(choice, state, ledger.prepared),
      )
      const plan: readonly string[] = TRIAL_PLANS[trialLean]
      const want = plan.length ? plan[journey.landIndex % plan.length] : null
      // Scouting a trial takes a PREPARE first (canPrepareTrialV7).
      if (
        want === 'scout' &&
        !ledger.prepared.includes(land.id) &&
        canPrepareTrialV7(state, ledger.prepared)
      ) {
        const next = stepJourneyLedgerV10(ledger, { type: 'PREPARE' })
        if (next !== ledger) {
          ledger = next
          continue
        }
      }
      const preferred = open.filter((choice) => choice.id === want)
      const fallback = open.filter((choice) => plan.includes(choice.id))
      const from = preferred.length
        ? preferred
        : fallback.length
          ? fallback
          : open
      action = { type: 'TRIAL', choiceId: from[roll(from.length)]!.id }
    } else if (journey.active) {
      const card = activeCardV10(ledger)!
      const open = card.choices.filter((choice) => !choiceLock(state, choice))
      let from = open
      if (lean === 'thread') {
        const wanted = open.filter((choice) =>
          choice.success.add_flags.some((flag) => wantFlags.has(flag)),
        )
        if (wanted.length) from = wanted
      } else if (lean !== 'random') {
        const best = Math.max(...open.map((choice) => markGain(choice, lean)))
        if (best > 0)
          from = open.filter((choice) => markGain(choice, lean) === best)
      }
      action = { type: 'CHOOSE', choiceId: from[roll(from.length)]!.id }
    } else {
      const open = reachableLocations(journey).filter(
        (id) => !journey.resolved.some((result) => result.locationId === id),
      )
      action = { type: 'TRAVEL', locationId: open[roll(open.length)]! }
    }
    const next = stepJourneyLedgerV10(ledger, action)
    if (next === ledger) break
    ledger = next
  }
  return ledger
}

type Witness = {
  traveler: string
  seed: number
  lean: Lean
  trialLean: TrialLean
  phase: string
  actions: number
}
const shared = new Map<string, Witness>()
const personal = new Map<string, Witness>()
const replayChecked: JourneyLedgerV10[] = []

const willa = makeCustomCharacter({
  name: 'Willa Thorn',
  species: 'otter',
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
const TRAVELERS: ShiftingCharacter[] = [...PREMADE_CHARACTERS, willa]
const PERSONAL_IDS = new Set(ALL_PERSONAL_ENDINGS.map((ending) => ending.id))
const SHARED_TITLES = new Set(Object.keys(SHARED_ENDING_PLATES))
let runs = 0

for (const character of TRAVELERS) {
  const thread = personalThreadFlags(character.id)
  for (const trialLean of TRIAL_LEANS)
    for (const lean of LEANS)
      for (let seed = 1; seed <= 24; seed++) {
        // 'thread' with an even seed chases the traveler's good turns, with an
        // odd seed its dark turn, so all three own endings get a chance.
        const wantFlags = new Set<string>(
          thread ? (seed % 2 ? thread.dark : thread.hopeful) : [],
        )
        const ledger = play(seed, character, lean, trialLean, wantFlags)
        runs++
        const state = ledger.current
        const phase = state.journey.phase
        if (!['complete', 'fallen', 'retired'].includes(phase)) continue
        const witness: Witness = {
          traveler: character.id,
          seed,
          lean,
          trialLean,
          phase,
          actions: ledger.actions.length,
        }
        const ending = authoredEndingV7(state, ledger.trialResults)
        if (ending && !shared.has(ending.title)) {
          shared.set(ending.title, witness)
          replayChecked.push(ledger)
        }
        const mine = personalEndingV10(character.id, state, ledger.trialResults)
        if (mine && !personal.has(mine.personal.endingId)) {
          personal.set(mine.personal.endingId, witness)
          replayChecked.push(ledger)
        }
      }
}

// Every witness replays exactly from its saved form.
for (const ledger of replayChecked)
  assert.deepEqual(
    restoreJourneyLedgerV10(JSON.parse(JSON.stringify(ledger))),
    ledger,
    'a witness replays exactly',
  )

const missingShared = [...SHARED_TITLES].filter((title) => !shared.has(title))
const missingPersonal = [...PERSONAL_IDS].filter((id) => !personal.has(id))
for (const title of shared.keys())
  assert.ok(SHARED_TITLES.has(title), `"${title}" has a painted plate`)
for (const title of SHARED_TITLES)
  assert.ok(
    existsSync(
      fileURLToPath(
        new URL(
          `../../public/shifting-lands/endings/${SHARED_ENDING_PLATES[title]}.webp`,
          import.meta.url,
        ),
      ),
    ),
    `${title} plate ships`,
  )
assert.deepEqual(missingPersonal, [], 'every own ending has a witness')
assert.deepEqual(missingShared, [], 'every shared ending has a witness')

const out = process.argv.indexOf('--write')
if (out > 0)
  writeFileSync(
    process.argv[out + 1]!,
    JSON.stringify(
      {
        runs,
        shared: Object.fromEntries(shared),
        personal: Object.fromEntries(personal),
      },
      null,
      1,
    ),
  )

console.log(
  `Shifting Lands endings graph passed: ${shared.size}/${SHARED_TITLES.size} shared endings and ${personal.size}/${PERSONAL_IDS.size} own endings witnessed across ${runs} journeys by ${TRAVELERS.length} travelers; every witness replays exactly`,
)
