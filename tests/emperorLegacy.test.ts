import { describe, expect, it } from 'vitest'
import {
  LEGACY_BRASS,
  applyLegacy,
  decodeLegacy,
  earnLegacy,
  emptyLegacy,
  encodeLegacy,
} from '~/utils/emperorOfDust/fortress/legacy'
import { createRun } from '~/utils/emperorOfDust/fortress/engine'

describe('Emperor legacy carry-over', () => {
  it('never grants a reward before a completed reign', () => {
    const start = createRun(123)
    expect(earnLegacy(emptyLegacy(), start)).toEqual(emptyLegacy())
    expect(applyLegacy(start, { endings: [], useWrit: true }).brass).toBe(start.brass)
  })

  it('records earned endings once and grants only an optional bounded bonus', () => {
    const finished = { ...createRun(123), day: 51 }
    const first = earnLegacy(emptyLegacy(), finished)
    expect(first.endings).toEqual(['long-night'])
    expect(earnLegacy(first, finished)).toEqual(first)
    const start = createRun(456)
    expect(applyLegacy(start, first).brass).toBe(start.brass)
    const enabled = { ...first, useWrit: true }
    expect(applyLegacy(start, enabled).brass).toBe(start.brass + LEGACY_BRASS)
    expect(start.brass).toBe(createRun(456).brass)
    expect(decodeLegacy(encodeLegacy(enabled))).toEqual(enabled)
  })

  it('rejects malformed saves without erasing them or granting a boon', () => {
    expect(decodeLegacy('{bad')).toBeNull()
    expect(decodeLegacy('{"endings":false}')).toBeNull()
    expect(decodeLegacy(null)).toEqual(emptyLegacy())
  })
})
