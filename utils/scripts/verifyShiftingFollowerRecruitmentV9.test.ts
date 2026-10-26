import assert from 'node:assert/strict'
import type { TrialResult } from '../shiftingLands/authoredBosses'
import type { V6Result } from '../shiftingLands/deckV6'
import { activeV6Card, choiceLock } from '../shiftingLands/deckV6'
import { JOURNEY_WORLD, reachableLocations } from '../shiftingLands/journey'
import {
  kitchenNoviceEchoesV9,
  kitchenNoviceOptionsV9,
  kitchenNoviceStatusV9,
  newJourneyLedgerV9,
  restoreJourneyLedgerV9,
  stepJourneyLedgerV9,
  v9CharacterSheet,
  type JourneyLedgerV9,
} from '../shiftingLands/saveLedgerV9'
import {
  newJourneyLedgerV8,
  restoreJourneyLedgerV8,
} from '../shiftingLands/saveLedgerV8'
import { canChooseTrialV7 } from '../shiftingLands/trialRulesV7'
import { trialForLandV8 } from '../shiftingLands/trialRulesV8'

const fresh = newJourneyLedgerV9(606)
const intro: V6Result = {
  locationId: 'wayside-refuge',
  encounterId: 'a-crust-for-the-road',
  choiceId: 'thank-with-bow',
  turn: 4,
  roll: {
    landId: 'homestead',
    locationId: 'wayside-refuge',
    dice: [5, 5],
    skill: 'bearing',
    modifier: 2,
    difficulty: 7,
    total: 12,
    success: true,
  },
  success: true,
  resultText: 'The sister shares bread and the eastern road note.',
  hpChange: 0,
  provisionChange: 2,
  flags: ['kitchen-novice-trust'],
  marks: {},
}
const boss = (landId: string, turn: number) => {
  const land = JOURNEY_WORLD.lands.find((entry) => entry.id === landId)!
  return {
    landId,
    id: land.boss.id,
    turn,
    approach: 'parley' as const,
    roll: {
      landId,
      locationId: land.boss.id,
      dice: [6, 6] as [number, number],
      skill: 'bearing' as const,
      modifier: 2,
      difficulty: 9,
      total: 14,
      success: true,
    },
  }
}
const first = boss('homestead', 11)
const second = boss('dustwater', 21)
const third = boss('tablelands', 31)
const trial = (
  entry: ReturnType<typeof boss>,
  choiceId: string,
): TrialResult => ({
  landId: entry.landId,
  bossId: entry.id,
  choiceId,
  turn: entry.turn,
  roll: entry.roll,
  resultText: 'The recorded trial passes.',
  hpChange: 0,
  provisionChange: 0,
})
const homestead = trial(first, 'witness')
const dustwater = trial(second, 'solidarity')
const tablelands = trial(third, 'witness')
const atDustwater: JourneyLedgerV9 = {
  ...fresh,
  current: {
    ...fresh.current,
    flags: [...intro.flags],
    outcomes: [intro],
    journey: {
      ...fresh.current.journey,
      landIndex: 1,
      turn: 12,
      provisions: 6,
      phase: 'explore',
      bosses: [first],
    },
  },
  trialResults: [homestead],
}
assert.deepEqual(kitchenNoviceOptionsV9(fresh), [])
assert.deepEqual(
  kitchenNoviceOptionsV9({
    ...atDustwater,
    current: { ...atDustwater.current, outcomes: [] },
  }),
  [],
  'a bare trust flag cannot invent a recruitable person',
)
assert.deepEqual(
  kitchenNoviceOptionsV9({
    ...atDustwater,
    trialResults: [trial(first, 'coerce')],
  }),
  [],
  'coercion cannot unlock the earned recruitment',
)
assert.deepEqual(
  kitchenNoviceOptionsV9({
    ...atDustwater,
    current: { ...atDustwater.current, flags: [] },
  }),
  [],
  'the source flag must be backed by the actual encounter',
)
assert.deepEqual(
  kitchenNoviceOptionsV9(atDustwater).map((choice) => choice.id),
  ['invite-sister', 'respect-her-road'],
)
const refused = stepJourneyLedgerV9(atDustwater, {
  type: 'FOLLOWER',
  choiceId: 'respect-her-road',
})
assert.equal(kitchenNoviceStatusV9(refused), 'Independent traveler')
assert.deepEqual(kitchenNoviceOptionsV9(refused), [])
assert.strictEqual(
  stepJourneyLedgerV9(refused, { type: 'FOLLOWER', choiceId: 'invite-sister' }),
  refused,
  'refusal cannot be overwritten by a forged later invitation',
)
const invited = stepJourneyLedgerV9(atDustwater, {
  type: 'FOLLOWER',
  choiceId: 'invite-sister',
})
assert.equal(kitchenNoviceStatusV9(invited), 'Traveling companion')
assert.equal(
  v9CharacterSheet(invited).relationships.find(
    (entry) => entry.id === 'kitchen-novice',
  )?.traveling,
  true,
)
assert.ok(invited.current.flags.includes('kitchen-sister-traveling'))
assert.equal(invited.current.journey.turn, 13)
assert.equal(invited.current.journey.provisions, 6)
assert.equal(invited.current.journey.journal.at(-1)?.kind, 'encounter')
assert.strictEqual(
  stepJourneyLedgerV9(invited, { type: 'FOLLOWER', choiceId: 'invite-sister' }),
  invited,
)
const atTablelands: JourneyLedgerV9 = {
  ...invited,
  trialResults: [homestead, dustwater],
  current: {
    ...invited.current,
    journey: {
      ...invited.current.journey,
      landIndex: 2,
      turn: 22,
      bosses: [first, second],
    },
  },
}
assert.deepEqual(
  kitchenNoviceOptionsV9(atTablelands).map((choice) => choice.id),
  ['carry-family-ledger', 'sell-family-ledger'],
)
const helped = stepJourneyLedgerV9(atTablelands, {
  type: 'FOLLOWER',
  choiceId: 'carry-family-ledger',
})
assert.equal(helped.current.journey.provisions, 4)
assert.equal(helped.current.marks.mercy, 1)
assert.equal(kitchenNoviceStatusV9(helped), 'Trusted companion')
assert.deepEqual(
  kitchenNoviceOptionsV9({
    ...atTablelands,
    current: {
      ...atTablelands.current,
      journey: { ...atTablelands.current.journey, provisions: 1 },
    },
  }).map((choice) => choice.id),
  ['sell-family-ledger'],
  'a companion decision cannot spend food the player does not have',
)
const sold = stepJourneyLedgerV9(atTablelands, {
  type: 'FOLLOWER',
  choiceId: 'sell-family-ledger',
})
assert.equal(sold.current.journey.provisions, 8)
assert.equal(sold.current.marks.ruthlessness, 1)
assert.equal(kitchenNoviceStatusV9(sold), 'Departed after betrayal')
assert.equal(
  v9CharacterSheet(sold).relationships.find(
    (entry) => entry.id === 'kitchen-novice',
  )?.traveling,
  false,
)
const cave = (ledger: JourneyLedgerV9): JourneyLedgerV9 => ({
  ...ledger,
  trialResults: [homestead, dustwater, tablelands],
  current: {
    ...ledger.current,
    journey: {
      ...ledger.current.journey,
      landIndex: 3,
      turn: 32,
      bosses: [first, second, third],
    },
  },
})
const loyal = stepJourneyLedgerV9(cave(helped), {
  type: 'FOLLOWER',
  choiceId: 'stand-as-witness',
})
assert.equal(kitchenNoviceStatusV9(loyal), 'Loyal ally')
assert.ok(loyal.current.flags.includes('kitchen-sister-loyal'))
assert.equal(loyal.current.marks.honesty, 1)
const reunited = stepJourneyLedgerV9(cave(sold), {
  type: 'FOLLOWER',
  choiceId: 'offer-restitution',
})
assert.equal(kitchenNoviceStatusV9(reunited), 'Tentatively reunited')
assert.equal(reunited.current.journey.provisions, 5)
assert.equal(kitchenNoviceEchoesV9(reunited).length, 3)
const soldAtCave = cave(sold)
assert.strictEqual(
  stepJourneyLedgerV9(soldAtCave, {
    type: 'FOLLOWER',
    choiceId: 'stand-as-witness',
  }),
  soldAtCave,
  'a betrayal cannot jump directly to loyal status',
)
assert.deepEqual(restoreJourneyLedgerV9(fresh), fresh)
assert.equal(restoreJourneyLedgerV9(newJourneyLedgerV8(606)), null)
assert.equal(restoreJourneyLedgerV8(newJourneyLedgerV9(606)), null)
assert.equal(
  restoreJourneyLedgerV9({
    ...fresh,
    followerHistory: [
      {
        choiceId: 'invite-sister',
        turn: 1,
        landId: 'dustwater',
        text: 'forged',
      },
    ],
  }),
  null,
  'saved companion history must be reproduced from the action ledger',
)

