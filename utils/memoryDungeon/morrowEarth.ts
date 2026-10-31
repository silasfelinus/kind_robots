/**
 * Morrow's mundane-Earth experience 03, first authored downtown district.
 * This is a replay-validated content engine, not yet a routed game screen.
 * Earth is genuinely mundane here: a failed spell remains a failed spell.
 */
export interface MorrowEarthChoice {
  id: string
  label: string
  outcome: string
  flag: string
  confidence: number
  empathy: number
}

export interface MorrowEarthSite {
  key: string
  title: string
  opening: string
  artPrompt: string
  choices: readonly [MorrowEarthChoice, MorrowEarthChoice]
}

export const MORROW_EARTH_SITES: readonly MorrowEarthSite[] = [
  {
    key: '1,1',
    title: 'The Borrowed Morning',
    opening:
      'Morrow wakes in a rented room under a ceiling that has no constellations. The landlord wants a deposit, not a true name.',
    artPrompt:
      'A narrow city apartment at dawn, folded train map, unfamiliar key and a grey cardigan on a chair.',
    choices: [
      {
        id: 'pay',
        label: 'Pay the deposit from the dwindling envelope',
        outcome:
          'The landlord hands over a receipt. Morrow buys privacy but has less money for the week.',
        flag: 'deposit-paid',
        confidence: -1,
        empathy: 1,
      },
      {
        id: 'explain',
        label: 'Explain the missing references honestly',
        outcome:
          'The landlord grants one night and a deadline. The room is safer than the street, but tomorrow remains uncertain.',
        flag: 'deadline-given',
        confidence: 1,
        empathy: 0,
      },
    ],
  },
  {
    key: '2,1',
    title: 'The Bus with No Bargain',
    opening:
      'A driver waits while Morrow offers a polished river stone instead of fare. Nobody laughs until Morrow asks why.',
    artPrompt:
      'City bus at curb, ticket reader, driver with patient expression and one polished river stone.',
    choices: [
      {
        id: 'return',
        label: 'Put the stone away and ask for the fare',
        outcome:
          'The driver names the price and points to a transfer ticket. A small rule becomes learnable.',
        flag: 'bus-fare-learned',
        confidence: 1,
        empathy: 1,
      },
      {
        id: 'walk',
        label: 'Walk rather than surrender the stone',
        outcome:
          'The stone stays safe in a pocket. Morrow arrives late and misses the first research briefing.',
        flag: 'bus-walked',
        confidence: -1,
        empathy: 0,
      },
    ],
  },
  {
    key: '3,1',
    title: 'Platform of Twelve Minutes',
    opening:
      'The train display promises twelve minutes. Morrow counts twelve heartbeats and is furious when nothing arrives.',
    artPrompt:
      'Subway platform with a glowing twelve-minute arrival display, tiled wall and waiting commuters.',
    choices: [
      {
        id: 'ask',
        label: 'Ask a commuter what the number means',
        outcome:
          'A commuter explains minutes without making Morrow feel foolish. Morrow writes the lesson down.',
        flag: 'minutes-learned',
        confidence: 1,
        empathy: 1,
      },
      {
        id: 'observe',
        label: 'Wait through a full cycle and infer the rule',
        outcome:
          'The train arrives. Morrow learns the system, but misses the conversation that might have helped sooner.',
        flag: 'minutes-observed',
        confidence: 1,
        empathy: -1,
      },
    ],
  },
  {
    key: '3,2',
    title: 'The Glass Turnstile',
    opening:
      'A metal gate opens for everyone else. Morrow suspects a password, while the card reader waits for a tap.',
    artPrompt:
      'Station turnstiles, contactless card reader and commuter shoes on a rain-dark floor.',
    choices: [
      {
        id: 'watch',
        label: 'Watch two travelers before attempting the gate',
        outcome:
          'Morrow copies the tap and enters. The guard notices the hesitation but leaves the lesson intact.',
        flag: 'turnstile-watched',
        confidence: 1,
        empathy: 0,
      },
      {
        id: 'request',
        label: 'Ask the attendant for an accessible entrance',
        outcome:
          'The attendant opens the wider gate and explains how to pay next time. A route exists without pretending to know.',
        flag: 'turnstile-help',
        confidence: 0,
        empathy: 1,
      },
    ],
  },
  {
    key: '2,2',
    title: 'Library of Unenchanted Books',
    opening:
      'The library catalog answers a query without a spell. Morrow distrusts its speed and trusts the librarian less.',
    artPrompt:
      'Public library terminal, paper note with search terms and librarian shelving science books.',
    choices: [
      {
        id: 'search',
        label: 'Use the catalog to find a research methods primer',
        outcome:
          'The first chapter explains what a reproducible experiment is. Morrow has found a language for uncertainty.',
        flag: 'library-primer',
        confidence: 1,
        empathy: 0,
      },
      {
        id: 'listen',
        label: 'Ask the librarian why books are free to borrow',
        outcome:
          'The librarian describes a public promise supported by neighbors. Morrow learns that not every gift demands a secret.',
        flag: 'library-promise',
        confidence: 0,
        empathy: 1,
      },
    ],
  },
  {
    key: '1,2',
    title: 'The Neighborhood Noticeboard',
    opening:
      'Posters offer a free meal, a paid survey and a missing-cat search. Morrow cannot tell which requests are traps.',
    artPrompt:
      'Community noticeboard with soup kitchen poster, missing cat photo and survey flyer.',
    choices: [
      {
        id: 'meal',
        label: 'Volunteer at the free meal before accepting one',
        outcome:
          'Morrow washes dishes and eats beside strangers. Charity here has work, not an invisible price.',
        flag: 'noticeboard-meal',
        confidence: 0,
        empathy: 1,
      },
      {
        id: 'survey',
        label: 'Read the survey consent sheet before signing',
        outcome:
          'The survey pays a little and asks too much. Morrow declines the data request and keeps the right to say no.',
        flag: 'noticeboard-consent',
        confidence: 1,
        empathy: 0,
      },
    ],
  },
  {
    key: '1,3',
    title: 'The Transit Lesson',
    opening:
      'The ticket machine refuses the ancient coin in Morrow hands. An older traveler offers a patient explanation.',
    artPrompt:
      'Subway ticket machine, older traveler pointing at a screen and Morrow holding a coin.',
    choices: [
      {
        id: 'accept-help',
        label: 'Accept the traveler as a teacher',
        outcome:
          'The traveler shows the correct ticket and refuses payment. Morrow has to learn the difference between aid and debt.',
        flag: 'transit-help',
        confidence: 0,
        empathy: 1,
      },
      {
        id: 'study-alone',
        label: 'Decline help and read every instruction',
        outcome:
          'Morrow eventually buys the ticket, but the traveler leaves before being thanked. Competence has a loneliness tax.',
        flag: 'transit-alone',
        confidence: 1,
        empathy: -1,
      },
    ],
  },
  {
    key: '2,3',
    title: 'The Lost Property Window',
    opening:
      'Behind glass sit umbrellas, headphones and one absurdly ornate silver spoon. Morrow recognizes none of the owners.',
    artPrompt:
      'Lost-property counter with numbered drawers, umbrellas and a decorated silver spoon.',
    choices: [
      {
        id: 'report',
        label: 'Register the spoon instead of claiming it',
        outcome:
          'The clerk writes down the description. Morrow leaves with no treasure and an unfamiliar sense of trust.',
        flag: 'spoon-registered',
        confidence: 0,
        empathy: 1,
      },
      {
        id: 'investigate',
        label: 'Ask how owners prove an item is theirs',
        outcome:
          'The clerk describes receipts and details only the owner would know. Identity becomes a question of evidence.',
        flag: 'ownership-evidence',
        confidence: 1,
        empathy: 0,
      },
    ],
  },
  {
    key: '3,3',
    title: 'The Research Lobby',
    opening:
      'A security guard asks for identification. Morrow knows the face on the badge but not the history behind it.',
    artPrompt:
      'Research institute lobby, security desk and access badge beneath fluorescent light.',
    choices: [
      {
        id: 'confess',
        label: 'Say the badge is yours but the experience is not',
        outcome:
          'The guard escorts Morrow to reception rather than the lab. Honesty costs access today but creates a record.',
        flag: 'badge-confessed',
        confidence: -1,
        empathy: 1,
      },
      {
        id: 'wait',
        label: 'Ask for a visitor pass while records are checked',
        outcome:
          'Reception issues a temporary pass with limited doors. Morrow gains a route, not a borrowed reputation.',
        flag: 'visitor-pass',
        confidence: 1,
        empathy: 0,
      },
    ],
  },
  {
    key: '4,3',
    title: 'The Team Desk',
    opening:
      'A colleague has left a notebook of experiments in careful handwriting. The first page says that a negative result is still a result.',
    artPrompt:
      'Shared office desk, open experiment notebook, labelled beakers and desk lamp.',
    choices: [
      {
        id: 'read',
        label: 'Read the failed experiments before proposing new ones',
        outcome:
          'Morrow finds three questions worth asking. The colleague notices the care taken with earlier work.',
        flag: 'team-history',
        confidence: 1,
        empathy: 1,
      },
      {
        id: 'organize',
        label: 'Sort the scattered notes into a reproducible index',
        outcome:
          'The notebook becomes searchable, but the colleague asks Morrow not to rearrange the evidence without asking.',
        flag: 'team-index',
        confidence: 1,
        empathy: -1,
      },
    ],
  },
  {
    key: '4,2',
    title: 'Café of Unpaid Apologies',
    opening:
      'Two former coworkers recognize the stolen face. One turns away; the other asks whether Morrow is ready to listen.',
    artPrompt:
      'Small cafe table, two cooling coffees and a third chair pushed back.',
    choices: [
      {
        id: 'listen',
        label: 'Listen without defending the borrowed history',
        outcome:
          'The coworker describes a humiliating meeting. Morrow cannot undo it, but can stop arguing with the witness.',
        flag: 'cafe-listened',
        confidence: -1,
        empathy: 1,
      },
      {
        id: 'leave',
        label: 'Leave a written apology and give them space',
        outcome:
          'The note stays unread for now. Morrow avoids another argument but also misses the chance to hear what happened.',
        flag: 'cafe-note',
        confidence: 0,
        empathy: -1,
      },
    ],
  },
  {
    key: '5,2',
    title: 'The Workers Hall',
    opening:
      'A notice invites everyone to discuss unpaid overtime. Morrow mistakes the meeting for a ritual of binding names.',
    artPrompt:
      'Union meeting room with folding chairs, hand-lettered overtime notice and shared tea.',
    choices: [
      {
        id: 'attend',
        label: 'Attend and ask who can speak',
        outcome:
          'The chair explains that even the newest worker has a voice. Morrow learns a collective rule without a king.',
        flag: 'hall-voice',
        confidence: 0,
        empathy: 1,
      },
      {
        id: 'record',
        label: 'Take notes on the demands and their costs',
        outcome:
          'The list shows who would pay for every concession. Morrow learns that fairness needs arithmetic as well as feeling.',
        flag: 'hall-ledger',
        confidence: 1,
        empathy: 0,
      },
    ],
  },
  {
    key: '5,3',
    title: 'The Patient Mentor',
    opening:
      'Dr. Sen notices the holes in Morrow knowledge but not the impossible reason. She offers one afternoon to teach, not to impersonate expertise.',
    artPrompt:
      'University laboratory bench, Dr Sen demonstrating a small sensor with a notebook and pencil.',
    choices: [
      {
        id: 'ask',
        label: 'Admit the gap and accept Dr. Sen as a mentor',
        outcome:
          'Dr. Sen schedules a lesson on controls and uncertainty. The borrowed face is allowed to become a beginner.',
        flag: 'mentor-asked',
        confidence: 0,
        empathy: 1,
      },
      {
        id: 'imitate',
        label: 'Copy the procedure before revealing the gap',
        outcome:
          'The first measurement fails. Dr. Sen helps repair it but asks Morrow to disclose the mistake in the lab record.',
        flag: 'mentor-imitated',
        confidence: 1,
        empathy: -1,
      },
    ],
  },
  {
    key: '6,3',
    title: 'The Utility Stair',
    opening:
      'A stairwell door bears a warning about power outages. Morrow thinks the city has finally admitted to a sleeping dragon.',
    artPrompt:
      'Concrete stairwell with emergency power sign, handrail and window onto the city.',
    choices: [
      {
        id: 'inspect',
        label: 'Read the maintenance schedule before touching the switch',
        outcome:
          'The warning is ordinary and useful. Morrow leaves the equipment alone and reaches the lab safely.',
        flag: 'stair-inspected',
        confidence: 1,
        empathy: 0,
      },
      {
        id: 'call',
        label: 'Call facilities instead of improvising a repair',
        outcome:
          'A technician arrives with a key and explains the hazard. Morrow loses time but protects everyone using the stair.',
        flag: 'stair-called',
        confidence: -1,
        empathy: 1,
      },
    ],
  },
  {
    key: '6,4',
    title: 'The Failed Gesture',
    opening:
      'At a quiet lab desk, Morrow lifts a hand to summon the light of home. The glass of water does not stir. There is no spell here.',
    artPrompt:
      'Ordinary research desk, still glass of water, raised hand, wall clock and no supernatural glow.',
    choices: [
      {
        id: 'attempt',
        label: 'Try the spell alone and record the absence',
        outcome:
          'Nothing happens. Morrow writes the time, the conditions and the failure instead of inventing a miracle.',
        flag: 'magic-failed-private',
        confidence: -1,
        empathy: 0,
      },
      {
        id: 'witness',
        label: 'Ask Dr. Sen to witness the attempt without promising magic',
        outcome:
          'Nothing happens. Dr. Sen records an unexplained gesture and asks whether Morrow needs rest. The failed spell is not hidden.',
        flag: 'magic-failed-witnessed',
        confidence: 0,
        empathy: 1,
      },
    ],
  },
  {
    key: '5,4',
    title: 'The Rain Shelter',
    opening:
      'Rain pins commuters beneath a narrow awning. A stranger shares dry paper with Morrow to protect the research notes.',
    artPrompt:
      'City pharmacy awning in rain, strangers shielding notebooks with a folded paper bag.',
    choices: [
      {
        id: 'share',
        label: 'Offer the remaining dry space to another commuter',
        outcome:
          'The notes get damp, but three people fit under the awning. Morrow begins to recognize a different kind of shelter.',
        flag: 'rain-shared',
        confidence: -1,
        empathy: 1,
      },
      {
        id: 'protect',
        label: 'Protect the experiment notebook first',
        outcome:
          'The pages stay legible while a neighbor gets wet. Morrow keeps the evidence and notices the cost.',
        flag: 'rain-notebook',
        confidence: 1,
        empathy: -1,
      },
    ],
  },
]

