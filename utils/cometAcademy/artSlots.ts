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
/** Three dramatic splash contexts for one permanent named person, never three identities. */
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

/**
 * Every ending finishAcademy can reach: the real prom's first six, the
 * simulation's four, then two more real-prom endings (t-020). Saves store the
 * ending's text, so the order here is presentation only.
 */
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
  'THE SHIELD CHANGES HANDS',
  'THE TRANSMITTER GOES DARK',
] as const

/** The week-one simulation's endings; every other ending is the real Prom of Doom. */
export const SIMULATION_ENDINGS: readonly string[] = PROM_ENDINGS.slice(6, 10)

/** How each ending is reached, for the yearbook and Playbook Studio. */
export const PROM_ENDING_ROUTES: Record<(typeof PROM_ENDINGS)[number], string> =
  {
    'A CITY WITH A THOUSAND KEYS':
      'Hand shield control to the neighborhoods with enough allies, evidence and standing behind you. Districts defend themselves and the grid survives in a thousand hands.',
    'THE BROKEN GRID':
      'Hand shield control to the neighborhoods without the allies to coordinate it. Some districts hold, others burn, and every neighborhood keeps its own brass key.',
    'THE LAST DANCE LEAVES BY BOAT':
      'Put the guests before the hardware with earned support. Everyone leaves the ballroom by the harbor, and the villain keeps a damaged grid.',
    'THE MUSIC AFTER GLASS':
      'Try to save the guests or break the transmitter without the allies to do it. The ballroom empties at a cost the city remembers.',
    'MASTER OF THE SHIELD':
      'Seize the shield console with the standing to hold it. The city is safe and answers to you now.',
    'THE PRICE OF A SINGLE SWITCH':
      'Seize the console without the support to keep it. One switch saves the city and isolates the person who threw it.',
    'HONORS IN THE PROM SIMULATION':
      'Week-one simulation: protect your classmates with influence earned and danger kept low.',
    'THE RESCUE THAT COUNTED':
      'Week-one simulation: protect your classmates without the record to make it count for a grade.',
    'MASTER OF THE SIMULATION':
      'Week-one simulation: seize the controls after a week of ruthless choices.',
    'AN UNEXPECTED REBOOT':
      'Week-one simulation: seize the controls without the nerve the machine wanted.',
    'THE SHIELD CHANGES HANDS':
      'Reach the prom having exposed none of the three accomplice operations, without the allies to make up for it, and try anything except handing the grid to the neighborhoods. The mastermind takes the shield towers whole.',
    'THE TRANSMITTER GOES DARK':
      'Break the transmitter at the cost of the ballroom with earned support. The attack dies at its source and the city gives up its shield to be rid of it.',
  }

/** Four real-prom endings already painted in PROM-OF-DOOM-FINALE-ROUND-1. */
const ENDING_PLATES: Record<string, string> = {
  'A CITY WITH A THOUSAND KEYS': 'prom-of-doom/ct-prom-finale-a-thousand-keys',
  'THE LAST DANCE LEAVES BY BOAT': 'prom-of-doom/ct-prom-finale-last-boat',
  'THE MUSIC AFTER GLASS': 'prom-of-doom/ct-prom-finale-empty-orchestra',
  'MASTER OF THE SHIELD': 'prom-of-doom/ct-prom-finale-iron-corsage',
}
export const endingArtKey = (ending: string) =>
  ENDING_PLATES[ending] ?? `endings/${slugify(ending)}`

/**
 * A finale plate that fits an ending still waiting on its own painting: shown
 * only while the ending's dedicated slot has no render.
 */
export const ENDING_STAND_INS: Record<string, string> = {
  'THE TRANSMITTER GOES DARK':
    'prom-of-doom/ct-d30-prom-of-doom-destroy-antenna-success',
}

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
    return (
      promArt(endingArtKey(run.ending)) ??
      promArt(ENDING_STAND_INS[run.ending] ?? '')
    )
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
