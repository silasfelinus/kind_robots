/**
 * MONSTRIQUE, a deterministic adult monster-celebrity comedy mystery.
 * The convention is a distinct city venue; the murders happen at a motel.
 * Iris is the physical field investigator. Norb can observe and question,
 * but his germophobia prevents touching objects, using or photographing them.
 */
export type Investigator = 'iris' | 'nico'
export type RoomId =
  | 'motel-exterior'
  | 'front-office'
  | 'ice-alcove'
  | 'balcony'
  | 'investigators-room'
  | 'neighbor-room'
  | 'odette-room'
  | 'city-map'
  | 'convention-center'
export type Verb =
  'walk' | 'look' | 'talk' | 'take' | 'use' | 'photograph' | 'ask'
export type CaseEnding = 'lead-earned' | 'reckless'

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
  version: 2
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
  'motel-exterior': {
    id: 'motel-exterior',
    label: 'Last Call Motor Lodge',
    floor: 0,
    caption:
      'Rain patters against a two-storey motel. The ice machine hums beneath a crooked MONSTRIQUE billboard.',
    exits: ['front-office', 'ice-alcove', 'city-map'],
    hotspots: [
      {
        id: 'motel-sign',
        label: 'Flickering motel sign',
        x: 44,
        y: 22,
        verbs: ['look', 'photograph'],
      },
      {
        id: 'gavin',
        label: 'Intrusive fanboy',
        x: 75,
        y: 66,
        verbs: ['look', 'talk', 'ask'],
      },
      {
        id: 'fan-camera',
        label: 'Fan camera',
        x: 82,
        y: 81,
        verbs: ['look', 'photograph'],
      },
    ],
  },
  'front-office': {
    id: 'front-office',
    label: 'Motel Front Office',
    floor: 1,
    caption:
      'A dust-covered counter, sticky key rack and guest register. Norb declines the complimentary pen.',
    exits: ['motel-exterior', 'balcony'],
    hotspots: [
      {
        id: 'marta',
        label: 'Marta, motel manager',
        x: 60,
        y: 50,
        verbs: ['look', 'talk', 'ask', 'use'],
      },
      {
        id: 'guest-ledger',
        label: 'Guest register',
        x: 25,
        y: 67,
        verbs: ['look', 'photograph'],
      },
    ],
  },
  'ice-alcove': {
    id: 'ice-alcove',
    label: 'Ice Machine Alcove',
    floor: 1,
    caption:
      'A machine clanks twice every so often. An ancient sign says FREE ICE. Most promises here are lies.',
    exits: ['motel-exterior', 'balcony'],
    hotspots: [
      {
        id: 'ice-machine',
        label: 'Temperamental ice machine',
        x: 55,
        y: 57,
        verbs: ['look', 'use', 'photograph'],
      },
      {
        id: 'maintenance-log',
        label: 'Maintenance log',
        x: 19,
        y: 40,
        verbs: ['look', 'photograph'],
      },
      {
        id: 'sewer-hatch',
        label: 'Locked sewer hatch',
        x: 76,
        y: 83,
        verbs: ['look', 'use'],
      },
    ],
  },
  balcony: {
    id: 'balcony',
    label: 'Second-Floor Balcony',
    floor: 2,
    caption:
      'Thin walls, peeling wallpaper and one neighbor who heard entirely too much.',
    exits: [
      'front-office',
      'ice-alcove',
      'investigators-room',
      'neighbor-room',
      'odette-room',
    ],
    hotspots: [
      {
        id: 'room-door',
        label: 'Odette’s room door',
        x: 62,
        y: 48,
        verbs: ['look', 'use'],
      },
      {
        id: 'footprints',
        label: 'Wet prints on the balcony',
        x: 29,
        y: 83,
        verbs: ['look', 'photograph'],
      },
    ],
  },
  'investigators-room': {
    id: 'investigators-room',
    label: 'Iris and Norb’s Room',
    floor: 2,
    caption:
      'Two suitcases, one cramped bed and a portable evidence desk Norb has not touched.',
    exits: ['balcony'],
    hotspots: [
      {
        id: 'desk',
        label: 'Portable case desk',
        x: 33,
        y: 72,
        verbs: ['look', 'use'],
      },
      {
        id: 'nico',
        label: 'Norb and his immaculate gloves',
        x: 68,
        y: 53,
        verbs: ['look', 'talk', 'ask'],
      },
    ],
  },
  'neighbor-room': {
    id: 'neighbor-room',
    label: 'Next Door, Room 204',
    floor: 2,
    caption:
      'A TV plays the MONSTRIQUE idol special. The guest next door heard the evening very clearly.',
    exits: ['balcony'],
    hotspots: [
      {
        id: 'neighbor',
        label: 'Sleepless neighbor',
        x: 59,
        y: 54,
        verbs: ['look', 'talk', 'ask'],
      },
      {
        id: 'wall-clock',
        label: 'Clock beside the TV',
        x: 29,
        y: 27,
        verbs: ['look', 'photograph'],
      },
    ],
  },
  'odette-room': {
    id: 'odette-room',
    label: 'Odette’s Room, 205',
    floor: 2,
    caption:
      'Two women lie motionless. One ornate knife, no clear assailant. A second set of voices rises from the mirror.',
    exits: ['balcony'],
    hotspots: [
      {
        id: 'knife',
        label: 'Ornate stage knife',
        x: 47,
        y: 74,
        verbs: ['look', 'photograph'],
      },
      {
        id: 'odette-body',
        label: 'Odette’s body',
        x: 25,
        y: 81,
        verbs: ['look', 'photograph'],
      },
      {
        id: 'violet-body',
        label: 'Violet’s body',
        x: 69,
        y: 80,
        verbs: ['look', 'photograph'],
      },
      {
        id: 'odette-ghost',
        label: 'Odette’s impatient ghost',
        x: 38,
        y: 35,
        verbs: ['look', 'talk', 'ask'],
      },
      {
        id: 'violet-ghost',
        label: 'Violet’s observant ghost',
        x: 68,
        y: 41,
        verbs: ['look', 'talk', 'ask'],
      },
    ],
  },
  'city-map': {
    id: 'city-map',
    label: 'The Monstrique City Map',
    floor: 0,
    caption:
      'The city unfolds: a convention hall, a supernatural joke shop, a vampire mansion and something beneath the drains.',
    exits: ['motel-exterior', 'convention-center'],
    hotspots: [
      {
        id: 'joke-shop',
        label: 'Spooky supernatural joke shop',
        x: 35,
        y: 49,
        verbs: ['look'],
      },
      {
        id: 'mansion',
        label: 'Draculina’s mansion',
        x: 78,
        y: 22,
        verbs: ['look'],
      },
      {
        id: 'sewers',
        label: 'Sewer entrance',
        x: 66,
        y: 82,
        verbs: ['look'],
      },
    ],
  },
  'convention-center': {
    id: 'convention-center',
    label: 'MONSTRIQUE Convention Center',
    floor: 1,
    caption:
      'An enormous idol poster presides over autographs, models, fans and contracts worth killing for.',
    exits: ['city-map'],
    hotspots: [
      {
        id: 'idol-poster',
        label: 'Monstrique idol group poster',
        x: 51,
        y: 42,
        verbs: ['look', 'photograph'],
      },
      {
        id: 'mummy-actress',
        label: 'Celestine, the mummy star',
        x: 75,
        y: 58,
        verbs: ['look', 'talk'],
      },
    ],
  },
}

