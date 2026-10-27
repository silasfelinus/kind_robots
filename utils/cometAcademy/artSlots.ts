import { personalOutcomeArt } from './identitySerial'
import { personalOutcomeArtKey } from './personalQuests'
import { promArt } from './artManifest'
import { campaignVillain } from './campaign'
import { districtEncounterFor } from './districtEncounters'
import { CITY_SITES, type SiteId } from './cityMap'
import type { AcademyRun } from './rules'
import { ENCOUNTERS, incidentsFor } from './rules'

// Every picture Capes & Tassels shows, by asset key under public/comet-city-academy.
// The play page and the Playbook Studio adapter read the same keys, so a render
// exported for one of them (conductor scripts/export_round_art.py) appears in
// both. A slot without a render falls back to the drawn academy or initials.

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export const SPLASH_ART_KEY = 'front/splash'
export const studentArtKey = (id: string) => `students/${id}`
/** A roster person's beat key in Playbook Studio. */
export const identityKey = (signature: string) => `identity:${signature}`
/** One of a roster person's three forms: student/sidekick, hero or villain. */
export const identityArtKey = (
  signature: string,
  form: 'student' | 'hero' | 'villain',
) => `identities/${signature}/${form}`
export const incidentArtKey = (id: string) => `incidents/${id}`
export const encounterArtKey = (title: string) => `encounters/${slugify(title)}`
export const districtArtKey = (siteId: string) => `districts/${siteId}`
/** A landmark's week-later return scene (returnVisits.ts). */
export const returnVisitArtKey = (siteId: string) => `returns/${siteId}`
/** Matches the MAPS-AND-MASTERMINDS round: villains/glass-architect-portrait. */
export const villainArtKey = (name: string) =>
  `villains/${slugify(name).replace(/^the-/, '')}-portrait`

export const GUEST_LIST_ART_KEYS = {
  open: 'prom-of-doom/ct-d29-the-guest-list-open-doors-success',
  private: 'prom-of-doom/ct-d29-the-guest-list-private-guard-success',
  duplicate: 'prom-of-doom/ct-d29-the-guest-list-steal-access-success',
} as const
export const GUEST_LIST_ARRIVAL_ART_KEY =
  'prom-of-doom/ct-prom-d29-ballroom-doors'
export const FINALE_ART_KEY = 'prom-of-doom/ct-prom-d30-the-chandelier-turns'

/** Every ending finishAcademy can reach: the real prom's six, then the simulation's four. */
export const PROM_ENDINGS = [
  'A CITY WITH A THOUSAND KEYS',
  'THE BROKEN GRID',
  'THE LAST DANCE LEAVES BY BOAT',
  'THE MUSIC AFTER GLASS',
  'MASTER OF THE SHIELD',
  'THE PRICE OF A SINGLE SWITCH',
  'HONORS IN THE PROM SIMULATION',
  'THE RESCUE THAT COUNTED',
  'MASTER OF THE SIMULATION',
  'AN UNEXPECTED REBOOT',
] as const

/** Four real-prom endings already painted in PROM-OF-DOOM-FINALE-ROUND-1. */
const ENDING_PLATES: Record<string, string> = {
  'A CITY WITH A THOUSAND KEYS': 'prom-of-doom/ct-prom-finale-a-thousand-keys',
  'THE LAST DANCE LEAVES BY BOAT': 'prom-of-doom/ct-prom-finale-last-boat',
  'THE MUSIC AFTER GLASS': 'prom-of-doom/ct-prom-finale-empty-orchestra',
  'MASTER OF THE SHIELD': 'prom-of-doom/ct-prom-finale-iron-corsage',
}
export const endingArtKey = (ending: string) =>
  ENDING_PLATES[ending] ?? `endings/${slugify(ending)}`

/** The encounter slot for a campus visit: a district scene, else the site's encounter card. */
export function siteEncounterArtKey(siteId: SiteId): string | null {
  if (districtEncounterFor(siteId)) return districtArtKey(siteId)
  const site = CITY_SITES.find((item) => item.id === siteId)
  const card =
    site?.encounterIndex !== undefined ? ENCOUNTERS[site.encounterIndex] : null
  return card ? encounterArtKey(card.title) : null
}

/** The stage picture for an academy moment, or null to keep the drawn academy. */
export function academyStageArt(run: AcademyRun | null): string | null {
  if (!run) return promArt(SPLASH_ART_KEY)
  if (run.phase === 'ending' && run.ending)
    return promArt(endingArtKey(run.ending))
  if (run.phase === 'finale')
    return run.flowVersion === 3 ? promArt(FINALE_ART_KEY) : null
  if (run.flowVersion === 3 && run.day === 29)
    return promArt(
      run.guestPlan
        ? GUEST_LIST_ART_KEYS[run.guestPlan]
        : GUEST_LIST_ARRIVAL_ART_KEY,
    )
  if (
    run.flowVersion === 3 &&
    (run.phase === 'campus' || run.phase === 'debrief') &&
    [4, 12, 21, 27].includes(run.day)
  ) {
    const outcome = personalOutcomeArt(run)
    if (outcome && promArt(outcome)) return promArt(outcome)
  }
  if (
    run.flowVersion === 3 &&
    run.signature &&
    run.personalHistory?.some((event) => event.day === run.day) &&
    ['dispatch', 'debrief'].includes(run.phase)
  ) {
    const key = personalOutcomeArtKey(
      run.signature,
      run.personalHistory,
      run.day,
    )
    const delivered = key ? promArt(key) : null
    if (delivered) return delivered
  }
  if (run.phase === 'debrief' && run.reports[0])
    return promArt(incidentArtKey(run.reports[0].caseId))
  if (run.phase === 'dispatch')
    return promArt(incidentArtKey(incidentsFor(run)[0]!.id))
  if (run.phase === 'campus' && run.selectedSite) {
    const revisit =
      run.flowVersion === 3 && run.visitedDays?.[run.selectedSite]
        ? promArt(returnVisitArtKey(run.selectedSite))
        : null
    if (revisit) return revisit
    const key = siteEncounterArtKey(run.selectedSite)
    return key ? promArt(key) : null
  }
  return null
}

/** The mastermind's portrait for the real prom's finale and ending, once painted. */
export function academyVillainArt(run: AcademyRun | null): string | null {
  if (!run || run.flowVersion !== 3) return null
  if (run.phase !== 'finale' && run.phase !== 'ending') return null
  return promArt(villainArtKey(campaignVillain(run.seed).name))
}
