import type {
  Choice,
  CompanionId,
  EncounterCard,
  EventId,
  Fate,
  LeadId,
  LensId,
  SceneKind,
} from './content'

// The route spine: which event you go to, who you meet there, the voluntary offer,
// and the fixed story beats each route walks through between the daily white-rabbit forks.
// Silas, 2026-10-20 PT: area first, then the offer, then the companion (or nobody);
// the Kinetic route conscripts you into the race. Recorded in conductor weird-humboldt t-032.

export type EventInfo = {
  id: EventId
  name: string
  kind: string
  blurb: string
  pick: string
  scene: SceneKind
  art: string
  companions: [CompanionId, CompanionId]
  lenses: LensId[]
  days: string[]
  /** Future score needed for the hopeful ending; the longer race asks more of you. */
  futureTarget: number
  provenance: string
}

export const EVENTS: EventInfo[] = [
  {
    id: 'green-ribbon',
    name: 'The Green Ribbon Fair',
    kind: 'An invented cannabis harvest fair at the forest edge',
    blurb:
      'Growers’ booths, a giant moss puppet, circus on the lawn and drums in the woods. Where Kit and Juniper are, and where the weekend can go sober, stoned or psychedelic.',
    pick: 'You follow the green flyer out of town, to a meadow where the redwoods begin.',
    scene: 'meadow',
    art: 'scenes/prologue-meadow',
    companions: ['kit', 'juniper'],
    lenses: ['sober', 'stoned', 'tripping_balls'],
    days: ['Friday', 'Saturday', 'Sunday'],
    futureTarget: 5,
    provenance:
      'An invented festival in the spirit of Humboldt’s harvest fairs. No real event, venue or vendor.',
  },
  {
    id: 'kinetic',
    name: 'The Kinetic Grand Championship',
    kind: 'The real three-day human-powered art race, with an invented afterparty',
    blurb:
      'Pedal-powered sculptures race from the Arcata Plaza over sand, mud and Humboldt Bay to Ferndale. Where Cedar and Mara are, a drink or a clear head, and a seat in the race.',
    pick: 'You stay on the Plaza. By morning it will be full of sculptures, costumes and people who trained all year to be ridiculous.',
    scene: 'plaza',
    art: 'chapters/the-impossible-festival',
    companions: ['cedar', 'mara'],
    lenses: ['sober', 'tipsy', 'cocaine', 'mdma'],
    days: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'],
    futureTarget: 7,
    provenance:
      'The Kinetic Grand Championship is real: a three-day race of human-powered art sculptures from Arcata to Ferndale over Memorial Day weekend. The afterparty, teams, injury and anomalies are invented.',
  },
]

export const EVENT_CHOICE = {
  title: 'Where Does the Weekend Start?',
  place: 'Arcata Plaza, a telephone pole',
  scene: 'plaza' as SceneKind,
  art: 'chapters/arcata-after-hours',
  body: [
    'Two flyers are stapled to the same telephone pole on the Arcata Plaza. One is green, hand-printed, and smells faintly of the forest. The other is a photocopy of a giant pedal-powered banana slug.',
    'A white rabbit in a tiny racing helmet hops past both, checks a pocket watch and says, to nobody, “Late, late, the fog won’t wait.” Then it is gone, and the choice of which one to chase is yours.',
  ],
}

const MEET_CHOICES: Choice[] = [
  {
    id: 'together',
    label: 'Travel with {companion}',
    meet: true,
    success: {
      text: '{companion} grins and falls into step beside you. The weekend has a guide.',
      effects: { goodwill: 1 },
    },
  },
  {
    id: 'alone',
    label: 'Thank {companion} and go it alone',
    meet: false,
    cost: 'Loners see what a guide would explain away. Some endings are only for them.',
    success: {
      text: '{companion} shrugs, unoffended, and goes after the mystery on their own. You keep your own counsel, and your own pace.',
      effects: { nerve: 1 },
    },
  },
]

const LOCKED: Choice['success'] = { text: '', effects: {} }

