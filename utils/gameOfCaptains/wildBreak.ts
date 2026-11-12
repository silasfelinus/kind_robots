/**
 * The Wild Break: the Couchscope's way out.
 *
 * Silas, 2026-11-12: "there needs to be a wild break possible to avoid the
 * horoscope, with at least 32 endings." At any point in the Couchscope the
 * player may refuse the screening. One four-way escape, one two-way turn and
 * one four-way finish (4 x 2 x 4) reach 32 distinct endings. Every ending is
 * its own painted plate, gives a small starting perk, writes a finale coda,
 * and launches the voyage with no constellation at all.
 *
 * Tone (Silas, 2026-10-26): absurd, but dry. Deadpan, procedural, understated.
 */

import type { VoyageRun } from './rules'

export type WildBreakMeter =
  'supplies' | 'trust' | 'reputation' | 'intervention' | 'shieldCharge'

export type WildBreakChoice = {
  label: string
  hint: string
  /** A scene id, or an ending id on the last step. */
  to: string
}

export type WildBreakScene = {
  id: string
  kicker: string
  title: string
  text: string
  choices: readonly WildBreakChoice[]
}

export type WildBreakEnding = {
  id: string
  title: string
  text: string
  /** One line the finale reads back after the voyage's main ending. */
  coda: string
  perk: { meter: WildBreakMeter; delta: 1 }
}

export type WildBreakRecord = {
  /** Choice index taken at each of the three steps. */
  path: number[]
  ending: string
}

export const WILD_BREAK_ROOT = 'walkout'
export const WILD_BREAK_STEPS = 3
export const WILD_BREAK_SHIELD_MAX = 3

