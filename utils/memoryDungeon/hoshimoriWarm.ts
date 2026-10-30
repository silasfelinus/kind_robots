/**
 * Hoshimori's first connected sixteen-site authoring slice.
 * This pure engine is not a released third overworld: the existing e07
 * campaign route and Chronicle pickups remain gated until UI integration.
 */
export interface HoshimoriChoice {
  id: string
  label: string
  outcome: string
  rations?: number
  trust?: number
  flag: string
}

export interface HoshimoriSite {
  key: string
  title: string
  opening: string
  choices: readonly [HoshimoriChoice, HoshimoriChoice]
}

function site(
  key: string,
  title: string,
  opening: string,
  first: HoshimoriChoice,
  second: HoshimoriChoice,
): HoshimoriSite {
  return { key, title, opening, choices: [first, second] }
}

export const HOSHIMORI_WARM_SITES: readonly HoshimoriSite[] = [
  site(
    '1,1',
    'The Cedar Footbridge',
    'The river carries empty sandals toward a lantern supper. Pip insists the shoes count as guests, though nobody knows who took them off.',
    {
      id: 'seat',
      label: 'Spend a ration to set a place for the missing guest',
      outcome:
        'A seat remains empty but nobody is turned away. Pip writes a question mark where a name should be.',
      rations: -1,
      trust: 1,
      flag: 'guest-seated',
    },
    {
      id: 'listen',
      label: 'Follow the sandals to learn who is absent',
      outcome:
        'The current leads toward a locked household. You learn where to ask, but the hungry guests still need supper.',
      flag: 'guest-traced',
    },
  ),
  site(
    '2,1',
    'The Singing Rice Terraces',
    'A harvest song travels uphill without singers. Every time its final note returns, a lantern brightens above the paddy.',
    {
      id: 'sing',
      label: 'Return the final note without claiming the harvest',
      outcome:
        'The terraces answer with a lantern sign. The farmers remember your restraint.',
      trust: 1,
      flag: 'rice-song',
    },
    {
      id: 'gather',
      label: 'Gather fallen rice for the hungry travelers',
      outcome:
        'You recover a meal from the path, but the watchkeeper asks who will replant what you take.',
      rations: 1,
      trust: -1,
      flag: 'rice-gathered',
    },
  ),
  site(
    '3,1',
    'The Persimmon Steps',
    'Rain beads on orange fruit. A child-sized coat hangs from a branch, carefully mended and never collected.',
    {
      id: 'share',
      label: 'Leave food for whoever owns the coat',
      outcome:
        'The coat disappears at dusk. You cannot know whether its owner ate, but someone has tied a grateful knot in the sleeve.',
      rations: -1,
      trust: 2,
      flag: 'coat-fed',
    },
    {
      id: 'watch',
      label: 'Guard the coat from the weather',
      outcome:
        'You save the little garment and learn that kindness is not always something you can count in meals.',
      trust: 1,
      flag: 'coat-guarded',
    },
  ),
  site(
    '4,1',
    'Orchard of Floating Lanterns',
    'An old lantern floats upside down beneath a branch. The orchard keeper says it belonged to someone who stopped coming home.',
    {
      id: 'repair',
      label: 'Repair the wick before asking for the story',
      outcome:
        'The keeper tells you which road the absent neighbor used, because you helped without bargaining for it.',
      trust: 1,
      flag: 'orchard-repaired',
    },
    {
      id: 'mark',
      label: 'Mark the unlit route on Pip’s map',
      outcome:
        'You preserve a possible path without claiming that its traveler survived.',
      flag: 'orchard-marked',
    },
  ),
  site(
    '1,2',
    'The Lantern Stall',
    'Three painted lanterns hang over the stall. The vendor points to the first position in the festival sequence and invites you to remember its symbol.',
    {
      id: 'tend',
      label: 'Help trim the wicks',
      outcome:
        'The stall stays open for late arrivals. The vendor repeats the first lantern clue without demanding a fee.',
      trust: 1,
      flag: 'wicks-tended',
    },
    {
      id: 'borrow',
      label: 'Borrow a meal against tomorrow’s delivery',
      outcome:
        'You receive food, but the debt is entered under your name rather than the vendor’s.',
      rations: 1,
      trust: -1,
      flag: 'stall-debt',
    },
  ),
  site(
    '2,2',
    'Pip’s Ledger House',
    'Pip remembers apprenticing here, counting every borrowed bowl. He cannot recall who fed him on his first night, and the missing name is in his own handwriting.',
    {
      id: 'trace',
      label: 'Help Pip trace the anonymous meal',
      outcome:
        'Pip admits he erased a benefactor to keep the village from demanding repayment. He will testify if the Oven asks who was protected.',
      trust: 1,
      flag: 'pip-testimony',
    },
    {
      id: 'protect',
      label: 'Let Pip protect the giver’s identity',
      outcome:
        'Pip keeps the name private and promises to challenge any claim that the meal was a debt. The witness will remain anonymous.',
      trust: 1,
      flag: 'pip-privacy',
    },
  ),
  site(
    '3,2',
    'Shrine of the Third Light',
    'A household spirit sweeps the steps with a broom older than the shrine. It shows you the third lantern symbol and asks whether safety can be offered without ownership.',
    {
      id: 'welcome',
      label: 'Leave a meal where any traveler may take it',
      outcome:
        'The spirit opens the shrine to strangers. No guest must pledge to stay in exchange for food.',
      rations: -1,
      trust: 2,
      flag: 'shrine-open',
    },
    {
      id: 'ask',
      label: 'Ask the spirit what a safe household promises',
      outcome:
        'It says a home must also have a door that opens outward. You keep the warning for the Oven.',
      flag: 'shrine-warning',
    },
  ),
  site(
    '4,2',
    'The Bakery Back Door',
    'The baker offers passage to the Red Oven: either a meal for the waiting queue or a promise to help settle the village’s accounts.',
    {
      id: 'offer',
      label: 'Donate a ration for the waiting queue',
      outcome:
        'The baker opens the Oven door. A family eats now, though you have less to carry beyond the village.',
      rations: -1,
      trust: 1,
      flag: 'oven-passage-offer',
    },
    {
      id: 'pledge',
      label: 'Promise to account for the missing memories',
      outcome:
        'The baker grants passage, but Pip warns that the promise will follow you even if you leave.',
      trust: -1,
      flag: 'oven-passage-pledge',
    },
  ),
  site(
    '1,3',
    'The Returning Slippers',
    'A procession of empty slippers marches out of the stream. A living umbrella tries to shelter each one from rain it cannot feel.',
    {
      id: 'return',
      label: 'Carry the slippers back to the bridge',
      outcome:
        'The umbrella bows and gives the travelers a dry crossing, but it refuses to guess who owns the shoes.',
      trust: 1,
      flag: 'slippers-returned',
    },
    {
      id: 'record',
      label: 'Record their sizes without inventing owners',
      outcome:
        'Pip gains a useful list and an uncomfortable reminder that an inventory is not a census.',
      flag: 'slippers-recorded',
    },
  ),
  site(
    '2,3',
    'The Night-Crew Photograph',
    'An Earth photograph shows Morrow bringing warm rolls to exhausted workers. It is evidence of a kindness, not proof that the stolen life has been forgiven.',
    {
      id: 'question',
      label: 'Ask who invited Morrow into the room',
      outcome:
        'You leave the question open until a living witness can answer it. The workers are more than a verdict on Morrow.',
      flag: 'e07-photo-question',
    },
    {
      id: 'hold',
      label: 'Keep the kindness beside the original harm',
      outcome:
        'The photograph joins your private account without cancelling the loss that brought you here.',
      flag: 'e07-photo-held',
    },
  ),
  site(
    '3,3',
    'The Guest Registry',
    'A kitsune clerk insists that every guest be named accurately. A family waiting outside has good reasons not to put its children on a public list.',
    {
      id: 'witness',
      label: 'Record a voluntary adult witness',
      outcome:
        'The clerk accepts an account that can be checked without conscripting the children as evidence.',
      trust: 1,
      flag: 'registry-witness',
    },
    {
      id: 'anonymous',
      label: 'Reserve places without exposing the family',
      outcome:
        'The clerk leaves four names blank. The record is less complete and the guests are safer.',
      flag: 'registry-private',
    },
  ),
  site(
    '4,3',
    'The Red Oven',
    'Bread rises without flour. Behind the furnace door, the village’s missing memories glow like coals. The lantern sequence or a costly bakery bargain can open the threshold.',
    {
      id: 'question',
      label: 'Ask which memories pay for the bread',
      outcome:
        'The baker admits the village never asked every donor. The ovens are feeding people and hiding a serious wrong.',
      flag: 'oven-questioned',
    },
    {
      id: 'serve',
      label: 'Feed the waiting family before arguing',
      outcome:
        'The family eats. The baker agrees that immediate hunger cannot settle the question of consent.',
      rations: -1,
      trust: 1,
      flag: 'oven-family-fed',
    },
  ),
  site(
    '1,4',
    'The Hillside Shelter',
    'A house spirit has kept one room warm for travelers, but its owner fears that an open door will bring more mouths than the village can feed.',
    {
      id: 'open',
      label: 'Contribute food so the room can stay open',
      outcome:
        'A tired traveler sleeps indoors. The house spirit learns that hospitality can be shared work.',
      rations: -1,
      trust: 2,
      flag: 'shelter-fed',
    },
    {
      id: 'repair',
      label: 'Mend the roof before inviting anyone',
      outcome:
        'The room stays dry, though tonight’s travelers must still find food elsewhere.',
      trust: 1,
      flag: 'shelter-mended',
    },
  ),
  site(
    '2,4',
    'The Tanuki’s Honest Market',
    'A trader in an oversized ceremonial hat advertises perfect fairness. His scales are accurate; the labels on the weights are not.',
    {
      id: 'audit',
      label: 'Correct the labels in front of everyone',
      outcome:
        'The trader loses face and keeps his shop. Customers can finally judge the bargain for themselves.',
      trust: 1,
      flag: 'market-audited',
    },
    {
      id: 'trade',
      label: 'Take the discounted meal and note the trick',
      outcome:
        'You gain food while the mislabeled weights remain for the next buyer. Pip notices.',
      rations: 1,
      trust: -1,
      flag: 'market-traded',
    },
  ),
  site(
    '3,4',
    'The Umbrella Workshop',
    'Living umbrellas refuse to be thrown away when their cloth tears. The repairer calls them stubborn; they call it survival.',
    {
      id: 'mend',
      label: 'Repair an umbrella and ask its permission',
      outcome:
        'It offers to shelter one traveler, but chooses the road itself.',
      trust: 1,
      flag: 'umbrella-mended',
    },
    {
      id: 'release',
      label: 'Help the umbrellas leave their owner’s hooks',
      outcome:
        'The workshop loses free labor. The umbrellas gain the right to return if they wish.',
      trust: 1,
      flag: 'umbrella-freed',
    },
  ),
  site(
    '4,4',
    'The Ember Path',
    'Beyond the bakery a safe road leads out of the village. A child has placed a lantern beside the gate, pointing in both directions.',
    {
      id: 'witness',
      label: 'Promise to return with an honest account',
      outcome:
        'Pip offers to carry your account to the next village, provided you do not claim it is the only truth.',
      trust: 1,
      flag: 'path-witnessed',
    },
    {
      id: 'depart',
      label: 'Leave without promising what you cannot deliver',
      outcome:
        'The gate stays open. You have not repaired the village, but neither have you trapped yourself in a false vow.',
      flag: 'path-departed',
    },
  ),
]

