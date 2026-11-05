/**
 * e06 "Undertide Crown": the same 64 sea-palace places as e05, warped by
 * Scylla's second chance into the horror register of the pair. Photograph
 * sites (2,6 and 6,2), Char's own choice at 7,7 and the 8,8 witness bells
 * author their scene only; their choices stay the Chronicle's and the
 * campaign's.
 */
import { SCYLLAS_SHORE_SITES } from '../scyllasShore'
import type { MorrowShiftSite } from '../morrowShift/types'
import { UNDERTIDE_CROWN_ROWS_1_2 } from './rows12'
import { UNDERTIDE_CROWN_ROWS_3_4 } from './rows34'
import { UNDERTIDE_CROWN_ROWS_5_6 } from './rows56'
import { UNDERTIDE_CROWN_ROWS_7_8 } from './rows78'

export const UNDERTIDE_CROWN_SITES: readonly MorrowShiftSite[] = [
  ...UNDERTIDE_CROWN_ROWS_1_2,
  ...UNDERTIDE_CROWN_ROWS_3_4,
  ...UNDERTIDE_CROWN_ROWS_5_6,
  ...UNDERTIDE_CROWN_ROWS_7_8,
]

export const UNDERTIDE_CROWN_BY_KEY: ReadonlyMap<string, MorrowShiftSite> =
  new Map(UNDERTIDE_CROWN_SITES.map((site) => [site.key, site]))

/** Choices supplied elsewhere: two photographs, Char's choice and the bells. */
export const UNDERTIDE_CROWN_FIXED_SITES = ['2,6', '6,2', '7,7', '8,8'] as const

/** How Scylla left e05's gate; e06 must remember each. */
export const DEPARTURE_FLAGS = [
  'e05:run-again',
  'e05:stay',
  'e05:tell-char',
] as const

export function validateUndertideCrown(): string[] {
  const problems: string[] = []
  const e05Places = new Map(
    SCYLLAS_SHORE_SITES.map((site) => [site.key, site.place]),
  )
  const keys = new Set<string>()
  for (const site of UNDERTIDE_CROWN_SITES) {
    if (keys.has(site.key)) problems.push(site.key + ': duplicate site')
    keys.add(site.key)
    if (site.place !== e05Places.get(site.key))
      problems.push(site.key + ': place differs from e05')
    const ids = site.choices.map((choice) => choice.id)
    const fixed = (UNDERTIDE_CROWN_FIXED_SITES as readonly string[]).includes(
      site.key,
    )
    if (fixed && ids.length)
      problems.push(site.key + ': fixed site must keep its existing choices')
    if (!fixed && site.instant && (ids.length !== 1 || ids[0] !== 'notice'))
      problems.push(site.key + ': instant site needs one notice choice')
    if (!fixed && !site.instant && (ids[0] !== 'care' || ids[1] !== 'risk'))
      problems.push(site.key + ': regular site must keep care/risk ids')
  }
  const echoed = new Set(
    UNDERTIDE_CROWN_SITES.flatMap((site) =>
      (site.echoes ?? []).map((echo) => echo.flag),
    ),
  )
  for (const flag of DEPARTURE_FLAGS)
    if (!echoed.has(flag)) problems.push('no site remembers ' + flag)
  for (let y = 1; y <= 8; y++)
    for (let x = 1; x <= 8; x++)
      if (!keys.has(x + ',' + y)) problems.push(x + ',' + y + ': missing site')
  return problems
}