export const BEATS: EncounterCard[] = [
  {
    id: 'GR-1',
    kind: 'spine',
    event: 'green-ribbon',
    day: 1,
    chapter: 1,
    place: 'The Green Ribbon Fair, at the forest edge',
    title: 'The Green Ribbon Fair',
    scene: 'meadow',
    art: 'scenes/prologue-meadow',
    body: [
      'Music shakes moss off a huge wooden puppet. Growers in sun hats judge each other’s harvest with the seriousness of a wine competition. A handmade sign at the tree line reads THE WOODS ARE NOT RESPONSIBLE FOR WHAT YOU REMEMBER.',
      'Two things pull at you. On the lawn, a crowd gasps at circus performers stacking themselves into impossible shapes. Past the tree line, a drum circle is playing a rhythm the trees seem to be answering.',
    ],
    choices: [
      {
        id: 'acro',
        label: 'Watch the partner acrobats on the lawn',
        prospect: 'kit',
        success: {
          text: 'A woman in patched coveralls stands on her partner’s hands, upside down, juggling three clubs with her feet. She catches your eye mid-flip and winks, as if the two of you have an appointment.',
          effects: { flag: 'saw_the_acro' },
        },
      },
      {
        id: 'drums',
        label: 'Follow the drum circle into the woods',
        prospect: 'juniper',
        success: {
          text: 'The path is marked with green ribbons. In a clearing ringed by redwoods a young woman with a ribbon in her hair is dancing at the circle’s edge. Her reflection in a puddle has branches growing from its head.',
          effects: { weird: 1 },
        },
      },
    ],
    provenance:
      'An invented festival. Partner acrobatics and drum circles are ordinary festival sights; the forest’s replies are not.',
  },
  {
    id: 'GR-2',
    kind: 'spine',
    event: 'green-ribbon',
    day: 1,
    chapter: 1,
    place: 'The Green Ribbon Fair',
    title: 'Something to Share',
    scene: 'meadow',
    variantBy: 'prospect',
    body: [
      'Somebody always has something to share at the Green Ribbon Fair: water, sandwiches, a joint, and a little tin of the serious brownies, labeled. Nobody has to.',
    ],
    variants: {
      kit: [
        'After the show the acrobats sprawl on a blanket, passing around water, a basket of sandwiches and a joint, all offered with the same easy generosity. The base of the act, a huge bearded man with a voice like a lullaby, holds up a wax-paper parcel. “Brownies,” he says. “Labeled. The serious kind. Nobody has to.”',
        'The woman in coveralls, still upside down on a stranger’s shoulders, calls over: “Whatever you pick, pick it on purpose.”',
      ],
      juniper: [
        'The drum circle breaks for water. A drummer with silver rings on every finger passes you a canteen, then a joint, then, more carefully, a small labeled tin of the serious brownies. “Nobody has to,” she says. “The forest’s weird enough either way.”',
        'Across the clearing the woman with the ribbon watches you decide, curious rather than expectant.',
      ],
    },
    choices: [
      {
        id: 'sober',
        label: 'Sober: water and a sandwich',
        lens: 'sober',
        check: { skill: 'wits', target: 7 },
        success: {
          text: 'The puddle’s reflected branches sway against the wind. Not with it. Against it. You write that down.',
          effects: {
            evidence: 'Reflection moving against the wind',
            flag: 'nymph_seen_clearly',
          },
        },
        failure: {
          text: 'Someone hands you a perfectly ordinary trail map. It has one trail on it that is not on any other map.',
          effects: { evidence: 'A map with an unmarked trail', weird: 1 },
        },
      },
      {
        id: 'stoned',
        label: 'Stoned: a voluntary smoke and a quiet place to listen',
        lens: 'stoned',
        check: { skill: 'psyche', target: 9 },
        success: {
          text: 'Under the music there is a forest polyrhythm nobody composed. You could hum it back. You decide not to, yet.',
          effects: { evidence: 'An uncomposed forest rhythm', weird: 1 },
        },
        failure: {
          text: 'You lose the rhythm in the bass line. Somebody else at this fair heard it too; you will find them later.',
          effects: { weird: 1 },
        },
      },
      {
        id: 'tripping',
        label:
          'Tripping: a clearly labeled, entirely fictional enchanted brownie',
        lens: 'tripping_balls',
        check: { skill: 'psyche', target: 9 },
        success: {
          text: 'The forest has acquired a painted moon, and the paint is still wet. Behind it, a trail. Nobody else is looking up. The moon will still be there tomorrow, and the day after.',
          effects: {
            evidence: 'A painted moon over the trail',
            weird: 1,
            flag: 'moon_route',
          },
        },
        failure: {
          text: 'You follow a very convincing false lead to the porta-potties. It is, at least, a memorable false lead, and the colors are not done with you.',
          effects: { weird: 1, nerve: -1 },
        },
      },
    ],
    provenance:
      'A voluntary adult choice at an invented festival. No dosages, sources or real products.',
  },
  {
    id: 'GR-3',
    kind: 'spine',
    event: 'green-ribbon',
    day: 1,
    chapter: 1,
    place: 'The Green Ribbon Fair',
    title: 'Someone Worth Following',
    scene: 'grove',
    variantBy: 'prospect',
    body: [
      'Someone at the fair has noticed the same strange things you have, and would like company.',
    ],
    variants: {
      kit: [
        'The show is over and the woman in patched coveralls is repairing a club with tape and spite. Up close there is a little gear tattooed behind her ear. “Kit,” she says, shaking your hand like a juggler, testing your grip. “I grew up here. I know every weird thing in this county, and something new just started ticking.”',
        'She shows you a gear from her pocket. She didn’t make it. It ticks in a rhythm nobody taught it, faster whenever it points at the fog. “I’m going to follow it,” she says. “Want to come?”',
      ],
      juniper: [
        'The woman with the green ribbon finds you on a fallen log, listening. She sits without asking and offers half a sandwich, and the redwoods lean in like old friends eavesdropping.',
        '“You heard it too,” Juniper says. “The forest is repeating itself. It doesn’t do that.” She smiles like she knows exactly how strange she is. “I’m going to find out why. Company’s welcome, if it can keep a secret.”',
      ],
    },
    choices: MEET_CHOICES,
    provenance: 'Invented characters.',
  },
  {
    id: 'GR-4',
    kind: 'spine',
    event: 'green-ribbon',
    day: 2,
    chapter: 1,
    place: 'Behind the main stage, into the redwoods',
    title: 'The Path Behind the Stage',
    scene: 'grove',
    body: [
      'Saturday morning the fair is asleep in its tents. Behind the main stage a path you are sure wasn’t there yesterday runs straight into the redwoods, marked with green ribbons at exactly the height of your eyes.',
      'A mile in, the forest starts repeating itself: the same fallen log, the same fern curled like a question mark, the same banana slug crossing the same root. On the third pass, the slug is wearing a tiny racing helmet.',
    ],
    lensLines: {
      sober:
        'You mark the log with a stone on every pass. All your stones are still there, and so is a fourth one you didn’t put down.',
      tipsy:
        'Last night’s cheer is still in your chest, which makes the loop feel more like a joke than a trap.',
      stoned:
        'The repeat has a rhythm: three beats and a rest, like the drums last night.',
      tripping_balls:
        'The ribbons are glowing softly and the redwoods are breathing in time with you. This was never going to be over by morning.',
    },
    leadLines: {
      kit: 'Kit pulls the ticking gear from her pocket. It is ticking in threes.',
      juniper:
        'Juniper has gone very quiet. “This is the shape,” she says. “The one it shouldn’t make.”',
      cedar: 'Cedar’s handheld radio picks up a calm voice counting laps.',
      mara: 'Mara sketched the log on the first pass. On the third, her drawing has changed to match it.',
    },
    aloneLine:
      'Nobody is here to tell you it’s fine. You decide that it is, mostly.',
    choices: [
      {
        id: 'slug',
        label: 'Follow the slug in the racing helmet',
        check: { skill: 'psyche', target: 9 },
        success: {
          text: 'The slug leads you off the loop, between two redwoods that turn out to be one tree, into a glade where the fair’s music sounds like it’s coming from next year.',
          effects: {
            evidence: 'A glade where next year’s music plays',
            weird: 1,
          },
        },
        failure: {
          text: 'You follow it for an hour. It is very slow. When you look up you are back at the log, and it is noon.',
          effects: { nerve: -1 },
        },
      },
      {
        id: 'seam',
        label: 'Map the loop and find the seam',
        check: { skill: 'wits', target: 9 },
        success: {
          text: 'Every pass is eleven steps shorter than the last. At the end of the count there is a seam in the air, and through it the fair’s parking lot, deserted and thirty years older.',
          effects: { evidence: 'A seam in the loop, eleven steps short' },
        },
        failure: {
          text: 'Your map is perfect, and it describes a forest that isn’t this one.',
          effects: { weird: 1 },
        },
      },
      {
        id: 'wait',
        label: 'Sit down and wait for the forest to finish',
        cost: 'You lose the morning',
        success: {
          text: 'You sit on the log until the forest gets bored of you. A family of hikers comes by and shares their trail mix; they have been looping since Thursday and are delighted to have company.',
          effects: { goodwill: 1, nerve: 1 },
        },
      },
    ],
    provenance:
      'An invented trail in an invented forest behind an invented fair. Banana slugs are real and do not usually race.',
  },
  {
    id: 'GR-5',
    kind: 'spine',
    event: 'green-ribbon',
    day: 3,
    chapter: 1,
    place: 'The Green Ribbon Fair, the last night',
    title: 'The Closing Bonfire',
    scene: 'meadow',
    art: 'scenes/prologue-meadow',
    body: [
      'On the last night the fair burns a wicker redwood in the meadow, and everyone still standing comes to watch. The moss puppet takes a bow. Growers trade seeds and promises. Somebody is collecting signatures to protect the forest behind the stage, and somebody else is collecting signatures to buy it.',
      'In the smoke over the fire you can see the county, the way you can see faces in clouds. It is changing shape, waiting to see what you do.',
    ],
    lensLines: {
      sober:
        'You watch the signature tables, not the fire. The buyer’s clipboard has more pages than people in line.',
      tipsy:
        'Everybody is hugging everybody, and the county in the smoke looks like it would like a hug too.',
      stoned:
        'The fire crackles in threes and a rest. The forest is still talking.',
      tripping_balls:
        'The smoke is not a picture of the county. It is the county, small and close and alive, and it can see you too.',
    },
    leadLines: {
      kit: 'Kit is juggling burning clubs for the crowd, which is either the best or worst idea anyone has had all weekend.',
      juniper:
        'Juniper stands at the edge of the light with her bare feet in the grass. “Whatever happens to the forest,” she says, “happens to me.”',
      cedar:
        'Cedar holds his radio up to the fire like he’s trying to tune it in.',
      mara: 'Mara is drawing the smoke, fast. On her page it already has six wings.',
    },
    aloneLine:
      'You came alone and you are watching alone, and somehow you are part of the crowd anyway.',
    choices: [
      {
        id: 'petition',
        label: 'Sign the petition to protect the forest, and get others to',
        check: { skill: 'rizz', target: 7 },
        success: {
          text: 'By midnight there are three hundred signatures, a bake sale schedule and a legal fund. The smoke settles into the shape of a forest with a trail through it.',
          effects: { goodwill: 1, flag: 'forest_petition' },
        },
        failure: {
          text: 'You collect forty signatures and a lecture about zoning. It is a start. The smoke can’t decide.',
          effects: { flag: 'forest_petition' },
        },
      },
      {
        id: 'buyer',
        label: 'Find out who is buying the forest',
        check: { skill: 'lore', target: 9 },
        success: {
          text: 'The buyer’s address is a post office box in a county with no trees. You write it down, with the names of three locals who will vouch for what you saw.',
          effects: { evidence: 'Who is buying the forest behind the stage' },
        },
        failure: {
          text: 'You find the buyer’s representative, who is charming and generous and gone by morning, along with your notes.',
          effects: { nerve: -1 },
        },
      },
      {
        id: 'offering',
        label: 'Give the fire something of yours',
        cost: 'Something you won’t get back',
        success: {
          text: 'You give the fire the notebook you kept all weekend. The smoke takes the shape of everyone you met, all of them laughing. You remember everything anyway.',
          effects: { weird: 1, nerve: 1 },
        },
      },
    ],
    provenance:
      'An invented fair’s closing night. The forest, the petition and the buyer are invented.',
  },
  {
    id: 'KN-1',
    kind: 'spine',
    event: 'kinetic',
    day: 1,
    chapter: 1,
    place: 'Arcata Plaza, race morning',
    title: 'Race Morning on the Plaza',
    scene: 'plaza',
    art: 'chapters/arcata-after-hours',
    body: [
      'By eight in the morning the Plaza is a parade that hasn’t decided to move: a pedal-powered dragon, a giant banana slug on bicycle wheels, a rolling teacup crewed by people in pith helmets. Every machine has to cross sand, mud and Humboldt Bay under human power, and every racer is in costume.',
      'Behind the sculptures there is a pit row of trucks and tools, where someone is welding something urgent. Across the square, a tattoo artist has set up a folding table of flash and is painting team sigils on racers’ arms.',
    ],
    choices: [
      {
        id: 'pit',
        label: 'Wander down pit row',
        prospect: 'cedar',
        success: {
          text: 'A man in an oil-stained jacket is welding a broken axle for a team he isn’t on. The CB handset on his truck’s dash crackles out a race report for a race that hasn’t started yet.',
          effects: { flag: 'pit_row' },
        },
      },
      {
        id: 'flash',
        label: 'Get a team sigil at the tattoo table',
        prospect: 'mara',
        success: {
          text: 'The artist paints a small six-winged bird on your forearm without asking which team you’re on. “You’ll be on one,” she says, and does not explain.',
          effects: { flag: 'painted_sigil' },
        },
      },
    ],
    provenance:
      'The race really starts on the Arcata Plaza. The teams, the mechanic, the artist and the early race report are invented.',
  },
  {
    id: 'KN-2',
    kind: 'spine',
    event: 'kinetic',
    day: 1,
    chapter: 3,
    place: 'A warehouse on the Eureka waterfront',
    title: 'The Afterparty',
    scene: 'bay',
    variantBy: 'prospect',
    body: [
      'The first day ends in Eureka, muddy and triumphant. The afterparty fills an old warehouse on the waterfront: a brass band, a costume contest, a keg, and in the back corners a few people offering the kind of party favors that keep you dancing until sunrise.',
    ],
    variants: {
      cedar: [
        'The first day ends in Eureka, muddy and triumphant. The afterparty fills an old warehouse on the waterfront: a brass band, a costume contest, a keg, and in the back corners a few people offering the kind of party favors that keep you dancing until sunrise.',
        'The mechanic from pit row is out in the lot with his tailgate down, a cooler of beer and the CB on low. “Help yourself,” he says. “Or don’t. I’m on the clock with this radio.”',
      ],
      mara: [
        'The first day ends in Eureka, muddy and triumphant. The afterparty fills an old warehouse on the waterfront: a brass band, a costume contest, a keg, and in the back corners a few people offering the kind of party favors that keep you dancing until sunrise.',
        'The tattoo artist has set up her flash by the door and is drinking sparkling water. She looks at the bird on your arm, then at you. “It’s got more wings than I painted,” she says.',
      ],
    },
    choices: [
      {
        id: 'sober',
        label: 'Sober: sparkling water and a clear head',
        lens: 'sober',
        check: { skill: 'wits', target: 7 },
        success: {
          text: 'You are the only person in the warehouse who notices that the band’s shadows are a beat behind the band. You write that down.',
          effects: { evidence: 'Shadows a beat behind the band' },
        },
        failure: {
          text: 'You spend an hour explaining the race to a confused tourist and come away with his blurry photo of a sculpture that wasn’t in it.',
          effects: {
            evidence: 'A photo of a sculpture that was not in the race',
            weird: 1,
          },
        },
      },
      {
        id: 'tipsy',
        label: 'Tipsy: a beer and the dance floor',
        lens: 'tipsy',
        check: { skill: 'rizz', target: 7 },
        success: {
          text: 'You talk your way into the brass band’s second line. The tuba’s note lands a split second before the tuba player plays it. Nobody else notices. You do.',
          effects: { goodwill: 1, flag: 'second_line_echo' },
        },
        failure: {
          text: 'You are adopted by a racing team called the Mudflat Mermaids, handed a tambourine and promoted to unreliable witness.',
          effects: { goodwill: 1, nerve: -1 },
        },
      },
      {
        id: 'fast-track',
        label: 'The Fast Track',
        lens: 'cocaine',
        locked: 'Being written',
        success: LOCKED,
      },
      {
        id: 'loves-all',
        label: 'Everybody Loves Everybody',
        lens: 'mdma',
        locked: 'Being written',
        success: LOCKED,
      },
    ],
    provenance:
      'The afterparty and its warehouse are invented. A voluntary adult choice; no dosages, sources or real products.',
  },
  {
    id: 'KN-3',
    kind: 'spine',
    event: 'kinetic',
    day: 1,
    chapter: 3,
    place: 'The afterparty',
    title: 'Someone Worth Following',
    scene: 'bay',
    variantBy: 'prospect',
    body: [
      'Someone at the race has noticed the same strange things you have, and would like company.',
    ],
    variants: {
      cedar: [
        'The mechanic is elbow-deep in the generator keeping the warehouse lights on. On his truck’s dash a calm voice reads a weather report for a Humboldt that has a bullet train.',
        '“That ain’t a station,” says Cedar, wiping his hands. “I been listening to every station in this county since I was six. Tomorrow I’m going to find out where it’s coming from.” He looks at you. “You seeing the weird stuff too?”',
      ],
      mara: [
        'The tattoo artist turns your arm toward the light. The bird she painted this morning has grown a seventh wing, in her style, in her ink. “I didn’t draw that,” says Mara, very calmly. “Somebody keeps finishing my work before I do.”',
        '“I’m going to find out who,” she says. “I could use someone who writes things down.”',
      ],
    },
    choices: MEET_CHOICES,
    provenance: 'Invented characters.',
  },
  {
    id: 'KN-4',
    kind: 'spine',
    event: 'kinetic',
    day: 2,
    chapter: 3,
    place: 'Eureka waterfront, Sunday morning',
    title: 'Conscripted',
    scene: 'bay',
    body: [
      'The Banana Slug Express, a twelve-foot yellow slug on bicycle wheels, is missing its pilot. Dot sprained her ankle on the afterparty dance floor and is sitting on a cooler with a bag of frozen peas, pointing a crutch at you. “You,” she says. “You’ve got legs. The bay crossing is in an hour.”',
      'The crew captain hands you a helmet with antennae on it. A sculpture keeps racing as long as somebody keeps it moving, and somebody, apparently, is you.',
    ],
    leadLines: {
      cedar:
        'Cedar is already under the slug with a wrench. “Her drive chain’s held on with prayer,” he says. “I’ll ride along and keep it that way.”',
      mara: 'Mara paints the team’s slug sigil on your helmet, then on her own. “If you’re going in the bay,” she says, “I’m going in the bay.”',
      kit: 'Kit is already strapping herself into the back seat. “I’ve crossed this bay four times,” she says. “Twice on purpose.”',
      juniper:
        'Juniper looks at the slug the way other people look at puppies. “It wants to swim,” she says, and climbs in.',
    },
    aloneLine:
      'Nobody you know is here. The crew of strangers adopts you anyway; that is how this race works.',
    choices: [
      {
        id: 'pilot',
        label: 'Take the pilot’s seat',
        check: { skill: 'burly', target: 7 },
        success: {
          text: 'You find the rhythm on the second block. The slug surges down the waterfront and the crowd starts chanting a name, which turns out to be the slug’s.',
          effects: { nerve: 1, flag: 'slug_pilot' },
        },
        failure: {
          text: 'You steer the slug into a planter in front of a cheering crowd. The judges award points for style.',
          effects: { nerve: -1, flag: 'slug_pilot' },
        },
      },
      {
        id: 'navigator',
        label: 'Ride as navigator and mechanic',
        check: { skill: 'wits', target: 9 },
        success: {
          text: 'You find the slipping gear before it strips, and a second gear in the gearbox that nobody installed. It is ticking.',
          effects: {
            evidence: 'A gear nobody installed, ticking',
            flag: 'slug_navigator',
          },
        },
        failure: {
          text: 'You read the course map upside down for a full block. The crew forgives you; the course does not.',
          effects: { nerve: -1, flag: 'slug_navigator' },
        },
      },
      {
        id: 'dot-aboard',
        label: 'Talk the crew into letting Dot ride along in the cargo hold',
        check: { skill: 'rizz', target: 7 },
        success: {
          text: 'Dot rides in the slug’s belly with her peas, shouting directions. With her aboard, the crew stops being strangers.',
          effects: { goodwill: 1, flag: 'dot_aboard' },
        },
        failure: {
          text: 'Dot ends up on the chase bike instead, shouting directions at the wrong slug.',
          effects: { flag: 'dot_chasing' },
        },
      },
    ],
    provenance:
      'The bay crossing is part of the real race. The Banana Slug Express, Dot and her ankle are invented.',
  },
  {
    id: 'KN-5',
    kind: 'spine',
    event: 'kinetic',
    day: 2,
    chapter: 3,
    place: 'Humboldt Bay',
    title: 'The Bay Crossing',
    scene: 'bay',
    body: [
      'The slug floats. That is the first miracle. The second is that it moves: a yellow lump paddle-wheeling across Humboldt Bay between a pedal-powered octopus and a crew dressed as a city council. Spectator boats honk. Seals take a professional interest.',
      'Halfway across, the fog comes down and the other sculptures go quiet. In the gray a bell buoy is ringing, and the slug’s ticking gear is keeping time with it.',
    ],
    lensLines: {
      sober:
        'You count the rings. They match the gear’s ticks exactly, which is not a thing buoys do.',
      tipsy:
        'Somebody on the octopus is singing a sea shanty, and the fog is singing the harmony.',
      stoned:
        'The water is full of slow green light, like the bay is thinking.',
      tripping_balls:
        'The fog parts like a stage curtain, and for a moment the far shore is a Eureka with a glass tower and a train across the water.',
    },
    leadLines: {
      cedar:
        'Cedar has his handheld CB pressed to his ear. “Same voice,” he mouths. “It’s calling the race.”',
      mara: 'Mara is sketching the fog with a grease pencil on the slug’s hull, fast, before it changes.',
      kit: 'Kit is laughing so hard she can barely pedal. “It’s never done this before,” she says. “I love it.”',
      juniper: 'Juniper trails a hand in the water and listens to it.',
    },
    aloneLine:
      'Dot leans out of the hatch. “Is it supposed to do that?” Nobody on the crew knows. You are the closest thing to an expert aboard.',
    choices: [
      {
        id: 'pedal',
        label: 'Pedal hard for the far shore',
        check: { skill: 'burly', target: 9 },
        success: {
          text: 'You come out of the fog in third place with your legs on fire, to a roar from the dock. Behind you the fog closes like a door.',
          effects: { nerve: 1, goodwill: 1 },
        },
        failure: {
          text: 'The slug turns slow circles in the fog for ten minutes. You come out last, but you come out.',
          effects: { nerve: -1 },
        },
      },
      {
        id: 'current',
        label: 'Read the tide and ride the current',
        check: { skill: 'lore', target: 7 },
        success: {
          text: 'You know this bay. You ride the ebb along the channel edge and arrive early enough to help the octopus ashore.',
          effects: { goodwill: 1, flag: 'helped_octopus' },
        },
        failure: {
          text: 'The current knows this bay better than you do. You land on a mudflat with some very interested seals.',
          effects: { nerve: -1, weird: 1 },
        },
      },
      {
        id: 'buoy',
        label: 'Steer toward the ringing buoy',
        check: { skill: 'psyche', target: 9 },
        success: {
          text: 'The buoy is on no chart. Its bell is ringing out a date. You memorize it before the fog lifts and takes the buoy with it.',
          effects: {
            evidence: 'A date rung by a buoy that is on no chart',
            weird: 1,
          },
        },
        failure: {
          text: 'You chase the bell into a fog bank and come out an hour later with no memory of the hour.',
          effects: { weird: 2, nerve: -1 },
        },
      },
    ],
    provenance:
      'Sculptures really do cross Humboldt Bay on the race’s second day. The buoy, the fog and the octopus’s politics are invented.',
  },
  {
    id: 'KN-6',
    kind: 'spine',
    event: 'kinetic',
    day: 3,
    chapter: 5,
    place: 'The Eel River and Ferndale',
    title: 'The Ferndale Finish',
    scene: 'grove',
    art: 'chapters/southern-humboldt-older-roads',
    body: [
      'Day three. The slug fords the Eel River with the crew pushing and Dot steering, then rolls into Ferndale: Victorian gingerbread houses and a Main Street full of cheering people. The finish line is in sight.',
      'On the hill above town the old cemetery is very quiet. Someone in a black frock coat stands among the headstones, waving a racing flag. And just behind you, the pedal-powered octopus has lost a wheel in the river.',
    ],
    lensLines: {
      sober:
        'The man in the frock coat has no reflection in the bakery window. You check twice.',
      tipsy:
        'Main Street is one long cheer, and every Victorian house seems to be cheering too.',
      stoned:
        'The gingerbread trim on the houses is moving very slowly, like ferns.',
      tripping_balls:
        'The headstones on the hill are lined up like a crowd at a finish line. They are all wearing tiny party hats.',
    },
    leadLines: {
      cedar:
        'Cedar’s radio says, in that calm voice, “Finish order is not yet decided.” He turns it off. Then on again.',
      mara: 'Mara is staring at the man in the frock coat. “That’s my bird on his lapel pin,” she says. “Seven wings.”',
      kit: 'Kit is standing on the slug’s back, juggling for the crowd. “Finish lines are for people who stop,” she says.',
      juniper:
        'Juniper is looking at the hill, not the finish. “Somebody up there wants to meet you,” she says.',
    },
    aloneLine:
      'Dot squeezes your shoulder. “Whatever you do,” she says, “do it like you meant to.”',
    choices: [
      {
        id: 'finish',
        label: 'Sprint the slug across the finish line',
        check: { skill: 'burly', target: 9 },
        success: {
          text: 'You cross under the banner to a roar, a medal made from a bicycle gear and a hug from a crew who are not strangers anymore.',
          effects: { goodwill: 1, nerve: 1, flag: 'slug_finished' },
        },
        failure: {
          text: 'The chain snaps ten feet from the line. The crew carries the slug across on their shoulders, which, the judges agree, counts.',
          effects: { goodwill: 1, flag: 'slug_finished' },
        },
      },
      {
        id: 'octopus',
        label: 'Go back and help the octopus out of the river',
        cost: 'You finish last',
        success: {
          text: 'You lose the race and find the octopus crew’s wheel in the reeds. Their captain swears you a lifelong debt, which in Humboldt means a standing invitation to dinner.',
          effects: { goodwill: 2, flag: 'saved_octopus' },
        },
      },
      {
        id: 'cemetery',
        label: 'Climb to the cemetery and meet the man with the flag',
        check: { skill: 'lore', target: 9 },
        success: {
          text: 'He is one of the town’s invented dead, a dairyman who swears he won the very first race, the one nobody remembers. He hands you the flag. It is printed with a finish date thirty years from now.',
          effects: {
            evidence: 'A finish flag dated thirty years ahead',
            weird: 1,
          },
        },
        failure: {
          text: 'You find only the flag, tied to a headstone with a green ribbon. The slug finishes without you; Dot tells the story better than you would have.',
          effects: { weird: 1, flag: 'cemetery_flag' },
        },
      },
    ],
    provenance:
      'The race really fords the Eel River and finishes in Ferndale, whose Victorian Main Street and hillside cemetery are real. The man in the frock coat and everyone else buried in this card are invented.',
  },
]