export const WILD_BREAK_SCENES: readonly WildBreakScene[] = [
  {
    id: 'walkout',
    kicker: 'WILD BREAK · UNSCHEDULED DEPARTURE FROM SCREENING',
    title: 'You stand up in the middle of a question.',
    text: 'Nobody has ever stood up in the middle of a question. The Assessor, a floating filing cabinet with excellent posture, opens one drawer very slowly, which is how it frowns. The exit sign is lit. So is the window.',
    choices: [
      {
        label: 'Leave through the window',
        hint: 'The window opens onto the zodiac',
        to: 'window',
      },
      {
        label: 'Take the Couchscope with you',
        hint: 'It is heavier than it looks',
        to: 'heist',
      },
      {
        label: 'Assess the Assessor',
        hint: 'Turn the clipboard around',
        to: 'audit',
      },
      {
        label: 'Ask the constellations directly',
        hint: 'Skip the middle management',
        to: 'stars',
      },
    ],
  },
  {
    id: 'window',
    kicker: 'WILD BREAK · EXIT VIA WINDOW',
    title: 'The zodiac is parked outside.',
    text: 'Beyond the window, twelve constellations idle in a neat row like taxis waiting for a fare. Between two of them is a stretch of sky nobody has claimed. A comet is pulling away from the curb with its doors still open.',
    choices: [
      {
        label: 'Catch the departing comet',
        hint: 'Standing room only',
        to: 'comet',
      },
      {
        label: 'Hide in the unclaimed dark',
        hint: 'Zoned for future development',
        to: 'gap',
      },
    ],
  },
  {
    id: 'heist',
    kicker: 'WILD BREAK · UNAUTHORIZED REMOVAL OF EQUIPMENT',
    title: 'The Couchscope is under your arm.',
    text: 'It is a brass instrument with a velvet eyepiece and a cushion for the elbow. The alarm is very polite. It asks everyone to remain seated and to note the time, which is now.',
    choices: [
      {
        label: 'Run for the couch',
        hint: 'Pursuit is likely',
        to: 'chase',
      },
      {
        label: 'Look through the wrong end',
        hint: 'Nobody has tried this',
        to: 'reverse',
      },
    ],
  },
  {
    id: 'audit',
    kicker: 'WILD BREAK · REVERSE SCREENING',
    title: 'You pick up the clipboard.',
    text: 'The Assessor has screened four million captains. Nobody has ever screened the Assessor. It hovers a little lower. Somewhere in its bottom drawer, a very old form rustles.',
    choices: [
      {
        label: 'Ask the Assessor its sign',
        hint: 'It has never been asked',
        to: 'cabinet',
      },
      {
        label: 'Request every screening ever filed',
        hint: 'Freedom of information',
        to: 'archive',
      },
    ],
  },
  {
    id: 'stars',
    kicker: 'WILD BREAK · DIRECT APPEAL TO THE SKY',
    title: 'You address the constellations by name.',
    text: 'The constellations are, technically, the people in charge. You lean out of the screening office and shout up at them. After a while, the whole sky clicks and begins to play a short, cheerful tune.',
    choices: [
      {
        label: 'Wait for someone to answer',
        hint: 'Your call is important to them',
        to: 'hold',
      },
      {
        label: 'Climb up and knock',
        hint: 'The dotted lines look sturdy',
        to: 'climb',
      },
    ],
  },
  {
    id: 'comet',
    kicker: 'WILD BREAK · COMMUTER COMET 9',
    title: 'The comet is full.',
    text: 'A notice on the tail reads NO STANDING ABOVE NINE THOUSAND DEGREES. The other passengers are two minor deities, a family of ice moths and a quiet man holding a lamp. The next stop is in four centuries.',
    choices: [
      {
        label: 'Ride it to the far end',
        hint: 'Bring a book',
        to: 'the-long-way-round',
      },
      {
        label: 'Pull the emergency cord',
        hint: 'Comets do not have brakes',
        to: 'the-emergency-cord',
      },
      {
        label: 'Sell your spot to the man with the lamp',
        hint: 'He has been waiting a long time',
        to: 'the-lamp-dealer',
      },
      {
        label: 'Jump off at nothing in particular',
        hint: 'It has a gift shop',
        to: 'nothing-in-particular',
      },
    ],
  },
  {
    id: 'gap',
    kicker: 'WILD BREAK · UNCLAIMED SKY',
    title: 'The dark between signs is very quiet.',
    text: 'Between the Northern Sloth and the Velvet Comet is a strip of sky nobody was ever assigned. It is dark, comfortable and slightly warmer than it should be. You are not the first person to hide here.',
    choices: [
      {
        label: 'Draw yourself a constellation',
        hint: 'You have the stars for it',
        to: 'the-thirteenth-sign',
      },
      {
        label: 'Meet the other people hiding here',
        hint: 'They brought chairs',
        to: 'the-unsorted',
      },
      {
        label: 'Sell the gap to a developer',
        hint: 'Views of nothing, guaranteed',
        to: 'prime-dark-real-estate',
      },
      {
        label: 'Take a nap',
        hint: 'You have earned it',
        to: 'the-quiet-zone',
      },
    ],
  },
  {
    id: 'chase',
    kicker: 'WILD BREAK · PURSUIT IN PROGRESS',
    title: 'Human Resources sends a tandem bicycle.',
    text: 'Two clerks pedal after you through vacuum out of pure policy. Their bell works. Physically, it should not. The couch is fifty meters away and you are carrying an instrument with an elbow cushion.',
    choices: [
      {
        label: 'Launch the couch and floor it',
        hint: 'Bicycles have limits',
        to: 'the-tandem-pursuit',
      },
      {
        label: 'Throw the Couchscope back',
        hint: 'It might not like that',
        to: 'returned-with-interest',
      },
      {
        label: 'Hide between the cushions',
        hint: 'Deeper than it looks',
        to: 'down-the-cushions',
      },
      {
        label: 'Surrender, very slowly',
        hint: 'Paperwork takes time',
        to: 'the-slowest-surrender',
      },
    ],
  },
  {
    id: 'reverse',
    kicker: 'WILD BREAK · INSTRUMENT HELD BACKWARDS',
    title: 'The stars have futures too.',
    text: 'Through the wrong end, the Couchscope shows not your fortune but the constellations’ fortunes. Several of them are worried. Most of them are worried about you, specifically.',
    choices: [
      {
        label: 'Read the stars their fortunes',
        hint: 'Gently',
        to: 'the-captain-reads-the-sky',
      },
      {
        label: 'Search for your own future anyway',
        hint: 'Just a quick look',
        to: 'the-blank-chart',
      },
      {
        label: 'Break it over your knee',
        hint: 'Brass is brittle in vacuum',
        to: 'twelve-loose-signs',
      },
      {
        label: 'Let the couch take a look',
        hint: 'It has never been asked either',
        to: 'the-couch-has-a-sign',
      },
    ],
  },
  {
    id: 'cabinet',
    kicker: 'WILD BREAK · ASSESSOR UNDER ASSESSMENT',
    title: 'The Assessor requests a moment.',
    text: 'Its drawers rattle in sequence, top to bottom. It requests the moment in writing, then retracts the request, then asks whether retracting counts as an answer. Nobody has ever asked what it is.',
    choices: [
      {
        label: 'Score it on your own test',
        hint: 'Four questions, all about drawers',
        to: 'the-assessor-assessed',
      },
      {
        label: 'Give it a hug',
        hint: 'Mind the handles',
        to: 'a-hug-for-the-cabinet',
      },
      {
        label: 'Promote it',
        hint: 'You do not have the authority',
        to: 'the-promotion',
      },
      {
        label: 'Report it to its own department',
        hint: 'Procedurally sound',
        to: 'the-infinite-loop',
      },
    ],
  },
  {
    id: 'archive',
    kicker: 'WILD BREAK · COMPLETE SCREENING ARCHIVE',
    title: 'The archive arrives on a moon.',
    text: 'The file comes on a cart, then a second cart, then a small moon of paper towed into orbit outside the window. Most captains gave the same answers. One folder is marked DO NOT OPEN, in your own handwriting.',
    choices: [
      {
        label: 'Open the folder in your handwriting',
        hint: 'You would not lie to yourself',
        to: 'a-note-from-later',
      },
      {
        label: 'Publish all of it',
        hint: 'Everyone deserves to know',
        to: 'the-great-leak',
      },
      {
        label: 'Find the name at the top',
        hint: 'Somebody designed this',
        to: 'the-name-at-the-top',
      },
      {
        label: 'Shred the moon',
        hint: 'Bring a big shredder',
        to: 'paper-moon',
      },
    ],
  },
  {
    id: 'hold',
    kicker: 'WILD BREAK · PLEASE CONTINUE TO HOLD',
    title: 'The sky has put you on hold.',
    text: 'The hold music is the background radiation of the universe in a slightly faster arrangement. Every eleven minutes a recorded voice says that your call is important to the stars and that the stars are experiencing high volume.',
    choices: [
      {
        label: 'Keep holding',
        hint: 'Someone has to answer eventually',
        to: 'still-holding',
      },
      {
        label: 'Press zero for an operator',
        hint: 'There is always an operator',
        to: 'the-operator',
      },
      {
        label: 'Hum along',
        hint: 'It is catchy',
        to: 'the-hold-music',
      },
      {
        label: 'Hang up and call your mother',
        hint: 'She is never on hold',
        to: 'call-your-mother',
      },
    ],
  },
  {
    id: 'climb',
    kicker: 'WILD BREAK · ASCENT BY DOTTED LINE',
    title: 'At the top of the zodiac is a door.',
    text: 'The dotted lines between stars hold your weight if you do not look down. At the top is a plain door marked CONSTELLATIONS · STAFF ONLY. Behind it, someone is shuffling cards.',
    choices: [
      {
        label: 'Knock politely',
        hint: 'They might be busy',
        to: 'staff-only',
      },
      {
        label: 'Walk in like you work there',
        hint: 'Confidence is a uniform',
        to: 'the-new-hire',
      },
      {
        label: 'Keep climbing past the door',
        hint: 'There is more ladder',
        to: 'above-the-zodiac',
      },
      {
        label: 'Climb back down',
        hint: 'You have seen enough',
        to: 'the-climb-down',
      },
    ],
  },
]