export const HOSHIMORI_LANTERN_CLUE_SITES = ['1,2', '2,1', '3,2'] as const
const LANTERN_ORDERS = [
  ['bell', 'leaf', 'flame'],
  ['bell', 'flame', 'leaf'],
  ['leaf', 'bell', 'flame'],
  ['leaf', 'flame', 'bell'],
  ['flame', 'bell', 'leaf'],
  ['flame', 'leaf', 'bell'],
] as const

export interface HoshimoriOvenRoom {
  id: string
  title: string
  opening: string
  choices: readonly [HoshimoriChoice, HoshimoriChoice]
}

export const HOSHIMORI_OVEN_ROOMS: readonly HoshimoriOvenRoom[] = [
  {
    id: 'OV-01',
    title: 'The Pantry Threshold',
    opening:
      'The pantry stores loaves beside jars of other people’s memories. Pip asks whether a full shelf can justify an empty childhood.',
    choices: [
      {
        id: 'audit',
        label: 'Count the jars and ask who consented',
        outcome:
          'The baker cannot produce consent for half the jars. The missing records matter more than the impressive stock.',
        flag: 'pantry-audited',
      },
      {
        id: 'feed',
        label: 'Feed a waiting family from your own supplies',
        outcome:
          'The family eats without surrendering a memory. Your dwindling pack makes the gesture costly.',
        rations: -1,
        trust: 1,
        flag: 'pantry-fed',
      },
    ],
  },
  {
    id: 'OV-02',
    title: 'The Ember Ledger',
    opening:
      'The furnace speaks in borrowed voices. Pip recognizes one entry from his apprenticeship, but will not let you force its owner to testify.',
    choices: [
      {
        id: 'consent',
        label: 'Separate volunteered memories from seized ones',
        outcome:
          'The furnace burns colder. It can still bake, but not by quietly taking what was never offered.',
        trust: 1,
        flag: 'ember-consent',
      },
      {
        id: 'pause',
        label: 'Bank the coals until the villagers can decide',
        outcome:
          'No new memories are taken tonight. The queue outside grows, and the emergency must be faced openly.',
        flag: 'ember-paused',
      },
    ],
  },
  {
    id: 'OV-03',
    title: 'The First Oven Hearing',
    opening:
      'Three households wait for an answer. This is a first hearing, not a final judgment on the Red Oven or the village.',
    choices: [
      {
        id: 'pact',
        label: 'Propose a witnessed, revocable food pact',
        outcome:
          'The households agree to discuss terms. Nobody is compelled to sign; tomorrow’s meals remain uncertain.',
        trust: 1,
        flag: 'hearing-pact',
      },
      {
        id: 'relief',
        label: 'Organize emergency meals without a new bargain',
        outcome:
          'The villagers begin a ration rota. It may not last, but it does not demand a single stolen memory.',
        flag: 'hearing-relief',
      },
    ],
  },
]