export const MORROW_EARTH_PHOTO_SITES = ['1,3', '6,4'] as const
export const MORROW_EARTH_MAX_EVENTS = 1024

export type MorrowEarthEvent =
  { type: 'move'; to: string } | { type: 'choose'; id: string }

export interface MorrowEarthProgress {
  version: 1
  seed: number
  current: string
  visited: string[]
  choices: Record<string, string>
  confidence: number
  empathy: number
  flags: string[]
  events: MorrowEarthEvent[]
}

const SITES = new Map(MORROW_EARTH_SITES.map((site) => [site.key, site]))

function adjacent(a: string, b: string): boolean {
  const [ax, ay] = a.split(',').map(Number)
  const [bx, by] = b.split(',').map(Number)
  return Math.abs(ax! - bx!) + Math.abs(ay! - by!) === 1
}

function validEvent(event: unknown): event is MorrowEarthEvent {
  if (!event || typeof event !== 'object') return false
  const value = event as Record<string, unknown>
  if (Object.keys(value).length !== 2 || typeof value.type !== 'string')
    return false
  return value.type === 'move'
    ? typeof value.to === 'string'
    : value.type === 'choose' && typeof value.id === 'string'
}

export function newMorrowEarthProgress(seed: number): MorrowEarthProgress {
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 2147483647)
    throw new Error('Invalid Morrow Earth seed')
  return {
    version: 1,
    seed,
    current: '1,1',
    visited: ['1,1'],
    choices: {},
    confidence: 0,
    empathy: 0,
    flags: [],
    events: [],
  }
}