export const WILD_BREAK_ENDINGS: readonly WildBreakEnding[] = [
  // Window -> comet
  {
    id: 'the-long-way-round',
    title: 'The Long Way Round',
    text: 'At the comet’s far end it is always three in the morning, and a diner serves coffee to retired gods. You stay eleven years by one clock and forty minutes by Human Resources’. The couch is exactly where you parked it. Nobody has ticketed it.',
    coda: 'Eleven years at the far end of a comet have made the captain impossible to rush.',
    perk: { meter: 'trust', delta: 1 },
  },
  {
    id: 'the-emergency-cord',
    title: 'The Emergency Cord',
    text: 'The comet stops. Comets are not designed to stop. Three planets receive an unscheduled eclipse and one receives a very good meteor shower. You receive a laminated fine, which is how serious they are about it.',
    coda: 'The captain still carries an unpaid, laminated fine for stopping a comet.',
    perk: { meter: 'reputation', delta: 1 },
  },
  {
    id: 'the-lamp-dealer',
    title: 'The Lamp Dealer',
    text: 'The man pays for your spot with his lamp and steps onto the tail with visible relief. The lamp only lights up near something that is about to be lost. On the walk back to the couch it flickers twice, at you.',
    coda: 'The lamp from the comet glowed over everything the crew saved before it was lost.',
    perk: { meter: 'shieldCharge', delta: 1 },
  },
  {
    id: 'nothing-in-particular',
    title: 'Nothing in Particular',
    text: 'You land on nothing in particular. It is roomier than expected and has a small gift shop that sells postcards of itself. You buy six. The shopkeeper does not ask for your sign, because nothing in particular has never had one.',
    coda: 'Six postcards of nothing in particular were pinned behind the backrest for the whole voyage.',
    perk: { meter: 'supplies', delta: 1 },
  },
  // Window -> gap
  {
    id: 'the-thirteenth-sign',
    title: 'The Thirteenth Sign',
    text: 'You connect the leftover stars into a picture of yourself on a couch. Human Resources rejects it as insufficiently mythical. Astronomers in seven systems add it to their charts anyway, and quietly stop teaching the other twelve.',
    coda: 'In seven systems, children born under the captain’s homemade constellation are described as stubborn.',
    perk: { meter: 'reputation', delta: 1 },
  },
  {
    id: 'the-unsorted',
    title: 'The Unsorted',
    text: 'Hiding in the gap are a lighthouse, two retired admirals and a moth who refused to be classified as a moth sign. They have folding chairs and a thermos. By the end of the afternoon you have a union, a charter and a meeting next Thursday.',
    coda: 'The Union of the Unsorted still meets on Thursdays, and saves the captain a folding chair.',
    perk: { meter: 'trust', delta: 1 },
  },
  {
    id: 'prime-dark-real-estate',
    title: 'Prime Dark Real Estate',
    text: 'A developer buys the gap for a sum with a lot of zeros in it. Within a month it holds luxury residences with views of absolutely nothing, each one sold out. You keep one unit, which you never visit, and the commission, which you do.',
    coda: 'The captain’s unit in the gap is still empty, and still appreciating.',
    perk: { meter: 'supplies', delta: 1 },
  },
  {
    id: 'the-quiet-zone',
    title: 'The Quiet Zone',
    text: 'You sleep for forty minutes in the dark between two constellations. It is the best sleep anyone has ever had. When you wake, the screening office has closed for lunch and nobody remembers why you were there.',
    coda: 'The captain once slept between the stars and has been unreasonably calm ever since.',
    perk: { meter: 'shieldCharge', delta: 1 },
  },
  // Heist -> chase
  {
    id: 'the-tandem-pursuit',
    title: 'The Tandem Pursuit',
    text: 'The clerks follow on their bicycle for six star systems. At the seventh they stop to file a pursuit report, which becomes the longest in the department’s history. They send a postcard every year. They still want the Couchscope back.',
    coda: 'Two clerks on a tandem bicycle were spotted at the edge of the finale, still technically in pursuit.',
    perk: { meter: 'reputation', delta: 1 },
  },
  {
    id: 'returned-with-interest',
    title: 'Returned with Interest',
    text: 'The Couchscope sails back through the office window. Offended, it gives itself a reading and comes out a Feral Umbrella. It resigns on the spot and opens a small fortune-telling stall that only tells people to bring an umbrella.',
    coda: 'A former Couchscope now tells fortunes in a market. It is always right about the rain.',
    perk: { meter: 'trust', delta: 1 },
  },
  {
    id: 'down-the-cushions',
    title: 'Down the Cushions',
    text: 'Between the cushions is a pocket room nobody ever unfolded. It contains every coin lost on the couch since it was built and a small, organized society of crumbs who have elected a mayor. They grant you asylum and a modest loan.',
    coda: 'The mayor of the cushion crumbs still sends the captain a quarterly statement.',
    perk: { meter: 'supplies', delta: 1 },
  },
  {
    id: 'the-slowest-surrender',
    title: 'The Slowest Surrender',
    text: 'Your surrender takes nine hours. There are forms for each hand. By the third hour the clerks are sharing their sandwiches. By the ninth, all three of you have forgotten what the surrender was for, and they help you push the couch off the curb.',
    coda: 'The captain’s surrender to Human Resources is still marked pending.',
    perk: { meter: 'intervention', delta: 1 },
  },
  // Heist -> reverse
  {
    id: 'the-captain-reads-the-sky',
    title: 'The Captain Reads the Sky',
    text: 'You give all twelve constellations their fortunes, kindly. The Princess Mantic Shrimp cries. The Northern Sloth asks you to come back tomorrow. Human Resources receives eleven complaints and one thank-you note, which it frames.',
    coda: 'Somewhere above the finale, twelve constellations were nervously checking their fortunes.',
    perk: { meter: 'reputation', delta: 1 },
  },
  {
    id: 'the-blank-chart',
    title: 'The Blank Chart',
    text: 'You turn the Couchscope around and look for your own future. There is nothing there. Not darkness: nothing, neatly. The instrument apologizes, checks again and confirms that your future is officially unwritten. Insurers hate this.',
    coda: 'The captain’s future remains officially unwritten, so the crew wrote it themselves.',
    perk: { meter: 'intervention', delta: 1 },
  },
  {
    id: 'twelve-loose-signs',
    title: 'Twelve Loose Signs',
    text: 'The Couchscope cracks and twelve constellations roll out like marbles, bouncing off into the galaxy. For a few weeks nobody anywhere has a sign. Decisiveness rises. Small talk at parties collapses entirely.',
    coda: 'The twelve loose signs were last seen rolling toward the outer systems. Nobody went after them.',
    perk: { meter: 'shieldCharge', delta: 1 },
  },
  {
    id: 'the-couch-has-a-sign',
    title: 'The Couch Has a Sign',
    text: 'You hold the eyepiece to the backrest. The couch is a Cosmic Turnip: deep roots, slow to move, unreasonably dependable. It has never spoken, but for the rest of the day the cushions feel slightly more upright.',
    coda: 'The couch, unlike its captain, has a star sign, and has held itself a little straighter ever since.',
    perk: { meter: 'shieldCharge', delta: 1 },
  },
  // Audit -> cabinet
  {
    id: 'the-assessor-assessed',
    title: 'The Assessor Assessed',
    text: 'Your four questions are all about drawers. The Assessor scores as Unclassifiable Storage and is so relieved that it takes early retirement. It now serves as a nightstand at the end of the couch, and keeps the crew’s socks in impeccable order.',
    coda: 'The retired Assessor kept every sock aboard the couch filed, cross-referenced and paired.',
    perk: { meter: 'supplies', delta: 1 },
  },
  {
    id: 'a-hug-for-the-cabinet',
    title: 'A Hug for the Cabinet',
    text: 'Nobody has ever hugged the Assessor. All of its drawers open at once and ten thousand years of filed feelings drift out into the room. Some of them are yours, from the earlier questions. You take those back.',
    coda: 'The Assessor writes to the captain every winter, on very good stationery.',
    perk: { meter: 'trust', delta: 1 },
  },
  {
    id: 'the-promotion',
    title: 'The Promotion',
    text: 'You invent a job title on the back of a form and hand it over. The Assessor accepts. Human Resources now has a Vice President of Leaving People Alone, who is extremely effective and holds no meetings.',
    coda: 'The Vice President of Leaving People Alone left the captain alone all voyage, as promised.',
    perk: { meter: 'intervention', delta: 1 },
  },
  {
    id: 'the-infinite-loop',
    title: 'The Infinite Loop',
    text: 'You report the Assessor to its own department. It is required to investigate itself, which requires an assessment, which requires an assessor. The screening office closes pending review. Nobody in the galaxy gets a sign that year.',
    coda: 'The Assessor’s investigation into itself is in its third year. Preliminary findings are expected.',
    perk: { meter: 'reputation', delta: 1 },
  },
  // Audit -> archive
  {
    id: 'a-note-from-later',
    title: 'A Note from Later',
    text: 'Inside the folder in your handwriting is one sheet of paper. It says: Skip it. Bring snacks. The ink is still wet. You do not remember writing it yet. You bring snacks.',
    coda: 'At the finale the captain found the pen that wrote the note, and wrote it.',
    perk: { meter: 'supplies', delta: 1 },
  },
  {
    id: 'the-great-leak',
    title: 'The Great Leak',
    text: 'You publish four million screenings. Captains across the galaxy discover they all gave the same three answers. A support group forms. It is very well attended and the coffee is excellent. Human Resources issues a statement that is mostly commas.',
    coda: 'The support group for over-assessed captains named its meeting room after the couch.',
    perk: { meter: 'trust', delta: 1 },
  },
  {
    id: 'the-name-at-the-top',
    title: 'The Name at the Top',
    text: 'At the top of the org chart is a child’s name. The zodiac was her homework, nine thousand years ago. It received a B-minus and a note: needs more animals. You add a sticky note of your own. It says: good job.',
    coda: 'The girl who drew the zodiac got the captain’s sticky note, and finally raised her grade.',
    perk: { meter: 'intervention', delta: 1 },
  },
  {
    id: 'paper-moon',
    title: 'Paper Moon',
    text: 'The shredded moon of screenings falls as confetti over three planets for a week. Two of them declare a festival. The third files a complaint, on paper, which the festival then uses.',
    coda: 'The Confetti Festival of the Paper Moon is held every year, and the captain is never invited, which is fair.',
    perk: { meter: 'reputation', delta: 1 },
  },
  // Stars -> hold
  {
    id: 'still-holding',
    title: 'Still Holding',
    text: 'You hold. You keep the call open on speaker for the whole voyage, under a cushion, through every crisis. The crew learns the hold music by heart. It becomes, without anybody deciding it, the couch’s anthem.',
    coda: 'During the finale the stars finally picked up and said, quite politely, sorry, wrong number.',
    perk: { meter: 'trust', delta: 1 },
  },
  {
    id: 'the-operator',
    title: 'The Operator',
    text: 'The operator is an elderly black hole who has heard every question ever asked. She listens to yours, considers it for an amount of time you cannot measure, and tells you to go and live your life. Then she disconnects you, warmly.',
    coda: 'The captain lived the voyage exactly as an elderly black hole advised: on purpose.',
    perk: { meter: 'shieldCharge', delta: 1 },
  },
  {
    id: 'the-hold-music',
    title: 'The Hold Music',
    text: 'You hum along. Your humming is recorded for quality purposes and, after review, adopted as the new hold music of the universe. Every caller from now until the heat death waits to you. Royalties are pending.',
    coda: 'Every caller in the universe is still on hold to the captain’s humming. Royalties remain pending.',
    perk: { meter: 'reputation', delta: 1 },
  },
  {
    id: 'call-your-mother',
    title: 'Call Your Mother',
    text: 'She picks up on the first ring. She asks if you have eaten. You have not. She does not believe in star signs either, and never has, and is very glad you finally called. You stay on the line an hour. The couch waits.',
    coda: 'The captain called home after the finale. They asked whether the captain had eaten.',
    perk: { meter: 'supplies', delta: 1 },
  },
  // Stars -> climb
  {
    id: 'staff-only',
    title: 'Staff Only',
    text: 'Behind the door, the twelve constellations are on a break, playing cards. They deal you in. You win the Northern Sloth’s lunch and the Laughing Leviathan’s respect. Nobody mentions screening. The break lasts all afternoon.',
    coda: 'The constellations still save the captain a seat at their card game.',
    perk: { meter: 'trust', delta: 1 },
  },
  {
    id: 'the-new-hire',
    title: 'The New Hire',
    text: 'They assume you are the new constellation and assign you a quadrant. You work three night shifts as a sign before anybody checks. Your reviews are excellent. Two worlds still navigate by where you stood.',
    coda: 'Two worlds still steer by the three nights the captain spent working as a constellation.',
    perk: { meter: 'intervention', delta: 1 },
  },
  {
    id: 'above-the-zodiac',
    title: 'Above the Zodiac',
    text: 'Past the door, the ladder keeps going, up to the ceiling. The ceiling is painted with an older zodiac: twelve long red couches, each in a faint bubble, in a ring. One spot in the ring is empty. You climb down quietly and do not mention it to anyone.',
    coda: 'There is an empty spot in the old zodiac on the ceiling of the sky. The captain knows whose it is.',
    perk: { meter: 'shieldCharge', delta: 1 },
  },
  {
    id: 'the-climb-down',
    title: 'The Climb Down',
    text: 'You climb all the way back down without opening the door. Nothing happens. You had a nice climb and a good view. You feel a deep and specific calm about not knowing what was behind it. Human Resources cannot file this under anything.',
    coda: 'The captain climbed to the top of the zodiac and came back down without asking. Nobody knows what to make of it.',
    perk: { meter: 'intervention', delta: 1 },
  },
]

