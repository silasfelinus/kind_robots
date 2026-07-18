// /utils/scripts/verifyWonderLabStatus.ts
import assert from 'node:assert/strict'
import {
  getLegacyComponentStatus,
  hasLegacyStatusUpdate,
  legacyFieldsForComponentStatus,
  resolveLegacyStatusUpdate,
} from '@/utils/wonderlab/componentStatus'

assert.equal(
  getLegacyComponentStatus({
    isWorking: true,
    underConstruction: true,
    isBroken: true,
  }),
  'BROKEN',
  'Legacy contradictions must resolve deterministically.',
)

assert.deepEqual(legacyFieldsForComponentStatus('UNREVIEWED'), {
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