export function advanceMorrowEarth(
  progress: MorrowEarthProgress,
  event: MorrowEarthEvent,
): MorrowEarthProgress {
  if (progress.events.length >= MORROW_EARTH_MAX_EVENTS || !validEvent(event))
    return progress
  if (event.type === 'move') {
    if (!SITES.has(event.to) || !adjacent(progress.current, event.to))
      return progress
    return {
      ...progress,
      current: event.to,
      visited: progress.visited.includes(event.to)
        ? progress.visited
        : [...progress.visited, event.to],
      events: [...progress.events, { type: 'move', to: event.to }],
    }
  }
  if (progress.choices[progress.current]) return progress
  const choice = SITES.get(progress.current)?.choices.find(
    (option) => option.id === event.id,
  )
  if (!choice) return progress
  return {
    ...progress,
    choices: { ...progress.choices, [progress.current]: choice.id },
    confidence: progress.confidence + choice.confidence,
    empathy: progress.empathy + choice.empathy,
    flags: [...progress.flags, choice.flag],
    events: [...progress.events, { type: 'choose', id: choice.id }],
  }
}

/** Only decisions at the two fixed coordinates may earn these photo sites. */
export function morrowEarthPhotoSites(progress: MorrowEarthProgress): string[] {
  return MORROW_EARTH_PHOTO_SITES.filter((site) =>
    Boolean(progress.choices[site]),
  )
}

