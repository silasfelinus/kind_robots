import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  activeFiveLandEncounter,
  FIVE_LAND_CARDS,
  findFiveLandCard,
  LATER_LAND_PACK,
  validateLaterLandContent,
} from '../shiftingLands/authoredFiveLands'
import { JOURNEY_WORLD, reachableLocations } from '../shiftingLands/journey'
import {
  newJourneyLedger,
  restoreJourneyLedger,
} from '../shiftingLands/saveLedger'
import {
  newJourneyLedgerV4,
  restoreJourneyLedgerV4,
  stepJourneyLedgerV4,
  type JourneyLedgerV4,
} from '../shiftingLands/saveLedgerV4'

const json = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const read = (p: string) =>
  readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8')
const source = read('../shiftingLands/authoredLaterLands.json')

assert.deepEqual(validateLaterLandContent(), [])
assert.equal(JOURNEY_WORLD.lands.length, 5)
assert.equal(FIVE_LAND_CARDS.length, 48)
assert.equal(LATER_LAND_PACK.encounters.length, 36)
assert.equal(LATER_LAND_PACK.locations.length, 12)
assert.equal(LATER_LAND_PACK.sources.length, 4)
assert.doesNotMatch(
  source,
  /developer_note|locked_character_id|visual_description|risk_hint|art_ref|cosmic_horror/,
)
assert.ok(
  LATER_LAND_PACK.encounters.every(
    (card) =>
      card.art === null &&
      card.flavor.length >= 90 &&
      card.choices.length >= 2 &&
      card.choices.every(
        (choice) =>
          choice.success.text !== choice.failure.text &&
          choice.success.text.length >= 30 &&
          choice.failure.text.length >= 30,
      ),
  ),
)

const original = newJourneyLedgerV4(77)
assert.equal(original.version, 4)
assert.deepEqual(restoreJourneyLedgerV4(json(original)), original)
assert.deepEqual(newJourneyLedgerV4(77), original)
const oldV3 = newJourneyLedger(77)
assert.deepEqual(restoreJourneyLedger(json(oldV3)), oldV3)
assert.equal(restoreJourneyLedgerV4(json(oldV3)), null)
assert.equal(restoreJourneyLedger(json(original)), null)
assert.equal(restoreJourneyLedgerV4({ ...original, worldSha: 'changed' }), null)
assert.equal(
  restoreJourneyLedgerV4({ ...original, homesteadSha: 'changed' }),
  null,
)
assert.equal(
  restoreJourneyLedgerV4({ ...original, laterSources: ['fake'] }),
  null,
)
assert.equal(restoreJourneyLedgerV4({ ...original, seed: -1 }), null)
assert.equal(restoreJourneyLedgerV4({ ...original, actions: null }), null)
assert.equal(restoreJourneyLedgerV4({ ...original, version: 5 }), null)
assert.equal(
  restoreJourneyLedgerV4({
    ...original,
    actions: [{ type: 'CHOOSE', choiceId: 'invented' }],
  }),
  null,
)
assert.equal(
  restoreJourneyLedgerV4({ ...original, usedRewards: ['fake'] }),
  null,
)
assert.equal(
  restoreJourneyLedgerV4({
    ...original,
    current: {
      ...original.current,
      journey: { ...original.current.journey, hp: 1 },
    },
  }),
  null,
)
assert.equal(
  restoreJourneyLedgerV4({
    ...original,
    actions: Array(1201).fill({ type: 'TRAVEL', locationId: 'border-farm' }),
  }),
  null,
)

const cardsSeen = new Set<string>()
const reachedLands = new Set<string>()
const authoredLocations = new Set<string>()
let completedFiveLands = 0
let recordedShifts = 0
let maximumResolved = 0

