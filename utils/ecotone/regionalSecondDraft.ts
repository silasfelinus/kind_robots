import type { Choice, EncounterCard } from './content'

/**
 * Curated second-draft overrides. Baseline regional scripts remain the source
 * for the first two choices; each revision contributes a different third way.
 * Lens lines are subjective attention, never new evidence or drug-locked truth.
 */
export type RegionalRevision = {
  choices: Choice[]
  lensLines?: EncounterCard['lensLines']
  flagLines?: EncounterCard['flagLines']
}

export const REGIONAL_REVISIONS: Record<string, RegionalRevision> = {
  // Fifth pass: options with a real public, personal, or material cost.
  'WH-008': {
    choices: [
      {
        id: 'crew-veto',
        label: 'Put your name on a crew veto and risk losing the fundraiser',
        cost: 'You may take the blame for a cancelled show and reduced wages',
        check: { skill: 'rizz', target: 9 },
        success: {
          text: 'You put your name on the notice and ask the crew what they actually want. The director agrees to a safe performance with a smaller audience. The understudy insists every worker gets the credit. The original donors threaten to withdraw, and some do.',
          effects: { goodwill: 1, nerve: -1, flag: 'wh_008_crew_veto' },
        },
        failure: {
          text: 'The director cancels the fundraiser and pins your name to the lobby door. The cast walks out together; the volunteer crew must find next month\'s rent elsewhere. The understudy thanks you for not lying about the cost.',
          effects: { nerve: -1, flag: 'wh_008_show_cancelled' },
        },
      },
    ],
  },
  'WH-023': {
    choices: [
      {
        id: 'signed-warning',
        label: 'Sign a temporary cliff closure request in your own name',
        cost: 'You own the warning publicly even if the date in the bottle is wrong',
        check: { skill: 'lore', target: 9 },
        success: {
          text: 'You secure a short closure on the strength of falling grit, not prophecy. An angry vendor counts the customers leaving the beach. You sign the inspection request knowing they will remember who cost them a busy afternoon.',
          effects: { goodwill: 1, nerve: -1, flag: 'wh_023_cliff_closed' },
        },
        failure: {
          text: 'Your petition fails. The vendor prints your name beside the phrase TIME-TRAVEL SCARE, and tourists crowd the rope line to laugh. You cannot close the path; you can keep warning people about the stones striking the sand.',
          effects: { nerve: -1, flag: 'wh_023_warning_rejected' },
        },
      },
    ],
  },
  'WH-041': {
    choices: [
      {
        id: 'porch-vigil',
        label: 'Take the night watch on the tenants\' steps instead of going home',
        cost: 'Give up your rest to keep the confession tourists away tonight',
        success: {
          text: 'You sit beneath the new window through the night, handing out tea and declining every offered confession. The upstairs tenant finally sleeps. At dawn the booth owner arrives with fresh tickets. You have won one night, not the deed to her home.',
          effects: { goodwill: 1, nerve: -1, flag: 'wh_041_porch_vigil' },
        },
      },
    ],
    flagLines: {
      wh_008_crew_veto: {
        all: 'The upstairs tenant recognizes you from the theatre crew\'s public safety notice. She asks whether standing here will make the property owner finally listen or merely supply another spectacle.',
      },
      wh_008_show_cancelled: {
        all: 'The landlord waves an old show-cancellation flyer with your name on it. The tenant says she cares about her bedroom, not whether you have a perfect record.',
      },
    },
  },
  'WH-065': {
    choices: [
      {
        id: 'camera-truce',
        label: 'Ask the host and photographer to negotiate at the gate',
        cost: 'The host may decide you made a private supper into a public confrontation',
        check: { skill: 'rizz', target: 9 },
        success: {
          text: 'The photographer agrees to leave his camera in the car, though he still insists everyone overreacted. The host permits him one plate of pie and exactly zero pictures. The guests do not forgive him on schedule, which was never part of the deal.',
          effects: { goodwill: 1, flag: 'wh_065_camera_truce' },
        },
        failure: {
          text: 'The neighbor turns your invitation into a speech about censorship. A guest quietly packs up their dish and the host asks you both to leave. You get no photograph, no slice of pie, and a lesson in how even well-meant mediation can cost somebody their safe room.',
          effects: { nerve: -1, flag: 'wh_065_truce_failed' },
        },
      },
    ],
    flagLines: {
      wh_023_cliff_closed: {
        all: 'One of the guests heard about the beach path you helped close after the rocks started falling. They appreciate a warning with evidence but ask you to keep tonight\'s private gathering off your map.',
      },
    },
  },
  'WH-082': {
    choices: [
      {
        id: 'curtain-strike',
        label: 'Back the crew\'s refusal to raise the curtain before payroll',
        cost: 'An empty theater may mean no ticket income for anyone tonight',
        check: { skill: 'rizz', target: 9 },
        success: {
          text: 'You help the stage crew hold a silent line beneath the curtain. The board agrees to pay the arrears before the first note; a donor quits in disgust. The cow eats the donor\'s velvet program. The musicians play beautifully to a smaller, solvent audience.',
          effects: { goodwill: 1, nerve: -1, flag: 'wh_082_crew_paid' },
        },
        failure: {
          text: 'The board calls the strike a bluff. The curtain stays down, a family loses the outing they saved for, and nobody gets tonight\'s ticket sales. The crew has refused free labor, but you cannot pay them with the satisfaction of being right.',
          effects: { nerve: -1, flag: 'wh_082_curtain_dark' },
        },
      },
    ],
    flagLines: {
      wh_041_porch_vigil: {
        all: 'A stagehand recalls your night on the Victorian tenants\' porch and asks whether you would stay as long for workers instead of windows.',
      },
    },
  },
  'WH-096': {
    choices: [
      {
        id: 'cover-the-shift',
        label: 'Cover one wet Sunday shift so the scarecrow can actually rest',
        cost: 'Spend your own strength and a full day on work the owner should fund',
        success: {
          text: 'You take the dawn shift and discover that every row needs a different kind of patience. The scarecrow spends Sunday watching the rain from beneath a dry roof. On Monday it asks the owner for a paid replacement, because your free labor did not fix the arrangement.',
          effects: { goodwill: 1, nerve: -1, flag: 'wh_096_shift_covered' },
        },
      },
    ],
    flagLines: {
      wh_065_camera_truce: {
        all: 'The scarecrow has heard how you asked a potluck photographer to respect an invitation. It asks whether the same courtesy can apply to a worker\'s day off.',
      },
    },
  },
  'WH-014': {
    choices: [
      {
        id: 'fungus-hearing',
        label:
          'Invite the mushrooms to testify before a very patient committee',
        check: { skill: 'rizz', target: 9 },
        success: {
          text: 'The meeting runs late because the fungus insists on reading its complaint in full. The minutes distinguish a bad drainage pipe from bad neighbors. The mushrooms request a chair for next month.',
          effects: { goodwill: 1, flag: 'wh_014_fungus_hearing' },
        },
        failure: {
          text: 'The chair declares the mushrooms out of order. They mail their statement to everyone on the block, including people who had no idea they were on the block.',
          effects: { flag: 'wh_014_fungus_petition' },
        },
      },
    ],
    lensLines: {
      sober:
        'There is a water problem, a missing installation record, and a complaint on paper. Paper is almost reassuring.',
      tipsy:
        'Someone has brought folding chairs for the mushrooms. You hope the meeting has snacks, although you have doubts about the refreshments.',
      stoned:
        'Every cap seems connected to the next. That may be a real mycelium network, or merely what happens when you pay attention.',
      tripping_balls:
        'The complaint looks like a constitution written in damp ink. It still concerns a pipe. Even impossible governments need plumbing.',
      cocaine:
        'A signature, an invoice, a deadline. Everybody wants an answer this minute; nobody has found the person who installed the pipe.',
      meth: 'The letters on the complaint keep insisting on your attention. You ask someone rested to check the survey while you sit down.',
      mdma: 'The fungus sounds furious and the neighbors sound embarrassed. You can listen to both without deciding they must become friends.',
    },
  },
  'WH-026': {
    choices: [
      {
        id: 'ask-the-light',
        label:
          'Signal the second light from shore and listen without following it',
        check: { skill: 'psyche', target: 9 },
        success: {
          text: 'The phantom flashes once for every vessel already safe in harbor, then twice for one still outside. You log the pattern for the pilot. Nothing asks you to get in a boat.',
          effects: {
            evidence: 'Second light signal counted from shore',
            flag: 'wh_026_light_witness',
          },
        },
        failure: {
          text: 'The light answers in a rhythm you cannot decipher. You write the exact flashes instead of claiming to understand them. A pilot thanks you for that much.',
          effects: { flag: 'wh_026_untranslated_signal' },
        },
      },
    ],
    lensLines: {
      sober:
        'Two lights, one charted. The harbor log is blank where the second should be.',
      tipsy:
        'The harbor pilot looks like a person who has run out of polite ways to discuss ghosts. You offer them your notebook instead.',
      stoned:
        'The second light hangs just beyond the first, as if distance were an opinion. The boats still need a safe channel.',
      tripping_balls:
        'For a second the headland has two horizons. You keep your feet on the shore and count flashes until the horizon settles.',
      cocaine:
        'Every flash feels urgent. The pilot has a procedure and refuses to hurry it, which might be the best thing here.',
      meth: 'You have checked the flashes three times. A rested pilot checks your notes and circles the numbers that agree.',
      mdma: 'The tiny light feels almost lonely. That is a feeling, not a navigational instruction. You pass the warning along.',
    },
  },
  'WH-052': {
    choices: [
      {
        id: 'buoy-bargain',
        label: 'Negotiate a one-tide labor agreement with the striking buoy',
        check: { skill: 'rizz', target: 7 },
        success: {
          text: 'The buoy agrees to return for one tide if its misleading chart is labeled provisional. A skipper signs as witness, and the buoy demands the document be laminated.',
          effects: { goodwill: 1, flag: 'wh_052_buoy_contract' },
        },
        failure: {
          text: 'The buoy refuses the contract because someone wrote permanent on it. You cross the word out. Negotiations resume, but not before the tide turns.',
          effects: { flag: 'wh_052_buoy_talks' },
        },
      },
    ],
    lensLines: {
      sober:
        'The buoy has left its post, but the hazard is measurable. A polite labor dispute should not get anyone grounded.',
      tipsy:
        'You have never toasted a union organizer made of metal. The buoy declines the gesture and asks for better charts.',
      stoned:
        'It is difficult to decide where the marker ends and the water begins. The shipping lane, less philosophically, needs an answer.',
      tripping_balls:
        'The buoy looks like a punctuation mark that resigned from the sentence. The sea continues talking anyway.',
      cocaine:
        'A missing marker means a missed deadline for every boat in the harbor. Speed is not going to put a safe channel back.',
      meth: 'The chart keeps moving under your tired eyes. You hand it to a skipper and ask them to show you the position again.',
      mdma: 'Even the buoy seems to want its complaint understood. You can respect that and still ask what the boat crews need.',
    },
  },
  'WH-056': {
    choices: [
      {
        id: 'private-memory',
        label: 'Leave a memory without asking anyone to explain theirs',
        cost: 'Your own story stays on the bench, unsigned',
        success: {
          text: 'You leave a scratched button from a childhood coat. It is not a clue. The bench makes room for it and, for once, asks no questions. The caretaker moves the removal notice to a drawer.',
          effects: { flag: 'wh_056_private_memory', nerve: 1 },
        },
      },
    ],
  },
  'WH-070': {
    choices: [
      {
        id: 'reply-to-relay',
        label: 'Answer the abandoned relay with a question nobody could sell',
        check: { skill: 'lore', target: 9 },
        success: {
          text: 'The reply is not from a star. It is a local voice asking whether the bridge has reopened. You record the call sign and leave the caller unnamed.',
          effects: {
            evidence: 'Unattributed bridge question on a local relay',
            flag: 'wh_070_relay_answered',
          },
        },
        failure: {
          text: 'The transmission dissolves into the hourly weather. Your question is recorded in the operator log, awaiting a voice that can answer later.',
          effects: { flag: 'wh_070_relay_question' },
        },
      },
    ],
  },
  'WH-074': {
    choices: [
      {
        id: 'witness-consent',
        label: 'Ask the absent witness what they want done with their name',
        success: {
          text: 'They ask for the carving to be photographed and the name redacted before public display. The bridge warning stays legible. The river does not get to volunteer people for its mysteries.',
          effects: { flag: 'wh_074_witness_consent', goodwill: 1 },
        },
      },
    ],
    lensLines: {
      sober:
        'The bridge deserves inspection. The witness deserves a question, not an accusation. The river is not available for comment.',
      tipsy:
        'You briefly consider asking the driftwood for an autograph. The witness does not laugh, and you abandon the joke.',
      stoned:
        'Wood can carry a name a long way. Carrying consent appears to be considerably harder.',
      tripping_balls:
        'The driftwood seems to have mistaken a person for a line of dialogue. You refuse to give the river final edit.',
      cocaine:
        'The warning is urgent. Publishing somebody else’s name without asking is fast, too, and not nearly so useful.',
      meth: 'You keep returning to the name on the wood. A neighbor reminds you the owner of that name is right here to speak.',
      mdma: 'You feel the witness’s unease sharply. Rather than promise to make it disappear, you ask what they would like the record to say.',
    },
  },
  'WH-090': {
    choices: [
      {
        id: 'public-forecast',
        label: 'Let the neighbors write what the official forecast forgot',
        check: { skill: 'rizz', target: 9 },
        success: {
          text: 'The board fills with practical notes: a wheelchair route, a dog that panics at sirens, three people needing rides. The station posts them beside the flood gauge. Someone adds APOLOGY to the bottom in smaller letters.',
          effects: { goodwill: 1, flag: 'wh_090_neighbors_forecast' },
        },
        failure: {
          text: 'People mistrust the open board, understandably. Two volunteers quietly collect accessibility needs and promise to return with a useful notice.',
          effects: { flag: 'wh_090_forecast_outreach' },
        },
      },
    ],
  },
  'WH-094': {
    choices: [
      {
        id: 'open-ring-record',
        label: 'Publish a nonexclusive record before anyone cuts another slice',
        check: { skill: 'lore', target: 9 },
        success: {
          text: 'The measurements go to the public archive with their uncertainties attached. Nobody has acquired the future; several students acquire an excellent argument about dendrochronology.',
          effects: {
            evidence: 'Open ring archive with uncertainty notes',
            flag: 'wh_094_open_ring_record',
          },
        },
        failure: {
          text: 'Your first count is wrong by a year. The archivist publishes the correction beside the original. It is a less impressive miracle and a better record.',
          effects: { flag: 'wh_094_public_correction' },
        },
      },
    ],
    lensLines: {
      sober:
        'Two extra rings. That is a claim you can count, challenge, and count again.',
      tipsy:
        'The contractor is selling tomorrow by the slice. It sounds like a terrible business model until somebody asks for a receipt.',
      stoned:
        'The rings sit inside one another without a center you can settle on. The wood still belongs somewhere in the real world.',
      tripping_balls:
        'The log contains a summer that has not met the calendar yet. It has no idea why that makes it valuable.',
      cocaine:
        'Someone wants to sell the specimen before the next meeting. You insist on making the record first.',
      meth: 'The rings refuse to hold still in your exhausted count. An archivist offers another pair of eyes and a chair.',
      mdma: 'The volunteers care deeply about the tree, in different ways. Keeping the record open gives them something to share without surrendering it.',
    },
  },
  'WH-101': {
    choices: [
      {
        id: 'silent-backup',
        label: 'Rig a silent backup signal so the exhausted riders can stop',
        check: { skill: 'burly', target: 7 },
        success: {
          text: 'A row of brightly colored mittens replaces the applause. The sculpture moves. The audience applauds anyway, because nobody told them not to, and the crew finally gets a drink of water.',
          effects: { goodwill: 1, flag: 'wh_101_silent_backup' },
        },
        failure: {
          text: 'The mitten line tangles around a pedal and the sculpture sits down with alarming grace. Nobody is hurt. The exhausted crew takes the break it had been too proud to ask for.',
          effects: { flag: 'wh_101_rest_break' },
        },
      },
    ],
  },
  'WH-110': {
    choices: [
      {
        id: 'credited-anonymity',
        label: 'Offer the repair crew credit under names they choose',
        check: { skill: 'rizz', target: 9 },
        success: {
          text: 'The credit reads Axle Team, Anonymous By Request. They accept payment in soup and a fresh socket wrench. The sponsor cannot find a photograph to put on a billboard.',
          effects: { goodwill: 1, flag: 'wh_110_credited_anonymity' },
        },
        failure: {
          text: 'The rescue workers refuse even an invented name. You respect it. The receipt simply says repairs completed, and no one gets to claim ownership of their faces.',
          effects: { flag: 'wh_110_anonymity_respected' },
        },
      },
    ],
  },
  'WH-114': {
    choices: [
      {
        id: 'future-waterline',
        label:
          'Abandon the salvage and mark the safe waterline for the next crew',
        cost: 'The equipment and lost memory are not recovered by you',
        success: {
          text: 'You mark the height with bright tape and write the time in waterproof pencil. The tide goes back to being water. Next week a different crew will know where to stop, which is not a dramatic sort of heroism.',
          effects: { flag: 'wh_114_waterline_warning', goodwill: 1 },
        },
      },
    ],
    lensLines: {
      sober:
        'You have one minute, one working marker, and an honest choice about what can be saved.',
      tipsy:
        'The crew is yelling and somebody calls the tide a thief. You would laugh if the rope were not slipping.',
      stoned:
        'The water touches the past as casually as the dock. Its beauty is not a reason to trust it.',
      tripping_balls:
        'A minute opens like a door in the bay. You can see the hinges and still cannot make it stay.',
      cocaine:
        'Every second makes a demand. You have to decide which demand will still matter when the clock resumes.',
      meth: 'Your tired mind keeps rehearsing impossible rescues. A crew member calls your name and points to the safe bank.',
      mdma: 'The stranger is frightened. So is the crew. You cannot give everyone their first choice, but you can tell them the truth.',
    },
  },
  'WH-115': {
    choices: [
      {
        id: 'ballot-challenge',
        label: 'File a public challenge and postpone the impossible vote',
        check: { skill: 'lore', target: 9 },
        success: {
          text: 'The officials have to acknowledge an appeals process they invented and immediately forgot. The future waits a day. For the first time, people can read what they are being asked to surrender.',
          effects: {
            evidence: 'Public challenge to the future ballots',
            flag: 'wh_115_ballot_challenged',
          },
        },
        failure: {
          text: 'The rules committee rules against delay. You get the objection entered into the minutes. A clerk whispers that minutes sometimes last longer than judges.',
          effects: { flag: 'wh_115_dissent_recorded' },
        },
      },
    ],
    flagLines: {
      wh_052_buoy_contract: {
        all: 'The meeting secretary produces a laminated copy of the buoy contract. Apparently even the harbor has a vote.',
      },
      wh_074_witness_consent: {
        all: 'A clerk starts reading the river witness’s name. You point to the redaction they requested, and the clerk stops.',
      },
      wh_094_open_ring_record: {
        all: 'The archive with the impossible tree rings is on the table, corrections and all. It has not been sold to anyone.',
      },
    },
  },
  'WH-120': {
    choices: [
      {
        id: 'blank-ballot',
        label: 'Submit a blank ballot with your objections signed and public',
        cost: 'You refuse to endorse a future you cannot honestly defend',
        success: {
          text: 'The clerk frowns at your blank square, then files the objections with the actual vote. You have not escaped the future. You have left a record that the tidy choices were not enough.',
          effects: { flag: 'wh_120_recorded_dissent', nerve: 1 },
        },
      },
    ],
    flagLines: {
      wh_014_fungus_hearing: {
        all: 'The minutes include a complaint from a fungal neighborhood association. Nobody finds this stranger than the ballot itself.',
      },
      wh_110_credited_anonymity: {
        all: 'The rescue crew is thanked under its chosen name. The clerk does not demand their real faces.',
      },
      wh_114_waterline_warning: {
        all: 'A crew that came after you reports finding the bright waterline tape. They stayed out of the current.',
      },
    },
  },
}
