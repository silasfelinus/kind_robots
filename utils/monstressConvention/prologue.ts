/**
 * Monstress Convention: deterministic first hotel investigation.
 * Everything here is authored, inspectable and replayable without an LLM.
 * No public route imports these scenes until the mature-access gate ships.
 */
export type Investigator = 'nico' | 'iris'
export type RoomId =
  | 'parking'
  | 'lobby'
  | 'registration'
  | 'convention'
  | 'courtyard'
  | 'stairwell'
  | 'suite-205'
export type Verb =
  'walk' | 'look' | 'talk' | 'take' | 'use' | 'photograph' | 'ask'
export type CaseEnding = 'responsible' | 'reckless'

export interface HotelHotspot {
  id: string
  label: string
  x: number
  y: number
  verbs: Verb[]
}
export interface HotelRoom {
  id: RoomId
  label: string
  floor: number
  caption: string
  exits: RoomId[]
  hotspots: HotelHotspot[]
}
export interface CaseState {
  version: 1
  seed: number
  room: RoomId
  actor: Investigator
  flags: string[]
  evidence: string[]
  topics: string[]
  inventory: string[]
  asked: string[]
  transcript: string[]
  ending: CaseEnding | null
}
export interface CaseAction {
  verb: Verb
  target: string
  topic?: string
}
export interface CaseResult {
  state: CaseState
  line: string
  changed: boolean
}

export const HOTEL_ROOMS: Record<RoomId, HotelRoom> = {
  parking: {
    id: 'parking',
    label: 'Rain-Slick Parking Lot',
    floor: 0,
    caption:
      'A neon fang buzzes above the Grand Gloaming. Rain keeps the secrets wet.',
    exits: ['lobby', 'courtyard'],
    hotspots: [
      {
        id: 'marquee',
        label: 'MONSTRESS-CON sign',
        x: 44,
        y: 23,
        verbs: ['look', 'photograph'],
      },
      {
        id: 'lost-pass',
        label: 'Lost fan pass',
        x: 74,
        y: 80,
        verbs: ['look', 'take'],
      },
    ],
  },
  lobby: {
    id: 'lobby',
    label: 'Grand Gloaming Lobby',
    floor: 1,
    caption:
      'The carpet is burgundy, the chandelier is broken, and the manager is still smiling.',
    exits: ['parking', 'registration', 'convention', 'courtyard', 'stairwell'],
    hotspots: [
      {
        id: 'porter',
        label: 'Pip, night porter',
        x: 68,
        y: 54,
        verbs: ['look', 'talk', 'ask'],
      },
      {
        id: 'desk',
        label: 'Press-room typewriter',
        x: 30,
        y: 71,
        verbs: ['look', 'use'],
      },
    ],
  },
  registration: {
    id: 'registration',
    label: 'Convention Check-in',
    floor: 1,
    caption: 'The guest badges cost more than the hotel rooms.',
    exits: ['lobby'],
    hotspots: [
      {
        id: 'clerk',
        label: 'Marta Rook',
        x: 55,
        y: 53,
        verbs: ['look', 'talk', 'use'],
      },
      {
        id: 'call-sheet',
        label: 'Panel program',
        x: 30,
        y: 63,
        verbs: ['look', 'photograph'],
      },
    ],
  },
  convention: {
    id: 'convention',
    label: 'Ballroom of the Damned',
    floor: 1,
    caption:
      'The franchise stars sit beneath banners promoting a dozen things nobody asked for.',
    exits: ['lobby'],
    hotspots: [
      {
        id: 'celestine',
        label: 'Celestine Veil',
        x: 60,
        y: 52,
        verbs: ['look', 'talk', 'ask'],
      },
      {
        id: 'poster',
        label: 'Licensing poster',
        x: 25,
        y: 35,
        verbs: ['look', 'photograph'],
      },
      {
        id: 'stage',
        label: 'Anniversary panel',
        x: 48,
        y: 78,
        verbs: ['look', 'use'],
      },
    ],
  },
  courtyard: {
    id: 'courtyard',
    label: 'Hot Tub Courtyard',
    floor: 1,
    caption:
      'Steam rises from a tiled tub. The chemistry is best left to the imagination.',
    exits: ['parking', 'lobby'],
    hotspots: [
      {
        id: 'gavin',
        label: 'Gavin Spindle',
        x: 65,
        y: 49,
        verbs: ['look', 'talk', 'ask'],
      },
      {
        id: 'camera',
        label: 'Fan camera',
        x: 33,
        y: 71,
        verbs: ['look', 'photograph'],
      },
    ],
  },
  stairwell: {
    id: 'stairwell',
    label: 'Service Stairwell',
    floor: 2,
    caption:
      'The staff bell hangs crooked. Somebody dragged a heavy trolley here.',
    exits: ['lobby', 'suite-205'],
    hotspots: [
      {
        id: 'bell',
        label: 'Scratched service bell',
        x: 72,
        y: 33,
        verbs: ['look', 'photograph'],
      },
    ],
  },
  'suite-205': {
    id: 'suite-205',
    label: 'Celestine’s Suite',
    floor: 2,
    caption:
      'The door is locked from within. The bathroom mirror is fogging up by itself.',
    exits: ['stairwell'],
    hotspots: [
      {
        id: 'ghost',
        label: 'Figure in the mirror',
        x: 55,
        y: 45,
        verbs: ['look', 'talk', 'ask'],
      },
      {
        id: 'latch',
        label: 'Interior door latch',
        x: 18,
        y: 62,
        verbs: ['look', 'photograph'],
      },
    ],
  },
}

