import type {
  Choice,
  CompanionId,
  EncounterCard,
  EventId,
  EndingLine,
  Fate,
  LensId,
  SceneKind,
} from './content'

// The route spine: which event you go to, who you meet there, the voluntary offer,
// and the fixed story beats each route walks through between the daily white-rabbit forks.
// Silas, 2026-10-20 PT: area first, then the offer, then the companion (or nobody);
// the Kinetic route conscripts you into the race. Recorded in conductor weird-humboldt t-032.
// Silas, 2026-10-20 PT later: a third, contemplative opening (the marsh, the zoo) that can lead to a
// companion another way or straight onto the solo path, with an animal-first Wild Way ending line.

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
  /** Quiet route only: animal-first choices needed for the Wild Way's paradise when you finish alone. */
  wildTarget?: number
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
    lenses: ['sober', 'stoned', 'tripping_balls', 'meth'],
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
      'Pedal-powered sculptures race from the Arcata Plaza over road, the Manila dunes, Humboldt Bay and the Eel River to Ferndale. Where Cedar and Mara are, a drink or a clear head, a seat in the race, and a rainbow shrimp, a dragon, a shark and a raft of sea otters to race against.',
    pick: 'You stay on the Plaza. The race starts at noon tomorrow, and the sculptures are already rolling in, with costumes and people who trained all year to be ridiculous.',
    scene: 'plaza',
    art: 'chapters/the-impossible-festival',
    companions: ['cedar', 'mara'],
    lenses: ['sober', 'tipsy', 'cocaine', 'mdma'],
    days: ['Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'],
    futureTarget: 7,
    provenance:
      'The Kinetic Grand Championship is real: a three-day race of human-powered art sculptures from Arcata to Ferndale over Memorial Day weekend, over road, the Manila dunes and Dead Man’s Drop, Humboldt Bay, Table Bluff and the Eel River. The pre-race party, teams, sculptures, injury and anomalies are invented.',
  },
  {
    id: 'quiet',
    name: 'The Quiet Way',
    kind: 'No festival at all: the marsh, the zoo, or a trail nobody else knows',
    blurb:
      'Skip both flyers for a contemplative day on your own. The marsh may lead to Juniper and the zoo to Kit, or you can keep the whole county to yourself. Choose the animals often enough and finish alone, and the Wild Way opens.',
    pick: 'You leave both flyers on the pole and walk the other way, toward the water and the birds.',
    scene: 'marsh',
    art: 'encounters/arcata-marsh',
    companions: ['juniper', 'kit'],
    lenses: ['sober', 'stoned', 'tripping_balls'],
    days: ['Saturday', 'Sunday', 'Monday'],
    futureTarget: 5,
    wildTarget: 4,
    provenance:
      'The Arcata Marsh and Wildlife Sanctuary, the Sequoia Park Zoo, Elk Prairie and the Mad River are real places. Past zoo animals appear only as memory, performance or vision. Everyone you meet is invented.',
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
    'Or chase neither. The marsh is a ten-minute walk, the zoo opens at ten, and nobody is expecting you anywhere.',
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
      {
        id: 'long-watch',
        label: 'The Long Watch: a voluntary adult stimulant choice',
        lens: 'meth',
        check: { skill: 'lore', target: 9 },
        success: {
          text: "The festival is still awake at dawn. By the repair tent, a radio operator hears three versions of tomorrow's weather and writes them in separate columns. You ask another listener to verify the third. The first good answer is to share the night watch, not own it.",
          effects: {
            evidence: 'Three independently compared dawn weather broadcasts',
            flag: 'night_watch_shared',
          },
        },
        failure: {
          text: 'Every sound seems worth following until the sky turns gray. You let a rested volunteer take over the radio, accept breakfast and keep only the frequency you can verify. The mystery will still be here after sleep.',
          effects: { weird: 1, flag: 'night_watch_relief' },
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
    lensLines: {
      meth: 'The volunteer radio operator changes shifts as you reach the clearing. Juniper and Kit are both watching the handoff, not making judgments about how you began the night.',
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
      meth: 'The loop has not slept, but several people responsible for the trail have. You write down the repetitions and ask a rested hiker to verify one before making a claim.',
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
      meth: 'You recognize the exhausted radio volunteer across the fire. Her replacement is listening to the signal now; sharing the watch made the warning more reliable.',
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
    id: 'QW-1',
    kind: 'spine',
    event: 'quiet',
    day: 1,
    chapter: 1,
    place: 'Arcata, early',
    title: 'A Day to Yourself',
    scene: 'marsh',
    art: 'encounters/arcata-marsh',
    body: [
      'The Plaza is filling up with costumes and pedal-powered beasts, and somewhere out by the forest a fair is warming up, and you do not want any of it. You want quiet.',
      'Humboldt has plenty. The marsh is a ten-minute walk. The zoo opens at ten. And behind the community forest there is a deer trail that, as far as you know, nobody else has ever found.',
    ],
    choices: [
      {
        id: 'marsh',
        label: 'Walk out to the Arcata Marsh',
        prospect: 'juniper',
        wild: true,
        success: {
          text: 'Egrets lift off the ponds as you pass, unbothered. On the far boardwalk a young woman with a green ribbon in her hair is talking to a heron, and the heron appears to be answering.',
          effects: { weird: 1 },
        },
      },
      {
        id: 'zoo',
        label: 'Visit the Sequoia Park Zoo',
        prospect: 'kit',
        wild: true,
        success: {
          text: 'You walk the Redwood Sky Walk through the canopy, then stop by the entrance where the prairie dogs used to pop up. A woman in patched coveralls is standing there too, very still, juggling nothing at all.',
          effects: { flag: 'zoo_morning' },
        },
      },
      {
        id: 'trail',
        label: 'Take the deer trail nobody else knows',
        wild: true,
        cost: 'Nobody to meet today, and that is the point',
        success: {
          text: 'The trail leaves the last house behind in a hundred steps. A doe watches you go by, then follows at a polite distance for a mile, as if seeing you off.',
          effects: { nerve: 1 },
        },
      },
    ],
    provenance:
      'The Arcata Marsh and Wildlife Sanctuary and the Sequoia Park Zoo, with its Redwood Sky Walk, are real. The prairie dogs are a memory, not current residents. The deer trail is invented.',
  },
  {
    id: 'QW-2',
    kind: 'spine',
    event: 'quiet',
    day: 1,
    chapter: 1,
    place: 'A bench above the water',
    title: 'The Bench by the Water',
    scene: 'marsh',
    variantBy: 'prospect',
    body: [
      'The trail ends at a bench above a slough with the whole bay in view. Someone has left a thermos of coffee there with a note: FOR WHOEVER NEEDS IT. Beside it sits a tidy little tin of the serious brownies with its own note: ONLY IF YOU MEANT TO COME HERE.',
      'There is also, in your pocket, the joint a neighbor gave you last week. Nobody is watching. That is the point.',
    ],
    variants: {
      juniper: [
        'The young woman with the ribbon sits at the far end of a boardwalk bench and offers you the lid of her thermos without a word. In her other hand there is a joint, and on the bench between you a small labeled tin of the serious brownies.',
        '“Nobody has to,” she says. “The marsh is plenty either way.”',
      ],
      kit: [
        'The woman in coveralls notices you noticing her and laughs at herself. “I come here when I miss something,” she says, and holds out half a sandwich, then a joint, then, more carefully, a little labeled tin of the serious brownies.',
        '“Nobody has to. I just don’t like eating alone.”',
      ],
    },
    choices: [
      {
        id: 'sober',
        label: 'Sober: coffee and binoculars',
        lens: 'sober',
        check: { skill: 'wits', target: 7 },
        success: {
          text: 'Through the binoculars a heron stands on one leg in exactly the spot it occupies in the photo on the interpretive sign. Exactly. You write that down.',
          effects: {
            evidence: 'A heron standing in the sign photo’s exact spot',
          },
        },
        failure: {
          text: 'You count ducks for an hour and lose count twice. It is the best hour of your month.',
          effects: { nerve: 1 },
        },
      },
      {
        id: 'stoned',
        label: 'Stoned: a quiet smoke and the long view',
        lens: 'stoned',
        check: { skill: 'psyche', target: 9 },
        success: {
          text: 'The tide comes in with a sound like breathing, and for a while you breathe with it. Under the water something enormous and patient turns over in its sleep.',
          effects: { evidence: 'The bay breathing in its sleep', weird: 1 },
        },
        failure: {
          text: 'You lose an hour to a single cloud. The cloud seemed to enjoy it.',
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
          text: 'The birds begin to speak in a language you almost know. By sunset you can make out one word, repeated by every heron on the marsh: stay.',
          effects: {
            evidence: 'Every heron saying the same word',
            weird: 1,
            flag: 'heron_word',
          },
        },
        failure: {
          text: 'The reeds lean in to tell you something and you giggle at the wrong moment. They take it well. The colors stay with you anyway.',
          effects: { weird: 1, nerve: -1 },
        },
      },
    ],
    provenance:
      'A voluntary adult choice in a quiet place. No dosages, sources or real products.',
  },
  {
    id: 'QW-3',
    kind: 'spine',
    event: 'quiet',
    day: 1,
    chapter: 1,
    place: 'The marsh or the zoo',
    title: 'Someone Worth Following',
    scene: 'marsh',
    variantBy: 'prospect',
    body: [
      'Someone else came here for the quiet, and noticed the same strange things you did.',
    ],
    variants: {
      juniper: [
        'The woman with the ribbon says her name is Juniper and that the marsh is new, which is a strange thing to say about a place full of birds. “People built it out of a dump,” she says. “I like things that started as a dump.”',
        'Tomorrow she is walking north to see what else is repeating. “You can come. Or you can keep your quiet. Both are good answers.”',
      ],
      kit: [
        '“Kit,” she says. “When I was a kid I used to race the otter along his fence. Snerfy. He always won.” She points at a fence that isn’t there anymore. “I miss the ones who aren’t here.”',
        '“My troupe is doing a thing for them. Come with me till then, or don’t. You look like somebody who needs a quiet day, and I respect that.”',
      ],
    },
    choices: MEET_CHOICES,
    provenance:
      'Invented characters. Snerfy is a remembered zoo otter, not a current resident.',
  },
  {
    id: 'QW-4',
    kind: 'spine',
    event: 'quiet',
    day: 2,
    chapter: 4,
    place: 'Elk Prairie, Prairie Creek Redwoods',
    title: 'The Elk Meadow',
    scene: 'grove',
    body: [
      'An hour north, where the redwoods open onto a long green prairie, a herd of Roosevelt elk grazes in the mist. There are signs everywhere telling you to keep your distance, and you do.',
      'The bull lifts his head and looks at you for a long time. Then the whole herd, all at once, turns to face the same direction: not toward you, but toward the coast, as if they are waiting for something to come up the road.',
    ],
    lensLines: {
      sober:
        'You time it: the herd turned at 9:41 exactly, every head at once, with no sound you could hear.',
      tipsy:
        'Somebody’s cousin is at the visitor center telling elk stories, and every one of them is true.',
      stoned:
        'The prairie is breathing the same slow breath as the bay was. The elk are breathing it too.',
      tripping_balls:
        'The elk are not looking at the road. They are looking at a year, and you can almost see it too: green, and crowded with animals.',
    },
    leadLines: {
      juniper:
        'Juniper sits down in the wet grass, very still. “They know something,” she whispers. “They always know first.”',
      kit: 'Kit is watching the elk with her hands in her pockets, for once not juggling anything.',
      cedar:
        'Cedar’s handheld radio hisses. “Herd’s turned west,” says the calm voice, as if it were a weather report.',
      mara: 'Mara is sketching the bull’s antlers, fast. On her page they branch into a seventh tine that isn’t there.',
    },
    aloneLine: 'Nobody here knows your name. The elk don’t need it.',
    choices: [
      {
        id: 'wait',
        label: 'Sit at a respectful distance and wait with the herd',
        wild: true,
        cost: 'It takes the whole day',
        success: {
          text: 'Near sunset a single fox trots up the road the elk were watching, carrying something in its mouth, and the herd goes back to grazing as if a question has been answered. You will never know what. You don’t mind.',
          effects: { nerve: 1, goodwill: 1 },
        },
      },
      {
        id: 'ranger',
        label: 'Find the ranger and ask what the herd is waiting for',
        check: { skill: 'lore', target: 9 },
        success: {
          text: 'The ranger has noticed too. She keeps a whole notebook of the days the herd turns west, and she lets you copy the last page.',
          effects: {
            evidence: 'A ranger’s log of the days the herd turns west',
          },
        },
        failure: {
          text: 'The ranger is very busy and very polite. You get a pamphlet and a reminder about the distance rules.',
          effects: {},
        },
      },
      {
        id: 'road',
        label: 'Follow their gaze down to the coast road',
        check: { skill: 'psyche', target: 9 },
        success: {
          text: 'On the road there is nothing, except a line of elk tracks that stops in the middle of the asphalt, as if the elk who made it stepped into another year.',
          effects: {
            evidence: 'Elk tracks that stop in the middle of the road',
            weird: 1,
          },
        },
        failure: {
          text: 'You walk the road for an hour and find an excellent sandwich shop, which is its own kind of answer.',
          effects: {},
        },
      },
    ],
    provenance:
      'Elk Prairie in Prairie Creek Redwoods State Park is real, and so are its Roosevelt elk and its keep-your-distance rules. The herd’s timing, the ranger and her notebook are invented.',
  },
  {
    id: 'QW-5',
    kind: 'spine',
    event: 'quiet',
    day: 3,
    chapter: 4,
    place: 'Up the Mad River',
    title: 'The Long Quiet',
    scene: 'grove',
    body: [
      'On the last morning you drive up the Mad River until the road turns to gravel and the gravel to a footpath. There is a cabin up here, empty, with a for-sale sign so old the phone number has five digits.',
      'From the porch you can see an osprey nest, a gravel bar where the salmon used to run thick, and a hillside replanted in rows of young redwoods. Somebody started something here and didn’t finish it. The quiet is waiting to see whether you will.',
    ],
    lensLines: {
      sober:
        'The redwood rows are exactly six feet apart, planted by someone who measured. The newest ones are not more than ten years old.',
      tipsy:
        'You raise your thermos to the osprey. It does not raise anything back, but it does stay.',
      stoned:
        'The river is saying the same thing over and over, patiently, the way rivers do.',
      tripping_balls:
        'For a moment the hillside is a forest a hundred years old, and the gravel bar is silver with salmon, and then it is now again. Both are true.',
    },
    leadLines: {
      juniper:
        'Juniper puts her palm flat on the porch rail. “Somebody loved this place,” she says. “It’s still deciding whether to forgive them for leaving.”',
      kit: 'Kit wanders down to the gravel bar and starts stacking stones into a little sculpture that the river immediately improves.',
      cedar:
        'Cedar reads the for-sale sign twice. “That number’s been disconnected since before I was born,” he says. “Try it anyway.”',
      mara: 'Mara sits on the steps drawing the osprey. For once the drawing has exactly as many wings as the bird.',
    },
    aloneLine:
      'It is the quietest place you have ever been, and you came here on your own. You could stay.',
    choices: [
      {
        id: 'restore',
        label:
          'Spend the day hauling brush out of the creek so the salmon can come back',
        wild: true,
        check: { skill: 'burly', target: 9 },
        success: {
          text: 'By dark the creek runs clear past the gravel bar, and in the last light a single salmon noses up into it, the first in years, or the first you have ever seen. You decide to keep doing this.',
          effects: { goodwill: 1, flag: 'creek_restored' },
        },
        failure: {
          text: 'The brush wins today. But you cleared enough that the creek sounds different, and you know you will be back.',
          effects: { flag: 'creek_started' },
        },
      },
      {
        id: 'call',
        label: 'Call the five-digit number on the sign',
        check: { skill: 'lore', target: 9 },
        success: {
          text: 'The number connects, impossibly, to the person who planted the redwoods forty years ago. She tells you what she meant to do with the place. It is a long call.',
          effects: { evidence: 'The plan for the cabin on the Mad River' },
        },
        failure: {
          text: 'The number rings and rings, somewhere in another decade.',
          effects: { weird: 1 },
        },
      },
      {
        id: 'porch',
        label: 'Just sit on the porch until it gets dark',
        success: {
          text: 'You sit. The osprey comes and goes. It is perfect, and at the end of it you have decided nothing at all.',
          effects: { nerve: 1 },
        },
      },
    ],
    provenance:
      'The Mad River is real. The cabin, the replanted hillside, the five-digit number and the person who planted the trees are invented.',
  },
  {
    id: 'KN-1',
    kind: 'spine',
    event: 'kinetic',
    day: 1,
    chapter: 1,
    place: 'Arcata Plaza, the night before the race',
    title: 'The Night Before on the Plaza',
    scene: 'plaza',
    art: 'chapters/arcata-after-hours',
    body: [
      'The race starts at the noon whistle tomorrow, but the sculptures are already parked around the Plaza to be admired. A twenty-foot Rainbow Shrimp dyed every color a salon can mix. Fogbreather, a green dragon that exhales real fog. The Loan Shark, a great white in a pinstripe suit. And the Snerfmobile, a raft of pedal-powered sea otters holding paws so they don’t drift apart. Every one of them has to cross road, sand dunes and open water under human power.',
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
      'The race really starts at noon on the Arcata Plaza and really crosses road, the Manila dunes, Humboldt Bay and the Eel River. The sculptures, teams, mechanic, artist and early race report are invented.',
  },
  {
    id: 'KN-2',
    kind: 'spine',
    event: 'kinetic',
    day: 1,
    chapter: 3,
    place: 'A warehouse at the edge of Arcata',
    title: 'The Pre-Race Party',
    scene: 'theater',
    variantBy: 'prospect',
    body: [
      'The night before the race, the racers party like people who will be pedaling a shrimp across Humboldt Bay on Sunday. An old warehouse at the edge of town has a brass band, a costume contest the Rainbow Shrimp’s crew are obviously going to win, a keg, and in the back corners a few people offering the kind of party favors that keep you dancing until sunrise.',
    ],
    variants: {
      cedar: [
        'The night before the race, the racers party like people who will be pedaling a shrimp across Humboldt Bay on Sunday. An old warehouse at the edge of town has a brass band, a costume contest the Rainbow Shrimp’s crew are obviously going to win, a keg, and in the back corners a few people offering the kind of party favors that keep you dancing until sunrise.',
        'The mechanic from pit row is out in the lot with his tailgate down, a cooler of beer and the CB on low. “Help yourself,” he says. “Or don’t. I’m on the clock with this radio.”',
      ],
      mara: [
        'The night before the race, the racers party like people who will be pedaling a shrimp across Humboldt Bay on Sunday. An old warehouse at the edge of town has a brass band, a costume contest the Rainbow Shrimp’s crew are obviously going to win, a keg, and in the back corners a few people offering the kind of party favors that keep you dancing until sunrise.',
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
          text: 'You are adopted by the Snerfmobile’s crew, handed an otter hood and a tambourine, and promoted to unreliable witness.',
          effects: { goodwill: 1, nerve: -1 },
        },
      },
      {
        id: 'fast-track',
        label: 'The Fast Track: an adult, voluntary stimulant choice',
        lens: 'cocaine',
        check: { skill: 'wits', target: 9 },
        success: {
          text: 'The brass band seems to have raced ahead of itself. You slow down long enough to notice the second set of shadow players at the loading door. A sober stagehand corroborates what you saw. Being quick did not make it true; checking did.',
          effects: {
            evidence: 'A stagehand witnessed the second shadow band',
            flag: 'fast_track_checked',
          },
        },
        failure: {
          text: 'The party becomes a blur of brilliant half-formed plans. At the curb you find a race marshal who helps you locate a quiet place to sit. You keep the curious note, not the certainty that it explains everything.',
          effects: { weird: 1, flag: 'fast_track_unverified' },
        },
      },
      {
        id: 'loves-all',
        label: 'Everybody Loves Everybody: a voluntary adult choice',
        lens: 'mdma',
        check: { skill: 'rizz', target: 9 },
        success: {
          text: 'For one evening the costume crews feel like a single team. You ask who has agreed to help tomorrow. Three people volunteer for an actual repair shift, and one writes the plan down. The promise, not the feeling, is what you can take with you.',
          effects: { goodwill: 1, flag: 'crew_promise_written' },
        },
        failure: {
          text: 'You are certain everyone understands each other until a mechanic points out that nobody has discussed safety. You apologize, share water and listen. Affection is real; the practical agreement still needs making.',
          effects: { weird: 1, flag: 'crew_promise_pending' },
        },
      },
    ],
    provenance:
      'The pre-race party and its warehouse are invented. A voluntary adult choice; no dosages, sources or real products.',
  },
  {
    id: 'KN-3',
    kind: 'spine',
    event: 'kinetic',
    day: 1,
    chapter: 3,
    place: 'The pre-race party',
    title: 'Someone Worth Following',
    scene: 'theater',
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
        'The tattoo artist turns your arm toward the light. The bird she painted this afternoon has grown a seventh wing, in her style, in her ink. “I didn’t draw that,” says Mara, very calmly. “Somebody keeps finishing my work before I do.”',
        '“I’m going to find out who,” she says. “I could use someone who writes things down.”',
      ],
    },
    lensLines: {
      cocaine:
        "The party's accelerated noise fades enough for the person you approached to ask a practical question: which strange event can another witness confirm?",
      mdma: 'The feeling of being welcomed is vivid; the person you meet wants to know what you will still help fix tomorrow.',
    },
    choices: MEET_CHOICES,
    provenance: 'Invented characters.',
  },
  {
    id: 'KN-4',
    kind: 'spine',
    event: 'kinetic',
    day: 2,
    chapter: 1,
    place: 'Arcata Plaza, an hour before the noon whistle',
    title: 'Conscripted',
    scene: 'plaza',
    body: [
      'The Banana Slug Express, a twelve-foot yellow slug on bicycle wheels, is missing its pilot. Dot sprained her ankle on last night’s dance floor and is sitting on a cooler with a bag of frozen peas, pointing a crutch at you. “You,” she says. “You’ve got legs. The whistle blows at noon.”',
      'The crew captain hands you a helmet with antennae on it. Ahead are the road out of town, the Manila dunes, Humboldt Bay and the Eel River. A sculpture keeps racing as long as somebody keeps it moving, and somebody, apparently, is you.',
    ],
    lensLines: {
      cocaine:
        'Every team shouts at once and the starting whistle seems late. A marshal points out the actual order: helmet, brakes, shared signal, then go.',
      mdma: 'You recognize people from the warehouse and greet them warmly. Dot still needs a competent pilot and a crew who can hear a clear safety instruction.',
    },
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
          text: 'You find the rhythm on the second block. The slug surges off the Plaza at the whistle and the crowd starts chanting a name, which turns out to be the slug’s.',
          effects: { nerve: 1, flag: 'slug_pilot' },
        },
        failure: {
          text: 'You steer the slug into the Loan Shark at the start line, in front of a cheering crowd. The shark’s crew bills you for the damages in play money. The judges award points for style.',
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
      'The noon start on the Arcata Plaza is real. The Banana Slug Express, Dot and her ankle are invented.',
  },
  {
    id: 'KN-5',
    kind: 'spine',
    event: 'kinetic',
    day: 3,
    chapter: 3,
    place: 'Humboldt Bay, from the Eureka waterfront',
    title: 'The Bay Crossing',
    scene: 'bay',
    body: [
      'Sunday’s water entry is at a boat ramp on the Eureka waterfront when the tide turns, and the whole waterfront comes to watch. The sculptures go down the ramp one at a time. The slug floats, which is the first miracle. The second is that it moves: a yellow lump paddle-wheeling across Humboldt Bay between the Snerfmobile, its otters rafted paw to paw, and Fogbreather, steaming. Spectator boats honk. Real seals take a professional interest in the fake otters.',
      'Halfway across, the fog comes down and the other sculptures go quiet. In the gray a bell buoy is ringing. Somewhere in the slug’s hull, something has started, very gently, to gurgle.',
    ],
    lensLines: {
      sober:
        'You count the rings. They come exactly four seconds apart, which is not a thing buoys do.',
      tipsy:
        'Somebody on the octopus is singing a sea shanty, and the fog is singing the harmony.',
      stoned:
        'The water is full of slow green light, like the bay is thinking.',
      tripping_balls:
        'The fog parts like a stage curtain, and for a moment the far shore is a Eureka with a glass tower and a train across the water.',
      cocaine:
        'The bay crossing compresses to a series of urgent calls. You ask a second skipper to repeat the buoy reading before acting.',
      mdma: 'The boats look for a moment like one delighted flotilla; their skippers still have to agree where the safe channel is.',
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
          text: 'You come out of the fog in third place with your legs on fire, just behind the Rainbow Shrimp, to a roar from the dock. Behind you the fog closes like a door.',
          effects: { nerve: 1, goodwill: 1 },
        },
        failure: {
          text: 'The gurgle becomes a glug. Two hundred yards from shore, after a year of somebody’s welding and a weekend of your legs, the Banana Slug Express sinks: slowly, nose first, with enormous dignity. You and the crew bob in the bay in your life jackets while the whole waterfront cheers like you won. The Snerfmobile circles back, its otters holding out their paws, and tows you all ashore in a soggy conga line. Nobody who was in that water will ever be a stranger to you again.',
          effects: { goodwill: 2, flag: 'slug_sank' },
        },
      },
      {
        id: 'current',
        label: 'Read the tide and ride the current',
        check: { skill: 'lore', target: 7 },
        success: {
          text: 'You know this bay. You ride the ebb along the channel edge and arrive early enough to help haul the Snerfmobile up the ramp, otter by otter.',
          effects: { goodwill: 1, flag: 'helped_snerfmobile' },
        },
        failure: {
          text: 'The current knows this bay better than you do. It sets the slug down on a mudflat, where it settles, sighs and fills up like a bathtub. You spend the next hour knee-deep in mud, shoving a sunken slug toward a crowd that is filming everything, while a harbor seal watches without blinking. By the time the tide floats you off you are all wearing the same mud and laughing at the same jokes.',
          effects: { goodwill: 2, weird: 1, flag: 'slug_sank' },
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
          text: 'You chase the bell into the fog, and the slug follows the bell straight down. One moment the deck is wet, the next the bay is up to your chest and the bell is ringing underwater. You come up sputtering beside the crew, missing an hour nobody can account for, and swim the slug’s antennae ashore like a trophy. On the dock the Loan Shark’s crew hands you a towel and an invoice.',
          effects: { weird: 2, goodwill: 1, flag: 'slug_sank' },
        },
      },
    ],
    provenance:
      'Sculptures really do enter Humboldt Bay from the Eureka waterfront on the race’s second day, and some really do sink. The buoy, the fog and the gurgle are invented.',
  },
  {
    id: 'KN-6',
    kind: 'spine',
    event: 'kinetic',
    day: 4,
    chapter: 5,
    place: 'The Eel River and Ferndale',
    title: 'The Ferndale Finish',
    scene: 'rivermouth',
    art: 'chapters/southern-humboldt-older-roads',
    body: [
      'Day three starts at Crab Park, at the mouth of the Eel River. The sculptures go into the water one last time and paddle up the river to Fernbridge, then roll down the road into Ferndale: Victorian gingerbread houses and a Main Street full of cheering people. The finish line is in sight.',
      'On the hill above town the old cemetery is very quiet. Someone in a black frock coat stands among the headstones, waving a racing flag. And just behind you, the Snerfmobile has lost a wheel in the river, and its otters are rafted up in the shallows, waving.',
    ],
    flagLines: {
      slug_sank: {
        all: 'Main Street has heard about the bay. When the slug rolls in, still sloshing, the crowd starts chanting “SUNK! SUNK! SUNK!” with enormous affection.',
      },
    },
    lensLines: {
      sober:
        'The man in the frock coat has no reflection in the bakery window. You check twice.',
      tipsy:
        'Main Street is one long cheer, and every Victorian house seems to be cheering too.',
      stoned:
        'The gingerbread trim on the houses is moving very slowly, like ferns.',
      tripping_balls:
        'The headstones on the hill are lined up like a crowd at a finish line. They are all wearing tiny party hats.',
      cocaine:
        'The finish line is crowded with quick solutions. You choose to listen to the volunteer who actually witnessed the strange clock.',
      mdma: "There are embraces at the finish and more promises than places to write them. A crew chief starts taking names for tomorrow's repairs.",
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
        id: 'otters',
        label: 'Go back and help the Snerfmobile out of the river',
        cost: 'You finish last',
        success: {
          text: 'You lose the race and find the otters’ wheel in the reeds. Their captain swears you a lifelong debt, which in Humboldt means a standing invitation to dinner, and the whole crew floats on their backs in the shallows to applaud you, otter style.',
          effects: { goodwill: 2, flag: 'saved_snerfmobile' },
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
      'The race’s last day really starts at Crab Park, crosses the mouth of the Eel River up to Fernbridge and finishes in Ferndale, whose Victorian Main Street and hillside cemetery are real. The man in the frock coat and everyone else buried in this card are invented.',
  },
  {
    id: 'KN-7',
    kind: 'spine',
    event: 'kinetic',
    day: 2,
    chapter: 2,
    place: 'The Manila dunes, Dead Man’s Drop',
    title: 'Dead Man’s Drop',
    scene: 'dunes',
    body: [
      'The road out of Arcata is the easy part: flat pavement, cheering porches, the Rainbow Shrimp shedding glitter at every pedal stroke. Then the course leaves the road for the Manila dunes, and the slug’s wheels sink to the hubs in sand.',
      'The crews push, drag and swear their sculptures up to the top of Dead Man’s Drop, a sand slope so steep the crowd sits along it like bleachers. Fogbreather goes over first, roaring fog. The Snerfmobile follows, its otters sliding the whole way down on their backs. The Loan Shark noses in and buries itself to the dorsal fin.',
    ],
    lensLines: {
      sober:
        'From the top you can see the whole course: the Samoa Bridge, Eureka, the bay you cross tomorrow, and a second, fainter bridge beside the first that is gone when you blink.',
      tipsy:
        'The crowd on the dune is doing the wave. The dune is doing it too, a little.',
      cocaine:
        'The dune makes every second feel expensive, but Cedar or the closest race mechanic asks you to test the rope before anybody moves.',
      mdma: 'Every crew is cheering for the others. A borrowed belay rope still needs knots that someone can inspect.',
    },
    leadLines: {
      cedar:
        'Cedar walks the drop before you ride it, kicking at the sand. “Lean back,” he says. “Way back. Further than that.”',
      mara: 'Mara is already sketching the Loan Shark, fin-deep in the sand. “I’m calling it Lunch,” she says.',
      kit: 'Kit takes one look at the drop and whoops. “This is the best part. This is the only part.”',
      juniper:
        'Juniper pats the dune like a large, patient animal. “It doesn’t mind,” she says. “Go on.”',
    },
    aloneLine:
      'Dot shouts up from the bottom of the drop, frozen peas held aloft like a torch: “Don’t brake! Braking is how you die!”',
    choices: [
      {
        id: 'ride',
        label: 'Point the slug straight down the drop',
        check: { skill: 'burly', target: 9 },
        success: {
          text: 'The slug goes over the lip and down in one long yellow scream. You hit the bottom upright, to a roar, and the dune crowd votes it the cleanest run of the day.',
          effects: { nerve: 1, goodwill: 1 },
        },
        failure: {
          text: 'Halfway down the slug turns sideways, then over, then over again, and arrives at the bottom as a sand-crusted yellow burrito with you inside it. The crowd gives it a standing ovation. It is the best thing they have seen all year.',
          effects: { goodwill: 1, nerve: -1, flag: 'slug_rolled' },
        },
      },
      {
        id: 'rope',
        label: 'Lower the slug down on ropes, the safe way',
        check: { skill: 'wits', target: 7 },
        success: {
          text: 'You rig a belay from a fence post and the crew lowers the slug like a piano. It takes forever and nothing breaks. Halfway down you find a brass plaque in the sand stamped with the race’s name and a year that hasn’t happened.',
          effects: {
            evidence: 'A race plaque from a year that hasn’t happened',
          },
        },
        failure: {
          text: 'The rope holds. The fence post does not. The slug, the post and two of the crew arrive at the bottom together, laughing.',
          effects: { nerve: -1 },
        },
      },
      {
        id: 'shark',
        label: 'Stop and help dig out the Loan Shark',
        cost: 'You lose your place',
        success: {
          text: 'You dig the Loan Shark out of the dune with your hands and a borrowed frisbee. Its crew forgives a debt you did not know you had, and pays you in play money they swear is good in Eureka tonight.',
          effects: { goodwill: 2, flag: 'helped_shark' },
        },
      },
    ],
    provenance:
      'The road out of Arcata, the Manila dunes and Dead Man’s Drop are real parts of the race’s first day, which ends over the Samoa Bridge in Eureka. The sculptures, the plaque and the crowd’s votes are invented.',
  },
  {
    id: 'KN-8',
    kind: 'spine',
    event: 'kinetic',
    day: 3,
    chapter: 4,
    place: 'Table Bluff, on the road south',
    title: 'Melvin’s Mile',
    scene: 'highway',
    body: [
      'After a lunch stop in Eureka the course heads south on the bay trail toward the Eel River Valley, and then it climbs Table Bluff, a long, cruel grade the racers call Melvin’s Mile. Fogbreather is being pushed by its own crew. The Rainbow Shrimp has stopped glittering and started sweating.',
      'At the top the whole valley is laid out green and gold, and the road drops down the other side so steeply that a hand-painted sign on the shoulder just says PRAY.',
    ],
    flagLines: {
      slug_sank: {
        all: 'The crew hauled the Banana Slug Express out at the boat ramp, tipped it upside down, bailed it with buckets and put it back on the road. It still sloshes on the turns.',
        cedar:
          'Cedar is still wringing bay water out of his radio. “Thirty years I’ve listened to boats go down on that channel,” he says. “Never figured I’d be one of the voices.” He laughs until he has to sit on the guardrail. You sit with him.',
        mara: 'Mara has drawn the sinking on her forearm in grease pencil: the slug going under, the two of you bobbing beside it. “I’m never washing this off,” she says. “Neither are you. It’s on you too, somewhere.”',
        kit: 'Kit has told the story of the sinking four times since lunch, and in every version you saved her life. “You did,” she insists. “Emotionally.”',
        juniper:
          'Juniper hasn’t stopped smiling since the bay. “The water held us,” she says. “It wanted to know us.” You are both still damp, and it is the closest you have felt to anyone all year.',
        alone:
          'The crew has started calling you Captain Glug. Dot had shirts printed at the lunch stop. You are wearing one.',
      },
    },
    lensLines: {
      cocaine:
        'You stop racing the future for long enough to check the grade and share your measurements with the tired riders.',
      mdma: 'People call encouragement from the hill. You see who needs an actual push, a safe rest, or an honest warning.',
    },
    choices: [
      {
        id: 'climb',
        label: 'Stand on the pedals and take the hill',
        check: { skill: 'burly', target: 9 },
        success: {
          text: 'You stand on the pedals the whole mile and crest Table Bluff ahead of the dragon. Its crew salutes you with a puff of fog.',
          effects: { nerve: 1 },
        },
        failure: {
          text: 'Halfway up, your legs file a formal complaint. The crew gets out and pushes, singing, and nobody pretends this is anything but a group effort.',
          effects: { goodwill: 1, nerve: -1 },
        },
      },
      {
        id: 'brakes',
        label: 'Take the descent on the brakes, as the sign suggests',
        check: { skill: 'wits', target: 7 },
        success: {
          text: 'You feather the brakes all the way down and arrive with the slug intact and a smell of hot rubber. In the ditch at the bottom is a mile marker for a road that doesn’t exist yet.',
          effects: {
            evidence: 'A mile marker for a road that doesn’t exist yet',
          },
        },
        failure: {
          text: 'The brakes give up a third of the way down. The slug takes the rest of the hill at a speed it was never designed for, and you finish in a ditch full of cow parsnip, whooping.',
          effects: { nerve: -1 },
        },
      },
      {
        id: 'shrimp',
        label: 'Help push the Rainbow Shrimp up the hill',
        cost: 'Your slug waits',
        success: {
          text: 'The Rainbow Shrimp’s crew are hairstylists, it turns out, every one of them dyed to match their sculpture. At the top they give you a streak of electric blue as a thank-you, right there on the bluff, and it is honestly a great look.',
          effects: { goodwill: 2, flag: 'shrimp_streak' },
        },
      },
    ],
    provenance:
      'Table Bluff and its long climb, known to racers as Melvin’s Mile, are real parts of the course toward the Eel River Valley, where the second day ends at Crab Park. The crews, the sign and the mile marker are invented.',
  },
]

export type RouteStep =
  /** ifProspect: skipped when the opening led you to nobody (straight onto the solo path). */
  | { kind: 'beat'; id: string; day: number; ifProspect?: boolean }
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
      title: 'Friday: Arcata or a backroads detour',
      pools: [1, 4],
      scene: 'plaza',
    },
    { kind: 'beat', id: 'GR-4', day: 2 },
    {
      kind: 'fork',
      day: 2,
      title: 'Saturday: the coast or the southern roads',
      pools: [2, 5],
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
  quiet: [
    { kind: 'beat', id: 'QW-1', day: 1 },
    { kind: 'beat', id: 'QW-2', day: 1 },
    { kind: 'beat', id: 'QW-3', day: 1, ifProspect: true },
    {
      kind: 'fork',
      day: 1,
      title: 'Saturday: close to home or far into the hills',
      pools: [1, 4],
      scene: 'marsh',
    },
    { kind: 'beat', id: 'QW-4', day: 2 },
    {
      kind: 'fork',
      day: 2,
      title: 'Sunday: the coast or the Eel River Valley',
      pools: [2, 5],
      scene: 'beach',
    },
    { kind: 'crossroads', day: 2 },
    {
      kind: 'fork',
      day: 3,
      title: 'Monday in Eureka',
      pools: [3],
      scene: 'bay',
    },
    { kind: 'beat', id: 'QW-5', day: 3 },
    { kind: 'finale', day: 3 },
  ],
  // The real course (Silas, 2026-10-20 PT: "over road, over dunes, and across water"): the noon
  // whistle on the Plaza, road and Dead Man's Drop to Eureka on Saturday, the bay and Table Bluff on
  // Sunday, the Eel River to Ferndale on Monday. The party is the night before.
  kinetic: [
    { kind: 'beat', id: 'KN-1', day: 1 },
    { kind: 'beat', id: 'KN-2', day: 1 },
    { kind: 'beat', id: 'KN-3', day: 1 },
    { kind: 'beat', id: 'KN-4', day: 2 },
    { kind: 'beat', id: 'KN-7', day: 2 },
    {
      kind: 'fork',
      day: 2,
      title: 'Saturday: Eureka or the impossible race',
      pools: [3, 6],
      scene: 'bay',
    },
    { kind: 'beat', id: 'KN-5', day: 3 },
    { kind: 'beat', id: 'KN-8', day: 3 },
    { kind: 'beat', id: 'KN-6', day: 4 },
    { kind: 'crossroads', day: 5 },
    {
      kind: 'fork',
      day: 5,
      title: 'Tuesday: the coast or Southern Humboldt',
      pools: [2, 5],
      scene: 'beach',
    },
    {
      kind: 'fork',
      day: 6,
      title: 'Back in Arcata or beyond the old highway',
      pools: [1, 4],
      scene: 'plaza',
    },
    { kind: 'finale', day: 6 },
  ],
}

