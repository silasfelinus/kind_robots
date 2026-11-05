/**
 * e05 "Scylla's Shore": Scylla, flung back into her younger self in the sea
 * palace three days before the sisters first ran away, remembering how the
 * e04 tide gate ended. Photograph sites (3,1 and 8,5) and the 8,8 departure
 * gate author their scene only; their choices stay the Chronicle's and the
 * campaign's. e06 revisits these same places.
 */
import type { MorrowShiftSite } from '../morrowShift/types'
import { SCYLLAS_SHORE_ROWS_1_2 } from './rows12'
import { SCYLLAS_SHORE_ROWS_3_4 } from './rows34'
import { SCYLLAS_SHORE_ROWS_5_6 } from './rows56'
import { SCYLLAS_SHORE_ROWS_7_8 } from './rows78'

export const SCYLLAS_SHORE_SITES: readonly MorrowShiftSite[] = [
  ...SCYLLAS_SHORE_ROWS_1_2,
  ...SCYLLAS_SHORE_ROWS_3_4,
  ...SCYLLAS_SHORE_ROWS_5_6,
  ...SCYLLAS_SHORE_ROWS_7_8,
]

export const SCYLLAS_SHORE_BY_KEY: ReadonlyMap<string, MorrowShiftSite> =
  new Map(SCYLLAS_SHORE_SITES.map((site) => [site.key, site]))

/** Sites whose choices come from elsewhere: two photographs and the departure. */
export const SCYLLAS_SHORE_FIXED_SITES = ['3,1', '8,5', '8,8'] as const

/** The three e04 tide-gate outcomes Scylla can remember. */
export const TIDE_GATE_FLAGS = [
  'e04:char-lost-in-present',
  'e04:char-alive-commuters-stranded',
  'e04:char-alive-district-at-risk',
] as const

export function validateScyllasShore(): string[] {
  const problems: string[] = []
  const keys = new Set<string>()
  const places = new Set<string>()
  for (const site of SCYLLAS_SHORE_SITES) {
    if (keys.has(site.key)) problems.push(site.key + ': duplicate site')
    keys.add(site.key)
    if (places.has(site.place))
      problems.push(site.key + ': duplicate place ' + site.place)
    places.add(site.place)
    const ids = site.choices.map((choice) => choice.id)
    const fixed = (SCYLLAS_SHORE_FIXED_SITES as readonly string[]).includes(
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
    SCYLLAS_SHORE_SITES.flatMap((site) =>
      (site.echoes ?? []).map((echo) => echo.flag),
    ),
  )
  for (const flag of TIDE_GATE_FLAGS)
    if (!echoed.has(flag)) problems.push('no site remembers ' + flag)
  for (let y = 1; y <= 8; y++)
    for (let x = 1; x <= 8; x++)
      if (!keys.has(x + ',' + y)) problems.push(x + ',' + y + ': missing site')
  return problems
}
