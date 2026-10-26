import type { Choice, EncounterCard } from './content'
import { openingLensChoices } from './openingLensChoices'

const roadCorridorMonitoring: Choice = {
  id: 'monitor',
  label: 'Commit four Saturdays to a safe road-to-creek wildlife survey',
  wild: true,
  cost: 'Four Saturdays, a road steward, and a survey that never approaches the elk',
  check: { skill: 'lore', target: 9 },
  success: {
    text: 'The crew lead calls the road steward before promising anything. Together you agree on four observation shifts from existing public pullouts, with a second volunteer checking each entry. Your impossible tracks remain an unverified observation, not a reason to close a highway. You give up four Saturdays and gain a plan that protects both drivers and wildlife.',
    effects: {
      goodwill: 1,
      nerve: -1,
      flag: 'creek_corridor_survey_planned',
    },
  },
  failure: {
    text: 'The road steward cannot authorize a survey on the strength of one vanished trackway. The crew refuses to send volunteers into traffic or near the herd. You spend the afternoon drafting a safer request and leave with a contact, not a survey slot. Your four free Saturdays are still yours, but you have no agreement to show for them.',
    effects: { nerve: -2, flag: 'creek_corridor_survey_deferred' },
  },
}

const futurePhotoAudit: Choice = {
  id: 'monitor',
  label: 'Commit four Saturdays to checking the future-dated meadow photo',
  cost: 'Four Saturdays of consent-based records work before any creek plan changes',
  check: { skill: 'wits', target: 9 },
  success: {
    text: 'The crew will not reroute restoration work because a photograph appears to show next Thursday. You arrange four Saturday archive shifts, ask the sandwich shop to preserve the original file with permission, and find a second person to verify the date. The image remains uncanny, but the crew now has a defensible way to investigate without frightening neighbors or disturbing the elk.',
    effects: {
      goodwill: 1,
      nerve: -1,
      flag: 'creek_photo_audit_agreed',
    },
  },
  failure: {
    text: 'The shop has only a print, the photographer has not consented to a search, and the date on the frame proves nothing by itself. The crew refuses to rewrite its permitted restoration plan around an unverified image. You spend the afternoon documenting what is missing, then accept a later records appointment rather than announcing a prophecy.',
    effects: { nerve: -2, flag: 'creek_photo_audit_unverified' },
  },
}

/** Keep the four saved choice IDs stable while making the earned monitoring
 * negotiation depend on the evidence actually gathered at Elk Prairie.
 * This pure function is shared by the visible menu and the reducer.
 */
export function contextualStoryChoices(
  card: EncounterCard,
  flags: readonly string[],
): Choice[] {
  const choices = openingLensChoices(card)
  if (card.id !== 'QW-5') return choices
  const monitoring = flags.includes('elk_road_tracks_vanished')
    ? roadCorridorMonitoring
    : flags.includes('elk_future_photo')
      ? futurePhotoAudit
      : null
  if (!monitoring) return choices
  return choices.map((choice) =>
    choice.id === 'monitor' ? monitoring : choice,
  )
}