export type RouteStep =
  | { kind: 'beat'; id: string; day: number }
  | {
      kind: 'fork'
      day: number
      title: string
      pools: number[]
      scene: SceneKind
    }
  | { kind: 'crossroads'; day: number }
  | { kind: 'finale'; day: number }

export const FORK_SIZE = 3

export const ROUTES: Record<EventId, RouteStep[]> = {
  'green-ribbon': [
    { kind: 'beat', id: 'GR-1', day: 1 },
    { kind: 'beat', id: 'GR-2', day: 1 },
    { kind: 'beat', id: 'GR-3', day: 1 },
    {
      kind: 'fork',
      day: 1,
      title: 'Friday night in Arcata',
      pools: [1],
      scene: 'plaza',
    },
    { kind: 'beat', id: 'GR-4', day: 2 },
    {
      kind: 'fork',
      day: 2,
      title: 'Saturday on the coast',
      pools: [2],
      scene: 'beach',
    },
    { kind: 'crossroads', day: 2 },
    {
      kind: 'fork',
      day: 3,
      title: 'Sunday in Eureka',
      pools: [3],
      scene: 'bay',
    },
    { kind: 'beat', id: 'GR-5', day: 3 },
    { kind: 'finale', day: 3 },
  ],
  kinetic: [
    { kind: 'beat', id: 'KN-1', day: 1 },
    { kind: 'beat', id: 'KN-2', day: 1 },
    { kind: 'beat', id: 'KN-3', day: 1 },
    { kind: 'beat', id: 'KN-4', day: 2 },
    { kind: 'beat', id: 'KN-5', day: 2 },
    {
      kind: 'fork',
      day: 2,
      title: 'Sunday night in Eureka',
      pools: [3],
      scene: 'bay',
    },
    { kind: 'beat', id: 'KN-6', day: 3 },
    { kind: 'crossroads', day: 4 },
    {
      kind: 'fork',
      day: 4,
      title: 'Tuesday on the coast',
      pools: [2],
      scene: 'beach',
    },
    {
      kind: 'fork',
      day: 5,
      title: 'Back in Arcata',
      pools: [1],
      scene: 'plaza',
    },
    { kind: 'finale', day: 5 },
  ],
}

