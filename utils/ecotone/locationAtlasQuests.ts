import type { EncounterCard } from './content'

/**
 * Unclaimed location-atlas gaps: independent fictional inhabitants and
 * consequences at real Humboldt landmarks. Existing regional cards cover
 * Luffenholtz and Ferndale's main street, but not these specific stories.
 * No tribe-specific locations, culturally held incidents or archived art.
 */
export const LOCATION_ATLAS_QUESTS: EncounterCard[] = [
  {
    id: 'LA-BAKER-01',
    kind: 'encounter',
    chapter: 2,
    place: 'Baker Beach trail, Trinidad area',
    title: 'The Tidepool Has a Privacy Policy',
    scene: 'beach',
    body: [
      'A weathered sign at a steep coastal trail says PLEASE RESPECT EVERYONE\'S PRIVACY. Beneath it somebody has stapled a second sign: PLEASE RESPECT THE OCEAN\'S PRIVACY TOO. Three camera drones hover where the surf meets a ring of smooth stones. They are taking photos of people who never agreed to be photographed. On the drones\' little screens, the people are wearing tomorrow\'s clothes.',
      'A volunteer with a first-aid kit wants the drones grounded before the tide cuts off the exit. The operator says the footage will prove a dangerous new rip current. The footage might, but the operator has been livestreaming the people, not the water. No one is required to explain why they came to the beach.',
    ],
    choices: [
      {
        id: 'public-warning',
        label: 'Move the warning up the trail and document the water conditions without filming visitors',
        cost: 'You lose the drones\' wide-angle view and must identify the danger on foot',
        check: { skill: 'lore', target: 9 },
        success: {
          text: 'You and the volunteer find a fresh channel in the sand and move the sign before the beachgoers return to the narrow staircase. The operator reluctantly films the surf only. The drone feed shows tomorrow\'s tide exactly where the warning now stands, with nobody\'s face in frame.',
          effects: {
            goodwill: 1,
            evidence: 'Tomorrow\'s tide recorded without people on camera',
            flag: 'baker_tide_warning',
          },
        },
        failure: {
          text: 'You mistake a harmless eddy for the worst of the current and lose time relocating the sign. The volunteer corrects you, closes the lower trail and stays to explain the detour to each arrival. The tide takes the drones\' landing spot, but everyone gets out. The livestream has already spread.',
          effects: { nerve: -1, flag: 'baker_wrong_warning' },
        },
      },
      {
        id: 'privacy',
        label: 'Ask the operator to erase the visitor footage and publish only the hazard warning',
        cost: 'The operator may refuse and the only usable current footage could vanish',
        check: { skill: 'rizz', target: 9 },
        success: {
          text: 'The operator deletes the identifying clips in front of two witnesses and gives the beach volunteer the original water footage. A message spreads about the current rather than about strangers\' bodies. The tomorrow-clothes mystery survives in a single unlabeled reflection.',
          effects: { goodwill: 1, flag: 'baker_privacy_respected' },
        },
        failure: {
          text: 'The operator promises to delete the feed, then drives away while it is still live. The volunteer writes down the drone registration and directs people to the safer stairs. You cannot retroactively unfilm a stranger, and the operator will have to answer for that.',
          effects: { flag: 'baker_privacy_broken', nerve: -1 },
        },
      },
      {
        id: 'help-leave',
        label: 'Help the volunteer get people up the trail without joining the filming dispute',
        success: {
          text: 'You carry a bag of lost shoes to the trailhead and keep the narrow stairs clear. Somebody thanks you without offering their name. Down below, the drones capture a perfectly empty beach full of distant, impossible applause.',
          effects: { goodwill: 1, flag: 'baker_trail_helped' },
        },
      },
    ],
    provenance:
      'Baker Beach and coastal trail access are real local context. Drone operator, volunteers, signs, tide hazard and uncanny video are entirely fictional. No actual visitor is identified, and this card does not assert current trail conditions.',
  },
  {
    id: 'LA-SOHUM-01',
    kind: 'encounter',
    chapter: 5,
    place: 'A fictional community arts room near Garberville',
    title: 'The Last Class Before Yesterday',
    scene: 'grove',
    body: [
      'In a borrowed Southern Humboldt classroom, a massage-training mannequin has begun giving patient, excellent advice about muscle tension to students who have not arrived yet. At six o\'clock the class is supposed to become a volunteer-run bodywork clinic. At five fifty-nine the room belongs to an entirely different year.',
      'An instructor wants to keep the free clinic because farmworkers and night-shift parents have arranged childcare to be here. The building manager wants the doors closed until someone can explain the mannequin. A student has written a perfectly ordinary sign: MASSAGE IS OPTIONAL. ANOMALIES ALSO OPTIONAL.',
    ],
    choices: [
      {
        id: 'safe-clinic',
        label: 'Set up a consent-first clinic in the unaffected half of the room',
        check: { skill: 'rizz', target: 9 },
        cost: 'The reduced room will serve fewer people and everyone must agree to the limits',
        success: {
          text: 'The instructor, manager and students agree to use the sunlit side of the room, offer chairs instead of tables, and stop if the floor starts remembering anyone. A parent gets ten quiet minutes with a cup of tea; nobody has to perform a miracle. The mannequin corrects your posture from its locked cupboard.',
          effects: { goodwill: 1, flag: 'sohum_consent_clinic' },
        },
        failure: {
          text: 'Your compromise leaves no accessible space for a visitor using a walker. The instructor calls the session off rather than making a person negotiate entry in front of strangers. You help reorganize the room for next week. The mannequin offers unsolicited ergonomic feedback.',
          effects: { nerve: -1, flag: 'sohum_access_failed' },
        },
      },
      {
        id: 'trace-time',
        label: 'Trace the time slip without asking any student to be a test subject',
        check: { skill: 'psyche', target: 9 },
        success: {
          text: 'A clock on the back wall moves by one minute whenever the therapy-room curtain closes, but only if somebody has turned the lights off to save power. You record the pattern, tape over the switch, and give the instructor a note written in plain language.',
          effects: {
            evidence: 'A classroom clock that loses time behind a curtain',
            flag: 'sohum_clock_pattern',
          },
        },
        failure: {
          text: 'You stare at the hands so long that the other students pack up without you. You cannot reproduce the slip. The instructor locks the room, leaves the clinic schedule intact for another day, and asks you not to declare a discovery on behalf of her class.',
          effects: { flag: 'sohum_unverified_clock', nerve: -1 },
        },
      },
      {
        id: 'repair',
        label: 'Help students move the free clinic to a normal, accessible room nearby',
        success: {
          text: 'You borrow folding chairs and a kettle from the community hall. The mannequin remains in a room that may or may not be last Tuesday. The actual people get a clinic that exists today, and the student who made the sign is hired to write the next one.',
          effects: { goodwill: 1, flag: 'sohum_clinic_relocated' },
        },
      },
    ],
    provenance:
      'Original fictional volunteer clinic in a fictional room near Garberville; inspired broadly by Southern Humboldt healing arts. No named real institute, instructor, grant or actual medical service is asserted. Touch and treatment are voluntary.',
  },
  {
    id: 'LA-FERNDALE-01',
    kind: 'encounter',
    chapter: 5,
    place: 'Ferndale Victorian Main Street',
    title: 'The Window of Unsold Tomorrows',
    scene: 'plaza',
    body: [
      'On Ferndale\'s painted Victorian main street, a tailor has dressed four shop-window mannequins in clothes from futures that have not happened. One wears a mechanic\'s coveralls with the town seal, one a wedding outfit cut from flood maps, one a graduation gown made of old invoices, and the fourth an ordinary coat with every pocket sewn shut.',
      'A developer offers to buy the display for an advertisement promising the town a magnificent new economy. The tailor needs the money to keep an apprentice employed. The apprentice says the clothes were made by the whole shop and nobody asked whether their names could be sold. Each mannequin turns its face toward whichever person is speaking.',
    ],
    choices: [
      {
        id: 'shared-credit',
        label: 'Negotiate payment and individual credit for every maker before the display changes hands',
        check: { skill: 'rizz', target: 9 },
        cost: 'The developer can walk away and the shop may miss this month\'s rent',
        success: {
          text: 'The tailor and apprentice insist on a contract they both understand, including the right to refuse the advertising script. The developer buys the mannequins but not the story. By morning the fourth coat has grown one open pocket, containing a receipt with both makers\' names.',
          effects: { goodwill: 1, flag: 'ferndale_makers_paid' },
        },
        failure: {
          text: 'The developer withdraws the offer when the apprentice asks for approval rights. The tailor quietly counts how many weeks the shop can last. The apprentice stays after closing to mend hems without pretending this was an inexpensive principle.',
          effects: { nerve: -1, flag: 'ferndale_contract_lost' },
        },
      },
      {
        id: 'inspect-pockets',
        label: 'Investigate why the mannequins turn before anyone agrees to sell them',
        check: { skill: 'wits', target: 9 },
        success: {
          text: 'Hidden inside the coat lining is a dated alteration ticket for a fitting scheduled thirty years from now. The apprentice recognizes their own handwriting, although they have not yet been taught that stitch. You photograph the ticket without touching the customer\'s name.',
          effects: {
            evidence: 'A future alteration ticket in Ferndale',
            flag: 'ferndale_future_tailor',
          },
        },
        failure: {
          text: 'You open the wrong seam and damage a finished garment. The tailor charges you for the repair, then teaches you how to hand-stitch the lining closed. The mannequins rotate back toward the front door, as if that were all they wanted.',
          effects: { nerve: -1, flag: 'ferndale_seam_repaired' },
        },
      },
      {
        id: 'apprentice-show',
        label: 'Help the apprentice stage a free window show that credits the workshop',
        success: {
          text: 'The street fills with friends and customers willing to buy alterations instead of futures. The apprentice reads each maker\'s name before the curtains open. A mannequin in the flood-map wedding outfit takes one careful bow; everyone pretends not to see it until the applause ends.',
          effects: { goodwill: 1, flag: 'ferndale_window_show' },
        },
      },
    ],
    provenance:
      'Ferndale is known for preserved Victorian architecture and its role in the Kinetic event. The tailor, apprentice, mannequins, developer, shop and contracts are entirely fictional.',
  },
  {
    id: 'LA-CEMETERY-01',
    kind: 'encounter',
    chapter: 5,
    place: 'A fictionalized hillside cemetery above Ferndale',
    title: 'The Committee for the Recently Imagined',
    scene: 'grove',
    body: [
      'On a hillside above Ferndale, the cemetery gate opens onto a small table where three translucent townspeople are holding a budget meeting. None of their names appears on any grave. They are the ghosts of people who might one day have lived here, and their agenda reads: WHO GETS TO CALL A FUTURE HOME?',
      'One future resident wants affordable housing on a ridge that should probably remain a water catchment. Another wants the catchment protected so future farms survive. The third is carrying an invoice for a bus service nobody has built. A living groundskeeper asks everyone to keep their voices down: actual mourners are visiting just beyond the hedge.',
    ],
    choices: [
      {
        id: 'quiet-hearing',
        label: 'Move the meeting away from the graves and let each imagined resident make a practical proposal',
        check: { skill: 'lore', target: 9 },
        cost: 'You may lose the ghost committee before anyone agrees on a priority',
        success: {
          text: 'Outside the gate, the ghosts offer different maps with the same missing bus line. You copy the overlap, not their names, and hand it to the living groundskeeper to share with whoever is actually planning the roads. Behind the hedge the mourners finish their visit undisturbed.',
          effects: {
            evidence: 'Three speculative maps with one missing bus line',
            goodwill: 1,
            flag: 'cemetery_future_listened',
          },
        },
        failure: {
          text: 'The ghosts fade when you ask for signatures. You have one half-legible map and have spoken too loudly near a funeral. You apologize to the groundskeeper, fold the page and wait until the visitors leave. Imagined citizens have no right to interrupt living grief.',
          effects: { nerve: -1, flag: 'cemetery_apology' },
        },
      },
      {
        id: 'leave-graves',
        label: 'Keep the meeting fictional and offer to help the groundskeeper tend the path instead',
        success: {
          text: 'You gather fallen branches and reset the loose gate latch. One ghost lingers long enough to ask whether the bus will have room for a walker. "It had better," says the groundskeeper, who is very much alive. You add a note before the translucent committee dissolves.',
          effects: { goodwill: 1, flag: 'cemetery_living_first' },
        },
      },
      {
        id: 'ask-terms',
        label: 'Ask the ghosts what their future demands would cost somebody living today',
        check: { skill: 'psyche', target: 9 },
        success: {
          text: 'The ghost with the flood map admits that her proposed houses occupy somebody else\'s orchard. The one guarding the catchment confesses he would send a real neighbor on a two-hour bus ride. They begin drawing a fourth map together, the first that includes people already here.',
          effects: { weird: 1, flag: 'cemetery_tradeoffs_named' },
        },
        failure: {
          text: 'Each future resident insists their sacrifice is the only ethical one. They cannot hear one another over their own unfinished lives. You leave them arguing politely outside the gate and refuse to name a winner on the way down the hill.',
          effects: { flag: 'cemetery_future_unsettled' },
        },
      },
    ],
    provenance:
      'All ghost characters, proposals, maps and conversations are original fictional futures. No real grave, deceased person, cemetery inscription or funeral is described or impersonated.',
  },
]