export type HoshimoriEvent =
  | { type: 'move'; to: string }
  | { type: 'choose'; id: string }
  | { type: 'light'; symbols: string[] }
  | { type: 'enter' }
  | { type: 'oven-choice'; id: string }
  | { type: 'leave' }

export interface HoshimoriWarmProgress {
  version: 1
  seed: number
  current: string
  visited: string[]
  choices: Record<string, string>
  rations: number
  trust: number
  flags: string[]
  lanternLit: boolean
  ovenRoom: string | null
  ovenChoices: Record<string, string>
  ovenComplete: boolean
  events: HoshimoriEvent[]
}

const SITES = new Map(HOSHIMORI_WARM_SITES.map((entry) => [entry.key, entry]))
const OVEN = new Map(HOSHIMORI_OVEN_ROOMS.map((entry) => [entry.id, entry]))

export function newHoshimoriWarmProgress(seed: number): HoshimoriWarmProgress {
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 2147483647)
    throw new Error('Invalid Hoshimori seed')
  return {
    version: 1,
    seed,
    current: '1,1',
    visited: ['1,1'],
    choices: {},
    rations: 2,
    trust: 0,
    flags: [],
    lanternLit: false,
    ovenRoom: null,
    ovenChoices: {},
    ovenComplete: false,
    events: [],
  }
}

