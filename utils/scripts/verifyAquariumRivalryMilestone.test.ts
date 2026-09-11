import assert from 'node:assert/strict'
import test from 'node:test'
import {
  rivalryMilestoneState,
} from '../../server/utils/aquariumRivalryMilestone'

test('records the first observed active rivalry', () => {
  assert.deepEqual(rivalryMilestoneState(true, false, false), {
    shouldRecordObserved: true,
    shouldFireResolved: false,
  })
})

test('does not repeatedly record an ongoing rivalry', () => {
  assert.deepEqual(rivalryMilestoneState(true, true, false), {
    shouldRecordObserved: false,
    shouldFireResolved: false,
  })
})

test('fires the milestone only after an observed rivalry clears', () => {
  assert.deepEqual(rivalryMilestoneState(false, true, false), {
    shouldRecordObserved: false,
    shouldFireResolved: true,
  })
})

test('does not fire for a tank that has never had rivalry', () => {
  assert.deepEqual(rivalryMilestoneState(false, false, false), {
    shouldRecordObserved: false,
    shouldFireResolved: false,
  })
})

test('resolved milestone is permanently idempotent', () => {
  assert.deepEqual(rivalryMilestoneState(true, true, true), {
    shouldRecordObserved: false,
    shouldFireResolved: false,
  })
  assert.deepEqual(rivalryMilestoneState(false, true, true), {
    shouldRecordObserved: false,
    shouldFireResolved: false,
  })
})