let witness: JourneyLedgerV9 | null = null
let witnessSeed = 0
for (let seed = 1; seed <= 2500 && !witness; seed++) {
  let ledger = newJourneyLedgerV9(seed)
  for (let turn = 0; turn < 100; turn++) {
    const state = ledger.current
    const journey = state.journey
    const available = kitchenNoviceOptionsV9(ledger)
    if (available.some((option) => option.id === 'invite-sister')) {
      witness = stepJourneyLedgerV9(ledger, {
        type: 'FOLLOWER',
        choiceId: 'invite-sister',
      })
      witnessSeed = seed
      break
    }
    if (
      journey.landIndex > 1 ||
      ['fallen', 'complete', 'retired'].includes(journey.phase)
    )
      break
    if (journey.phase === 'boss') {
      const choices = trialForLandV8(
        JOURNEY_WORLD.lands[journey.landIndex]!.id,
      )!.choices
      const legal = choices.filter((choice) =>
        canChooseTrialV7(choice, state, ledger.prepared),
      )
      const choice =
        legal.find((entry) => entry.id === 'witness') ??
        legal.find((entry) => entry.id === 'solidarity') ??
        legal.find((entry) => entry.id === 'parley') ??
        legal[0]
      if (!choice) break
      const next = stepJourneyLedgerV9(ledger, {
        type: 'TRIAL',
        choiceId: choice.id,
      })
      if (next === ledger) break
      ledger = next
    } else if (journey.active) {
      const card = activeV6Card(state)
      const legal =
        card?.choices.filter((choice) => !choiceLock(state, choice)) ?? []
      const choice =
        (card?.id === 'a-crust-for-the-road'
          ? legal.find((entry) => entry.id === 'thank-with-bow')
          : undefined) ??
        [...legal].sort(
          (a, b) =>
            (b.success.marks?.mercy ?? 0) +
            (b.success.marks?.honesty ?? 0) -
            (a.success.marks?.mercy ?? 0) -
            (a.success.marks?.honesty ?? 0),
        )[0]
      if (!choice) break
      const next = stepJourneyLedgerV9(ledger, {
        type: 'CHOOSE',
        choiceId: choice.id,
      })
      if (next === ledger) break
      ledger = next
    } else {
      const open = reachableLocations(journey).filter(
        (id) => !journey.resolved.some((entry) => entry.locationId === id),
      )
      if (!open.length) break
      const next = stepJourneyLedgerV9(ledger, {
        type: 'TRAVEL',
        locationId: open[0]!,
      })
      if (next === ledger) break
      ledger = next
    }
  }
}
assert.ok(
  witness,
  'at least one legitimate seeded new-game route must recruit the sister',
)
assert.ok(witnessSeed > 0)
assert.deepEqual(
  restoreJourneyLedgerV9(JSON.parse(JSON.stringify(witness))),
  witness,
  'a real recruitment survives full seed/action replay',
)
const tampered = JSON.parse(JSON.stringify(witness))
tampered.current.flags.push('kitchen-sister-loyal')
assert.equal(restoreJourneyLedgerV9(tampered), null)
console.log(
  `Shifting Lands V9 companion contract passed; genuine recruitment seed ${witnessSeed}, three decision stages, refusal, betrayal, reunion, resource costs and replay anti-forgery`,
)
