import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  canRequisitionSupplies,
  requisitionSupplies,
  restoreVoyage,
  startVoyage,
} from '../gameOfCaptains/rules'
import { controls } from './spaceCouchTraceHarness'

const base = {
  ...startVoyage('vale', ['pell', 'mox', 'rue'], 42),
  phase: 'debrief' as const,
  chapter: 2,
  supplies: 1,
  reputation: 4,
  missionHistory: [
    {
      chapter: 2,
      missionId: 'refugees',
      system: 'Test Station',
      policy: 'aid' as const,
      result: 'flawless' as const,
    },
  ],
}
assert.equal(canRequisitionSupplies(base), true)
assert.ok(controls(base).some((option) => option.label === 'resupply'))
const recovered = requisitionSupplies(base)
assert.notEqual(recovered, base)
assert.equal(recovered.supplies, 4)
assert.equal(recovered.reputation, 2)
assert.equal(recovered.trust, base.trust)
assert.deepEqual(recovered.missionHistory, base.missionHistory)
assert.ok(recovered.worldFlags?.includes('quartermaster:2'))
assert.match(recovered.scene, /three supply crates/)
assert.deepEqual(restoreVoyage(JSON.parse(JSON.stringify(recovered))), recovered)
assert.equal(canRequisitionSupplies(recovered), false)
assert.equal(requisitionSupplies(recovered), recovered)
assert.ok(!controls(recovered).some((option) => option.label === 'resupply'))
const briefing = { ...base, phase: 'briefing' as const }
assert.equal(requisitionSupplies(briefing), briefing)
assert.equal(canRequisitionSupplies({ ...base, supplies: 3 }), false)
assert.equal(canRequisitionSupplies({ ...base, reputation: 1 }), false)
assert.equal(canRequisitionSupplies({ ...base, missionHistory: [] }), false)
assert.equal(
  canRequisitionSupplies({
    ...base,
    missionHistory: [{ ...base.missionHistory[0]!, policy: 'missed' }],
  }),
  false,
)
assert.ok(!controls({ ...base, supplies: 3 }).some((option) => option.label === 'resupply'))

const page = readFileSync(
  new URL('../../pages/play/game-of-captains.vue', import.meta.url),
  'utf8',
)
assert.match(page, /space-couch-quartermaster/)
assert.match(page, /canRequisitionSupplies\(run\)/)
assert.match(page, /store\.requisition\(\)/)
console.log('Space Couch quartermaster: earned, optional and one-time per chapter')
