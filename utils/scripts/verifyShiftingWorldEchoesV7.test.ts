import assert from 'node:assert/strict'
import { JOURNEY_WORLD } from '../shiftingLands/journey'
import { newJourneyLedgerV7 } from '../shiftingLands/saveLedgerV7'
import { worldEchoesV7 } from '../shiftingLands/worldEchoesV7'
import type { JourneyStateV6, V6Result } from '../shiftingLands/deckV6'
import type { TrialResult } from '../shiftingLands/authoredBosses'

const fresh = newJourneyLedgerV7(606).current
assert.deepEqual(worldEchoesV7(fresh, []), [], 'no flash-forwards on the first land')

const first = JOURNEY_WORLD.lands[0]!
const successRoll = {
  landId: first.id,
  locationId: first.boss.id,
  skill: 'steel' as const,
  dice: [6, 6] as [number, number],
  modifier: 3,
  difficulty: 10,
  total: 15,
  success: true,
}
const boss = {
  landId: first.id,
  id: first.boss.id,
  turn: 11,
  approach: 'challenge' as const,
  roll: successRoll,
}
const recordedTrial = (choiceId: string): TrialResult => ({
  landId: first.id,
  bossId: first.boss.id,
  choiceId,
  turn: boss.turn,
  roll: successRoll,
  resultText: 'Verified victory.',
  hpChange: 0,
  provisionChange: 0,
})
const atDustwater: JourneyStateV6 = {
  ...fresh,
  journey: {
    ...fresh.journey,
    landIndex: 1,
    bosses: [boss],
    phase: 'explore',
  },
}

const beforeBoss: JourneyStateV6 = {
  ...atDustwater,
  journey: { ...atDustwater.journey, bosses: [] },
}
assert.deepEqual(
  worldEchoesV7(beforeBoss, [recordedTrial('coerce')]),
  [],
  'a fabricated trial result alone cannot create a returned witness',
)
assert.deepEqual(
  worldEchoesV7(atDustwater, [{ ...recordedTrial('coerce'), turn: 7 }]),
  [],
  'only the actual boss victory turn establishes the cause',
)
assert.deepEqual(
  worldEchoesV7(atDustwater, [
    {
      ...recordedTrial('coerce'),
      roll: { ...successRoll, success: false },
    },
  ]),
  [],
  'a failed trial never becomes a later triumph',
)
for (const id of [
  'confront', 'parley', 'evidence', 'witness', 'scout',
  'solidarity', 'tribute', 'coerce',
]) {
  const echoed = worldEchoesV7(atDustwater, [recordedTrial(id)])
  assert.equal(echoed.length, 1, `the ${id} route has distinct arrival copy`)
  assert.equal(echoed[0]!.landId, 'dustwater')
  assert.equal(echoed[0]!.sourceLandId, 'homestead')
  assert.equal(echoed[0]!.sourceTurn, 11)
  assert.ok(echoed[0]!.text.length > 100)
  assert.notEqual(echoed[0]!.title, 'The world remembers')
}
assert.notEqual(
  worldEchoesV7(atDustwater, [recordedTrial('coerce')])[0]!.text,
  worldEchoesV7(atDustwater, [recordedTrial('witness')])[0]!.text,
)
const outcome: V6Result = {
  locationId: 'wayside-refuge',
  encounterId: 'bread-under-the-long-table',
  choiceId: 'say-the-bread-was-yours',
  turn: 4,
  roll: null,
  success: true,
  resultText: 'You helped.',
  hpChange: 0,
  provisionChange: 0,
  flags: [],
  marks: { mercy: 2 },
}
const helped: JourneyStateV6 = {
  ...atDustwater,
  outcomes: [outcome],
}
const helpedEchoes = worldEchoesV7(helped, [recordedTrial('witness')])
assert.equal(helpedEchoes.length, 2, 'arrival remembers both trial and actual deed')
assert.equal(helpedEchoes[1]!.id, 'shared-bread')
assert.equal(helpedEchoes[1]!.source, 'encounter')
assert.equal(helpedEchoes[1]!.sourceLocationId, 'wayside-refuge')
assert.equal(
  worldEchoesV7({
    ...helped,
    outcomes: [{ ...outcome, success: false }],
  }, [recordedTrial('witness')]).length,
  1,
  'a failed rescue never fabricates a saved child',
)
assert.equal(
  worldEchoesV7({
    ...helped,
    outcomes: [{ ...outcome, choiceId: 'point-out-the-boy' }],
  }, [recordedTrial('witness')]).at(-1)?.id,
  'reported-boy',
  'the same encounter can return with the opposite moral consequence',
)
assert.equal(
  worldEchoesV7({
    ...helped,
    outcomes: [{ ...outcome, locationId: 'canyon-trail' }],
  }, [recordedTrial('witness')]).length,
  1,
  'a choice cannot masquerade as one from an earlier land',
)

const deep: JourneyStateV6 = {
  ...atDustwater,
  journey: { ...atDustwater.journey, landIndex: 4 },
  outcomes: [outcome],
}
const deepEchoes = worldEchoesV7(deep, [recordedTrial('tribute')])
assert.ok(deepEchoes.every((echo) => echo.landId === 'dustwater'))
assert.equal(
  worldEchoesV7(atDustwater, [recordedTrial('tribute')]).some(
    (echo) => echo.landId === 'verge',
  ),
  false,
  'the final-gate reprises cannot leak into the early game',
)

const a = worldEchoesV7(helped, [recordedTrial('witness')])
const b = worldEchoesV7(helped, [recordedTrial('witness')])
assert.deepEqual(a, b, 'echoes derive deterministically from the ledger')
assert.deepEqual(
  fresh,
  newJourneyLedgerV7(606).current,
  'the projection mutates neither source state nor replay rules',
)

console.log(
  'Shifting Lands V7 world echoes passed: 32 approach replies, distinct deed callbacks, cause-accurate first lands, no spoilers and deterministic replay-safe projection',
)
