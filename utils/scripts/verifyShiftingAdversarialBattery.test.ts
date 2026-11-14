import assert from 'node:assert/strict'
import {
  PREMADE_CHARACTERS,
  makeCustomCharacter,
  type ShiftingCharacter,
} from '../shiftingLands/characters'
import { choiceLock, type V6Choice } from '../shiftingLands/deckV6'
import { JOURNEY_WORLD, reachableLocations } from '../shiftingLands/journey'
import { personalEndingV10 } from '../shiftingLands/personalEndings'
import { authoredEndingV7 } from '../shiftingLands/endingsV7'
import {
  canChooseTrialV7,
  canPrepareTrialV7,
} from '../shiftingLands/trialRulesV7'
import { trialForLandV8 } from '../shiftingLands/trialRulesV8'
import {
  kitchenNoviceOptionsV9,
  type JourneyActionV9,
} from '../shiftingLands/saveLedgerV9'
import {
  activeCardV10,
  newJourneyLedgerV10,
  restoreJourneyLedgerV10,
  stepJourneyLedgerV10,
  type JourneyLedgerV10,
} from '../shiftingLands/saveLedgerV10'

// zuzu-shifting-lands t-017 / t-046: the adversarial playtest battery. Seven
// reproducible policies (kind, ruthless, greedy, cautious, mixed, chaotic and
// pathological) play every traveler across many seeds through the real V10
// reducer. Every journey must end (no soft lock), keep HP and provisions in
// range, refuse every illegal or forged action without throwing, and replay
// exactly from its saved form; tampered saves are refused. A per-policy
// balance table (survival, deaths by land) is printed for the playtest notes.

type Policy =
  | 'kind'
  | 'ruthless'
  | 'greedy'
  | 'cautious'
  | 'mixed'
  | 'chaotic'
  | 'pathological'
const POLICIES: Policy[] = [
  'kind',
  'ruthless',
  'greedy',
  'cautious',
  'mixed',
  'chaotic',
  'pathological',
]
const SEEDS = Number(process.argv[2] ?? 12)
const MAX_TURNS = 200

const rng = (seed: number) => {
  let state = seed >>> 0 || 1
  return (n: number) => {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0
    // High bits: an LCG's low bits cycle (bit 0 just alternates).
    return (state >>> 16) % n
  }
}
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

const marks = (choice: V6Choice) =>
  (choice.success.marks ?? {}) as Record<string, number>
const score: Record<
  Exclude<Policy, 'chaotic' | 'pathological' | 'mixed'>,
  (c: V6Choice) => number
> = {
  kind: (c) => (marks(c).mercy ?? 0) + (marks(c).honesty ?? 0),
  ruthless: (c) => (marks(c).ruthlessness ?? 0) + (marks(c).cunning ?? 0),
  greedy: (c) => c.success.provisions_delta + (c.cost?.provisions ?? 0),
  cautious: (c) =>
    (c.roll ? 0 : 3) + Math.min(0, c.success.hp_delta) + (c.cost?.hp ?? 0),
}
const TRIAL_PREF: Record<string, string[]> = {
  kind: ['solidarity', 'witness', 'parley', 'evidence'],
  ruthless: ['coerce', 'tribute', 'confront'],
  greedy: ['tribute', 'parley', 'confront'],
  cautious: ['evidence', 'scout', 'parley'],
}

// Garbage the pathological policy throws at the reducer between real moves.
const JUNK: unknown[] = [
  null,
  undefined,
  42,
  'TRAVEL',
  {},
  { type: 'TRAVEL', locationId: 'nowhere' },
  { type: 'TRAVEL', locationId: 'last-threshold' },
  { type: 'CHOOSE', choiceId: 'not-a-choice' },
  { type: 'CHOOSE', choiceId: '__proto__' },
  { type: 'TRIAL', choiceId: 'solidarity' },
  { type: 'TRIAL', choiceId: 'free-pass' },
  { type: 'FOLLOWER', choiceId: 'stand-as-witness' },
  { type: 'USE_REWARD', rewardId: 'infinite-water' },
  { type: 'BOSS', approach: 'challenge' },
  { type: 'RESOLVE', approach: 'fight' },
  { type: 'PREPARE', extra: true },
]

type Run = {
  ledger: JourneyLedgerV10
  phase: string
  deathLand: string | null
  junkRefused: number
}