export const WILD_BREAK_ENDING_COUNT = WILD_BREAK_ENDINGS.length

export const WILD_BREAK_METER_LABELS: Record<WildBreakMeter, string> = {
  supplies: '+1 supplies',
  trust: '+1 crew trust',
  reputation: '+1 reputation',
  intervention: '+1 intervention standing',
  shieldCharge: '+1 force-bubble charge',
}

const SCENES = new Map(WILD_BREAK_SCENES.map((scene) => [scene.id, scene]))
const ENDINGS = new Map(WILD_BREAK_ENDINGS.map((end) => [end.id, end]))

export const wildBreakSceneArtKey = (id: string) => 'couchscope/wild/' + id
export const wildBreakEndingArtKey = (id: string) => 'couchscope/wild-end/' + id

export function wildBreakScene(id: string): WildBreakScene | null {
  return SCENES.get(id) ?? null
}

export function wildBreakEnding(id: string): WildBreakEnding | null {
  return ENDINGS.get(id) ?? null
}

/** Where a partial or complete path leads: a scene, an ending, or null if invalid. */
export function walkWildBreak(
  path: readonly number[],
): { scene: WildBreakScene } | { ending: WildBreakEnding } | null {
  let scene = SCENES.get(WILD_BREAK_ROOT)!
  for (let step = 0; step < path.length; step++) {
    const index = path[step]
    if (!Number.isInteger(index)) return null
    const choice = scene.choices[index as number]
    if (!choice) return null
    const next = SCENES.get(choice.to)
    if (next) {
      scene = next
      continue
    }
    const ending = ENDINGS.get(choice.to)
    return ending && step === path.length - 1 ? { ending } : null
  }
  return { scene }
}

