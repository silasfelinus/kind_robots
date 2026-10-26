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

const dotAboardSafety: Choice = {
  id: 'dot-bailout',
  label: 'Ask Dot to direct a safety relay from inside the slug',
  requiresFlag: 'dot_aboard',
  cost: 'Give up your place in the race while Dot coordinates the crew and a rescue boat',
  check: { skill: 'rizz', target: 9 },
  success: {
    text: 'Dot stays seated with her injured ankle and calls out a calm count. You repeat it to the Snerfmobile crew, who match your speed and pass over a spare float. The leak is contained, but the Rainbow Shrimp passes you. Dot writes down every volunteer who helped, then asks who will thank them after the race.',
    effects: { goodwill: 2, nerve: -1, flag: 'slug_dot_safety_coordinated' },
    leadLines: {
      kit: 'Kit stops joking long enough to relay Dot’s signals exactly. “That was teamwork,” she says, “not a stunt.”',
      cedar:
        'Cedar marks the leaking seam for a proper repair on shore. “We do not race on borrowed flotation twice.”',
      alone:
        'You pass Dot’s instructions down the line. Nobody has to pretend you are the hero of a rescue that took six people.',
    },
  },
  failure: {
    text: 'Your shouted relay reaches the wrong boat. Dot orders everyone into life jackets before the slug rolls sideways and sinks in a slow yellow bow. The Snerfmobile circles back, its fake otters offering very real hands. Dot is carried ashore without putting weight on her ankle. The team loses the crossing and gains a rescue story nobody will stop telling.',
    effects: {
      goodwill: 1,
      nerve: -1,
      flags: ['slug_dot_bailout_delayed', 'slug_sank'],
    },
    leadLines: {
      juniper:
        'Juniper thanks the rescue crew before asking Dot how her ankle is. The race can wait.',
      mara: 'Mara draws the soggy slug with six rescuers in the frame. She refuses to make the picture about one brave pilot.',
      alone:
        'You count every head twice on the rescue boat. The finish line is suddenly a very small thing.',
    },
  },
}

const dotShoreRelay: Choice = {
  id: 'shore-relay',
  label: 'Signal Dot on the chase bike to organize a safe landing',
  requiresFlag: 'dot_chasing',
  cost: 'Abandon the racing line for a slower ramp and wait for the shore marshal',
  check: { skill: 'wits', target: 9 },
  success: {
    text: 'Dot spots your signal from the shore road and persuades a marshal to clear a public ramp. You steer away from the uncharted bell and bring the leaking slug in last, but upright. Dot meets you with a clipboard and a towel. The judges award no speed points; the crew votes to call it a finish.',
    effects: { goodwill: 1, nerve: -1, flag: 'slug_shore_relay_confirmed' },
    leadLines: {
      cedar:
        'Cedar writes down the marshal’s route so the next team can use it without guessing.',
      kit: 'Kit bows to the crowd, then makes sure the volunteers get their own applause.',
      alone:
        'You let the marshal take the lead. A safe landing is not diminished by having help.',
    },
  },
  failure: {
    text: 'Your flag is hidden by the fog. Dot is still searching for a ramp when the slug settles into the water like a tired bathtub. The Snerfmobile pulls everyone clear, and the shore marshal closes the unsafe landing. Dot arrives on her chase bike furious, then counts the crew, sees everyone safe, and laughs until her injured ankle hurts.',
    effects: {
      goodwill: 1,
      weird: 1,
      flags: ['slug_shore_relay_missed', 'slug_sank'],
    },
    leadLines: {
      mara: 'Mara sketches Dot arriving at the ramp after the rescue. “She still came,” she says.',
      juniper:
        'Juniper helps gather floating costume pieces while the marshal explains which ramps are safe.',
      alone:
        'Dot reaches you on the dock. You tell her the signal failed before she has to ask.',
    },
  },
}