export const FORK_PROMPT =
  'Which white rabbit do you chase? Each card is a different corner of the county; the others will still be out there, changed, another time.'

// Endings: the Humboldt of your future. The lead you finish with (or nobody), the lens you
// opened with, and whether your stats at the end of the journey earn the hopeful future.
// Signature titles for the companions come from conductor projects/weird-humboldt/ECOTONE-32-ENDINGS.md.

export type Signature = { title: string; line: string }

export const SIGNATURES: Record<string, Record<Fate, Signature>> = {
  'juniper.sober': {
    hope: {
      title: 'Patient Canopy',
      line: 'Publicly verified habitat protections, and jobs that stay.',
    },
    dark: {
      title: 'Silent Preserve',
      line: 'A green land deal shuts out its human neighbors.',
    },
  },
  'juniper.tipsy': {
    hope: {
      title: 'Common Ground Jubilee',
      line: 'A festival alliance endows a shared, open forest.',
    },
    dark: {
      title: 'Festival Fence',
      line: 'Forest access is sold to a luxury venue.',
    },
  },
  'juniper.stoned': {
    hope: {
      title: 'Living Patchwork',
      line: 'Restoration and local livelihoods grow together.',
    },
    dark: {
      title: 'Evergreen Dream',
      line: 'Pretty pledges hide runoff and neglected habitat.',
    },
  },
  'juniper.tripping_balls': {
    hope: {
      title: 'Doors in the Roots',
      line: 'Magical crossings, verified and protected for every neighbor.',
    },
    dark: {
      title: 'Mirror Grove',
      line: 'Private gatekeepers strand people between forests.',
    },
  },
  'kit.sober': {
    hope: {
      title: 'Workshop Charter',
      line: 'A fair-paid public arts workshop keeps the real history.',
    },
    dark: {
      title: 'Museum Without Makers',
      line: 'The plaques survive; the artists lose their housing.',
    },
  },
  'kit.tipsy': {
    hope: {
      title: 'Carnival of Makers',
      line: 'Kinetic performance grows into a lasting local institution.',
    },
    dark: {
      title: 'Sponsored Spectacle',
      line: 'A corporation buys the party’s identity.',
    },
  },
  'kit.stoned': {
    hope: {
      title: 'Handmade City',
      line: 'Artists win cooperative housing and space to build.',
    },
    dark: {
      title: 'Creative Exodus',
      line: 'Their art is repackaged as luxury branding.',
    },
  },
  'kit.tripping_balls': {
    hope: {
      title: 'Machine of Belonging',
      line: 'Impossible kinetic art shows the choices without rewriting history.',
    },
    dark: {
      title: 'Perfect Replica',
      line: 'A counterfeit Humboldt crowds out the living one.',
    },
  },
  'mara.sober': {
    hope: {
      title: 'Lines That Last',
      line: 'An independent studio with paid apprentices thrives.',
    },
    dark: {
      title: 'Fine-Print Ink',
      line: 'A predatory lease and a client leak break the trust.',
    },
  },
  'mara.tipsy': {
    hope: {
      title: 'Open Studio',
      line: 'An arts gathering makes lasting, fairly credited work.',
    },
    dark: {
      title: 'Stolen Flash',
      line: 'Promoters profit from Mara’s uncredited designs.',
    },
  },
  'mara.stoned': {
    hope: {
      title: 'Room to Grow',
      line: 'A cooperative studio network keeps the rents livable.',
    },
    dark: {
      title: 'Souvenir Humboldt',
      line: 'Investors turn local art into merchandise and push the artists out.',
    },
  },
  'mara.tripping_balls': {
    hope: {
      title: 'Original Line',
      line: 'An uncanny plagiarism trail ends in restored authorship.',
    },
    dark: {
      title: 'Erased Signature',
      line: 'A prediction machine claims her work as its own.',
    },
  },
  'cedar.sober': {
    hope: {
      title: 'Watershed Network',
      line: 'Co-owned fiber, creek sensor crews and safe forest trades.',
    },
    dark: {
      title: 'Private Backbone',
      line: 'Distant owners control the broadband and the forest data.',
    },
  },
  'cedar.tipsy': {
    hope: {
      title: 'Toast to Tomorrow',
      line: 'An enforceable coalition of rural trades and technology.',
    },
    dark: {
      title: 'Salesman’s Promise',
      line: 'Flashy developers promise jobs, then leave.',
    },
  },
  'cedar.stoned': {
    hope: {
      title: 'Redwood Cloud',
      line: 'An energy-aware computing co-op funds remote work and forest care.',
    },
    dark: {
      title: 'Server Clearing',
      line: 'Power-hungry servers drink the county while the jobs vanish.',
    },
  },
  'cedar.tripping_balls': {
    hope: {
      title: 'Signal from Home',
      line: 'Corroborated signals from the future build accountable technology.',
    },
    dark: {
      title: 'Perfect Prediction Trap',
      line: 'A false prophecy hands one owner every piece of county infrastructure.',
    },
  },
  'alone.sober': {
    hope: {
      title: 'The Witness',
      line: 'Your notebook becomes the county’s most trusted record.',
    },
    dark: {
      title: 'The Unread Report',
      line: 'You saw everything, wrote it all down, and told no one in time.',
    },
  },
  'alone.tipsy': {
    hope: {
      title: 'Everybody’s Cousin',
      line: 'You belong to a hundred small crews, and they show up for each other.',
    },
    dark: {
      title: 'Last Call',
      line: 'The party moves on without you, and so does the county.',
    },
  },
  'alone.stoned': {
    hope: {
      title: 'The Long Listen',
      line: 'You learn the forest’s rhythm and teach it to anyone who asks.',
    },
    dark: {
      title: 'Background Noise',
      line: 'The rhythm fades under the hum of a county that stopped listening.',
    },
  },
  'alone.tripping_balls': {
    hope: {
      title: 'Your Own Door',
      line: 'You walk between futures alone and come back with directions for everyone.',
    },
    dark: {
      title: 'Lost in the Fog',
      line: 'You found every door and forgot which one was home.',
    },
  },
}