export const TOPICS: Record<string, string> = {
  schedule: 'The panel schedule',
  royalties: 'The missing royalties',
  'service-bell': 'The service bell',
  'last-sensation': 'Her last sensation',
  'fan-alibi': 'Gavin’s whereabouts',
}

export const EVIDENCE: Record<string, string> = {
  'commission-photo': 'Convention marquee photograph',
  'panel-program': 'Panel program with corrected times',
  'rights-dispute': 'Celestine’s public royalties dispute',
  'licensing-poster': 'Rights-renewal licensing poster',
  'ghost-memory': 'Ghost’s recollection of a mechanical bell',
  'bell-scratch': 'Scratched service-bell plate',
  'porter-log': 'Signed laundry-lift call log',
  'fan-photo': 'Fan photo with a readable courtyard clock',
  'locked-latch': 'Photograph of the locked interior latch',
  'fan-exonerated': 'Corroborated evidence of Gavin’s whereabouts',
}

export function newCase(seed = 1): CaseState {
  return {
    version: 1,
    seed,
    room: 'parking',
    actor: 'nico',
    flags: [],
    evidence: [],
    topics: [],
    inventory: ['camera'],
    asked: [],
    transcript: [
      'Nico: One exclusive story. One mortgage payment. Maybe two if we skip dinner.',
    ],
    ending: null,
  }
}

function withLine(state: CaseState, line: string, changed = true): CaseResult {
  if (!changed) return { state, line, changed: false }
  return {
    state: { ...state, transcript: [...state.transcript, line] },
    line,
    changed,
  }
}

function has(state: CaseState, key: string): boolean {
  return (
    state.flags.includes(key) ||
    state.evidence.includes(key) ||
    state.inventory.includes(key)
  )
}

function addUnique(list: string[], value: string): string[] {
  return list.includes(value) ? list : [...list, value]
}

function unlockTopic(state: CaseState, value: string): void {
  state.topics = addUnique(state.topics, value)
}

function addEvidence(state: CaseState, value: string): void {
  state.evidence = addUnique(state.evidence, value)
}

export function switchInvestigator(state: CaseState): CaseResult {
  if (state.ending)
    return withLine(state, 'The story has gone to press.', false)
  const actor = state.actor === 'nico' ? 'iris' : 'nico'
  const line =
    actor === 'iris'
      ? 'Iris: Try not to interview the wallpaper while I check the facts.'
      : 'Nico: I had that under control. Probably.'
  return withLine({ ...state, actor }, line)
}

export function travel(state: CaseState, destination: RoomId): CaseResult {
  if (state.ending)
    return withLine(state, 'The case is closed for this run.', false)
  if (!HOTEL_ROOMS[state.room].exits.includes(destination))
    return withLine(state, 'There is no direct route from here.', false)
  if (destination === 'convention' && !has(state, 'press-badge'))
    return withLine(
      state,
      'The convention doors demand proper press credentials.',
      false,
    )
  if (destination === 'stairwell' && !has(state, 'murder'))
    return withLine(
      state,
      'Staff access is closed before the evening panel.',
      false,
    )
  if (destination === 'suite-205' && !has(state, 'murder'))
    return withLine(
      state,
      'Suite 205 is private until the investigation begins.',
      false,
    )
  const next = { ...state, room: destination }
  return withLine(next, HOTEL_ROOMS[destination].caption)
}