const sunkenSlugRepair: Choice = {
  id: 'shared-wheel',
  label: 'Offer the rescued slug’s spare wheel to repair the Snerfmobile',
  requiresFlag: 'slug_sank',
  cost: 'Donate the last spare wheel and miss the timed finish; no unsafe repairs',
  check: { skill: 'wits', target: 9 },
  success: {
    text: 'The marshal checks the axle before anybody lifts a wrench. Your spare stabilizer wheel fits the Snerfmobile after three improvised spacers and an argument about the word “round.” The otters paddle clear, then help you push the still-damp slug into Ferndale. You lose your official finish time, but both crews sign the repair log so next year’s racers know exactly what held.',
    effects: { goodwill: 2, nerve: -1, flag: 'slug_shared_wheel_rebuilt' },
    leadLines: {
      cedar: 'Cedar writes the spacer sizes on the back of his race number. “A rescue that can be repeated. Now that is a finish.”',
      mara: 'Mara draws the two crews holding up one wheel. Nobody in the sketch gets to stand alone in the center.',
      alone: 'You hand the wheel to the marshal and work beside people whose names you only learned in the bay.',
    },
  },
  failure: {
    text: 'The hub will not seat safely, no matter how many people volunteer a hammer. The marshal stops the repair, calls a recovery cart and makes everyone drink water while they wait. You have surrendered your spare wheel and your finish time, but nobody is sent downriver on a dangerous axle. The otters promise to help rebuild the slug tomorrow.',
    effects: { goodwill: 1, nerve: -1, flag: 'slug_shared_wheel_deferred' },
    leadLines: {
      kit: 'Kit puts the hammer away. “Not finishing is better than finishing in the river again.”',
      juniper: 'Juniper sits with the otters until the cart arrives. She does not call the failed repair a secret success.',
      alone: 'You sign the marshal’s unfinished-work sheet. The next crew deserves to know what still needs fixing.',
    },
  },
}

const uprightSlugTow: Choice = {
  id: 'tandem-tow',
  label: 'Ask a marshal to approve a slow tow for the stranded Snerfmobile',
  cost: 'Give up your podium chance and share the final mile at rescue speed',
  check: { skill: 'burly', target: 9 },
  success: {
    text: 'The marshal inspects the towbar, clears the route and gives you a pace slower than walking a parade float. The upright slug draws the wheel-less Snerfmobile over the bridge, with the otters steering from their seats. Both sculptures cross the Ferndale line together. The judges record two finishers and a very long time.',
    effects: { goodwill: 2, nerve: -1, flag: 'slug_tandem_finish' },
    leadLines: {
      kit: 'Kit waves the two race numbers like a single flag. “We made last place look expensive.”',
      cedar: 'Cedar checks the towbar one final time before he lets the crew celebrate.',
      alone: 'The otters thank you by name. You remember theirs, even after the announcer forgets your placing.',
    },
  },
  failure: {
    text: 'The towbar bends under the first careful pull. You stop before it snaps, and the marshal refuses to clear a second attempt. The crews walk both sculptures to the finish behind a recovery cart. You give up the podium, keep everyone safe and learn that asking for help is sometimes the whole engineering solution.',
    effects: { goodwill: 1, nerve: -1, flag: 'slug_tandem_walk' },
    leadLines: {
      mara: 'Mara sketches the bent bar beside the recovery cart. “That is the honest version,” she says.',
      juniper: 'Juniper helps an exhausted otter over the bridge, then comes back for the next one.',
      alone: 'You walk at the rear and count the crew twice. No one gets left behind for a finish photo.',
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
  if (card.id === 'KN-5') {
    const earned = flags.includes('dot_aboard')
      ? dotAboardSafety
      : flags.includes('dot_chasing')
        ? dotShoreRelay
        : null
    return earned ? [...choices, earned] : choices
  }
  if (card.id === 'KN-6')
    return [
      ...choices,
      flags.includes('slug_sank') ? sunkenSlugRepair : uprightSlugTow,
    ]
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
