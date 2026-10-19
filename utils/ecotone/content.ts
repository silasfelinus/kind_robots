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
  | 'marsh'
  | 'rivermouth'

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
  leadLines?: Partial<Record<CompanionId, string>>
  presence?: {
    companion: CompanionId
    lead: string
    met: string
    unmet: string
  }
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
    bio: 'An Arcata-raised Hmong American physical-theatre performer. Her grandparents came from Laos after the war and settled in Minnesota, where she was born; her parents brought the family west when she was small. Makes spectacle out of a broken bike, a ladder and a bad idea.',
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

  {
    id: 'WH-122',
    chapter: 1,
    place: 'Arcata Marsh',
    title: 'The Marsh That Eats Its Words',
    scene: 'marsh',
    art: 'encounters/arcata-marsh',
    body: [
      'The Arcata Marsh is a wildlife sanctuary built out of the town’s own wastewater: ponds, reeds and a thousand birds doing the last of the cleaning. Tonight it is digesting something else. The festival’s radio static has drifted down the hill, and the marsh is breaking it down like everything else.',
      'A birder in a rain shell lowers her binoculars. “The blackbirds are singing yesterday’s weather,” she says. “On time, for once.” A heron stands in the shallows looking like it has been asked to testify.',
    ],
    lensLines: {
      sober: 'Every bird call arrives a second after its beak opens.',
      tipsy: 'The ducks are definitely gossiping about you.',
      stoned:
        'You can hear the water cleaning itself, and it sounds like applause.',
      tripping_balls:
        'The ponds are a circuit board and the herons are the solder.',
    },
    leadLines: {
      cedar:
        'Cedar crouches by an outflow pipe, grinning. “It’s a sewage plant that grew feathers. That’s the future, right there.”',
      juniper:
        'Juniper watches the egrets. “People built this to clean up after themselves, and the birds moved in anyway. Don’t tell them it’s infrastructure.”',
      mara: 'Mara photographs the ripples on the pond. “Same pattern as my sketch,” she says quietly.',
      kit: 'Kit is already balancing on the boardwalk rail. “Best stage in Arcata. Free admission, terrible acoustics.”',
    },
    choices: [
      {
        id: 'count-birds',
        label: 'Count the birds against the birder’s tally',
        check: { skill: 'wits', target: 9 },
        success: {
          text: 'The numbers match yesterday’s count exactly, bird for bird, down to the heron.',
          effects: { evidence: 'A bird count from yesterday', weird: 1 },
        },
        failure: {
          text: 'You lose count at the forty-third mallard. The birder gently takes over.',
          effects: { nerve: -1 },
        },
      },
      {
        id: 'record-static',
        label: 'Help the birder record the static',
        check: { skill: 'rizz', target: 7 },
        success: {
          text: 'She lets you hold the parabolic microphone. On playback, the static has words in it: somebody reading out a vote count.',
          effects: {
            evidence: 'A vote count recorded in the static',
            flag: 'marsh_recording',
          },
        },
        failure: {
          text: 'Your elbow knocks the microphone into a pond. The heron gives you a look you will remember for the rest of the weekend.',
          effects: { flag: 'heron_grudge' },
        },
      },
      {
        id: 'let-it-work',
        label: 'Sit on the boardwalk and let the marsh work',
        success: {
          text: 'The static thins out and goes quiet. Given time, it turns out, the marsh can digest almost anything.',
          effects: { nerve: 1, flag: 'marsh_patience' },
        },
      },
    ],
    provenance:
      'The Arcata Marsh and Wildlife Sanctuary is real: a wetland that helps treat the city’s wastewater and draws birders from everywhere. The static, the birder and the heron’s testimony are invented.',
  },
  {
    id: 'WH-123',
    chapter: 1,
    place: 'Fickle Hill Road, above Arcata',
    title: 'Bad Reception',
    scene: 'highway',
    art: 'encounters/fickle-hill',
    body: [
      'Fickle Hill Road climbs out of Arcata into second-growth redwoods and a fog so thick it has opinions. An old pickup idles on the shoulder with its dome light on and its CB turned all the way up. Nobody is in it.',
      'For the first time all night, the signal is perfectly clear. A calm voice is reading the morning road conditions for a county where the road ahead of you has been paved with something that glows. Then it says your name.',
    ],
    lensLines: {
      sober: 'You check the dial. It’s tuned between stations.',
      tipsy: 'You want to call in a request.',
      stoned: 'The fog is moving in time with the voice.',
      tripping_balls: 'The voice sounds a lot like you, ten years older.',
    },
    leadLines: {
      cedar:
        'Cedar goes very still. “That’s my truck’s sister,” he says. “Same year, same ribbon. I’d know her anywhere.”',
      mara: 'Mara writes down the time to the second. “Nobody gets to tell me I imagined this.”',
      juniper:
        'Juniper puts a hand on a redwood like she’s checking its pulse. “The trees can hear it too. They don’t like it.”',
      kit: 'Kit honks the truck’s horn in the rhythm of the broadcast. The broadcast honks back.',
    },
    choices: [
      {
        id: 'answer',
        label: 'Answer the broadcast on the CB',
        check: { skill: 'rizz', target: 9 },
        success: {
          text: 'The voice pauses, then thanks you, and gives you one true piece of tomorrow’s news.',
          effects: {
            evidence: 'A clear broadcast from tomorrow',
            weird: 1,
            flag: 'answered_the_ridge',
          },
        },
        failure: {
          text: 'You key the mic and the whole county hears you sneeze.',
          effects: { nerve: -1, flag: 'ridge_sneeze' },
        },
      },
      {
        id: 'find-driver',
        label: 'Find out who left the truck running',
        check: { skill: 'wits', target: 9 },
        success: {
          text: 'Fresh boot prints lead into the trees and stop at a stump with a thermos on it, still warm.',
          effects: { evidence: 'A warm thermos on a stump' },
        },
        failure: {
          text: 'You find the thermos but not the prints. The fog closes in behind you, politely.',
          effects: { weird: 1 },
        },
      },
      {
        id: 'drive-down',
        label: 'Switch off the truck and walk back down, slow',
        check: { skill: 'burly', target: 7 },
        success: {
          text: 'You make it down the hill in one piece. The voice keeps reading conditions until the very last switchback.',
          effects: { nerve: 1 },
        },
        failure: {
          text: 'The fog won’t let you leave until the broadcast ends. You hear all of it.',
          effects: { nerve: -1, weird: 1, flag: 'heard_it_all' },
        },
      },
    ],
    provenance:
      'Fickle Hill Road is a real ridge road above Arcata. The truck, the broadcast and the voice are invented.',
  },
  {
    id: 'WH-121',
    chapter: 2,
    place: 'Mad River mouth',
    title: 'The Latitude Argument',
    scene: 'rivermouth',
    art: 'encounters/wh-121-latitude-argument',
    body: [
      'At the mouth of the Mad River the fog has a seam in it, and through the seam comes an argument from 1849. A ragged party of explorers stands at the water’s edge, starving and soaked. One of them, a bearded man with a brass sextant, refuses to cross until he has measured the latitude. The others would like to cross, eat, and never hear the word latitude again.',
      'They notice you at the same moment. “You,” says the man with the sextant. “Settle this.”',
    ],
    lensLines: {
      sober:
        'Their footprints fill with water a beat before they lift their boots.',
      tipsy: 'You have strong feelings about latitude, suddenly.',
      stoned: 'Their argument has exactly the rhythm of the surf.',
      tripping_balls:
        'You can see the river’s new name forming in the air above them, letter by letter.',
    },
    leadLines: {
      mara: 'Mara is on the sextant man’s side. “Write it down,” she tells him. “Somebody has to.”',
      kit: 'Kit is trying very hard not to laugh, and failing beautifully.',
      cedar:
        'Cedar sides with the crew. “Buddy, the river ain’t going anywhere.”',
      juniper:
        'Juniper says, to nobody in particular, that the river had names long before this argument, and none of these men asked.',
    },
    choices: [
      {
        id: 'reading',
        label: 'Help him take the reading',
        check: { skill: 'wits', target: 9 },
        success: {
          text: 'You hold the horizon steady and he gets his latitude. It is precise, and a little wrong for this Humboldt, and exactly right for another one.',
          effects: { evidence: 'A latitude from another county', weird: 1 },
        },
        failure: {
          text: 'The fog takes the horizon. He blames you, at length, with footnotes.',
          effects: { nerve: -1 },
        },
      },
      {
        id: 'cross',
        label: 'Help the crew across',
        check: { skill: 'burly', target: 7 },
        success: {
          text: 'Everyone gets across dry. Behind you, right on schedule, the shouting starts.',
          effects: { goodwill: 1, flag: 'mad_river_ferried' },
        },
        failure: {
          text: 'You are now as wet as they are, and twice as cross.',
          effects: { nerve: -1 },
        },
      },
      {
        id: 'peace',
        label: 'Try to make peace',
        check: { skill: 'rizz', target: 11 },
        success: {
          text: 'Thirty seconds of calm. Then it starts again, because the river’s name was never yours to change.',
          effects: { goodwill: 1, flag: 'mad_river_peace' },
        },
        failure: {
          text: 'You are now part of the argument. Historians will not mention you.',
          effects: { flag: 'mad_river_argued' },
        },
      },
    ],
    provenance:
      'The river was named in December 1849 after an argument recorded by L. K. Wood, the Gregg party’s only chronicler; historians treat his account with care. The river had other names first. The fog seam is invented.',
  },
  {
    id: 'WH-124',
    chapter: 3,
    place: 'Sequoia Park, Eureka',
    title: 'The Friends Who Aren’t Here',
    scene: 'grove',
    art: 'encounters/friends-who-arent-here',
    body: [
      'After the zoo closes, a lantern-lit clearing in Sequoia Park fills with a small, delighted crowd. Physical-theatre performers from Blue Lake have come to play the animals who aren’t here anymore: Bill the chimp, pacing and blowing raspberries; Snerfy the river otter, racing a kid along a fence that isn’t there; and a crowd of prairie dogs popping up from behind hay bales at exactly the wrong moments.',
      'Nobody sanctioned this. Everybody came anyway.',
    ],
    presence: {
      companion: 'kit',
      lead: 'Kit squeezes your arm. “I put this together,” she whispers. “Because of Snerfy. I’ll tell you after.”',
      met: 'Kit spots you from the clearing and waves with an otter paw. She organized all of this.',
      unmet:
        'A performer in patched coveralls is directing everything with a juggling club. Someone calls her Kit.',
    },
    lensLines: {
      sober:
        'The masks are brilliant, and you can see every seam. You love them anyway.',
      tipsy:
        'You know they’re actors, mostly. “Bill” blows a raspberry square in your face and you laugh too hard to care.',
      stoned:
        'The actors keep slipping away. For long moments it is just an otter and a kid, running.',
      tripping_balls:
        'You don’t see actors. You see Bill, Snerfy and the prairie dogs, alive in the dark. Later, when the masks come off, you may not believe it.',
    },
    choices: [
      {
        id: 'sit-with-bill',
        label: 'Sit with “Bill” a while',
        success: {
          text: 'He paces, blows you a raspberry, then sits down beside you and is very still for a long time. When the scene ends, the actor hands you a finger painting “he” made. It shows a Humboldt that hasn’t happened yet.',
          effects: {
            evidence: 'Bill’s finger painting of a future county',
            flag: 'sat_with_bill',
          },
        },
      },
      {
        id: 'run-with-snerfy',
        label: 'Run the fence with “Snerfy”',
        check: { skill: 'burly', target: 7 },
        success: {
          text: 'You race the otter the length of the clearing, stop at the end, both of you delighted, then race back. Afterwards Kit tells you about a little girl, an old otter pen, and the best friend she ever had who couldn’t talk.',
          effects: { goodwill: 1, flag: 'ran_with_snerfy' },
        },
        failure: {
          text: 'You trip over a prairie dog, who is outraged in a very small voice.',
          effects: { nerve: -1 },
        },
      },
      {
        id: 'hecklers',
        label: 'Shoo off the hecklers',
        check: { skill: 'rizz', target: 7 },
        success: {
          text: 'Two teenagers rattling the fence decide to join in instead. One of them turns out to be a very good prairie dog.',
          effects: { goodwill: 1 },
        },
        failure: {
          text: '“Bill” handles it himself, with a very convincing prop and excellent aim.',
          effects: { weird: 1, flag: 'bill_handled_it' },
        },
      },
    ],
    provenance:
      'Sequoia Park Zoo is real. Bill, a chimpanzee retired from the circus, lived there from 1957 until he died in 2007; Snerfy and the prairie dogs are remembered by people who grew up visiting. The troupe and the performance are invented, and the animals appear only as actors.',
  },
  {
    id: 'WH-125',
    chapter: 3,
    place: 'Bayshore Mall, Eureka',
    title: 'Anchor Stores',
    scene: 'plaza',
    art: 'encounters/anchor-stores',
    body: [
      'The once-great Bayshore Mall closes at nine. At one minute past, the skylights go dark, the fountain stops, and three of the shuttered anchor stores light up from the inside.',
      'Behind one gate is a forest town with solar roofs and a farmers market in the rain. Behind another, a gleaming warehouse where nobody looks up. Behind the third, a food court in the fog, chairs stacked, one pretzel still turning under a heat lamp. A security guard on a scooter glides past and doesn’t look at any of them. “Not my department,” she says.',
    ],
    lensLines: {
      sober:
        'The gates reflect the mall behind you, except that in the reflection the mall is full.',
      tipsy: 'You want to go shopping in all three.',
      stoned: 'Each gate hums a different chord.',
      tripping_balls: 'The stores are breathing.',
    },
    leadLines: {
      cedar:
        'Cedar presses his face to the first gate. “That’s fiber on those poles. Somebody did it right.”',
      juniper:
        'Juniper won’t go near the warehouse. “Nothing grows in there,” she says. “Not even mold.”',
      mara: 'Mara counts the gates, then counts them again. “There were four anchors. Where’s the fourth?”',
      kit: 'Kit wants to put on a show in the food court. “Somebody should. Look how sad that pretzel is.”',
    },
    choices: [
      {
        id: 'first-gate',
        label: 'Step through the first gate',
        check: { skill: 'psyche', target: 9 },
        success: {
          text: 'You walk the forest town for one minute that feels like a year. A kid hands you a flyer for a co-op meeting dated 2036.',
          effects: {
            evidence: 'A flyer from 2036',
            weird: 1,
            flag: 'saw_hope_future',
          },
        },
        failure: {
          text: 'The gate lets you look but not enter. Your nose leaves a print on a future.',
          effects: { weird: 1 },
        },
      },
      {
        id: 'ask-guard',
        label: 'Ask the guard what’s behind the warehouse gate',
        check: { skill: 'rizz', target: 9 },
        success: {
          text: 'She sighs. “Twelve-hour shifts and a lot of robots. My nephew works there. In some of them.”',
          effects: {
            evidence: 'The guard’s nephew in the warehouse future',
            flag: 'saw_dark_future',
          },
        },
        failure: {
          text: '“Mall’s closed, hon.” She escorts you to the exit with enormous politeness.',
          effects: { nerve: -1 },
        },
      },
      {
        id: 'fourth-anchor',
        label: 'Find the fourth anchor',
        check: { skill: 'wits', target: 11 },
        success: {
          text: 'The fourth gate is dark because nobody has decided what goes there yet. It’s waiting on the county. It’s waiting on you.',
          effects: {
            evidence: 'An empty fourth future',
            flag: 'fourth_anchor',
          },
        },
        failure: {
          text: 'You find a gate with a sign that says SPACE AVAILABLE. You decide not to think about it.',
          effects: { weird: 1 },
        },
      },
    ],
    provenance:
      'The Bayshore Mall is real and has lost several of its anchor stores over the years. The futures behind the gates are invented; no current tenant or owner is part of the story.',
  },
  {
    id: 'WH-126',
    chapter: 3,
    place: 'Behind the Bayshore Mall',
    title: 'Behind the Mall',
    scene: 'bay',
    art: 'encounters/behind-the-mall',
    body: [
      'Behind the mall, down by the slough, there’s a stretch of concrete locals call the Devil’s Playground: wall after wall of graffiti, tall reeds and water the color of dusk. A Cal Poly film crew is shooting a horror short here tonight. Their monster is a student in a rubber suit with a very good jaw.',
      'A man named Ray, who knows this wall better than anyone, is giving the crew advice about the light. He’s right about the light. The problem is the second monster. It wasn’t in the script, it isn’t on the crew, and it keeps getting better takes than the actors.',
    ],
    lensLines: {
      sober: 'The second monster leaves wet footprints. The first one doesn’t.',
      tipsy: 'You are fairly sure you could direct this better.',
      stoned:
        'The graffiti is moving very slowly, like a time-lapse of itself.',
      tripping_balls: 'Both monsters look at you at the same time.',
    },
    leadLines: {
      kit: 'Kit is already giving the second monster notes on its posture. It seems to appreciate them.',
      mara: 'Mara studies one of the murals. “Good linework,” she says. “Whoever did this could work in my shop.”',
      cedar:
        'Cedar offers the crew his truck battery for the lights. “Don’t tell my mom I was down here.”',
      juniper:
        'Juniper sits with her feet in the reeds, unbothered, like she’s seen the second monster before.',
    },
    choices: [
      {
        id: 'ask-ray',
        label: 'Ask Ray where the second monster comes from',
        check: { skill: 'rizz', target: 7 },
        success: {
          text: '“It comes out of the reeds when somebody’s filming,” Ray says. “Shy, I think. Wants to be seen.” He would know.',
          effects: {
            goodwill: 1,
            evidence: 'Ray’s account of the reed monster',
          },
        },
        failure: {
          text: 'Ray isn’t in the mood to be anybody’s local color tonight, and says so. Fair enough.',
          effects: { nerve: -1 },
        },
      },
      {
        id: 'footage',
        label: 'Review the footage',
        check: { skill: 'wits', target: 9 },
        success: {
          text: 'In every take, the second monster mouths a single word at the camera. You are almost sure it’s “vote.”',
          effects: { evidence: 'The monster’s word on film', weird: 1 },
        },
        failure: {
          text: 'The footage is blank except for a beautifully lit shot of your thumb.',
          effects: { flag: 'thumb_cameo' },
        },
      },
      {
        id: 'costar',
        label: 'Step into the scene and play along',
        check: { skill: 'psyche', target: 9 },
        success: {
          text: 'You and the second monster share one perfect take. It nods to you and wades back into the reeds. The director is weeping.',
          effects: { goodwill: 1, flag: 'monster_costar' },
        },
        failure: {
          text: 'The second monster upstages you completely. The director keeps your scream.',
          effects: { weird: 1 },
        },
      },
    ],
    provenance:
      'The graffiti spot behind the Bayshore Mall is real, and locals call it the Devil’s Playground. The film crew, Ray and the second monster are invented.',
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
  'encounters/arcata-marsh',
  'encounters/fickle-hill',
  'encounters/wh-121-latitude-argument',
  'encounters/anchor-stores',
  'encounters/behind-the-mall',
]

export function artUrl(asset?: string): string | null {
  if (!asset || !ECOTONE_ART.includes(asset)) return null
  return `${ECOTONE_ART_ROOT}${asset}.webp`
}
