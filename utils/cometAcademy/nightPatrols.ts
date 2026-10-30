import type { SiteId } from './cityMap'
import type { StoryGrade } from './patrolStories'

export type PatrolZoneId = 'academy' | 'transit' | 'harbor' | 'civic'
export type PatrolChoice = {
  id: string
  label: string
  result: string
  influence: number
  danger: number
  standing: number
}
export type PatrolScene = {
  id: string
  title: string
  scene: string
  choices: readonly [PatrolChoice, PatrolChoice]
}
export type PatrolMemory = {
  day: number
  zone: PatrolZoneId
  encounterId: string
  choiceId: string
  /** Only commissioned patrol stories (patrolStories.ts) record a grade. */
  outcome?: StoryGrade
}
export const PATROL_ZONES: readonly {
  id: PatrolZoneId
  title: string
  siteId: SiteId
  hook: string
}[] = [
  {
    id: 'academy',
    title: 'Academy Roofs',
    siteId: 'academy-roof',
    hook: 'Classmates, curfew and secrets',
  },
  {
    id: 'transit',
    title: 'Transit Narrows',
    siteId: 'transit-union',
    hook: 'Workers, gates and last trains',
  },
  {
    id: 'harbor',
    title: 'Harbor Ward',
    siteId: 'waterfront-market',
    hook: 'Mutual aid along the waterline',
  },
  {
    id: 'civic',
    title: 'Civic Heights',
    siteId: 'media-spire',
    hook: 'Hospitals, news and power',
  },
]

const choice = (
  id: string,
  label: string,
  result: string,
  influence: number,
  danger: number,
  standing: number,
): PatrolChoice => ({ id, label, result, influence, danger, standing })

// Original scene writing, not re-skinned case titles. Both responses have distinct
// consequences; three scenes per anchored map region rotate across later nights.
const PATROL_SCENES: Record<
  PatrolZoneId,
  readonly [PatrolScene, PatrolScene, PatrolScene]