const CLOSING_ACCOUNTS: Readonly<Record<string, string>> = {
  'accept-help:ask:attempt':
    'Morrow learned to accept help, trusted a mentor and then tried the old spell alone. The water stayed still. Dr. Sen receives a truthful failed experiment, not a miracle, and the stranger at the station remains a person rather than a debtor.',
  'accept-help:ask:witness':
    'The commuter offered a lesson, Dr. Sen offered a second, and Morrow asked her to witness the final gesture. The failed spell becomes an honest lab note. Someone may help with the next question without believing in magic.',
  'accept-help:imitate:attempt':
    'A stranger taught the fare, but Morrow copied the laboratory procedure without admitting the gap. The solitary spell failed as well. Morrow now owes Dr. Sen a correction before a new experiment can begin.',
  'accept-help:imitate:witness':
    'Morrow accepted ordinary help at the station, concealed a mistake at work and then invited Dr. Sen to witness a spell that did nothing. She asks for the earlier failed measurement too. The price of being believed is the full record.',
  'study-alone:ask:attempt':
    'Morrow conquered the ticket machine alone, finally asked Dr. Sen for instruction and tried magic privately. Nothing answered. The new mentor cannot repair an experiment she has not been told about; Morrow must decide whether to share the failure.',
  'study-alone:ask:witness':
    'The station stranger was turned away, but Dr. Sen was invited into the laboratory and witnessed the silent gesture. The failed spell costs Morrow pride rather than a job. Asking late was still better than pretending forever.',
  'study-alone:imitate:attempt':
    'Morrow rejected the commuter, copied the lab procedure and tried the final spell alone. Both experiments failed. The research notes contain omissions that must be repaired before anyone can trust the next result.',
  'study-alone:imitate:witness':
    'After refusing station help and concealing a lab error, Morrow finally asked Dr. Sen to witness the impossible gesture. Nothing moved. Her first question is not about magic but whether the earlier data can be trusted.',
}

