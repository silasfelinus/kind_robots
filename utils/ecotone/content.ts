export type SkillId = 'rizz' | 'burly' | 'wits' | 'lore' | 'psyche'
export type LensId =
  'sober' | 'tipsy' | 'stoned' | 'tripping_balls' | 'cocaine' | 'meth' | 'mdma'
export type CompanionId = 'mara' | 'kit' | 'juniper' | 'cedar'
export type Fate = 'hope' | 'dark'
export type SceneKind =
  | 'meadow'
  | 'theater'
  | 'beach'
  | 'bay'
  | 'plaza'
  | 'highway'
  | 'grove'
  | 'dunes'

export type Skills = Record<SkillId, number>

export type Effects = {
  nerve?: number
  goodwill?: number
  weird?: number
  evidence?: string
  flag?: string
}

export type Check = { skill: SkillId; target: number }

export type Outcome = { text: string; effects: Effects }

export type Choice = {
  id: string
  label: string
  check?: Check
  cost?: string
  success: Outcome
  failure?: Outcome
}

export type EncounterCard = {
  id: string
  chapter: number
  place: string
  title: string
  scene: SceneKind
  art?: string
  body: string[]
  lensLines?: Partial<Record<LensId, string>>
  choices: Choice[]
  provenance: string
}

export const SKILLS: { id: SkillId; label: string; blurb: string }[] = [
  { id: 'rizz', label: 'Rizz', blurb: 'Charm, connection, improvisation' },
  { id: 'burly', label: 'Burly', blurb: 'Physical resolve, rowing, stamina' },
  { id: 'wits', label: 'Wits', blurb: 'Reason, observation, machines' },
  { id: 'lore', label: 'Local Lore', blurb: 'History, places, connections' },
  { id: 'psyche', label: 'Psyche', blurb: 'Uncanny patterns, odd frequencies' },
]

export type Archetype = {
  id: string
  name: string
  vantage: string
  perk: string
  skills: Skills
}

export const ARCHETYPES: Archetype[] = [
  {
    id: 'reporter',
    name: 'North Coast Reporter',
    vantage:
      'Writes for an independent weekly. Lives for the quote, bad at hearing no.',
    perk: 'Ask one extra sourcing question before a choice, once per chapter.',
    skills: { rizz: 2, burly: 0, wits: 2, lore: 1, psyche: 1 },
  },
  {
    id: 'student',
    name: 'Cal Poly Student',
    vantage: 'Smart, sleep-deprived, unsure what to believe.',
    perk: 'Reframe one failure as a partial success with your study notes.',
    skills: { rizz: 1, burly: 0, wits: 3, lore: 1, psyche: 1 },
  },
  {
    id: 'rower',
    name: 'Bay Rower',
    vantage: 'Knows currents, crews and cold water. Volunteers first.',
    perk: 'Shrug off one travel penalty per chapter.',
    skills: { rizz: 1, burly: 3, wits: 1, lore: 1, psyche: 0 },
  },
  {
    id: 'local',
    name: 'Lifelong Local',
    vantage: 'Family everywhere, and contradictory memories of town.',
    perk: 'Recognize a local connection on one card per chapter.',
    skills: { rizz: 1, burly: 1, wits: 0, lore: 3, psyche: 1 },
  },
  {
    id: 'mechanic',
    name: 'Kinetic Sculpture Mechanic',
    vantage: 'Fixes broken things and unreliable teams. Leaves no contraption.',
    perk: 'Improvise a mechanical workaround at a material cost.',
    skills: { rizz: 1, burly: 2, wits: 2, lore: 1, psyche: 0 },
  },
  {
    id: 'gardener',
    name: 'Backwoods Gardener',
    vantage: 'Knows cultivation, land-use fights and survival. Wary of badges.',
    perk: 'Spot practical and environmental risks before they bite.',
    skills: { rizz: 0, burly: 1, wits: 1, lore: 2, psyche: 2 },
  },
  {
    id: 'dealer',
    name: 'Night-Shift Casino Dealer',
    vantage: 'Reads tells, chronically tired, used to fantastic stories.',
    perk: 'Test whether someone is bluffing, once per chapter.',
    skills: { rizz: 3, burly: 0, wits: 1, lore: 0, psyche: 2 },
  },
]

