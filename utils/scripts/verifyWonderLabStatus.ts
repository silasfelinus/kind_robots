// /utils/scripts/verifyWonderLabStatus.ts
import assert from 'node:assert/strict'
import {
  componentStatuses,
  getComponentStatus,
  isComponentStatus,
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

for (const status of componentStatuses) {
  assert.equal(isComponentStatus(status), true)
  assert.equal(getComponentStatus({ status }), status)
}

assert.equal(isComponentStatus('not-real'), false)
assert.equal(
  getComponentStatus({ status: 'invalid-status' }),
  'UNREVIEWED',
  'Invalid canonical input must fail closed to UNREVIEWED.',
)
assert.equal(
  getComponentStatus({ status: null }),
  'UNREVIEWED',
  'Missing canonical status must fail closed to UNREVIEWED.',
)
assert.equal(
  getComponentStatus({}),
  'UNREVIEWED',
  'An incomplete snapshot must remain safe without legacy booleans.',
)

console.log('WonderLab canonical Component status verification passed.')
