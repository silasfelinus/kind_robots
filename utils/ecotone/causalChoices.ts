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
    leadLines: {
      juniper:
        'Juniper circles the public pullouts on the map. “We can watch without making them perform for us.”',
      kit: 'Kit volunteers for the dawn shift, then makes you promise that the crew will get credit instead of her troupe.',
      cedar:
        'Cedar checks the road steward’s number twice. “No cones without permission. No heroes in traffic.”',
      mara: 'Mara sketches a survey sign that explains what observers can report and what they must leave alone.',
      alone:
        'You sign up for the first shift yourself. There is no companion to turn your four Saturdays into a romantic gesture.',
    },
  },
  failure: {
    text: 'The road steward cannot authorize a survey on the strength of one vanished trackway. The crew refuses to send volunteers into traffic or near the herd. You spend the afternoon drafting a safer request and leave with a contact, not a survey slot. Your four free Saturdays are still yours, but you have no agreement to show for them.',
    effects: { nerve: -2, flag: 'creek_corridor_survey_deferred' },
    leadLines: {
      juniper:
        'Juniper looks disappointed, then asks what evidence the steward would accept. She writes it down.',
      kit: 'Kit pockets the unsigned schedule. “No one is asking us to improvise in the middle of a road.”',
      cedar:
        'Cedar puts the safety cones back in the truck before anyone mistakes enthusiasm for authorization.',
      mara: 'Mara keeps the rejected plan. “It is a draft. We can learn from a draft.”',
      alone:
        'You leave with an unanswered contact and no one to tell you the refusal was secretly a victory.',
    },
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
    leadLines: {
      juniper:
        'Juniper wants to show everyone the photograph. She agrees to wait until the shop owner has given permission.',
      kit: 'Kit offers to catalog the prints and is relieved when somebody else volunteers to verify the timestamps.',
      cedar:
        'Cedar asks for the original file before he will entertain a theory about time. You add that to the checklist.',
      mara: 'Mara labels the photo “unverified” in thick letters, then signs up to help with the records anyway.',
      alone:
        'You put your name beside four dates. The crew can hold you to those dates even if no one shares your theory.',
    },
  },
  failure: {
    text: 'The shop has only a print, the photographer has not consented to a search, and the date on the frame proves nothing by itself. The crew refuses to rewrite its permitted restoration plan around an unverified image. You spend the afternoon documenting what is missing, then accept a later records appointment rather than announcing a prophecy.',
    effects: { nerve: -2, flag: 'creek_photo_audit_unverified' },
    leadLines: {
      juniper:
        'Juniper folds the photocopy away. “Not knowing is not the same as hiding something.”',
      kit: 'Kit offers to find a better archive, then accepts that the photographer still gets to say no.',
      cedar:
        'Cedar taps the printed date. “A number on a frame is not a forecast.”',
      mara: 'Mara writes the unanswered questions down rather than asking the crew to act on a hunch.',
      alone:
        'You keep the appointment for later. The creek work continues without needing your strange photograph to be true.',
    },
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