export const FORK_PROMPT =
  'Which white rabbit do you chase? Each card is a different corner of the county; the others will still be out there, changed, another time.'

// Endings: the Humboldt of your future. The lead you finish with (or nobody), the lens you
// opened with, and whether your stats at the end of the journey earn the hopeful future.
// Signature titles for the companions come from conductor projects/weird-humboldt/ECOTONE-32-ENDINGS.md.

export type Signature = { title: string; line: string }

export const SIGNATURES: Record<string, Record<Fate, Signature>> = {
  'ecotopia.sober': {
    hope: {
      title: 'The Census of Everything',
      line: 'Your counts become the baseline the whole county restores toward.',
    },
    dark: {
      title: 'Field Notes for No One',
      line: 'Every bird is in your notebook, and the notebook stays on your shelf.',
    },
  },
  'ecotopia.tipsy': {
    hope: {
      title: 'The Long Toast',
      line: 'Every town meeting about the river ends with a raised glass and a vote for the fish.',
    },
    dark: {
      title: 'The Bar Stool Naturalist',
      line: 'You tell the best elk stories in the county, to the same three people, every night.',
    },
  },
  'ecotopia.stoned': {
    hope: {
      title: 'The Slow Green Country',
      line: 'The county learns to move at the speed of the marsh, and it grows.',
    },
    dark: {
      title: 'Smoke Over the Water',
      line: 'You watched the tide breathe for thirty years and never once breathed out.',
    },
  },
  'ecotopia.tripping_balls': {
    hope: {
      title: 'The Animals’ Parliament',
      line: 'The herons said stay, and the county stayed, and so did the animals.',
    },
    dark: {
      title: 'The Door Left Open',
      line: 'You saw the green future clearly, and left it for someone else to walk through.',
    },
  },
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

export const FUTURES: Record<EndingLine, Record<Fate, string[]>> = {
  ecotopia: {
    hope: [
      'Thirty years on, Humboldt is where other places send their people to learn how it was done: the marsh twice its size, elk grazing on the old mill sites, salmon back in creeks that had forgotten them, and towns that grew up around the animals instead of over them.',
      'Nobody remembers it starting with one person who kept choosing the animals, again and again, when nobody was watching. You remember. The herons do too.',
    ],
    dark: [
      'You never quite chose. You loved the herons and the elk and the fog, and you kept loving them from a little distance. Things didn’t get worse, exactly. They just never got better.',
      'You retire to a cabin up the Mad River with a woodstove, a good pair of binoculars and a notebook of every bird that ever came to your feeder. Some mornings the elk come down to the meadow and you wave. It is a small, kind, quiet life, and the county went on deciding without you.',
    ],
  },
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