> = {
  academy: [
    {
      id: 'roof-false-alarm',
      title: 'A Bell After Midnight',
      scene:
        'The academy bell rings at 12:04 although the electrical room is dark. A first-year with burnt fingertips says the bell calls for help from inside the locked astronomy lab. The dean has ordered the roof sealed until morning.',
      choices: [
        choice(
          'roof-false-alarm-investigate',
          'Follow the bell through the maintenance crawlspace',
          'You find an injured student hiding a stolen fire-suppression blueprint. You carry them to the infirmary before the dean can label the cry for help a prank. The blueprint becomes whispered evidence in morning chemistry.',
          1,
          1,
          2,
        ),
        choice(
          'roof-false-alarm-intervene',
          'Open the roof and summon the night custodian',
          'The custodian evacuates three sleeping students safely, but a sealed evidence case vanishes from the laboratory while everyone watches the stairs. Faculty thanks you in public and questions your judgment in private.',
          0,
          0,
          1,
        ),
      ],
    },
    {
      id: 'roof-curfew',
      title: 'The Curfew Doppelganger',
      scene:
        'A security camera shows you crossing the north parapet while you are standing on the south one. The projected double carries a missing student’s backpack and heads toward the dormitory skylight.',
      choices: [
        choice(
          'roof-curfew-investigate',
          'Trail your double without raising the alarm',
          'You trace the projected body to a student-built camera loop and recover the missing backpack. The owner asks that you investigate its contents before reporting anyone to the dean.',
          1,
          1,
          1,
        ),
        choice(
          'roof-curfew-intervene',
          'Warn the dormitories and cut the feed',
          'Everyone wakes and gets clear of a collapsing skylight. The projection is destroyed with the footage, leaving a missing student’s family with no reliable evidence of where their child went.',
          0,
          -1,
          2,
        ),
      ],
    },
    {
      id: 'roof-chemistry',
      title: 'The Unmarked Antidote',
      scene:
        'The chemistry skylight is fogged from the inside. A frog-shaped shadow taps a frantic rhythm against it; beneath the glass, a gloved scientist is trying to keep a volatile antidote cold while a teacher orders the room fumigated.',
      choices: [
        choice(
          'roof-chemistry-investigate',
          'Listen to the scientist before opening the room',
          'The scientist teaches you which two valves must stay closed. The antidote survives, and you learn that the fumigation order bears the wrong faculty signature. Someone wanted the formula destroyed.',
          1,
          1,
          2,
        ),
        choice(
          'roof-chemistry-intervene',
          'Break the skylight and carry the scientist out',
          'You pull the scientist through the broken glass alive. The heat spoils part of the antidote, but the night staff witness enough to challenge the school’s claim that nobody was inside.',
          0,
          1,
          1,
        ),
      ],
    },
  ],
  transit: [
    {
      id: 'rail-red-flag',
      title: 'Red Flags at Platform Nine',
      scene:
        'A driver refuses to move the last passenger train. Its automatic controller insists the track is clear, but the driver holds a hand-painted red flag against the door and says the controller has been lying all week.',
      choices: [
        choice(
          'rail-red-flag-investigate',
          'Walk the switchyard with the driver',
          'You uncover a sabotaged signal just beyond the bend and photograph its fresh academy maintenance seal. The drivers trust you enough to show you the other three signals they have marked.',
          1,
          1,
          2,
        ),
        choice(
          'rail-red-flag-intervene',
          'Hold the platform while mechanics disable automation',
          'Commuters get home safely on a slower manual service. Officials praise your restraint, but management suspends the driver for ignoring a supposedly infallible system.',
          0,
          -1,
          1,
        ),
      ],
    },
    {
      id: 'rail-ticket',
      title: 'One Ticket for Eight Names',
      scene:
        'The last train disgorges eight refugees with one valid transit ticket among them. A station gate begins closing while a conductor argues with a private security team about who counts as a passenger.',
      choices: [
        choice(
          'rail-ticket-investigate',
          'Ask the conductor who changed the passenger manifest',
          'An old paper manifest records eight paid seats. You photograph the falsified digital roster and escort everyone to a legal aid office before midnight, but the security company now knows your face.',
          1,
          1,
          2,
        ),
        choice(
          'rail-ticket-intervene',
          'Keep the gate physically open until everyone crosses',
          'All eight travelers reach the safe platform. Your heroics make the evening news, but the erased tickets are still erased, and tomorrow the same machine may refuse them again.',
          1,
          0,
          1,
        ),
      ],
    },
    {
      id: 'rail-night-shift',
      title: 'The Last Shift Never Ends',
      scene:
        'A monorail depot is still lit at three in the morning. The mechanics inside have been ordered to repeat a safety drill until they approve a faulty axle. A manager waits with termination slips at the only exit.',
      choices: [
        choice(
          'rail-night-shift-investigate',
          'Document the axle failure with the night mechanics',
          'The crew demonstrates the fracture, and you make an authenticated recording before the manager can confiscate their tools. The morning union meeting can now demand repairs from evidence, not rumor.',
          1,
          1,
          2,
        ),
        choice(
          'rail-night-shift-intervene',
          'Escort the exhausted crew out through the service door',
          'Every mechanic leaves unhurt. The manager locks the depot and calls the walkout sabotage, but the crew gets its first full night of sleep in two weeks.',
          0,
          -1,
          1,
        ),
      ],
    },
  ],
  harbor: [
    {
      id: 'dock-medicine',
      title: 'The Tide Brings Medicine',
      scene:
        'A relief skiff docks without running lights, carrying refrigerated insulin for the night bazaar clinic. Harbor police are searching boats for contraband. The pilot asks whether you will help unload or verify the cargo.',
      choices: [
        choice(
          'dock-medicine-investigate',
          'Inspect the cooler before the police board',
          'You find legitimate medication beside counterfeit customs seals. The clinic receives the insulin with a paper trail that exposes the broker who profited from the shortage.',
          1,
          1,
          2,
        ),
        choice(
          'dock-medicine-intervene',
          'Help carry the coolers through the flooded alley',
          'The medicine reaches patients before the power fails. Harbor police question the pilot in the morning, and the clinic asks you to testify to what you actually saw.',
          1,
          0,
          1,
        ),
      ],
    },
    {
      id: 'dock-rope',
      title: 'A Rope Between Two Boats',
      scene:
        'A fishing boat is trapped against the flood barrier. On the opposite side, three families wave from a stranded houseboat. You have a single rescue line and a rising tide; the two captains are shouting over each other.',
      choices: [
        choice(
          'dock-rope-investigate',
          'Find the hidden maintenance winch beneath the pier',
          'You free both vessels using the old workers’ winch, but have to cut a private marina lock to do it. The owner threatens a lawsuit while the rescued captains offer you a berth for future patrols.',
          1,
          1,
          2,
        ),
        choice(
          'dock-rope-intervene',
          'Secure the houseboat and signal the fishing crew',
          'The families escape while fishers hold their own boat in the current. Their engine is lost, and the morning market opens a collection to keep their business afloat.',
          0,
          1,
          1,
        ),
      ],
    },
    {
      id: 'dock-grandmother',
      title: 'The Grandmother With a Traffic Cone',
      scene:
        'An elderly woman in an absurdly reinforced motorcycle helmet blocks a warehouse road with a bright orange cone. She claims that the delivery drones are transporting stolen heating batteries away from the waterfront shelters.',
      choices: [
        choice(
          'dock-grandmother-investigate',
          'Check the manifest with the woman',
          'The batteries are indeed registered to the shelters. The woman grins and calls herself Granny Mayhem; together you force a signed inventory correction before the dawn delivery shift.',
          1,
          1,
          2,
        ),
        choice(
          'dock-grandmother-intervene',
          'Block the drones while residents move the batteries',
          'The shelters regain their power before daybreak. Granny Mayhem offers a crooked salute, but the logistics company files a complaint that may complicate your next school inspection.',
          1,
          0,
          1,
        ),
      ],
    },
  ],
  civic: [
    {
      id: 'spire-recording',
      title: 'Two Videos of One Rescue',
      scene:
        'Every screen in the media district shows a hero saving a child, but the live feed from a nearby fire escape shows the same hero blocking an exit. An editor begs you to choose which recording to broadcast.',
      choices: [
        choice(
          'spire-recording-investigate',
          'Synchronize the cameras using streetlight flashes',
          'You prove one clip was spliced around a missing evacuation. The editor publishes both perspectives and names the powerful sponsor who paid for the edit.',
          1,
          1,
          2,
        ),
        choice(
          'spire-recording-intervene',
          'Put witnesses on the live broadcast',
          'Residents speak for themselves and correct the heroic headline. The sponsor threatens the editor’s job, but the people trapped at the fire escape are finally seen.',
          1,
          0,
          1,
        ),
      ],
    },
    {
      id: 'spire-lights',
      title: 'A Hospital Is Going Dark',
      scene:
        'The civic hospital loses one floor of power every three minutes. A utility dispatcher insists this is routine maintenance, while nurses are wheeling patients down stairwells with flashlights between their teeth.',
      choices: [
        choice(
          'spire-lights-investigate',
          'Follow the outage map to the city’s switch cabinet',
          'You find the cuts are timed to a private testing schedule, not a failing grid. A nurse keeps the dated schedule to confront the utilities board tomorrow.',
          1,
          1,
          2,
        ),
        choice(
          'spire-lights-intervene',
          'Carry patients past the dark operating wing',
          'Every patient on your floor gets to emergency power. The utility remains unchallenged, but the nurses credit the evacuation plan to the staff who stayed.',
          0,
          -1,
          1,
        ),
      ],
    },
    {
      id: 'spire-witness',
      title: 'The Reporter Who Refused a Byline',
      scene:
        'A reporter has photographs of a secret city contract but will not publish while the source is in danger. Security drones arrive at the media spire entrance, demanding the reporter’s identification.',
      choices: [
        choice(
          'spire-witness-investigate',
          'Escort the source through the archive stairwell',
          'You deliver the anonymous witness to a legal observer and preserve the photographs’ metadata. The next morning the paper prints the contract without exposing the worker.',
          1,
          1,
          2,
        ),
        choice(
          'spire-witness-intervene',
          'Draw the drones onto the public rooftop',
          'The reporter gets away with the negatives. Your confrontation becomes the headline instead, and the contract waits another day while police review your rooftop interference.',
          0,
          1,
          1,
        ),
      ],
    },
  ],
}

