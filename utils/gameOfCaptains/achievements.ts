// /utils/gameOfCaptains/achievements.ts
//
// Space Couch achievements (utils/achievements/catalog/main/
// game-of-captains.ts). The store snapshots a few facts about the voyage after
// every action and awards what that action newly earned. Loading a saved
// voyage only resets the snapshot, so a restored finished voyage earns nothing.

import { ALIEN_SPECIES } from './alienSpecies'
import { slugify } from './artSlots'
import type { CloneRun } from './cloneSaga'
import type { RomanceVoyage } from './romance'
import type { VoyageRun } from './rules'
import type { TrioVoyage } from './trioAdventures'

type AchievementVoyage = VoyageRun &
  Pick<CloneRun, 'cloneProgram'> &
  Pick<RomanceVoyage, 'romance'> &
  Pick<TrioVoyage, 'trioAdventure'>

export type VoyageDeedFacts = {
  seed: number | null
  ending: string | null
  committed: boolean
  clonesPrinted: number
  trioFinished: boolean
  detours: number
  hostAsked: number
}

export const NO_VOYAGE_FACTS: VoyageDeedFacts = {
  seed: null,
  ending: null,
  committed: false,
  clonesPrinted: 0,
  trioFinished: false,
  detours: 0,
  hostAsked: 0,
}

export function voyageDeedFacts(
  run: VoyageRun | null | undefined,
): VoyageDeedFacts {
  if (!run) return NO_VOYAGE_FACTS
  const voyage = run as AchievementVoyage
  return {
    seed: run.seed,
    ending: run.ending ? slugify(run.ending) : null,
    committed: voyage.romance?.status === 'committed',
    clonesPrinted: voyage.cloneProgram?.records.length ?? 0,
    trioFinished: voyage.trioAdventure?.ending !== undefined,
    detours: run.journeyHistory?.length ?? 0,
    hostAsked: (run.venueProgress?.choices ?? []).filter(
      (entry) => entry.venue === 'casino' && entry.choice === 'ask',
    ).length,
  }
}

const ENDING_ACHIEVEMENTS: Readonly<Record<string, string>> = {
  'captain-of-the-open-horizon': 'game-of-captains-open-horizon',
  'the-last-ship-home': 'game-of-captains-last-ship-home',
  'the-galactic-bargain': 'game-of-captains-galactic-bargain',
  'the-cost-of-command': 'game-of-captains-cost-of-command',
  'the-union-cancellation': 'game-of-captains-off-the-record',
  'the-witness-coalition': 'game-of-captains-off-the-record',
}

export const ANTHOLOGY_ENDINGS = 6

/**
 * Codes one action newly earned. `kitEndings` is how many Playbook Kit endings
 * the scrapbook holds after the action, so Anthology counts every voyage.
 */
export function voyageDeedAchievements(
  before: VoyageDeedFacts,
  after: VoyageDeedFacts,
  kitEndings = 0,
): string[] {
  if (after.seed === null) return []
  const prev = before.seed === after.seed ? before : NO_VOYAGE_FACTS
  const codes: string[] = []
  if (after.ending && after.ending !== prev.ending) {
    codes.push('game-of-captains-homeward')
    const code = ENDING_ACHIEVEMENTS[after.ending]
    if (code) codes.push(code)
    if (kitEndings >= ANTHOLOGY_ENDINGS)
      codes.push('game-of-captains-anthology')
  }
  if (after.committed && !prev.committed)
    codes.push('game-of-captains-couch-for-two')
  if (after.clonesPrinted > prev.clonesPrinted)
    codes.push('game-of-captains-print-another')
  if (after.trioFinished && !prev.trioFinished)
    codes.push('game-of-captains-trio')
  if (after.detours > prev.detours) codes.push('game-of-captains-detour')
  if (after.hostAsked > prev.hostAsked)
    codes.push('game-of-captains-ask-the-host')
  return codes
}

export const XENOLOGIST_SPECIES = 25

/** Codes logging alien species earns, from the scrapbook count before and after. */
export function alienAchievements(before: number, after: number): string[] {
  if (after <= before) return []
  const codes = ['game-of-captains-first-contact']
  if (after >= XENOLOGIST_SPECIES) codes.push('game-of-captains-xenologist')
  if (after >= ALIEN_SPECIES.length) codes.push('game-of-captains-field-guide')
  return codes
}

export const NAMES_KNOWN = 10

/** Learning redshirt names across voyages. */
export function redshirtAchievements(before: number, after: number): string[] {
  return after >= NAMES_KNOWN && before < NAMES_KNOWN
    ? ['game-of-captains-names-known']
    : []
}