export function hoshimoriLanternOrder(seed: number): readonly string[] {
  return LANTERN_ORDERS[seed % LANTERN_ORDERS.length]!
}

export function hoshimoriLanternClues(
  progress: HoshimoriWarmProgress,
): { position: number; symbol: string }[] {
  return HOSHIMORI_LANTERN_CLUE_SITES.flatMap((key, index) =>
    progress.visited.includes(key)
      ? [
          {
            position: index + 1,
            symbol: hoshimoriLanternOrder(progress.seed)[index]!,
          },
        ]
      : [],
  )
}

export function hoshimoriOvenTestimony(
  progress: HoshimoriWarmProgress,
): string {
  if (progress.choices['2,2'] === 'trace')
    return 'Pip offers to testify about the erased benefactor, but insists the giver must be asked before their name is published.'
  if (progress.choices['2,2'] === 'protect')
    return 'Pip defends the anonymous giver and challenges the village to prove a debt without exposing the person who fed him.'
  return 'Pip will not guess who fed him. The hearing must proceed without a witness the player never earned.'
}

const HOSHIMORI_HEARING_OUTCOMES: Readonly<Record<string, string>> = {
  'audit:consent:pact':
    'The ledger identifies jars whose owners were never asked. A witnessed pact may use only volunteered memories, with a right to withdraw; the baker cannot promise tomorrow’s loaves until families choose. This first hearing is a proposal, not a verdict.',
  'audit:consent:relief':
    'The unconsented jars are sealed as evidence while the furnace burns only what was offered. A ration rota feeds tonight’s queue without enrolling its guests as donors; tomorrow’s shortfall is visible to everyone. The first hearing ends with an audit, not absolution.',
  'audit:pause:pact':
    'The audit exposes missing consent and the banked coals leave empty trays. The households refuse to sign a pact while the records are incomplete; the baker must ask before resuming. This first hearing adjourns without a verdict.',
  'audit:pause:relief':
    'The ledger makes the missing consent undeniable, and the coals stay banked. Neighbors open their own pantries for emergency meals, but the rota cannot feed the mountain indefinitely. The first hearing names the shortage instead of hiding it.',
  'feed:consent:pact':
    'A family eats from your pack while the furnace separates offered memories from taken ones. The proposed pact can invite future donors, not retroactively claim the jars. This first hearing protects a doorway out and leaves the baker with fewer loaves.',
  'feed:consent:relief':
    'You paid for one supper and kept the furnace from using stolen memories. The neighbors build a ration rota, but your depleted bag cannot become the village’s permanent solution. The first hearing ends with a plan for tomorrow, not a pardon.',
  'feed:pause:pact':
    'Your own supplies bridge one meal while the coals are banked. The baker asks for a witnessed pact, but the households insist on a withdrawal clause before anyone volunteers. This first hearing buys time rather than consent.',
  'feed:pause:relief':
    'Your shared supper and the banked furnace make the cost of refusing stolen memories visible. Neighbors organize a rota that might fail by dawn; nobody is forced to pay with their childhood. The first hearing ends with an open door, not a solution.',
}