export const CITY_DESTINATIONS = [
  {
    id: 'convention-center',
    label: 'MONSTRIQUE Convention',
    availableInOpening: true,
  },
  {
    id: 'joke-shop',
    label: 'Supernatural Joke Shop',
    availableInOpening: false,
  },
  { id: 'mansion', label: 'Draculina’s Mansion', availableInOpening: false },
  {
    id: 'sewers',
    label: 'Sewers Beneath the Motel',
    availableInOpening: false,
  },
] as const

export const TOPICS: Record<string, string> = {
  'room-access': 'Access to Room 205',
  'unknown-visitor': 'The mysterious visitor',
  'ice-clank': 'The double ice-machine clang',
  'knife-origin': 'Origin of the ornate knife',
  'agent-deals': 'Odette’s many Monstrique deals',
  'violet-witness': 'What Violet remembers',
  'fan-alibi': 'Where Gavin was',
  'idol-schedule': 'Monstrique idol rehearsal',
  'ghost-accounts': 'The ghosts’ conflicting accounts',
}

export const EVIDENCE: Record<string, string> = {
  'motel-photo': 'Photograph of the Last Call Motor Lodge',
  'guest-ledger': 'Motel ledger showing Room 205',
  'double-murder': 'Two deceased women in Room 205',
  'knife-photo': 'Ornate knife photographed in place',
  'odette-photo': 'Odette’s position documented',
  'violet-photo': 'Violet’s position documented',
  'ice-timing': 'Documented ice-machine double clang',
  'neighbor-testimony': 'Neighbor heard an unknown visitor',
  'ghost-odette': 'Odette’s testimony about celebrity contracts',
  'ghost-violet': 'Violet’s separate sensory recollection',
  'fan-photo': 'Time-stamped photograph from the courtyard',
  'fan-exonerated': 'Gavin’s alibi for the double murder',
  'knife-prop-mark': 'Distinctive stage-prop manufacturer’s mark',
  'idol-poster': 'Monstrique idol rehearsal and promotional schedule',
}

