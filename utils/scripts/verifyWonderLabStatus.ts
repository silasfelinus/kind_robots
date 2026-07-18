// /utils/scripts/verifyWonderLabStatus.ts
import assert from 'node:assert/strict'
import {
  componentStatuses,
  getComponentStatus,
  getLegacyComponentStatus,
  hasLegacyStatusUpdate,
  isComponentStatus,
  legacyFieldsForComponentStatus,
  resolveLegacyStatusUpdate,
} from '@/utils/wonderlab/componentStatus'

assert.deepEqual(componentStatuses, [
  'UNREVIEWED',
  'WORKING',
  'NEEDS_CONTEXT',
  'UNDER_CONSTRUCTION',
  'BROKEN',
  'RETIRED',
  'PREVIEW_UNSUPPORTED',
])

assert.equal(isComponentStatus('RETIRED'), true)
assert.equal(isComponentStatus('not-real'), false)

assert.equal(
  getLegacyComponentStatus({
    isWorking: true,
    underConstruction: true,
    isBroken: true,
  }),
  'BROKEN',
  'Legacy contradictions must resolve deterministically.',
)

assert.equal(
  getComponentStatus({
    status: 'NEEDS_CONTEXT',
    isWorking: true,
    isBroken: true,
  }),
  'NEEDS_CONTEXT',
  'Canonical status must outrank contradictory compatibility booleans.',
)

assert.equal(
  getComponentStatus({
    status: 'invalid-status',
    isWorking: false,
    underConstruction: true,
  }),
  'UNDER_CONSTRUCTION',
  'Invalid canonical input must fall back to deterministic legacy fields.',
)

assert.deepEqual(legacyFieldsForComponentStatus('UNREVIEWED'), {
  isWorking: false,
  underConstruction: false,
  isBroken: false,
})
assert.deepEqual(legacyFieldsForComponentStatus('NEEDS_CONTEXT'), {
  isWorking: false,
  underConstruction: false,
  isBroken: false,
})
assert.deepEqual(legacyFieldsForComponentStatus('RETIRED'), {
  isWorking: false,
  underConstruction: false,
  isBroken: false,
})

assert.deepEqual(
  resolveLegacyStatusUpdate(
    {
      isWorking: false,
      underConstruction: false,
      isBroken: true,
    },
    {
      isWorking: true,
    },
  ),
  {
    isWorking: true,
    underConstruction: false,
    isBroken: false,
  },
  'Enabling one state must replace the previous state.',
)

assert.deepEqual(
  resolveLegacyStatusUpdate(
    {
      isWorking: false,
      underConstruction: true,
      isBroken: false,
    },
    {
      underConstruction: false,
    },
  ),
  {
    isWorking: false,
    underConstruction: false,
    isBroken: false,
  },
  'Disabling the only active state must produce UNREVIEWED.',
)

assert.equal(hasLegacyStatusUpdate({ notes: 'No status change' } as never), false)
assert.equal(hasLegacyStatusUpdate({ isBroken: false }), true)

console.log('WonderLab component status verification passed.')