export function patrolSceneFor(
  seed: number,
  day: number,
  zone: PatrolZoneId,
): PatrolScene {
  const index = PATROL_ZONES.findIndex((entry) => entry.id === zone)
  if (index < 0 || !Number.isInteger(day) || day < 1)
    throw new Error('Invalid night patrol')
  const stories = PATROL_SCENES[zone]
  return stories[(Math.abs(seed) + day + index) % stories.length]!
}

export const PATROL_SCENE_COUNT = Object.values(PATROL_SCENES).flat().length

// Secrets only appear after a real prior clue AND a trusted named teammate.
export const PATROL_SECRETS: Record<
  PatrolZoneId,
  { ally: string; choice: PatrolChoice }
> = {
  academy: {
    ally: 'kit',
    choice: choice(
      'academy-secret',
      'Ask Kit to identify the stolen lab seal',
      'Kit identifies the forged medical seal and persuades a frightened lab assistant to testify. The academy can no longer dismiss the missing research as student gossip.',
      2,
      -1,
      3,
    ),
  },
  transit: {
    ally: 'mara',
    choice: choice(
      'transit-secret',
      'Bring Mara to inspect the hidden switchyard file',
      'Mara recognizes the obsolete braking diagram and finds the sabotage order underneath the timetable. The drivers gain proof their strike prevented a collision.',
      2,
      -1,
      3,
    ),
  },
  harbor: {
    ally: 'nix',
    choice: choice(
      'harbor-secret',
      'Let Nix follow the sealed shipment through a portal',
      'Nix returns with photographs of the stockroom where relief supplies were diverted. The harbor clinic gets its medicine and the city inspector gets an evidence trail.',
      2,
      -1,
      3,
    ),
  },
  civic: {
    ally: 'sol',
    choice: choice(
      'civic-secret',
      'Ask Sol to preserve the unedited broadcast signal',
      'Sol anchors the signal long enough to recover the missing frames. A civilian witness gets to tell the complete story in the morning hearing.',
      2,
      -1,
      3,
    ),
  },
}