export function newCase(seed = 1): CaseState {
  return {
    version: 2,
    seed,
    room: 'motel-exterior',
    actor: 'iris',
    flags: [],
    evidence: [],
    topics: [],
    inventory: ['camera'],
    asked: [],
    transcript: [
      'Iris: Two people killed at a motel. Norb: Please handle every object in the room. Every single one.',
    ],
    ending: null,
  }
}

function copyState(state: CaseState): CaseState {
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
function add(list: string[], value: string): void {
  if (!list.includes(value)) list.push(value)
}
function has(state: CaseState, value: string): boolean {
  return (
    state.evidence.includes(value) ||
    state.flags.includes(value) ||
    state.inventory.includes(value)
  )
}
function withLine(state: CaseState, line: string, changed = true): CaseResult {
  if (!changed) return { state, line, changed: false }
  return {
    state: { ...state, transcript: [...state.transcript, line] },
    line,
    changed,
  }
}

export function switchInvestigator(state: CaseState): CaseResult {
  if (state.ending)
    return withLine(state, 'This report has already gone to press.', false)
  const actor: Investigator = state.actor === 'iris' ? 'nico' : 'iris'
  const line =
    actor === 'nico'
      ? 'Norb: I will investigate with my eyes, and neither of us will touch the carpet.'
      : 'Iris: I will do the touching. You can keep having brilliant thoughts at a safe distance.'
  return withLine({ ...state, actor }, line)
}

export function travel(state: CaseState, destination: RoomId): CaseResult {
  if (state.ending)
    return withLine(state, 'The opening chapter has ended.', false)
  if (!HOTEL_ROOMS[state.room].exits.includes(destination))
    return withLine(
      state,
      'There is no direct way there from this room.',
      false,
    )
  if (destination === 'odette-room' && !has(state, 'crime-room-access'))
    return withLine(
      state,
      'Room 205 is sealed. Find a legitimate way to enter.',
      false,
    )
  if (destination === 'city-map' && !has(state, 'city-lead'))
    return withLine(
      state,
      'The convention can wait until the motel evidence points somewhere.',
      false,
    )
  const next = copyState(state)
  next.room = destination
  if (destination === 'odette-room') {
    add(next.flags, 'double-murder-discovered')
    add(next.evidence, 'double-murder')
    add(next.topics, 'ghost-accounts')
    add(next.topics, 'knife-origin')
  }
  return withLine(next, HOTEL_ROOMS[destination].caption)
}

export function availableTopics(state: CaseState, target: string): string[] {
  const supported: Record<string, string[]> = {
    marta: ['room-access', 'unknown-visitor'],
    neighbor: ['unknown-visitor', 'ice-clank'],
    nico: ['knife-origin', 'ghost-accounts', 'ice-clank'],
    gavin: ['fan-alibi'],
    'odette-ghost': ['agent-deals', 'ghost-accounts', 'knife-origin'],
    'violet-ghost': ['violet-witness', 'ice-clank', 'ghost-accounts'],
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
  if (!availableTopics(state, target).includes(topic))
    return withLine(
      state,
      'You have not discovered that question or already asked it.',
      false,
    )
  const next = copyState(state)
  add(next.asked, state.actor + ':' + target + ':' + topic)
  const iris = state.actor === 'iris'
  if (target === 'marta' && topic === 'room-access') {
    add(next.flags, 'crime-room-access')
    add(next.inventory, 'motel-key')
    return withLine(
      next,
      iris
        ? 'Marta: I let you investigate because your press credentials and the missing guest both check out. Here is the emergency key.'
        : 'Marta: I trust Iris to handle the key, Norb. You already asked for a disinfectant bucket.',
    )
  }
  if (target === 'neighbor' && topic === 'unknown-visitor') {
    add(next.evidence, 'neighbor-testimony')
    add(next.flags, 'crime-room-access')
    add(next.topics, 'ice-clank')
    return withLine(
      next,
      iris
        ? 'Neighbor: Two women, then a third voice at the door. I heard an awful noise. The fire escape gives emergency access.'
        : 'Neighbor: It was three sets of footsteps, sir. You can count them without coming any closer.',
    )
  }
  if (target === 'neighbor' && topic === 'ice-clank') {
    add(next.evidence, 'ice-timing')
    return withLine(
      next,
      'Neighbor: The ice machine clanged twice just before the shouting. My clock was five minutes fast.',
    )
  }
  if (target === 'odette-ghost' && topic === 'agent-deals') {
    add(next.evidence, 'ghost-odette')
    add(next.topics, 'idol-schedule')
    return withLine(
      next,
      iris
        ? 'Odette: Every Monstrique star had a reason to loathe me. Contracts, endorsements, the idol group. Start at the convention.'
        : 'Odette: My clients were monsters, darling. Not all of them supernatural.',
    )
  }
  if (target === 'violet-ghost' && topic === 'violet-witness') {
    add(next.evidence, 'ghost-violet')
    add(next.topics, 'ice-clank')
    return withLine(
      next,
      iris
        ? 'Violet: I heard the ice machine twice. The person at the door knew Odette. I cannot remember their face.'
        : 'Violet: Nobody warned us. I remember two clanks and someone greeting Odette by name.',
    )
  }
  if (target === 'gavin' && topic === 'fan-alibi') {
    add(next.evidence, 'fan-photo')
    if (has(next, 'ice-timing') || has(next, 'neighbor-testimony'))
      add(next.evidence, 'fan-exonerated')
    return withLine(
      next,
      'Gavin: I was photographing a convention billboard. Iris: That is still not permission to photograph women through windows.',
    )
  }
  if (target === 'nico' && topic === 'knife-origin') {
    if (has(next, 'knife-photo')) add(next.evidence, 'knife-prop-mark')
    return withLine(
      next,
      'Norb: The maker’s seal looks theatrical. Do photograph it; I decline to touch the blade.',
    )
  }
  if (target === 'nico' && topic === 'ice-clank') {
    add(next.topics, 'ghost-accounts')
    return withLine(
      next,
      'Norb: Ice timing supplies a clock. We must ask both dead women what they heard.',
    )
  }
  if (target === 'odette-ghost' && topic === 'ghost-accounts')
    return withLine(
      next,
      'Odette: All I remember is a sharp interruption to a very expensive evening. Do not ask me for a face.',
    )
  if (target === 'violet-ghost' && topic === 'ghost-accounts')
    return withLine(
      next,
      'Violet: The voice was familiar to Odette. We heard different things because she was looking at me.',
    )
  if (target === 'marta' && topic === 'unknown-visitor') {
    add(next.evidence, 'guest-ledger')
    return withLine(
      next,
      'Marta: Three different people were seen near Room 205. None checked in at that time.',
    )
  }
  return withLine(
    next,
    iris
      ? 'Iris: I will compare that with the other witness.'
      : 'Norb: A hypothesis is not evidence, however cleanly arranged.',
  )
}

export function performAction(
  state: CaseState,
  action: CaseAction,
): CaseResult {
  if (state.ending)
    return withLine(state, 'The opening report has been filed.', false)
  const hotspot = HOTEL_ROOMS[state.room].hotspots.find(
    (item) => item.id === action.target,
  )
  if (!hotspot || !hotspot.verbs.includes(action.verb))
    return withLine(
      state,
      'There is nothing useful to do with that here.',
      false,
    )
  if (
    state.actor === 'nico' &&
    ['take', 'use', 'photograph'].includes(action.verb)
  )
    return withLine(
      state,
      'Norb: Touch that? Absolutely not. Iris, please.',
      false,
    )
  if (action.verb === 'ask')
    return interview(state, action.target, action.topic ?? '')
  const next = copyState(state)
  const target = action.target
  const verb = action.verb
  const iris = state.actor === 'iris'

  if (verb === 'look') {
    if (target === 'guest-ledger') {
      add(next.evidence, 'guest-ledger')
      add(next.topics, 'room-access')
    } else if (target === 'ice-machine' || target === 'maintenance-log') {
      add(next.topics, 'ice-clank')
    } else if (target === 'knife') {
      add(next.topics, 'knife-origin')
      if (!iris && has(next, 'knife-photo'))
        add(next.evidence, 'knife-prop-mark')
    } else if (
      target === 'mansion' ||
      target === 'joke-shop' ||
      target === 'sewers'
    ) {
      return withLine(
        state,
        'A lead points here, but the rest of the city is not part of this opening chapter.',
        false,
      )
    }
    const observations: Record<string, string> = {
      knife: iris
        ? 'Iris: A jewel-handled show knife. I should photograph it exactly where it fell.'
        : 'Norb: A counterfeit jewel is inset near the maker’s mark. I can study the photograph.',
      'odette-body':
        'Iris: The agent was killed here. I will document the scene with care.',
      'violet-body':
        'Iris: Violet was also killed. She matters to this case as much as the agent.',
      'ice-machine':
        'Norb: The machine produces a distinct double clang. A very unromantic metronome.',
      gavin: 'Iris: He is a stalker. That does not make him our murderer.',
      'sewer-hatch':
        'Something large is singing idol songs beneath the drainage grate.',
    }
    return withLine(
      next,
      observations[target] ?? HOTEL_ROOMS[state.room].caption,
    )
  }
  if (target === 'motel-sign' && verb === 'photograph') {
    add(next.evidence, 'motel-photo')
    return withLine(
      next,
      'Iris: This is the crime scene, not the convention. Different addresses, different problems.',
    )
  }
  if (target === 'guest-ledger' && verb === 'photograph') {
    add(next.evidence, 'guest-ledger')
    add(next.topics, 'room-access')
    return withLine(
      next,
      'Iris: Odette and Violet were in 205. Our room is just down the balcony.',
    )
  }
  if (target === 'marta' && verb === 'talk') {
    add(next.topics, 'room-access')
    return withLine(
      next,
      'Marta: There are two missing women in 205. If you have a legitimate reason, ask about emergency access.',
    )
  }
  if (target === 'marta' && verb === 'use') {
    if (!has(next, 'guest-ledger'))
      return withLine(
        state,
        'Marta: Check the room register before I give out any keys.',
        false,
      )
    add(next.flags, 'crime-room-access')
    add(next.inventory, 'motel-key')
    return withLine(
      next,
      'Marta: Here. Iris handles the key. Norb can stand somewhere hygienic.',
    )
  }
  if (target === 'neighbor' && verb === 'talk') {
    add(next.topics, 'unknown-visitor')
    add(next.topics, 'ice-clank')
    return withLine(
      next,
      'Neighbor: Someone knocked at 205, then I heard the machine and a terrible crash. Ask me about the visitor.',
    )
  }
  if (target === 'wall-clock' && verb === 'photograph') {
    add(next.evidence, 'ice-timing')
    return withLine(
      next,
      'Iris: The clock and neighbor’s account independently time the double clang.',
    )
  }
  if (target === 'ice-machine' && verb === 'photograph') {
    add(next.evidence, 'ice-timing')
    add(next.topics, 'ice-clank')
    return withLine(
      next,
      'Iris: I timed both clanks. A murder mystery now has a clock.',
    )
  }
  if (target === 'maintenance-log' && verb === 'photograph') {
    add(next.evidence, 'ice-timing')
    return withLine(
      next,
      'Iris: Maintenance logged the exact moment the ice dispenser restarted.',
    )
  }
  if (target === 'ice-machine' && verb === 'use') {
    add(next.topics, 'ice-clank')
    return withLine(
      next,
      'Iris: Clank, clank. Norb: Splendid. Now please wash your hands.',
    )
  }
  if (target === 'sewer-hatch' && verb === 'use')
    return withLine(
      state,
      'The hatch is locked. Somebody below is rehearsing a very ambitious chorus.',
      false,
    )
  if (target === 'room-door' && verb === 'use')
    return withLine(
      next,
      has(next, 'crime-room-access')
        ? 'Iris: The emergency route to 205 is ready. I will open it from the balcony map.'
        : 'Iris: Room 205 is sealed. We need Marta or a neighbor to authorize access.',
    )
  if (target === 'gavin' && verb === 'talk') {
    add(next.flags, 'stalker-reported')
    add(next.topics, 'fan-alibi')
    return withLine(
      next,
      'Iris: Following someone with a camera is not courtship. Gavin: But my pictures prove where I was.',
    )
  }
  if (target === 'fan-camera' && verb === 'photograph') {
    add(next.evidence, 'fan-photo')
    add(next.topics, 'fan-alibi')
    if (has(next, 'ice-timing') || has(next, 'neighbor-testimony'))
      add(next.evidence, 'fan-exonerated')
    return withLine(
      next,
      'Iris: The billboard and a visible time display place Gavin away from Room 205.',
    )
  }
  if (target === 'knife' && verb === 'photograph') {
    add(next.evidence, 'knife-photo')
    add(next.topics, 'knife-origin')
    return withLine(
      next,
      'Iris: One ornate stage knife. Both victims. The blade has a manufacturer’s emblem.',
    )
  }
  if (
    (target === 'odette-body' || target === 'violet-body') &&
    verb === 'photograph'
  ) {
    add(
      next.evidence,
      target === 'odette-body' ? 'odette-photo' : 'violet-photo',
    )
    return withLine(
      next,
      'Iris: Both women deserve a careful investigation, not a lurid headline.',
    )
  }
  if (target === 'odette-ghost' && verb === 'talk') {
    add(next.flags, 'odette-met')
    add(next.topics, 'agent-deals')
    add(next.topics, 'ghost-accounts')
    return withLine(
      next,
      'Odette: I am dead, yes. I do not know who did it. I could name twenty people who wished me harm.',
    )
  }
  if (target === 'violet-ghost' && verb === 'talk') {
    add(next.flags, 'violet-met')
    add(next.topics, 'violet-witness')
    add(next.topics, 'ghost-accounts')
    return withLine(
      next,
      'Violet: I remember the sound, not the face. And I would like to be more than a footnote to Odette.',
    )
  }
  if (target === 'nico' && verb === 'talk') {
    add(next.topics, 'knife-origin')
    add(next.topics, 'ice-clank')
    return withLine(
      next,
      'Iris: You look almost kissable. Norb: You are leaning on an unsterilized lamp. Please stop.',
    )
  }
  if (target === 'desk' && verb === 'use') {
    if (!has(next, 'double-murder'))
      return withLine(
        state,
        'Norb: We have not seen the scene yet. Please do not fabricate the headline.',
        false,
      )
    if (!has(next, 'ghost-odette') || !has(next, 'ghost-violet'))
      return withLine(
        state,
        'Iris: Both women were there. We must hear both accounts before filing.',
        false,
      )
    const ready = ['knife-photo', 'ice-timing', 'fan-exonerated'].every((key) =>
      has(next, key),
    )
    if (!ready) {
      next.ending = 'reckless'
      return withLine(
        next,
        'Norb: Publishing a suspect without the knife, time and alibi is reckless. Iris knows we should have waited.',
      )
    }
    add(next.flags, 'city-lead')
    add(next.topics, 'idol-schedule')
    return withLine(
      next,
      'Iris: The knife is a MONSTRIQUE prop. Norb: Let us examine the real convention center, not this filthy motel.',
    )
  }
  if (target === 'idol-poster' && verb === 'photograph') {
    if (!has(next, 'city-lead'))
      return withLine(
        state,
        'The convention is not yet open to this investigation.',
        false,
      )
    add(next.evidence, 'idol-poster')
    next.ending = 'lead-earned'
    return withLine(
      next,
      'Iris: Every actress and idol had a deal with Odette. Norb: Good. Our next chapter now has a real lead.',
    )
  }
  if (target === 'mummy-actress' && verb === 'talk') {
    add(next.topics, 'idol-schedule')
    return withLine(
      next,
      'Celestine: Mummy is my role, darling. Odette represented my whole career. Bring me evidence, not gossip.',
    )
  }
  return withLine(state, HOTEL_ROOMS[state.room].caption, false)
}

export function restoreCase(value: unknown): CaseState | null {
  if (!value || typeof value !== 'object') return null
  const state = value as CaseState
  if (
    state.version !== 2 ||
    !Object.prototype.hasOwnProperty.call(HOTEL_ROOMS, state.room)
  )
    return null
  if (state.actor !== 'iris' && state.actor !== 'nico') return null
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
    state.ending !== 'lead-earned' &&
    state.ending !== 'reckless'
  )
    return null
  if (!Number.isInteger(state.seed)) return null
  return copyState(state)
}

export const monstrexxKitId = (accountId: string | number): string =>
  `monstress-convention-user-${accountId}`