function note(state: CaseState, target: string, verb: Verb): string {
  const who = state.actor === 'nico' ? 'Nico' : 'Iris'
  if (target === 'lost-pass')
    return (
      who + ': Somebody dropped a badge. The name is mostly a coffee stain.'
    )
  if (target === 'gavin')
    return (
      who +
      ': He has a stack of photographs taken from disturbing angles. That is not romantic.'
    )
  if (target === 'celestine')
    return (
      who +
      ': The star is arguing with the licensing executive over an unsigned contract.'
    )
  if (target === 'ghost')
    return (
      who + ': Reflections do not usually answer questions. This one might.'
    )
  if (target === 'bell')
    return who + ': Fresh metal scratches. The laundry lift was used recently.'
  if (target === 'latch')
    return who + ': A locked door is evidence, not proof of the supernatural.'
  if (verb === 'photograph')
    return who + ': That belongs in the camera roll, not on a gossip feed.'
  return HOTEL_ROOMS[state.room].caption
}

export function availableTopics(state: CaseState, target: string): string[] {
  const supported: Record<string, string[]> = {
    clerk: ['schedule'],
    celestine: ['royalties', 'schedule'],
    porter: ['service-bell', 'schedule'],
    ghost: ['last-sensation', 'royalties'],
    gavin: ['fan-alibi', 'schedule'],
  }
  return (supported[target] ?? []).filter(
    (topic) =>
      state.topics.includes(topic) &&
      !state.asked.includes(state.actor + ':' + target + ':' + topic),
  )
}

function interview(
  state: CaseState,
  target: string,
  topic: string,
): CaseResult {
  if (
    !state.topics.includes(topic) ||
    !availableTopics(state, target).includes(topic)
  )
    return withLine(
      state,
      'That question has already been answered, or the lead is not known.',
      false,
    )
  const next = {
    ...state,
    asked: [...state.asked, state.actor + ':' + target + ':' + topic],
  }
  const iris = state.actor === 'iris'
  let line = ''
  if (target === 'clerk' && topic === 'schedule') {
    addEvidence(next, 'panel-program')
    line = iris
      ? 'Marta: The original call sheet has a correction in red. You have a good eye.'
      : 'Marta: The schedule changed. Please stop treating the correction fluid as a clue.'
  } else if (target === 'celestine' && topic === 'royalties') {
    addEvidence(next, 'rights-dispute')
    line = iris
      ? 'Celestine: My old contract does not license my face forever. Iris, you understand.'
      : 'Celestine: Put this in your blog, Nico: I want my royalties, not a plastic coffin.'
  } else if (target === 'porter' && topic === 'service-bell') {
    addEvidence(next, 'porter-log')
    line = iris
      ? 'Pip: Here are the signed lift calls. Odd; the panel blackout is noted twice.'
      : 'Pip: If that bell rang twice, the porter log proves it. And yes, I wrote the time.'
  } else if (target === 'ghost' && topic === 'last-sensation') {
    addEvidence(next, 'ghost-memory')
    unlockTopic(next, 'service-bell')
    line = iris
      ? 'Celestine: A short bell and bitter chemical smell. Iris: That is a lift, not a séance.'
      : 'Celestine: I remember a bell, and a scent that burned. Nico: Why cannot ghosts remember faces?'
  } else if (target === 'ghost' && topic === 'royalties') {
    addEvidence(next, 'rights-dispute')
    line = iris
      ? 'Celestine: Odette had the contract. I never signed it. Ask where the original went.'
      : 'Celestine: My face is not a subscription service, Nico. Not even after death.'
  } else if (target === 'gavin' && topic === 'fan-alibi') {
    addEvidence(next, 'fan-photo')
    if (has(next, 'porter-log')) addEvidence(next, 'fan-exonerated')
    line = iris
      ? 'Iris: The courtyard clock in his photograph matches Pip’s call log. He was stalking someone, but he did not commit this murder.'
      : 'Nico: His photographs put him outside during the blackout. He is a menace, not our murderer.'
  } else if (topic === 'schedule') {
    unlockTopic(next, 'royalties')
    line = iris
      ? 'Iris: The panel time changed after the contract dispute. Whose handwriting is this?'
      : 'Nico: A vampire reunion with a last-minute schedule change. Clickbait writes itself.'
  } else {
    line = iris
      ? 'Iris: We should compare that statement with the evidence.'
      : 'Nico: Not exactly a front-page quote. Yet.'
  }
  if (
    next.evidence.includes('fan-photo') &&
    next.evidence.includes('porter-log')
  )
    addEvidence(next, 'fan-exonerated')
  return withLine(next, line)
}

