import { describe, expect, it } from 'vitest'
import {
  completedDelta,
  isProjectProgressHistory,
  progressPercent,
} from '@/utils/projectProgressHistory'

describe('project progress history', () => {
  it('distinguishes missing points, zero scope and completed scope', () => {
    expect(progressPercent(null)).toBeNull()
    expect(progressPercent({ done: 0, total: 0 })).toBeNull()
    expect(progressPercent({ done: 3, total: 4 })).toBe(75)
    expect(completedDelta([null, { done: 3, total: 4 }])).toBeNull()
    expect(
      completedDelta([
        { done: 2, total: 4 },
        { done: 3, total: 6 },
      ]),
    ).toBe(1)
  })

  it('validates alignment and rejects impossible task counts', () => {
    const base = {
      sourceCommitSha: 'a'.repeat(40),
      dates: ['2026-11-24', '2026-11-25'],
      series: { game: [null, { done: 1, total: 2 }] },
    }
    expect(isProjectProgressHistory(base)).toBe(true)
    expect(
      isProjectProgressHistory({
        ...base,
        series: { game: [{ done: 3, total: 2 }, null] },
      }),
    ).toBe(false)
    expect(
      isProjectProgressHistory({
        ...base,
        series: { game: [null] },
      }),
    ).toBe(false)
  })
})
