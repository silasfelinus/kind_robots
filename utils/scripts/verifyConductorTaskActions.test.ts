import assert from 'node:assert/strict'
import {
  buildConductorTaskEvent,
  taskActionRequiresMessage,
} from '../conductorTaskActions'

const actor = 'silas'
const message = 'Use test mode only.'

assert.deepEqual(buildConductorTaskEvent('proceed', actor, message, false), {
  operation: 'ready',
  approved_by_human: true,
  note: 'APPROVED TO CONTINUE by silas via Kind Robots. Gate released for the next agent. Use test mode only.',
})
assert.deepEqual(buildConductorTaskEvent('approve', actor, '', false), {
  operation: 'done',
  approved_by_human: true,
  note: 'ACCEPTED COMPLETE by silas via Kind Robots For You.',
})
assert.equal(
  Object.hasOwn(
    buildConductorTaskEvent('answer', actor, message, false),
    'approved_by_human',
  ),
  false,
)
assert.equal(
  buildConductorTaskEvent('answer', actor, message, false).operation,
  'ready',
)
assert.equal(
  buildConductorTaskEvent('reject', actor, message, false).approved_by_human,
  false,
)
assert.deepEqual(buildConductorTaskEvent('comment', actor, message, true), {
  operation: 'needs-human',
  soft_gate: true,
  note: 'HUMAN NOTE from silas via Kind Robots. Still gated. Use test mode only.',
})
assert.equal(taskActionRequiresMessage('approve'), false)
for (const action of ['proceed', 'reject', 'comment', 'answer'] as const) {
  assert.equal(taskActionRequiresMessage(action), true)
}

console.log('Conductor task action semantics verified.')
