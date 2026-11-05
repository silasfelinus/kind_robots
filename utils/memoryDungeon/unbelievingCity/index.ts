/**
 * e04 "The Unbelieving City": the same 64 Earth places as e03 after magic
 * arrived uninvited. The horror register of the e03/e04 pair. Photograph
 * sites (2,2 and 7,6) and the 8,8 tide gate author their scene only; their
 * choices stay the Chronicle's and the campaign's.
 */
import { MORROW_SHIFT_SITES } from '../morrowShift'
import type { MorrowShiftSite } from '../morrowShift/types'
import { UNBELIEVING_CITY_ROWS_1_2 } from './rows12'
import { UNBELIEVING_CITY_ROWS_3_4 } from './rows34'
import { UNBELIEVING_CITY_ROWS_5_6 } from './rows56'
import { UNBELIEVING_CITY_ROWS_7_8 } from './rows78'

export const UNBELIEVING_CITY_SITES: readonly MorrowShiftSite[] = [
  ...UNBELIEVING_CITY_ROWS_1_2,
  ...UNBELIEVING_CITY_ROWS_3_4,
  ...UNBELIEVING_CITY_ROWS_5_6,
  ...UNBELIEVING_CITY_ROWS_7_8,
]

export const UNBELIEVING_CITY_BY_KEY: ReadonlyMap<string, MorrowShiftSite> =
  new Map(UNBELIEVING_CITY_SITES.map((site) => [site.key, site]))

/** Sites whose choices come from elsewhere: two photographs and the tide gate. */
export const UNBELIEVING_CITY_FIXED_SITES = ['2,2', '7,6', '8,8'] as const

export function validateUnbelievingCity(): string[] {
  const problems: string[] = []
  const e03Places = new Map(
    MORROW_SHIFT_SITES.map((site) => [site.key, site.place]),
  )
  const keys = new Set<string>()
  for (const site of UNBELIEVING_CITY_SITES) {
    if (keys.has(site.key)) problems.push(site.key + ': duplicate site')
    keys.add(site.key)
    if (site.place !== e03Places.get(site.key))
      problems.push(site.key + ': place differs from e03')
    const ids = site.choices.map((choice) => choice.id)
    const fixed = (UNBELIEVING_CITY_FIXED_SITES as readonly string[]).includes(
      site.key,
    )
    if (fixed && ids.length)
      problems.push(site.key + ': fixed site must keep its existing choices')
    if (!fixed && site.instant && (ids.length !== 1 || ids[0] !== 'notice'))
      problems.push(site.key + ': instant site needs one notice choice')
    if (!fixed && !site.instant && (ids[0] !== 'care' || ids[1] !== 'risk'))
      problems.push(site.key + ': regular site must keep care/risk ids')
    for (const echo of site.echoes ?? [])
      if (
        !/^(e0[34]:[1-8],[1-8]:[a-z-]+|SB-35:(return|finish|confess))$/.test(
          echo.flag,
        )
      )
        problems.push(site.key + ': malformed echo ' + echo.flag)
  }
  for (let y = 1; y <= 8; y++)
    for (let x = 1; x <= 8; x++)
      if (!keys.has(x + ',' + y)) problems.push(x + ',' + y + ': missing site')
  return problems
}
