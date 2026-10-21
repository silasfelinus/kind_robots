// Standing laws (conductor emperor-of-dust t-040): a choice that stays on the
// gate after the scene closes. A law is in force while the run holds its flag
// (clear the flag to repeal it) and the crown still sits in the tower. It
// changes the regions' daily taxes; its slow pull on a faction's mood is a
// recurring due (`DUES`, `every`) scheduled by the same answer.
import type { FortressRun } from './types'

export type LawDef = {
  id: string
  /** In force while the run holds this flag. */
  flag: string
  title: string
  /** The ledger's line: what it does, in the court's own words. */
  text: string
  /** Added to the regions' taxes each dawn (negative takes away). */
  taxes: number
}

/**
 * @example
 * { id: 'market-rate-hard', flag: 'tax-high', title: 'The market rate: hard',
 *   text: 'Two brass more a day at the gate.', taxes: 2 }
 */
export const LAWS: readonly LawDef[] = [
  {
    id: 'market-rate-hard',
    flag: 'tax-high',
    title: 'The market rate: hard',
    text: 'Painted on the gate on Day 2. Two brass more a day. Every week the Ledger likes the crown a little less.',
    taxes: 2,
  },
  {
    id: 'market-rate-light',
    flag: 'tax-low',
    title: 'The market rate: light',
    text: 'Painted on the gate on Day 2. Two brass less a day. Every week the Ledger likes the crown a little more.',
    taxes: -2,
  },
]

/** Laws on the gate today. None in hiding: the gate belongs to someone else. */
export const lawsInForce = (
  run: Pick<FortressRun, 'flags' | 'hideout'>,
): LawDef[] =>
  run.hideout ? [] : LAWS.filter((law) => run.flags.includes(law.flag))

export const lawTaxes = (run: Pick<FortressRun, 'flags' | 'hideout'>) =>
  lawsInForce(run).reduce((sum, law) => sum + law.taxes, 0)
