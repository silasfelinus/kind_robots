// /utils/arcade/butterflyBlaster/clinic.ts
//
// The Clinic (conductor kr-arcade/t-056, CABINETS.md section 6 "The Clinic"): between regions the
// night watch rests at AMI's clinic and spends thank-you beads, which the villages give at the
// dawn tally (never real money). Prices rise each Moon.

export type ClinicItem =
  'butterfly' | 'ribbon' | 'dash' | 'startNet' | 'sturdyNet' | 'hint'

export const CLINIC: Record<
  ClinicItem,
  { name: string; line: string; price: number; once: boolean }
> = {
  butterfly: {
    name: 'EXTRA BUTTERFLY',
    line: 'ONE MORE WING ON THE NIGHT WATCH',
    price: 8,
    once: false,
  },
  ribbon: {
    name: 'LONGER RIBBON',
    line: 'THE LASSO TRAILS HALF A SECOND MORE',
    price: 10,
    once: true,
  },
  dash: {
    name: 'QUICKER DASH',
    line: 'B IS READY AGAIN A THIRD SOONER',
    price: 8,
    once: true,
  },
  startNet: {
    name: 'STARTING NET',
    line: 'EVERY NIGHT BEGINS UNDER A BED NET',
    price: 10,
    once: true,
  },
  sturdyNet: {
    name: 'STURDY NET',
    line: 'BED NETS TAKE TWO HITS',
    price: 12,
    once: true,
  },
  hint: {
    name: 'THREAD HINT',
    line: "WHERE THE NEXT REGION'S GOLDEN THREAD IS",
    price: 4,
    once: false,
  },
}

/** The Clinic's rows, top to bottom (the last row leaves). */
export const CLINIC_ROWS: readonly (ClinicItem | 'leave')[] = [
  'butterfly',
  'ribbon',
  'dash',
  'startNet',
  'sturdyNet',
  'hint',
  'leave',
]

/** Prices rise each Moon. */
export function clinicPrice(item: ClinicItem, moon: number): number {
  const rise = [1, 1.5, 2][Math.max(0, Math.min(2, moon - 1))]!
  return Math.ceil(CLINIC[item].price * rise)
}

/** Thank-you beads a village gives at dawn. */
export const BEADS = {
  /** For each hut that came through unbitten. */
  hut: 1,
  /** Not a hut bitten all night. */
  notABite: 2,
  /** The special night's objective met. */
  special: 3,
  /** A nest boss netted. */
  boss: 10,
} as const

/** The Longer Ribbon's extra ticks, and the Quicker Dash's cooldown. */
export const UPGRADES = { ribbon: 30, dashCooldown: 40 } as const

/** Ticks the Clinic waits before it sends an idle watch on its way. */
export const CLINIC_IDLE = 60 * 30