export type Companion = {
  id: CompanionId
  name: string
  role: string
  lens: LensId
  motif: string
  bio: string
  line: string
  anomaly: string
  art?: string
}

export const COMPANIONS: Companion[] = [
  {
    id: 'mara',
    name: 'Mara',
    role: 'Tattoo artist',
    lens: 'sober',
    motif: 'six-winged bird',
    bio: 'Raised on her family’s reservation, meticulous and dryly funny. A tribal small-business grant helped her open a busy studio. She skips cannabis when she works: she likes her lines where she left them.',
    line: '“I don’t need to be high to know that tree just moved.”',
    anomaly:
      'A design she has never drawn keeps turning up in other people’s hands.',
    art: 'companions/mara',
  },
  {
    id: 'kit',
    name: 'Kit',
    role: 'Kinetic sculptor and juggler',
    lens: 'tipsy',
    motif: 'juggling clubs and a gear',
    bio: 'Hmong American physical-theatre performer who came up to Humboldt for school and stayed for the kinetic-sculpture crowd. Makes spectacle out of a broken bike, a ladder and a bad idea.',
    line: '“Every machine wants to be a parade. Most of them just need permission.”',
    anomaly: 'Her newest contraption has a mechanism she never designed.',
    art: 'companions/kit',
  },
  {
    id: 'juniper',
    name: 'Juniper',
    role: 'Forest guide, possibly a nymph',
    lens: 'stoned',
    motif: 'fern and green ribbon',
    bio: 'A warm, teasing hippie in thrift-store layers who seems at home among redwoods in a way people aren’t. Her reflection has branches. Her own goals come first.',
    line: '“The woods remember you. That’s not always a compliment.”',
    anomaly: 'The forest is growing a shape it should not make.',
    art: 'companions/juniper',
  },
  {
    id: 'cedar',
    name: 'Cedar',
    role: 'Backroads mechanic',
    lens: 'tripping_balls',
    motif: 'CB radio waves',
    bio: 'A country local in his thirties with oil-stained boots and a truck full of tools. His dad is a Hispanic logger; his mom grew up in a backwoods growing family and volunteered on the ground support for the Luna tree-sit. They met across the timber divide and are still together. He jokes about cosmic forces and fixes everything else.',
    line: '“Everybody in my family remembers the same tree. None of ’em remembers the same argument.”',
    anomaly: 'His CB picks up broadcasts from a Humboldt that hasn’t happened.',
    art: 'companions/cedar',
  },
]

export type Lens = {
  id: LensId
  label: string
  short: string
  offer: string
  question: string
  clarity: number
  companion: CompanionId | null
  check?: Check
  open: boolean
}

export const LENSES: Lens[] = [
  {
    id: 'sober',
    label: 'Sober',
    short: 'Sober',
    offer: 'Water and a sandwich.',
    question: 'What is the evidence?',
    clarity: 3,
    companion: 'mara',
    check: { skill: 'wits', target: 7 },
    open: true,
  },
  {
    id: 'tipsy',
    label: 'Tipsy',
    short: 'Tipsy',
    offer: 'A social drink and the dance circle.',
    question: 'Who belongs here?',
    clarity: 2,
    companion: 'kit',
    check: { skill: 'rizz', target: 7 },
    open: true,
  },
  {
    id: 'stoned',
    label: 'Stoned',
    short: 'Stoned',
    offer: 'A voluntary smoke and a quiet place to listen.',
    question: 'What is connected to what?',
    clarity: 2,
    companion: 'juniper',
    check: { skill: 'psyche', target: 9 },
    open: true,
  },
  {
    id: 'tripping_balls',
    label: 'Tripping',
    short: 'Tripping',
    offer: 'A clearly labeled, entirely fictional enchanted brownie.',
    question: 'Is any of this already decided?',
    clarity: 1,
    companion: 'cedar',
    check: { skill: 'psyche', target: 9 },
    open: true,
  },
  {
    id: 'cocaine',
    label: 'The Fast Track',
    short: 'Fast Track',
    offer: 'Being written.',
    question: '',
    clarity: 2,
    companion: null,
    open: false,
  },
  {
    id: 'meth',
    label: 'The Signal That Never Sleeps',
    short: 'No Sleep',
    offer: 'Being written.',
    question: '',
    clarity: 1,
    companion: null,
    open: false,
  },
  {
    id: 'mdma',
    label: 'Everybody Loves Everybody',
    short: 'Loves All',
    offer: 'Being written.',
    question: '',
    clarity: 2,
    companion: null,
    open: false,
  },
]