export function hoshimoriOvenResolution(
  progress: HoshimoriWarmProgress,
): string | null {
  if (!progress.ovenComplete) return null
  const key = [
    progress.ovenChoices['OV-01'],
    progress.ovenChoices['OV-02'],
    progress.ovenChoices['OV-03'],
  ].join(':')
  const outcome = HOSHIMORI_HEARING_OUTCOMES[key]
  return outcome ? outcome + ' ' + hoshimoriOvenTestimony(progress) : null
}

function adjacent(from: string, to: string): boolean {
  const a = from.split(',').map(Number)
  const b = to.split(',').map(Number)
  return Math.abs(a[0]! - b[0]!) + Math.abs(a[1]! - b[1]!) === 1
}

function applyChoice(
  progress: HoshimoriWarmProgress,
  choice: HoshimoriChoice,
): Pick<HoshimoriWarmProgress, 'rations' | 'trust' | 'flags'> | null {
  const rations = progress.rations + (choice.rations ?? 0)
  if (rations < 0) return null
  return {
    rations,
    trust: progress.trust + (choice.trust ?? 0),
    flags: progress.flags.includes(choice.flag)
      ? progress.flags
      : [...progress.flags, choice.flag],
  }
}

function eventShape(event: HoshimoriEvent): boolean {
  if (!event || typeof event !== 'object') return false
  const keys = Object.keys(event).sort().join(',')
  if (event.type === 'move')
    return keys === 'to,type' && typeof event.to === 'string'
  if (event.type === 'choose' || event.type === 'oven-choice')
    return keys === 'id,type' && typeof event.id === 'string'
  if (event.type === 'light')
    return (
      keys === 'symbols,type' &&
      Array.isArray(event.symbols) &&
      event.symbols.length === 3 &&
      event.symbols.every((symbol) => typeof symbol === 'string')
    )
  return (event.type === 'enter' || event.type === 'leave') && keys === 'type'
}

