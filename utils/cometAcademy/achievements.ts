// /utils/cometAcademy/achievements.ts
//
// Prom of Doom achievements (utils/achievements/catalog/main/
// comet-city-academy.ts). The store snapshots a few facts about the term after
// every action and awards what the action newly earned. A loaded or imported
// save only resets the snapshot, so restoring a finished term earns nothing.

import { CAMPAIGN_VILLAINS, campaignVillain } from './campaign'
import { PROM_ENDINGS, SIMULATION_ENDINGS } from './artSlots'
import type { AcademyRun } from './rules'

type YearbookEntryLike = {
  forms: readonly string[]
  endings: readonly string[]
}

export type AcademyDeedFacts = {
  seed: number | null
  ending: string | null
  unmasked: boolean
  romance: boolean
  honorsFights: number
  allies: number
  secrets: number
  reconciled: boolean
}

export const NO_ACADEMY_FACTS: AcademyDeedFacts = {
  seed: null,
  ending: null,
  unmasked: false,
  romance: false,
  honorsFights: 0,
  allies: 0,
  secrets: 0,
  reconciled: false,
}

export function academyDeedFacts(
  run: AcademyRun | null | undefined,
): AcademyDeedFacts {
  if (!run) return NO_ACADEMY_FACTS
  const history = run.tacticalHistory ?? []
  return {
    seed: run.seed,
    ending: run.phase === 'ending' ? run.ending : null,
    unmasked: Boolean(
      run.suspect &&
      run.suspect.id === campaignVillain(run.seed, run.mastermind).id,
    ),
    romance: Boolean(run.relationships?.romance),
    honorsFights: history.filter((fight) => fight.grade === 'honors').length,
    allies:
      history.filter((fight) => fight.lieutenantParley === 'ally').length +
      (run.tacticalBattle?.arena?.lieutenantParley === 'ally' ? 1 : 0),
    secrets: run.districtSecrets?.length ?? 0,
    reconciled: run.betrayal?.status === 'reconciled',
  }
}

const ENDING_ACHIEVEMENTS: Readonly<Record<string, string>> = {
  'HONORS IN THE PROM SIMULATION': 'comet-city-academy-sim-honors',
  'A CITY WITH A THOUSAND KEYS': 'comet-city-academy-thousand-keys',
  'THE LAST DANCE LEAVES BY BOAT': 'comet-city-academy-last-dance',
  'MASTER OF THE SHIELD': 'comet-city-academy-master-shield',
  'THE TRANSMITTER GOES DARK': 'comet-city-academy-transmitter-dark',
  'THE BROKEN GRID': 'comet-city-academy-collateral',
  'THE MUSIC AFTER GLASS': 'comet-city-academy-collateral',
  'THE PRICE OF A SINGLE SWITCH': 'comet-city-academy-collateral',
  'THE SHIELD CHANGES HANDS': 'comet-city-academy-collateral',
}

/** Codes earned between two snapshots of the same action. */
export function academyDeedAchievements(
  before: AcademyDeedFacts,
  after: AcademyDeedFacts,
): string[] {
  if (after.seed === null) return []
  const prev = before.seed === after.seed ? before : NO_ACADEMY_FACTS
  const codes: string[] = []
  if (after.ending && after.ending !== prev.ending) {
    if (!SIMULATION_ENDINGS.includes(after.ending))
      codes.push('comet-city-academy-graduated')
    const code = ENDING_ACHIEVEMENTS[after.ending]
    if (code) codes.push(code)
  }
  if (after.unmasked && !prev.unmasked)
    codes.push('comet-city-academy-unmasked')
  if (after.romance && !prev.romance) codes.push('comet-city-academy-prom-date')
  if (after.honorsFights > prev.honorsFights)
    codes.push('comet-city-academy-honors-fight')
  if (after.allies > prev.allies) codes.push('comet-city-academy-parley')
  if (after.secrets > prev.secrets) codes.push('comet-city-academy-case-secret')
  if (after.reconciled && !prev.reconciled)
    codes.push('comet-city-academy-reconciled')
  return codes
}

export const ALL_ENDINGS_COUNT = PROM_ENDINGS.length
export const MANY_FACES_COUNT = 5

export type YearbookFacts = {
  forms: number
  endings: number
  graduatedAs: number
  dossiers: number
}

const KNOWN_ENDINGS: ReadonlySet<string> = new Set(PROM_ENDINGS)

export function yearbookFacts(
  yearbook: Readonly<Record<string, YearbookEntryLike>>,
  dossiers: readonly string[],
): YearbookFacts {
  const entries = Object.values(yearbook)
  return {
    forms: entries.reduce((sum, entry) => sum + entry.forms.length, 0),
    endings: new Set(
      entries.flatMap((entry) =>
        entry.endings.filter((ending) => KNOWN_ENDINGS.has(ending)),
      ),
    ).size,
    graduatedAs: entries.filter((entry) => entry.endings.length > 0).length,
    dossiers: new Set(dossiers).size,
  }
}

/** Codes the Yearbook and dossiers newly earned during one action. */
export function yearbookAchievements(
  before: YearbookFacts,
  after: YearbookFacts,
): string[] {
  const codes: string[] = []
  if (after.forms > before.forms) codes.push('comet-city-academy-mantle')
  if (after.endings >= ALL_ENDINGS_COUNT && before.endings < ALL_ENDINGS_COUNT)
    codes.push('comet-city-academy-all-endings')
  if (
    after.graduatedAs >= MANY_FACES_COUNT &&
    before.graduatedAs < MANY_FACES_COUNT
  )
    codes.push('comet-city-academy-many-faces')
  if (
    after.dossiers >= CAMPAIGN_VILLAINS.length &&
    before.dossiers < CAMPAIGN_VILLAINS.length
  )
    codes.push('comet-city-academy-dossiers')
  return codes
}