export const PROLOGUE_OUTCOMES: Record<
  'sober' | 'tipsy' | 'stoned' | 'tripping_balls',
  { success: Outcome; failure: Outcome }
> = {
  sober: {
    success: {
      text: 'The puddle’s reflected branches sway against the wind. Not with it. Against it. You write that down.',
      effects: {
        evidence: 'Reflection moving against the wind',
        flag: 'nymph_seen_clearly',
      },
    },
    failure: {
      text: 'The young woman hands you a perfectly ordinary trail map. It has one trail on it that is not on any other map.',
      effects: { evidence: 'A map with an unmarked trail', weird: 1 },
    },
  },
  tipsy: {
    success: {
      text: 'You talk your way into the drum circle. The drum lands a split second before the drummer’s hand does. Nobody else notices. You do.',
      effects: { goodwill: 1, flag: 'drum_echo_heard' },
    },
    failure: {
      text: 'You are adopted by the drum circle, given a tambourine and promoted to unreliable witness.',
      effects: { goodwill: 1, nerve: -1 },
    },
  },
  stoned: {
    success: {
      text: 'Under the music there is a forest polyrhythm nobody composed. You could hum it back. You decide not to, yet.',
      effects: { evidence: 'An uncomposed forest rhythm', weird: 1 },
    },
    failure: {
      text: 'You lose the rhythm in the bass line. Somebody else at this festival heard it too; you will find them later.',
      effects: { weird: 1 },
    },
  },
  tripping_balls: {
    success: {
      text: 'The forest has acquired a painted moon, and the paint is still wet. Behind it, a trail. Nobody else is looking up.',
      effects: {
        evidence: 'A painted moon over the trail',
        weird: 1,
        flag: 'moon_route',
      },
    },
    failure: {
      text: 'You follow a very convincing false lead to the porta-potties. It is, at least, a memorable false lead.',
      effects: { weird: 1, nerve: -1 },
    },
  },
}

export const PROLOGUE = {
  title: 'The Woman Who Knows the Trail',
  place: 'An unnamed festival at the forest edge',
  scene: 'meadow' as SceneKind,
  art: 'scenes/prologue-meadow',
  body: [
    'The music shakes moss off a huge wooden puppet. Across the meadow a man juggles five clubs with what appear to be six hands. A handmade sign at the tree line reads THE WOODS ARE NOT RESPONSIBLE FOR WHAT YOU REMEMBER.',
    'A young woman with a green ribbon in her hair asks if you need directions to the stage, or to the path behind it. Her reflection in a puddle has branches growing from its head. She notices you noticing.',
    'You are an adult, it is your weekend, and the choice of how to meet it is yours.',
  ],
}

export const COMPANION_INTROS: Record<CompanionId, string[]> = {
  mara: [
    'Past the food trucks, an artist sits behind a table of tattoo flash, ink winding down both forearms. She is drawing a bird with six wings. You are fairly sure it had four a second ago, and you say so.',
    '“There’s a reason I don’t smoke when I’m working,” she says, tapping her pencil. Then she compares the drawing to an older page, and her humor vanishes. The extra wings are on both pages. The older sketch is dated next week.',
  ],
  kit: [
    'The dance circle opens around a pedal-powered sea serpent with a broken axle and a woman in patched coveralls juggling the parts. She catches a bolt behind her back and bows to it.',
    '“It’s got a gear I didn’t put in,” Kit tells you, tipsy-bright and dead serious. “It ticks in a rhythm I didn’t teach it. Want to help me figure out who did?”',
  ],
  juniper: [
    'The woman with the green ribbon finds you on a hay bale, listening. She sits without asking and offers half a sandwich, and the redwoods lean in like old friends eavesdropping.',
    '“You heard it too,” Juniper says. “The forest is repeating itself. It doesn’t do that.” She smiles like she knows exactly how strange she is.',
  ],
  cedar: [
    'Behind the stage a man in an oil-stained jacket is elbow-deep in a generator. A CB handset on his truck’s dash crackles, and a calm voice reads a weather report for a Humboldt that has a bullet train.',
    '“That ain’t a station,” says Cedar, wiping his hands. “I been listening to every station in this county since I was six.” He looks at you, then at the painted moon. “You seeing that too?”',
  ],
}