function play(seed: number, character: ShiftingCharacter, policy: Policy): Run {
  const roll = rng(seed * 7919 + character.id.length * 31 + policy.length)
  let ledger = newJourneyLedgerV10(seed, character, character.id !== 'custom')
  let junkRefused = 0
  // Junk does not count against the move budget; real moves do.
  for (
    let moves = 0, steps = 0;
    moves < MAX_TURNS && steps < MAX_TURNS * 4;
    steps++
  ) {
    const state = ledger.current
    const journey = state.journey
    assert.ok(journey.hp >= 0, 'hp never negative')
    assert.ok(journey.provisions >= 0, 'provisions never negative')
    if (['complete', 'fallen', 'retired'].includes(journey.phase)) break
    if (policy === 'pathological' && roll(2) === 0) {
      const junk = JUNK[roll(JUNK.length)] as JourneyActionV9
      let next: JourneyLedgerV10 | undefined
      assert.doesNotThrow(() => {
        next = stepJourneyLedgerV10(ledger, junk)
      }, 'junk never throws')
      // Junk that happens to be legal right now (a real PREPARE, say) may
      // advance; anything else must leave the journey untouched.
      if (next === ledger) junkRefused++
      else ledger = next!
      continue
    }
    const style: Policy =
      policy === 'mixed'
        ? (['kind', 'ruthless', 'greedy', 'cautious'] as const)[
            journey.landIndex % 4
          ]!
        : policy
    let action: JourneyActionV9
    const follower = kitchenNoviceOptionsV9(ledger as never)
    if (follower.length && style !== 'chaotic' && roll(3) === 0)
      action = {
        type: 'FOLLOWER',
        choiceId: follower[roll(follower.length)]!.id,
      }
    else if (journey.phase === 'boss') {
      const land = JOURNEY_WORLD.lands[journey.landIndex]!
      const wantsScout = style === 'cautious' && roll(2) === 0
      if (
        wantsScout &&
        !ledger.prepared.includes(land.id) &&
        canPrepareTrialV7(state, ledger.prepared)
      )
        action = { type: 'PREPARE' }
      else {
        const open = trialForLandV8(land.id)!.choices.filter((choice) =>
          canChooseTrialV7(choice, state, ledger.prepared),
        )
        assert.ok(open.length, `${land.id} trial always leaves a route`)
        const prefs = TRIAL_PREF[style] ?? []
        const preferred = open.filter((choice) => prefs.includes(choice.id))
        const from = style === 'chaotic' || !preferred.length ? open : preferred
        action = { type: 'TRIAL', choiceId: from[roll(from.length)]!.id }
      }
    } else if (journey.active) {
      const card = activeCardV10(ledger)!
      const open = card.choices.filter((choice) => !choiceLock(state, choice))
      assert.ok(open.length, `${card.id} always leaves a way through`)
      let from = open
      if (style in score) {
        const fn = score[style as keyof typeof score]
        const best = Math.max(...open.map(fn))
        from = open.filter((choice) => fn(choice) === best)
      }
      action = { type: 'CHOOSE', choiceId: from[roll(from.length)]!.id }
    } else {
      const open = reachableLocations(journey).filter(
        (id) => !journey.resolved.some((result) => result.locationId === id),
      )
      assert.ok(open.length, 'exploring always has somewhere to go')
      action = { type: 'TRAVEL', locationId: open[roll(open.length)]! }
    }
    const next = stepJourneyLedgerV10(ledger, action)
    assert.notStrictEqual(
      next,
      ledger,
      `${character.id}/${policy}/${seed}: a legal move is accepted`,
    )
    ledger = next
    moves++
  }
  const phase = ledger.current.journey.phase
  assert.ok(
    ['complete', 'fallen', 'retired'].includes(phase),
    `${character.id}/${policy}/${seed} ends within ${MAX_TURNS} moves (no soft lock), got ${phase}`,
  )
  return {
    ledger,
    phase,
    deathLand:
      phase === 'fallen'
        ? JOURNEY_WORLD.lands[ledger.current.journey.landIndex]!.id
        : null,
    junkRefused,
  }
}