export function performAction(
  state: CaseState,
  action: CaseAction,
): CaseResult {
  if (state.ending) return withLine(state, 'The story is already filed.', false)
  const hotspot = HOTEL_ROOMS[state.room].hotspots.find(
    (item) => item.id === action.target,
  )
  if (!hotspot || !hotspot.verbs.includes(action.verb))
    return withLine(
      state,
      'There is nothing useful to do with that here.',
      false,
    )
  if (action.verb === 'look') {
    const next = { ...state }
    if (action.target === 'bell') {
      addEvidence(next, 'bell-scratch')
      unlockTopic(next, 'service-bell')
    }
    if (action.target === 'latch') addEvidence(next, 'locked-latch')
    if (action.target === 'call-sheet') unlockTopic(next, 'schedule')
    if (action.target === 'poster') unlockTopic(next, 'royalties')
    return withLine(next, note(state, action.target, 'look'))
  }
  if (action.verb === 'ask')
    return interview(state, action.target, action.topic ?? '')
  const next: CaseState = { ...state }
  if (action.target === 'lost-pass' && action.verb === 'take') {
    next.inventory = addUnique(next.inventory, 'fan-pass')
    return withLine(
      next,
      'Nico: A mysterious badge. Either fate or an aggressively careless attendee.',
    )
  }
  if (action.target === 'marquee' && action.verb === 'photograph') {
    addEvidence(next, 'commission-photo')
    unlockTopic(next, 'schedule')
    return withLine(
      next,
      'Iris: The convention site needs a photograph. This one proves we were commissioned.',
    )
  }
  if (action.target === 'call-sheet' && action.verb === 'photograph') {
    addEvidence(next, 'panel-program')
    unlockTopic(next, 'schedule')
    return withLine(
      next,
      'Iris: The time was changed by hand. Save this before anyone loses it.',
    )
  }
  if (action.target === 'poster' && action.verb === 'photograph') {
    addEvidence(next, 'licensing-poster')
    unlockTopic(next, 'royalties')
    return withLine(
      next,
      'Nico: A lifetime likeness license? That does not sound suspicious at all.',
    )
  }
  if (action.target === 'clerk' && action.verb === 'talk') {
    unlockTopic(next, 'schedule')
    return withLine(
      next,
      state.actor === 'iris'
        ? 'Marta: Photographers are booked through the press desk. Show me the assignment.'
        : 'Marta: Bloggers are not press. Even if they describe themselves as voracious.',
    )
  }
  if (action.target === 'clerk' && action.verb === 'use') {
    if (state.actor === 'iris' && has(next, 'commission-photo')) {
      next.flags = addUnique(next.flags, 'press-badge')
      next.inventory = addUnique(next.inventory, 'press-badge')
      return withLine(
        next,
        'Marta: Your assignment checks out, Iris. Two press passes, on one condition: behave.',
      )
    }
    if (state.actor === 'nico' && has(next, 'fan-pass')) {
      next.flags = addUnique(next.flags, 'press-badge')
      next.inventory = addUnique(
        next.inventory.filter((item) => item !== 'fan-pass'),
        'press-badge',
      )
      return withLine(
        next,
        'Nico: I found a lost pass. Marta: Wonderful. I can convert it to a temporary press badge.',
      )
    }
    return withLine(
      state,
      'Marta needs convincing evidence of an invitation or a valid day pass.',
      false,
    )
  }
  if (has(next, 'murder') && action.target === 'celestine') {
    return withLine(
      state,
      'Celestine is gone. Her unusual return is upstairs.',
      false,
    )
  }
  if (action.target === 'celestine' && action.verb === 'talk') {
    unlockTopic(next, 'royalties')
    return withLine(
      next,
      'Celestine: Ask me what they owe. Not whether I am dating Countess Vespera.',
    )
  }
  if (
    action.target === 'stage' &&
    action.verb === 'use' &&
    has(next, 'murder')
  ) {
    return withLine(state, 'The anniversary panel has already ended.', false)
  }
  if (
    action.target === 'stage' &&
    action.verb === 'use' &&
    has(next, 'press-badge')
  ) {
    next.flags = addUnique(next.flags, 'murder')
    unlockTopic(next, 'fan-alibi')
    return withLine(
      next,
      'The lights die. A shout rises from upstairs. Celestine is found behind a locked door. The panel is over.',
    )
  }
  if (
    action.target === 'ghost' &&
    action.verb === 'talk' &&
    has(next, 'murder')
  ) {
    next.flags = addUnique(next.flags, 'ghost-met')
    unlockTopic(next, 'last-sensation')
    unlockTopic(next, 'royalties')
    return withLine(
      next,
      'Celestine: Do not ask who killed me. If I knew, this would be a shorter game.',
    )
  }
  if (action.target === 'gavin' && action.verb === 'talk') {
    next.flags = addUnique(next.flags, 'fan-reported')
    unlockTopic(next, 'fan-alibi')
    return withLine(
      next,
      'Gavin: She must have noticed my photographs. Iris: That is harassment, not a love story.',
    )
  }
  if (
    action.target === 'camera' &&
    action.verb === 'photograph' &&
    has(next, 'murder')
  ) {
    addEvidence(next, 'fan-photo')
    if (has(next, 'porter-log')) addEvidence(next, 'fan-exonerated')
    return withLine(
      next,
      'The photo includes a courtyard clock. His location can be checked against the lift log.',
    )
  }
  if (action.target === 'bell' && action.verb === 'photograph') {
    addEvidence(next, 'bell-scratch')
    unlockTopic(next, 'service-bell')
    return withLine(
      next,
      'Iris: An old bell does not get a fresh scratch on its own.',
    )
  }
  if (action.target === 'latch' && action.verb === 'photograph') {
    addEvidence(next, 'locked-latch')
    return withLine(
      next,
      'Nico: The latch was thrown from inside. A conventional alibi will not do.',
    )
  }
  if (action.target === 'porter' && action.verb === 'talk') {
    unlockTopic(next, 'service-bell')
    return withLine(
      next,
      'Pip: I log every service lift call. It is the only thing the hotel keeps in order.',
    )
  }
  if (
    action.target === 'desk' &&
    action.verb === 'use' &&
    has(next, 'murder')
  ) {
    if (!has(next, 'ghost-memory'))
      return withLine(
        state,
        'We should interview our most unusual witness before filing.',
        false,
      )
    if (has(next, 'fan-exonerated') && has(next, 'rights-dispute')) {
      next.ending = 'responsible'
      return withLine(
        next,
        'Iris: Publish the timeline, not the rumor. Nico: And give both our names top billing.',
      )
    }
    next.ending = 'reckless'
    return withLine(
      next,
      'Nico prints an early accusation. By dawn the blog has clicks, but the people in it have to repair the damage.',
    )
  }
  return withLine(state, note(state, action.target, action.verb), false)
}

export function restoreCase(value: unknown): CaseState | null {
  if (!value || typeof value !== 'object') return null
  const state = value as CaseState
  if (
    state.version !== 1 ||
    !Object.prototype.hasOwnProperty.call(HOTEL_ROOMS, state.room)
  )
    return null
  if (state.actor !== 'nico' && state.actor !== 'iris') return null
  for (const key of [
    'flags',
    'evidence',
    'topics',
    'inventory',
    'asked',
    'transcript',
  ] as const) {
    if (
      !Array.isArray(state[key]) ||
      !state[key].every((part) => typeof part === 'string')
    )
      return null
  }
  if (
    state.ending !== null &&
    state.ending !== 'responsible' &&
    state.ending !== 'reckless'
  )
    return null
  if (!Number.isInteger(state.seed)) return null
  return {
    ...state,
    flags: [...state.flags],
    evidence: [...state.evidence],
    topics: [...state.topics],
    inventory: [...state.inventory],
    asked: [...state.asked],
    transcript: [...state.transcript],
  }
}