export const CROSSROADS: Record<CompanionId, string[]> = {
  mara: [
    'At a laundromat in Old Town a woman in a studio apron is photographing a dryer window. Inside, the clothes spin into the shape of a six-winged bird, over and over.',
    'Mara wants to know who keeps copying a design she hasn’t finished. She is going to find out, and she could use someone who writes things down.',
  ],
  kit: [
    'On F Street a pedal-powered sea serpent loses a wheel at your feet. The rider, a performer in patched coveralls, juggles the wheel back on without stopping.',
    'Kit’s machine is ticking in a rhythm she didn’t build. She is following it to the bay tonight, and she could use a hand.',
  ],
  juniper: [
    'A woman with ferns in her hair is sitting on a bench by the bay, feeding a crow that is not quite a crow. She waves like she has been expecting you for a week.',
    'Juniper is heading back into the redwoods to ask the forest a hard question. She’d like company, if the company can keep a secret.',
  ],
  cedar: [
    'A pickup with a faded green ribbon on its antenna idles at the curb, its CB turned all the way up. The voice on it is reading tomorrow’s tide tables, and they’re wrong in a very specific way.',
    'Cedar is driving out to the ridge to find the transmitter. He’s got a thermos, a toolbox and an empty passenger seat.',
  ],
}

export const ENCOUNTERS: EncounterCard[] = [
  {
    id: 'WH-006',
    chapter: 1,
    place: 'Minor Theatre, Arcata',
    title: 'The Last Houdini Exit',
    scene: 'theater',
    art: 'encounters/wh-006-last-exit',
    body: [
      'The midnight audience is gone, but applause keeps coming from beneath the stage. A trapdoor lifts one inch. A gloved hand pushes up a handwritten note: STOP CALLING ME HARRY.',
      'The voice below sounds exhausted rather than spectral. “Do you know how many amateur magicians have used this door to impress a first date? Seventy-three. None of them tipped.” Behind the voice, someone is applauding from what sounds like a century away.',
    ],
    choices: [
      {
        id: 'ask-name',
        label: 'Ask for the voice’s real name',
        check: { skill: 'rizz', target: 7 },
        success: {
          text: 'A long pause, then a name, and a story about a first date in 1931 that went very well. The voice trusts you now.',
          effects: { goodwill: 1, flag: 'minor_occupant_trusted' },
        },
        failure: {
          text: 'The voice decides you are press and shuts the trapdoor. Through the boards you still catch a last name.',
          effects: { evidence: 'A last name from under the stage' },
        },
      },
      {
        id: 'inspect-rope',
        label: 'Inspect the rope system',
        check: { skill: 'wits', target: 9 },
        success: {
          text: 'There is one pulley more than the rigging needs, and it hums at the same frequency as the radio static outside.',
          effects: { evidence: 'An impossible extra pulley', weird: 1 },
        },
        failure: {
          text: 'The curtain falls on you. The empty auditorium applauds.',
          effects: { nerve: -1, flag: 'minor_curtain_fell' },
        },
      },
      {
        id: 'offer-ride',
        label: 'Offer the unseen performer a ride home',
        cost: 'Gives up your next free detour',
        success: {
          text: 'The trapdoor opens all the way. Nobody comes out, but the passenger seat of your borrowed car is warm for the rest of the weekend. Sometimes decency is more expensive than bravery.',
          effects: { goodwill: 1, flag: 'minor_companion' },
        },
      },
    ],
    provenance:
      'The trapdoor story comes from a former owner; a Houdini performance here is disputed. The voice is invented.',
  },
  {
    id: 'WH-021',
    chapter: 2,
    place: 'Moonstone Beach',
    title: 'Bigfoot Family Picnic',
    scene: 'beach',
    art: 'encounters/wh-021-bigfoot-picnic',
    body: [
      'Three vast figures in sun hats are arguing over the proper way to pose for a family photo. The youngest holds a phone with a cracked screen. The tallest says you may leave if you promise not to call them the Sasquatches.',
      'Uncle Glenn is missing again; everyone agrees this is typical. The cooler holds sparkling water and an impossible number of deviled eggs. The tide has begun moving backward, but the family is focused on whether Glenn got the invitation.',
    ],
    lensLines: {
      sober:
        'The photo on the cracked phone shows a fourth person. Only three are standing in frame.',
      tipsy: 'It feels like an invitation to a huge family cookout.',
      stoned:
        'The surf pulses to a rhythm you have heard before, in the forest.',
      tripping_balls:
        'The picnic blanket is, unmistakably, a map of the county.',
    },
    choices: [
      {
        id: 'photographer',
        label: 'Become the family’s photographer',
        check: { skill: 'rizz', target: 7 },
        success: {
          text: 'They pose beautifully. On the screen there is a fourth family member nobody can see on the sand.',
          effects: {
            goodwill: 1,
            evidence: 'A fourth figure in the family photo',
          },
        },
        failure: {
          text: 'You mention Glenn at exactly the wrong moment. An argument erupts, and one relative decides to follow you for a while.',
          effects: { nerve: -1, flag: 'glenn_followup' },
        },
      },
      {
        id: 'backwards-tide',
        label: 'Follow the backwards tide',
        check: { skill: 'psyche', target: 9 },
        success: {
          text: 'Out where the sea should be, you find Glenn’s folded note, and a sketch of a radio tower on a ridge.',
          effects: { evidence: 'Glenn’s note and a tower sketch', weird: 1 },
        },
        failure: {
          text: 'You come back wet and two hours older than you left.',
          effects: { nerve: -1, weird: 1 },
        },
      },
      {
        id: 'eggs',
        label: 'Ask who brought the eggs',
        success: {
          text: 'You receive a recipe, a warning never to photograph the sea at dawn, and a standing invitation. The clue is not useful yet. The friendship may be.',
          effects: { goodwill: 1, flag: 'sasquatch_recipe' },
        },
      },
    ],
    provenance:
      'Moonstone Beach is real. The Sasquatch family is original comic fiction.',
  },
  {
    id: 'WH-061',
    chapter: 3,
    place: 'F Street waterfront, Eureka',
    title: 'The Perilous Plunge into Monday',
    scene: 'bay',
    art: 'encounters/wh-061-perilous-plunge',
    body: [
      'Costumed jumpers queue by Humboldt Bay. A marching band strikes up, and a volunteer in a homemade squid costume dives in. They surface holding Monday’s newspaper, three days early, and insist they have already survived this morning twice.',
      'The organizer will not suspend judging, because the squid costume is, in fairness, magnificent. A hot tub nearby has begun hissing last year’s weather forecast.',
    ],
    choices: [
      {
        id: 'pull-squid',
        label: 'Pull the squid from the bay',
        check: { skill: 'burly', target: 7 },
        success: {
          text: 'You haul them out with their memory of the future intact. The wet newspaper dissolves in your hands.',
          effects: { goodwill: 1, flag: 'plunge_saved' },
        },
        failure: {
          text: 'You get them ashore, cold and disoriented. The newspaper floats away toward Monday.',
          effects: { nerve: -1 },
        },
      },
      {
        id: 'newspaper',
        label: 'Retrieve the future newspaper',
        check: { skill: 'wits', target: 9 },
        success: {
          text: 'You document one true prediction before the ink runs. It is about the county’s vote on Tuesday.',
          effects: {
            evidence: 'A true prediction from Monday’s paper',
            weird: 1,
          },
        },
        failure: {
          text: 'You snatch a fake edition. Someone on the dock was watching you, and they printed it.',
          effects: { weird: 1, flag: 'plunge_false_story' },
        },
      },
      {
        id: 'second-judging',
        label: 'Ask the organizers to hold a second judging',
        check: { skill: 'rizz', target: 11 },
        success: {
          text: 'You win an absurdly official day-change waiver, stamped twice.',
          effects: { goodwill: 1, flag: 'festival_waiver' },
        },
        failure: {
          text: 'You gain a recurring volunteer nemesis and one very good participation ribbon.',
          effects: { flag: 'volunteer_nemesis' },
        },
      },
    ],
    provenance:
      'The fundraising plunge and the waterfront are documented. The time anomalies and people are invented.',
  },
]