const willa = makeCustomCharacter({
  name: 'Willa Thorn',
  species: 'gorilla',
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
const table = new Map<
  Policy,
  {
    runs: number
    complete: number
    fallen: number
    deaths: Record<string, number>
  }
>()
let runs = 0
const byTraveler = new Map<string, { runs: number; complete: number }>()
let refused = 0
let tampered = 0
for (const policy of POLICIES)
  for (const character of TRAVELERS)
    for (let seed = 1; seed <= SEEDS; seed++) {
      const run = play(seed, character, policy)
      runs++
      refused += run.junkRefused
      const row = table.get(policy) ?? {
        runs: 0,
        complete: 0,
        fallen: 0,
        deaths: {},
      }
      row.runs++
      if (run.phase === 'complete') row.complete++
      if (run.deathLand) {
        row.fallen++
        row.deaths[run.deathLand] = (row.deaths[run.deathLand] ?? 0) + 1
      }
      table.set(policy, row)
      if (policy === 'kind' || policy === 'cautious') {
        const mine = byTraveler.get(character.id) ?? { runs: 0, complete: 0 }
        mine.runs++
        if (run.phase === 'complete') mine.complete++
        byTraveler.set(character.id, mine)
      }
      // Every terminal journey reads as an ending.
      const shared = authoredEndingV7(
        run.ledger.current,
        run.ledger.trialResults,
      )
      assert.ok(shared, 'every finished journey has a shared ending')
      if (character.id !== 'custom')
        assert.ok(
          personalEndingV10(
            character.id,
            run.ledger.current,
            run.ledger.trialResults,
          ),
          'every premade journey ends on its own ending',
        )
      // Exact replay, and forged saves are refused.
      if (seed <= 3) {
        const saved = clone(run.ledger)
        assert.deepEqual(restoreJourneyLedgerV10(saved), run.ledger)
        // Forgeries poke at the saved JSON, whose shape is deliberately untyped.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const forgeries: Array<(s: any) => void> = [
          (s) => (s.current.journey.hp = 99),
          (s) => (s.current.journey.provisions += 5),
          (s) => s.current.flags.push('deed-shared-bread'),
          (s) => (s.current.marks.mercy += 3),
          (s) => (s.seed += 1),
          (s) => s.actions.pop(),
          (s) =>
            (s.character = {
              ...s.character,
              skills: {
                ...s.character.skills,
                steel: s.character.skills.steel === 0 ? 1 : 0,
              },
            }),
          (s) =>
            s.trialResults[0]
              ? (s.trialResults[0].roll.success =
                  !s.trialResults[0].roll.success)
              : (s.current.journey.turn += 1),
        ]
        for (const [index, forge] of forgeries.entries()) {
          const forged = clone(run.ledger)
          forge(forged)
          assert.equal(
            restoreJourneyLedgerV10(forged),
            null,
            `${character.id}/${policy}/${seed}: forged save #${index} is refused`,
          )
          tampered++
        }
      }
    }

// Balance floor: a careful or kind traveler usually survives the road, and no
// policy is a guaranteed win.
const rate = (policy: Policy) =>
  table.get(policy)!.complete / table.get(policy)!.runs
for (const policy of POLICIES)
  assert.ok(rate(policy) < 1, `${policy} is not a guaranteed win`)
assert.ok(rate('kind') >= 0.3, 'a kind traveler can win the road')
assert.ok(refused > 0, 'the pathological policy really threw junk')
// Every traveler, played kindly or carefully, can win the road.
for (const [id, row] of byTraveler)
  assert.ok(
    row.complete / row.runs >= 0.4,
    `${id} wins at least 40% of kind or careful journeys (${row.complete}/${row.runs})`,
  )

console.log('policy        runs  complete  fallen  deaths by land')
for (const [policy, row] of table)
  console.log(
    `${policy.padEnd(13)} ${String(row.runs).padStart(4)}  ${String(row.complete).padStart(8)}  ${String(row.fallen).padStart(6)}  ${JSON.stringify(row.deaths)}`,
  )
console.log(
  'kind/cautious wins by traveler: ' +
    [...byTraveler]
      .map(([id, row]) => `${id} ${row.complete}/${row.runs}`)
      .join(', '),
)
console.log(
  `Shifting Lands adversarial battery passed: ${runs} journeys (${POLICIES.length} policies x ${TRAVELERS.length} travelers x ${SEEDS} seeds) all ended with no soft lock; ${refused} junk actions refused without throwing; ${tampered} forged saves refused; every finished journey has its endings`,
)
