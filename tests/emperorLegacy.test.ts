import assert from 'node:assert/strict'
import {
  LEGACY_BRASS,
  applyLegacy,
  decodeLegacy,
  earnLegacy,
  emptyLegacy,
  encodeLegacy,
} from '../utils/emperorOfDust/fortress/legacy'
import { createRun } from '../utils/emperorOfDust/fortress/engine'

{
  {
    const start = createRun(123)
    assert.deepEqual(earnLegacy(emptyLegacy(), start), emptyLegacy())
    assert.equal(
      applyLegacy(start, { endings: [], useWrit: true }).brass,
      start.brass,
    )
  }

  {
    const finished = { ...createRun(123), day: 51 }
    const first = earnLegacy(emptyLegacy(), finished)
    assert.deepEqual(first.endings, ['long-night'])
    assert.deepEqual(earnLegacy(first, finished), first)
    const start = createRun(456)
    assert.equal(applyLegacy(start, first).brass, start.brass)
    const enabled = { ...first, useWrit: true }
    assert.equal(applyLegacy(start, enabled).brass, start.brass + LEGACY_BRASS)
    assert.equal(start.brass, createRun(456).brass)
    assert.deepEqual(decodeLegacy(encodeLegacy(enabled)), enabled)
  }

  {
    assert.equal(decodeLegacy('{bad'), null)
    assert.equal(decodeLegacy('{"endings":false}'), null)
    assert.deepEqual(decodeLegacy(null), emptyLegacy())
  }
}