export type Chapter = {
  number: number
  name: string
  mood: string
  places: string[]
  turn: string
  scene: SceneKind
  art: string
  x: number
  y: number
}

export const CHAPTERS: Chapter[] = [
  {
    number: 1,
    name: 'Arcata After Hours',
    mood: 'Endearing locals',
    places: [
      'Arcata Plaza',
      'Minor Theatre',
      'Community Forest',
      'Cal Poly Humboldt',
    ],
    turn: 'The first unambiguous impossibility',
    scene: 'plaza',
    art: 'chapters/arcata-after-hours',
    x: 47,
    y: 33,
  },
  {
    number: 2,
    name: 'Coast of Improbable Tides',
    mood: 'Wistful unease',
    places: ['Moonstone Beach', 'Trinidad', 'Luffenholtz', 'Hammond Trail'],
    turn: 'Someone remembers an earlier version of you',
    scene: 'beach',
    art: 'chapters/coast-of-improbable-tides',
    x: 40,
    y: 16,
  },
  {
    number: 3,
    name: 'Eureka and the Bay',
    mood: 'Civic absurdism',
    places: ['Old Town', 'F Street', 'Humboldt Bay', 'Sequoia Park'],
    turn: 'Evidence of a coordinated cover-up',
    scene: 'bay',
    art: 'chapters/eureka-and-the-bay',
    x: 42,
    y: 46,
  },
  {
    number: 4,
    name: 'Backroads and Bad Reception',
    mood: 'UFOs and cryptids',
    places: ['Blue Lake', 'Kneeland', 'Willow Creek', 'Highway 299'],
    turn: 'A party whose motives aren’t what they seem',
    scene: 'highway',
    art: 'chapters/backroads-and-bad-reception',
    x: 72,
    y: 30,
  },
  {
    number: 5,
    name: 'Southern Humboldt and Older Roads',
    mood: 'Rural surrealism',
    places: ['Ferndale', 'Fortuna', 'Avenue of the Giants', 'Eel River'],
    turn: 'Decide whom to protect, not just what to learn',
    scene: 'grove',
    art: 'chapters/southern-humboldt-older-roads',
    x: 56,
    y: 74,
  },
  {
    number: 6,
    name: 'The Impossible Festival',
    mood: 'Converging timelines',
    places: [
      'Plaza race start',
      'Manila dunes',
      'Bay crossing',
      'Ferndale finish',
    ],
    turn: 'A player-authored, consequence-led finale',
    scene: 'dunes',
    art: 'chapters/the-impossible-festival',
    x: 34,
    y: 40,
  },
]