export const FUTURES: Record<LeadId, Record<Fate, string[]>> = {
  mara: {
    hope: [
      'Ten years on, Mara’s studio on the Plaza has three paid apprentices and a waiting list, and the six-winged bird is hers again, credited on every wall it appears on. Whatever kept finishing her work was a future that wanted her to stop waiting for permission. She stopped.',
      'You still have the bird on your arm. Mara touches it up every spring, and every spring it has exactly the wings she gave it.',
    ],
    dark: [
      'Ten years on, the six-winged bird is everywhere: souvenir mugs, rental-car ads, a hotel lobby downtown. Mara’s name is on none of it. Her studio closed when the lease changed hands; she tattoos out of her kitchen now, and she has stopped drawing birds.',
      'What you saw in the fog was a warning. Nobody wrote it down in time.',
    ],
  },
  kit: {
    hope: [
      'Ten years on, the workshop Kit dreamed up in a borrowed garage is a cooperative with a building of its own, fair wages, and a waiting list of kids who want to learn to weld, juggle and fall safely. The ticking gear hangs over the door. It still ticks. Nobody minds.',
      'Every Memorial Day she drags you into a sculpture. Every year you say yes.',
    ],
    dark: [
      'Ten years on, the parade belongs to a sponsor. The sculptures are built by contractors, the costumes arrive in branded crates, and the artists who invented all of it can’t afford to live within a day’s pedal of the Plaza.',
      'Kit performs in Portland now. Her postcards always have a little gear drawn in the corner.',
    ],
  },
  juniper: {
    hope: [
      'Ten years on, Juniper’s redwoods are protected and open: restored creeks, working woods and trails marked with green ribbons that never fray. The jobs are real and so are the salmon. Juniper is still there, mostly. Some mornings her reflection has leaves.',
      'You learned to hear the forest repeat itself. These days it is mostly saying thank you.',
    ],
    dark: [
      'Ten years on, the forest is fenced: a preserve with a gift shop and a gate code, beautiful and empty, managed from somewhere with no fog. The people who lived at its edge are gone, and so is Juniper.',
      'Sometimes, on the trail, you hear a rhythm under the wind, slowing down.',
    ],
  },
  cedar: {
    hope: [
      'Ten years on, the signal Cedar chased turned out to be the county talking to itself from a little further down the road, and the county listened. Co-owned fiber runs up the ridges, sensor crews watch the creeks, and the jobs stayed local. There is no bullet train. There is a very good bus.',
      'His folks still argue about the same old tree over Sunday dinner, holding hands under the table. Cedar keeps the CB on in the kitchen, just in case.',
    ],
    dark: [
      'Ten years on, the backbone of the county belongs to someone who has never seen it. The towers on the ridge report to a company in another state, the forests are data, and the promised jobs went somewhere sunnier. The voice on the CB went quiet the day the deal was signed.',
      'Cedar’s folks are still together, still feeding anybody who shows up hungry. Cedar fixes what he can. It is less every year.',
    ],
  },
  alone: {
    hope: [
      'Ten years on, you are the one people call when the fog starts acting strange. You never needed a guide; you needed to see for yourself, and you did, and then you told everyone. The county’s future came out of a hundred small decisions, and you were there for a lot of them.',
    ],
    dark: [
      'Ten years on, you still have the notebook. Everything you saw is in it: the signals, the doors, the futures. You meant to show someone. The county decided without you, the way counties do, and the future you saw in the fog is just the weather now.',
    ],
  },
}

export const LENS_CODAS: Partial<Record<LensId, string>> = {
  sober: 'You saw all of it clearly. That was the point.',
  tipsy: 'You remember it as one long, loud, loving crowd.',
  stoned: 'It never quite stopped sounding like the forest.',
  tripping_balls:
    'The colors never fully left. After a while you stopped wanting them to.',
}