export function wildBreakNumber(id: string): number {
  return WILD_BREAK_ENDINGS.findIndex((end) => end.id === id) + 1
}

export function createWildBreak(
  path: readonly number[],
): WildBreakRecord | null {
  const at = walkWildBreak(path)
  if (!at || !('ending' in at)) return null
  return { path: [...path], ending: at.ending.id }
}

export function validWildBreak(raw: unknown): raw is WildBreakRecord {
  if (!raw || typeof raw !== 'object') return false
  const value = raw as Partial<WildBreakRecord>
  if (!Array.isArray(value.path) || value.path.length !== WILD_BREAK_STEPS)
    return false
  const at = walkWildBreak(value.path)
  return !!at && 'ending' in at && at.ending.id === value.ending
}

/** The finale line for a voyage that broke out of the Couchscope. */
export function wildBreakCoda(record: WildBreakRecord | undefined): string {
  if (!record || !validWildBreak(record)) return ''
  const ending = wildBreakEnding(record.ending)!
  return 'THE UNSIGNED CAPTAIN: ' + ending.title + '. ' + ending.coda
}

/**
 * Launches an already-started voyage as an unsigned captain: records the
 * break, flags it for later callbacks and applies the ending's one perk.
 * Never stacks with a constellation; a signed voyage is returned unchanged.
 */
export function startWildBreakVoyage(
  run: VoyageRun,
  record: WildBreakRecord,
): VoyageRun {
  if (!validWildBreak(record) || run.starAssessment || run.wildBreak) return run
  const ending = wildBreakEnding(record.ending)!
  const { meter } = ending.perk
  const perked: VoyageRun =
    meter === 'shieldCharge'
      ? {
          ...run,
          shieldCharge: Math.min(
            WILD_BREAK_SHIELD_MAX,
            (run.shieldCharge ?? 2) + 1,
          ),
        }
      : { ...run, [meter]: run[meter] + 1 }
  return {
    ...perked,
    wildBreak: { path: [...record.path], ending: record.ending },
    worldFlags: [
      ...(run.worldFlags ?? []),
      'wild-break',
      'wild-break:' + record.ending,
    ],
    log: [
      ...run.log,
      'WILD BREAK: The captain refused the Couchscope. ' +
        ending.title +
        '. ' +
        ending.text,
    ],
  }
}