/** A remembered failed-magic anchor is earned, never inferred from map reveal. */
export function morrowEarthClosingAccount(
  progress: MorrowEarthProgress,
): string | null {
  const transit = progress.choices['1,3']
  const mentor = progress.choices['5,3']
  const gesture = progress.choices['6,4']
  if (!transit || !mentor || !gesture) return null
  return CLOSING_ACCOUNTS[`${transit}:${mentor}:${gesture}`] ?? null
}

/** Rebuild all derived values from the action journal before trusting a save. */
export function restoreMorrowEarth(value: unknown): MorrowEarthProgress | null {
  if (!value || typeof value !== 'object') return null
  const saved = value as Partial<MorrowEarthProgress>
  if (
    saved.version !== 1 ||
    !Number.isSafeInteger(saved.seed) ||
    saved.seed! < 0 ||
    saved.seed! > 2147483647 ||
    !Array.isArray(saved.events) ||
    saved.events.length > MORROW_EARTH_MAX_EVENTS
  )
    return null
  let replay = newMorrowEarthProgress(saved.seed!)
  for (const event of saved.events) {
    const next = advanceMorrowEarth(replay, event)
    if (next === replay) return null
    replay = next
  }
  const keys: (keyof MorrowEarthProgress)[] = [
    'version',
    'seed',
    'current',
    'visited',
    'choices',
    'confidence',
    'empathy',
    'flags',
    'events',
  ]
  return keys.every(
    (key) => JSON.stringify(saved[key]) === JSON.stringify(replay[key]),
  )
    ? replay
    : null
}