/** A successful action is journaled exactly once; invalid moves do not mutate the run. */
export function advanceHoshimoriWarm(
  progress: HoshimoriWarmProgress,
  event: HoshimoriEvent,
): HoshimoriWarmProgress {
  if (progress.events.length >= 256 || !eventShape(event)) return progress
  let changed: Partial<HoshimoriWarmProgress> | null = null
  switch (event.type) {
    case 'move':
      if (
        !progress.ovenRoom &&
        SITES.has(event.to) &&
        adjacent(progress.current, event.to)
      )
        changed = {
          current: event.to,
          visited: progress.visited.includes(event.to)
            ? progress.visited
            : [...progress.visited, event.to],
        }
      break
    case 'choose': {
      if (progress.ovenRoom || progress.choices[progress.current]) break
      const choice = SITES.get(progress.current)?.choices.find(
        (item) => item.id === event.id,
      )
      if (!choice) break
      const effects = applyChoice(progress, choice)
      if (!effects) break
      changed = {
        ...effects,
        choices: { ...progress.choices, [progress.current]: event.id },
      }
      break
    }
    case 'light':
      if (
        !progress.ovenRoom &&
        !progress.lanternLit &&
        hoshimoriLanternClues(progress).length === 3 &&
        event.symbols.join(':') ===
          hoshimoriLanternOrder(progress.seed).join(':')
      )
        changed = { lanternLit: true, trust: progress.trust + 1 }
      break
    case 'enter':
      if (
        !progress.ovenRoom &&
        !progress.ovenComplete &&
        progress.current === '4,3' &&
        (progress.lanternLit ||
          progress.flags.includes('oven-passage-offer') ||
          progress.flags.includes('oven-passage-pledge'))
      )
        changed = { ovenRoom: 'OV-01' }
      break
    case 'oven-choice': {
      if (!progress.ovenRoom) break
      const room = OVEN.get(progress.ovenRoom)
      const choice = room?.choices.find((item) => item.id === event.id)
      if (
        !choice ||
        (progress.ovenChoices[progress.ovenRoom] &&
          progress.ovenChoices[progress.ovenRoom] !== event.id)
      )
        break
      const first = !progress.ovenChoices[progress.ovenRoom]
      const effects = first
        ? applyChoice(progress, choice)
        : {
            rations: progress.rations,
            trust: progress.trust,
            flags: progress.flags,
          }
      if (!effects) break
      const next =
        room!.id === 'OV-01' ? 'OV-02' : room!.id === 'OV-02' ? 'OV-03' : null
      changed = {
        ...effects,
        ovenChoices: first
          ? { ...progress.ovenChoices, [room!.id]: event.id }
          : progress.ovenChoices,
        ovenRoom: next,
        ovenComplete: next === null,
      }
      break
    }
    case 'leave':
      if (progress.ovenRoom) changed = { ovenRoom: null }
      break
  }
  if (!changed) return progress
  return { ...progress, ...changed, events: [...progress.events, event] }
}

/** Replay rather than trusting a saved resource balance, route or puzzle solution. */
export function restoreHoshimoriWarm(
  value: unknown,
): HoshimoriWarmProgress | null {
  if (!value || typeof value !== 'object') return null
  const saved = value as Partial<HoshimoriWarmProgress>
  if (
    saved.version !== 1 ||
    !Number.isSafeInteger(saved.seed) ||
    saved.seed! < 0 ||
    saved.seed! > 2147483647 ||
    !Array.isArray(saved.events) ||
    saved.events.length > 256
  )
    return null
  let replay = newHoshimoriWarmProgress(saved.seed!)
  for (const event of saved.events) {
    const next = advanceHoshimoriWarm(replay, event)
    if (next === replay) return null
    replay = next
  }
  const keys: (keyof HoshimoriWarmProgress)[] = [
    'version',
    'seed',
    'current',
    'visited',
    'choices',
    'rations',
    'trust',
    'flags',
    'lanternLit',
    'ovenRoom',
    'ovenChoices',
    'ovenComplete',
    'events',
  ]
  return keys.every(
    (key) => JSON.stringify(saved[key]) === JSON.stringify(replay[key]),
  )
    ? replay
    : null
}

export function validateHoshimoriWarm(): string[] {
  const errors: string[] = []
  if (SITES.size !== 16) errors.push('Expected sixteen unique warm sites')
  if (OVEN.size !== 3) errors.push('Expected three first-oven rooms')
  for (const entry of HOSHIMORI_WARM_SITES) {
    const coords = entry.key.split(',').map(Number)
    if (
      coords.length !== 2 ||
      coords.some((n) => !Number.isInteger(n) || n < 1 || n > 8)
    )
      errors.push('Invalid site coordinate: ' + entry.key)
    if (
      entry.choices.length !== 2 ||
      entry.choices[0].id === entry.choices[1].id ||
      entry.choices.some(
        (choice) => !choice.label || !choice.outcome || !choice.flag,
      )
    )
      errors.push('Incomplete choices: ' + entry.key)
    if (!entry.title || !entry.opening)
      errors.push('Missing story: ' + entry.key)
  }
  const reached = new Set(['1,1'])
  const queue = ['1,1']
  while (queue.length) {
    const current = queue.shift()!
    for (const key of SITES.keys()) {
      if (!reached.has(key) && adjacent(current, key)) {
        reached.add(key)
        queue.push(key)
      }
    }
  }
  if (reached.size !== 16) errors.push('Warm map is disconnected')
  if (!SITES.has('2,3') || SITES.has('7,5'))
    errors.push('Earth-photo reservation drift')
  if (HOSHIMORI_LANTERN_CLUE_SITES.some((key) => !SITES.has(key)))
    errors.push('Missing lantern clue')
  return errors
}