export const ENDING_LENSES: LensId[] = [
  'sober',
  'tipsy',
  'stoned',
  'tripping_balls',
  'cocaine',
  'meth',
  'mdma',
]

export const ENDING_IDS: string[] = COMPANIONS.flatMap((companion) =>
  ENDING_LENSES.flatMap((lens) =>
    (['hope', 'dark'] as Fate[]).map(
      (fate) => `${companion.id}.${lens}.${fate}`,
    ),
  ),
)

export const ECOTONE_ART_ROOT = '/ecotone/'

export const ECOTONE_ART: string[] = [
  'title/key-art',
  'scenes/prologue-meadow',
  'companions/mara',
  'companions/kit',
  'companions/juniper',
  'chapters/arcata-after-hours',
  'chapters/coast-of-improbable-tides',
  'chapters/eureka-and-the-bay',
  'chapters/backroads-and-bad-reception',
  'encounters/wh-006-last-exit',
  'ui/card-back',
  'companions/cedar',
  'chapters/southern-humboldt-older-roads',
  'chapters/the-impossible-festival',
  'encounters/wh-021-bigfoot-picnic',
  'encounters/wh-061-perilous-plunge',
]

export function artUrl(asset?: string): string | null {
  if (!asset || !ECOTONE_ART.includes(asset)) return null
  return `${ECOTONE_ART_ROOT}${asset}.webp`
}