export function validateMorrowEarth(): string[] {
  const errors: string[] = []
  if (SITES.size !== 16) errors.push('Expected sixteen unique Earth sites')
  const seenOutcomes = new Set<string>()
  for (const site of MORROW_EARTH_SITES) {
    const [x, y] = site.key.split(',').map(Number)
    if (
      !Number.isInteger(x) ||
      !Number.isInteger(y) ||
      x! < 1 ||
      x! > 8 ||
      y! < 1 ||
      y! > 8
    )
      errors.push('Invalid site coordinate: ' + site.key)
    if (
      !site.title ||
      !site.opening ||
      !site.artPrompt ||
      site.choices.length !== 2
    )
      errors.push('Incomplete Earth site: ' + site.key)
    if (site.choices[0].id === site.choices[1].id)
      errors.push('Duplicate choice at ' + site.key)
    for (const choice of site.choices) {
      if (
        !choice.label ||
        !choice.outcome ||
        !choice.flag ||
        seenOutcomes.has(choice.outcome)
      )
        errors.push('Incomplete or repeated Earth outcome at ' + site.key)
      seenOutcomes.add(choice.outcome)
    }
  }
  const reached = new Set(['1,1'])
  const queue = ['1,1']
  while (queue.length) {
    const from = queue.shift()!
    for (const to of SITES.keys()) {
      if (!reached.has(to) && adjacent(from, to)) {
        reached.add(to)
        queue.push(to)
      }
    }
  }
  if (reached.size !== 16) errors.push('Morrow Earth district is disconnected')
  if (MORROW_EARTH_PHOTO_SITES.some((key) => !SITES.has(key)))
    errors.push('Missing fixed Earth photo coordinate')
  if (Object.keys(CLOSING_ACCOUNTS).length !== 8)
    errors.push('Expected eight distinct closing accounts')
  return errors
}