for (let seed = 1; seed <= 360; seed++) {
  let run: JourneyLedgerV4 = newJourneyLedgerV4(seed)
  for (let turn = 0; turn < 100; turn++) {
    const journey = run.current.journey
    const land = JOURNEY_WORLD.lands[journey.landIndex]!
    reachedLands.add(land.id)
    if (
      journey.phase === 'complete' ||
      journey.phase === 'fallen' ||
      journey.phase === 'retired'
    )
      break
    if (journey.phase === 'boss') {
      const next = stepJourneyLedgerV4(run, {
        type: 'BOSS',
        approach: 'challenge',
      })
      assert.notStrictEqual(
        next,
        run,
        'boss always resolves a legal dice check',
      )
      run = next
      continue
    }
    if (journey.active) {
      const encounter = activeFiveLandEncounter(run.current)
      assert.ok(encounter, 'every active V4 location must draw one card')
      assert.equal(encounter!.locationId, journey.active)
      assert.equal(findFiveLandCard(encounter!.id)?.id, encounter!.id)
      cardsSeen.add(encounter!.id)
      if (land.id !== 'homestead') authoredLocations.add(journey.active)
      assert.strictEqual(
        stepJourneyLedgerV4(run, { type: 'RESOLVE', approach: 'test' }),
        run,
        'V4 forbids old prototype resolution in every later land',
      )
      const choice = [...encounter!.choices].sort(
        (a, b) =>
          a.roll.target - a.roll.modifier - (b.roll.target - b.roll.modifier),
      )[0]!
      const next = stepJourneyLedgerV4(run, {
        type: 'CHOOSE',
        choiceId: choice.id,
      })
      assert.notStrictEqual(next, run)
      const result = next.current.outcomes.at(-1)!
      assert.equal(result.encounterId, encounter!.id)
      assert.equal(result.choiceId, choice.id)
      assert.equal(result.roll.landId, land.id)
      assert.equal(result.roll.dice.length, 2)
      assert.ok(result.roll.dice.every((die) => die >= 1 && die <= 6))
      assert.equal(
        result.roll.total,
        result.roll.dice[0] + result.roll.dice[1] + result.roll.modifier,
      )
      assert.equal(
        result.resultText,
        (result.roll.success ? choice.success : choice.failure).text,
      )
      assert.equal(next.current.journey.resolved.at(-1)!.approach, 'test')
      assert.strictEqual(
        stepJourneyLedgerV4(next, { type: 'CHOOSE', choiceId: choice.id }),
        next,
      )
      run = next
      continue
    }
    const nextId = reachableLocations(journey).find(
      (id) => !journey.resolved.some((result) => result.locationId === id),
    )
    assert.ok(
      nextId,
      'unfinished three-location land always has reachable place',
    )
    const next = stepJourneyLedgerV4(run, {
      type: 'TRAVEL',
      locationId: nextId!,
    })
    assert.notStrictEqual(next, run)
    assert.equal(next.current.journey.active, nextId)
    assert.ok(next.current.drawn[nextId!])
    run = next
  }
  maximumResolved = Math.max(
    maximumResolved,
    run.current.journey.resolved.length,
  )
  recordedShifts += run.current.journey.shifts.length
  if (run.current.journey.phase === 'complete') {
    completedFiveLands++
    assert.equal(run.current.journey.bosses.length, 5)
    assert.equal(run.current.journey.resolved.length, 15)
  }
  const restored = restoreJourneyLedgerV4(json(run))
  assert.deepEqual(
    restored,
    run,
    'seeded 2d6 and every scene replay through save/restore',
  )
  if (run.current.outcomes.length > 0) {
    const first = run.current.outcomes[0]!
    assert.equal(
      restoreJourneyLedgerV4({
        ...run,
        current: {
          ...run.current,
          outcomes: [
            { ...first, roll: { ...first.roll, dice: [7, 0] } },
            ...run.current.outcomes.slice(1),
          ],
        },
      }),
      null,
      'tampered saved dice never pass replay',
    )
  }
}
assert.ok(maximumResolved === 15, 'a seeded run should reach all 15 encounters')
assert.ok(completedFiveLands > 0, 'at least one run should clear five bosses')
assert.deepEqual(
  reachedLands,
  new Set(JOURNEY_WORLD.lands.map((land) => land.id)),
)
assert.equal(
  authoredLocations.size,
  12,
  'all twelve later locations must play authored cards',
)
assert.ok(
  cardsSeen.size >= 38,
  'seed variation must exercise most authored identities',
)
assert.ok(
  recordedShifts > 0,
  'authored geography changes must occur in seeded runs',
)
console.log(
  'Shifting Lands V4 passed: 48 fixed-cast cards, five lands, saved rolls/results, original V3 isolation, tamper rejection and causal shifts',
)
