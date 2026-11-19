import assert from 'node:assert/strict'
import { ENDINGS } from '../utils/emperorOfDust/fortress/endings'
import {
  LEGACY_BRASS,
  LEGACY_FAVOR_BONUS,
  LEGACY_FAVORS,
  applyLegacy,
  decodeLegacy,
  earnLegacy,
  emptyLegacy,
  encodeLegacy,
} from '../utils/emperorOfDust/fortress/legacy'
import { createRun } from '../utils/emperorOfDust/fortress/engine'

{
  const start = createRun(123)
  assert.deepEqual(earnLegacy(emptyLegacy(), start), emptyLegacy())
  assert.equal(
    applyLegacy(start, { endings: [], useWrit: true, selectedFavor: null })
      .brass,
    start.brass,
  )

  const finished = { ...createRun(123), day: 51 }
  const first = earnLegacy(emptyLegacy(), finished)
  assert.deepEqual(first.endings, ['long-night'])
  assert.deepEqual(earnLegacy(first, finished), first)
  assert.deepEqual(applyLegacy(start, first), start)
  const enabled = { ...first, useWrit: true }
  assert.equal(applyLegacy(start, enabled).brass, start.brass + LEGACY_BRASS)
  assert.equal(start.brass, createRun(123).brass)
  assert.deepEqual(decodeLegacy(encodeLegacy(enabled)), enabled)
}

{
  const base = createRun(456)
  assert.equal(Object.keys(LEGACY_FAVORS).length, 8)
  for (const id of Object.keys(ENDINGS) as (keyof typeof ENDINGS)[]) {
    const favor = LEGACY_FAVORS[id]
    const record = {
      endings: [id],
      useWrit: false,
      selectedFavor: id,
    }
    const next = applyLegacy(base, record)
    assert.equal(next.brass, base.brass)
    assert.equal(next.day, 1)
    if (favor.kind === 'local') {
      assert.equal(
        next.local[favor.faction],
        base.local[favor.faction] + LEGACY_FAVOR_BONUS,
      )
      assert.deepEqual(next.affinity, base.affinity)
    } else {
      assert.equal(
        next.affinity[favor.faction],
        base.affinity[favor.faction] + LEGACY_FAVOR_BONUS,
      )
      assert.deepEqual(next.local, base.local)
    }
    assert.deepEqual(decodeLegacy(encodeLegacy(record)), record)
    assert.deepEqual(base, createRun(456))
  }
  assert.deepEqual(
    applyLegacy(base, {
      endings: ['open-roads'],
      useWrit: false,
      selectedFavor: 'long-night',
    }),
    base,
  )
}

{
  assert.equal(decodeLegacy('{bad'), null)
  assert.equal(decodeLegacy('{"endings":false}'), null)
  assert.deepEqual(decodeLegacy(null), emptyLegacy())
  assert.deepEqual(
    decodeLegacy(
      '{"endings":["not-a-real-ending","long-night","long-night"],"useWrit":false,"selectedFavor":"not-a-real-ending"}',
    ),
    { endings: ['long-night'], useWrit: false, selectedFavor: null },
  )
  assert.deepEqual(decodeLegacy('{"endings":["long-night"],"useWrit":true}'), {
    endings: ['long-night'],
    useWrit: true,
    selectedFavor: null,
  })
  assert.deepEqual(
    decodeLegacy(
      '{"endings":["open-roads"],"useWrit":false,"selectedFavor":"long-night"}',
    ),
    { endings: ['open-roads'], useWrit: false, selectedFavor: null },
  )
  assert.deepEqual(
    decodeLegacy(
      '{"endings":["long-night"],"useWrit":true,"selectedFavor":"long-night"}',
    ),
    { endings: ['long-night'], useWrit: true, selectedFavor: null },
  )
}
