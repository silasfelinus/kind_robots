/**
 * e03 "Morrow's Shift": 64 authored Earth sites served by the overworld
 * event catalog in place of the template recipe for e03. Rows are written
 * as separate modules so each district can be revised on its own.
 */
import { MORROW_SHIFT_FINALE } from './finale'
import { MORROW_SHIFT_ROWS_1_2 } from './rows12'
import { MORROW_SHIFT_ROWS_3_4 } from './rows34'
import { MORROW_SHIFT_ROWS_5_6 } from './rows56'
import { MORROW_SHIFT_ROWS_7_8 } from './rows78'
import type { MorrowShiftSite } from './types'

export type * from './types'

export const MORROW_SHIFT_SITES: readonly MorrowShiftSite[] = [
  ...MORROW_SHIFT_ROWS_1_2,
  ...MORROW_SHIFT_ROWS_3_4,
  ...MORROW_SHIFT_ROWS_5_6,
  ...MORROW_SHIFT_ROWS_7_8,
  MORROW_SHIFT_FINALE,
]

export const MORROW_SHIFT_BY_KEY: ReadonlyMap<string, MorrowShiftSite> =
  new Map(MORROW_SHIFT_SITES.map((site) => [site.key, site]))

/** Fixed Chronicle photograph coordinates; their choices come from chronicle.ts. */
export const MORROW_SHIFT_PHOTO_SITES = ['1,3', '6,4'] as const

/** Ids the template-era e03 catalog stored for every non-photo site. */
export const MORROW_SHIFT_LEGACY_IDS = ['care', 'risk'] as const

export function validateMorrowShift(): string[] {
  const problems: string[] = []
  const keys = new Set<string>()
  for (const site of MORROW_SHIFT_SITES) {
    if (keys.has(site.key)) problems.push(site.key + ': duplicate site')
    keys.add(site.key)
    const ids = site.choices.map((choice) => choice.id)
    const photo = (MORROW_SHIFT_PHOTO_SITES as readonly string[]).includes(
      site.key,
    )
    if (photo && ids.length)
      problems.push(site.key + ': photograph site must defer to Chronicle')
    if (!photo && site.instant && (ids.length !== 1 || ids[0] !== 'notice'))
      problems.push(site.key + ': instant site needs one notice choice')
    if (!photo && !site.instant && (ids[0] !== 'care' || ids[1] !== 'risk'))
      problems.push(site.key + ': regular site must keep care/risk ids')
    for (const echo of site.echoes ?? []) {
      const match = /^e03:([1-8],[1-8]):(.+)$/.exec(echo.flag)
      if (!match) {
        problems.push(site.key + ': malformed echo ' + echo.flag)
        continue
      }
      if (match[1] === site.key)
        problems.push(site.key + ': echo cannot reference itself')
      const target = MORROW_SHIFT_SITES.find((item) => item.key === match[1])
      const targetIds = (
        MORROW_SHIFT_PHOTO_SITES as readonly string[]
      ).includes(match[1]!)
        ? ['challenge', 'hold']
        : (target?.choices.map((choice) => choice.id) ?? [])
      if (!targetIds.includes(match[2]!))
        problems.push(site.key + ': echo targets unknown choice ' + echo.flag)
    }
  }
  for (let y = 1; y <= 8; y++)
    for (let x = 1; x <= 8; x++)
      if (!keys.has(x + ',' + y)) problems.push(x + ',' + y + ': missing site')
  return problems
}
