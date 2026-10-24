import assert from 'node:assert/strict'
import { LENSES } from '../ecotone/content'
import {
  chooseBeat,
  computeEnding,
  createRun,
  findCard,
  restoreRun,
  type RunState,
} from '../ecotone/engine'
import { earnedQuestCallbacks } from '../ecotone/finaleExpansion'
import { outcomeArtKey } from '../ecotone/artSlots'

const card = findCard('QW-5')
assert.ok(card)
const monitor = card.choices.find((choice) => choice.id === 'monitor')
assert.ok(monitor?.check && monitor.failure)
assert.ok(monitor.wild)
assert.ok(monitor.cost)
assert.ok(
  (monitor.success.effects.nerve ?? 0) < 0 &&
    (monitor.failure.effects.nerve ?? 0) < 0,
  'both outcomes cost effort even when the commitment does not succeed',
)

let winningSeed = 0
let losingSeed = 0
for (let seed = 1; seed < 1000 && (!winningSeed || !losingSeed); seed++) {
  const state: RunState = {
    ...createRun(seed, 'reporter'),
    phase: 'beat',
    event: 'quiet',
    card: 'QW-5',
    wild: 2,
    activeLead: null,
  }
  const result = chooseBeat(state, 'monitor')
  if (result.pending?.entry.roll?.success) winningSeed ||= seed
  else if (result.pending?.entry.roll?.success === false) losingSeed ||= seed
}
assert.ok(winningSeed && losingSeed, 'seeded 2d6 checks reach both outcomes')

for (const lens of LENSES) {
  const stateFor = (seed: number): RunState => ({
    ...createRun(seed, 'reporter'),
    phase: 'beat',
    event: 'quiet',
    card: 'QW-5',
    openingState: lens.id,
    currentState: lens.id,
    activeLead: null,
    wild: 2,
  })

  const success = chooseBeat(stateFor(winningSeed), 'monitor')
  const failure = chooseBeat(stateFor(losingSeed), 'monitor')
  assert.equal(success.pending?.entry.roll?.success, true)
  assert.equal(failure.pending?.entry.roll?.success, false)
  assert.ok(success.flags.includes('creek_monitoring_committed'))
  assert.ok(failure.flags.includes('creek_monitoring_delayed'))
  assert.equal(success.wild, 3)
  assert.equal(failure.wild, 3)
  assert.equal(computeEnding(success).id, `ecotopia.${lens.id}.hope`)
  assert.equal(computeEnding(failure).id, `ecotopia.${lens.id}.dark`)
  assert.equal(computeEnding(success).score, 4)
  assert.equal(computeEnding(failure).score, 3)
  assert.equal(
    computeEnding(success).parts.at(-1)?.label,
    'Sustained crew stewardship',
  )
  assert.ok(
    earnedQuestCallbacks(success.flags, success.played).some((text) =>
      text.includes('dated rota'),
    ),
    'the future acknowledges only the signed commitment',
  )
  assert.ok(
    earnedQuestCallbacks(failure.flags, failure.played).some((text) =>
      text.includes('too-large promise'),
    ),
    'a missed shift is not falsely claimed as completed restoration',
  )
  assert.equal(
    success.pending?.entry.art,
    outcomeArtKey('QW-5', 'monitor', 'success'),
  )
  assert.equal(
    failure.pending?.entry.art,
    outcomeArtKey('QW-5', 'monitor', 'failure'),
  )
  assert.deepEqual(restoreRun(JSON.parse(JSON.stringify(success))), success)
  assert.deepEqual(restoreRun(JSON.parse(JSON.stringify(failure))), failure)

  const unearned = { ...stateFor(winningSeed), wild: 3 }
  assert.equal(computeEnding(unearned).id, `ecotopia.${lens.id}.dark`)
  const traditional = { ...stateFor(winningSeed), wild: 4 }
  assert.equal(computeEnding(traditional).id, `ecotopia.${lens.id}.hope`)
  assert.equal(
    computeEnding({
      ...stateFor(winningSeed),
      wild: 2,
      flags: ['creek_monitoring_committed'],
    }).id,
    `ecotopia.${lens.id}.dark`,
    'a forged flag alone never earns stewardship credit',
  )
}

const choice = card.choices.find((item) => item.id === 'restore')
assert.ok(choice, 'the original one-day creek volunteer choice stays playable')
console.log(
  'Ecotone solo creek repair: 7 lenses, 2 earned fates, no phantom shifts',
)
