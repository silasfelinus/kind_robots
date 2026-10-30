/**
 * Hoshimori's first sixteen night-procession sites. e08 mirrors e07's immutable
 * coordinates but records a separate Scylla-viewpoint expedition and testimony.
 */
export interface NightChoice {
  id: string
  label: string
  outcome: string
  flag: string
}

export interface NightSite {
  key: string
  title: string
  opening: string
  choices: readonly [NightChoice, NightChoice]
}

function c(
  id: string,
  label: string,
  outcome: string,
  flag: string,
): NightChoice {
  return { id, label, outcome, flag }
}
function s(
  key: string,
  title: string,
  opening: string,
  a: NightChoice,
  b: NightChoice,
): NightSite {
  return { key, title, opening, choices: [a, b] }
}

export const HOSHIMORI_NIGHT_SITES: readonly NightSite[] = [
  s(
    '1,1',
    'Cedar Footbridge / The Wall That Listens',
    'The bridge is where it always was. Tonight a wall breathes through the cedar rail; the voices inside it belong to travelers who asked to leave.',
    c(
      'name-the-trapped',
      'Ask the wall to repeat the travelers’ own names',
      'Scylla writes down only names the voices consent to share. The wall yields the first processional sign.',
      'wall-consent',
    ),
    c(
      'hear-the-silence',
      'Listen for those who refuse to be named',
      'Char hears a refusal beneath the plaster. Scylla leaves their identities unwritten and remembers the first sign.',
      'wall-privacy',
    ),
  ),
  s(
    '2,1',
    'Singing Terraces / The Breathless Choir',
    'Rice stands upright in black water. The workers have sung one note for seven nights because stopping is classified as a fall.',
    c(
      'end-the-song',
      'Offer the singers a silence they can choose',
      'The singers rest. Oren marks the second sign on a route that does not require a human voice as a toll.',
      'choir-rest',
    ),
    c(
      'change-the-meter',
      'Let Char rewrite the rhythm',
      'The choir learns a rest between notes. Char refuses the village’s claim that constant singing is care.',
      'choir-meter',
    ),
  ),
  s(
    '3,1',
    'Persimmon Steps / The Coat With No Body',
    'A child’s mended coat walks the stairs alone. The procession calls this proof that the child is perfectly protected.',
    c(
      'follow-the-coat',
      'Follow without pretending the child is safe',
      'The coat leads to a locked room. Scylla keeps the third sign and a promise to ask who is inside.',
      'coat-witness',
    ),
    c(
      'cut-the-thread',
      'Release the coat from its invisible leash',
      'The coat collapses. Someone inside the house knocks three times, and Oren records the third sign.',
      'coat-release',
    ),
  ),
  s(
    '4,1',
    'Orchard of Floating Lanterns / The Hanging Eyes',
    'Every lantern faces a different window. Vesper once drew safe roads through this orchard; the lights now follow whoever tries to use them.',
    c(
      'shade-the-lanterns',
      'Cover the lights facing occupied homes',
      'Vesper’s old marks still guide rescue without publishing household addresses.',
      'orchard-shaded',
    ),
    c(
      'trace-the-wires',
      'Trace who watches the lanterns',
      'A frightened keeper confesses the surveillance began as a missing-person search, then forgot how to stop.',
      'orchard-witness',
    ),
  ),
  s(
    '1,2',
    'Lantern Stall / The Mask Exchange',
    'The stall sells masks that smile after their wearers stop. A vendor asks Scylla to choose the expression the village will permit.',
    c(
      'remove-the-mask',
      'Ask the vendor to show their own face',
      'The vendor removes a mask of obedience. Under it is a tired person, not a monster.',
      'mask-unworn',
    ),
    c(
      'buy-a-blank',
      'Carry a blank mask for anyone who needs anonymity',
      'A traveler accepts the disguise and escapes the compulsory parade without becoming your dependent.',
      'mask-blank',
    ),
  ),
  s(
    '2,2',
    'Pip’s Ledger House / The Census of Rescued Names',
    'Pip’s childhood ledger has become a census of residents declared rescued whether or not they consented. Vesper recognizes a map hidden in its margins.',
    c(
      'seal-the-children',
      'Seal children’s addresses from public testimony',
      'Pip signs a protected witness statement. Scylla learns that secrecy can preserve agency.',
      'ledger-private',
    ),
    c(
      'audit-the-ledger',
      'Ask an independent witness to audit the claimed rescues',
      'The count shrinks. Pip admits a remembered meal was never a lifetime contract.',
      'ledger-audited',
    ),
  ),
  s(
    '3,2',
    'Shrine of the Third Light / The Door That Prays',
    'A house spirit kneels before a door that locks from the outside. It insists the family is safe because nobody has departed.',
    c(
      'ask-the-family',
      'Ask the family what safety means to them',
      'The family asks for a latch on their side. The spirit listens for the first time.',
      'shrine-latch',
    ),
    c(
      'offer-a-refuge',
      'Offer an open refuge without ownership',
      'A resident walks out and returns voluntarily. The spirit sees the difference.',
      'shrine-refuge',
    ),
  ),
  s(
    '4,2',
    'Bakery Back Door / The Nurikabe Toll',
    'The route to the Oven is sealed by a living wall. Its inscription demands either a remembered three-sign promise or a public guarantee of obedience.',
    c(
      'accept-the-mark',
      'Accept a visible escort mark to cross now',
      'The wall opens, but the mark tells every patrol where you went. Scylla keeps the risk on record.',
      'door-bargain',
    ),
    c(
      'refuse-the-mark',
      'Refuse surveillance and seek the side path',
      'Oren finds a narrow legal crossing by the shrine. No one has to surrender their location to continue.',
      'door-refusal',
    ),
  ),
  s(
    '1,3',
    'Returning Slippers / The March of Empty Feet',
    'The slippers still return to the river, but now they march in perfect pairs. A missing shoe is called a missing citizen.',
    c(
      'break-the-rank',
      'Let the shoes find their own pace',
      'The procession loses its perfect count. One traveler slips away without being numbered.',
      'slippers-freed',
    ),
    c(
      'ask-the-umbrella',
      'Ask the living umbrella whom it shelters',
      'The umbrella admits it has been ordered to shelter shoes while people wait in rain.',
      'umbrella-testimony',
    ),
  ),
  s(
    '2,3',
    'Night-Crew Lane / The Names Beneath Ash',
    'The old Earth photograph is absent here. A scorched window shows people working past midnight while a voice insists that nobody is ever tired.',
    c(
      'keep-the-question',
      'Preserve the contradiction for a living witness',
      'Scylla refuses to call exhaustion safety. The night workers are allowed to speak for themselves.',
      'nightcrew-witness',
    ),
    c(
      'find-the-shift',
      'Search for the shift register, not a verdict',
      'The register lists breaks that never occurred. Char demands the workers be asked what they need.',
      'nightcrew-record',
    ),
  ),
  s(
    '3,3',
    'Guest Registry / The Redacted Parade',
    'The kitsune clerk holds a list of guests who were ordered to stay forever. Vesper’s childhood rescue map appears as evidence against them.',
    c(
      'protect-the-map',
      'Redact routes that would expose refugee families',
      'The clerk accepts testimony without publishing escape routes. Vesper can answer for harm without betraying survivors again.',
      'registry-redacted',
    ),
    c(
      'share-custody',
      'Put the map under recallable community custody',
      'The clerk refuses a single owner. Scylla makes the witnesses define how access can be withdrawn.',
      'registry-custody',
    ),
  ),
  s(
    '4,3',
    'The Red Oven / The Furnace of Names',
    'The bakery occupies its familiar corner. The Oven now burns the names of those it feeds, declaring anonymous hunger impossible.',
    c(
      'name-the-cost',
      'Demand an account of whose names became fuel',
      'The baker shows a ledger of compelled donors. Pip recognizes his own childhood signature.',
      'oven-names',
    ),
    c(
      'feed-without-claim',
      'Serve the queue without taking names',
      'For one night the bakery feeds strangers without acquiring them. The guardian calls this dangerous.',
      'oven-open',
    ),
  ),
  s(
    '1,4',
    'Hillside Shelter / The Photograph Behind Glass',
    'An Earth photograph waits behind a sealed pane: a colleague holds open Morrow’s apartment door while friends carry a secondhand table upstairs. It belongs to the Chronicle, not the procession.',
    c(
      'ask-the-colleague',
      'Ask who invited the helpers inside',
      'Scylla keeps the invitation distinct from any claim that the stolen life was justified.',
      'e08-photo-invitation',
    ),
    c(
      'honor-the-help',
      'Honor their freely chosen help without inventing a debt',
      'The moving-day photograph records people beginning again, not a contract to remain forever.',
      'e08-photo-help',
    ),
  ),
  s(
    '2,4',
    'The Paper Theatre / Actors Who Cannot Exit',
    'A painted actor bows until their spine folds. The audience has been told the play must never end because departure would be cruel.',
    c(
      'open-the-curtain',
      'Open the exit before asking anyone to perform',
      'The actors choose who stays for an encore. The empty seats are not counted as deaths.',
      'theatre-exit',
    ),
    c(
      'ask-for-a-pause',
      'Ask the actors to name the last scene',
      'The final scene is a door. Vesper remembers drawing it when they were young.',
      'theatre-pause',
    ),
  ),
  s(
    '3,4',
    'Oathboat / The Ferry That Returns Itself',
    'A boat keeps rowing rescued passengers back to shore, insisting it cannot risk leaving them anywhere unfamiliar.',
    c(
      'release-the-oar',
      'Let the passengers steer after a safety briefing',
      'Oren provides a tide chart and the ferry finally carries people where they choose.',
      'boat-agency',
    ),
    c(
      'build-a-beacon',
      'Make a return beacon rather than a leash',
      'Char lights a beacon that can be ignored. The boat stops counting refusals as disappearances.',
      'boat-beacon',
    ),
  ),
  s(
    '4,4',
    'Southern Council / The Last Shut Door',
    'The night procession arrives at a council of bolted doors. Its masked witnesses insist that every rescue creates a permanent obligation.',
    c(
      'allow-departure',
      'Write an enforceable right to leave',
      'The council accepts voluntary shelter and a revocable map. Scylla demands follow-up for those still trapped.',
      'council-departure',
    ),
    c(
      'require-consent',
      'Require renewed consent for every protection',
      'The council sets a sunset on compulsory safeguards. Vesper must answer to the families their map exposed.',
      'council-consent',
    ),
  ),
]

export const HOSHIMORI_NIGHT_CLUE_SITES = ['1,1', '2,1', '3,1'] as const
export const HOSHIMORI_NIGHT_MAX_EVENTS = 512
const SITES = new Map(HOSHIMORI_NIGHT_SITES.map((site) => [site.key, site]))
const SIGNS = ['cedar', 'bell', 'coat', 'ash'] as const

export type NightEvent =
  | { type: 'move'; to: string }
  | { type: 'choose'; id: string }
  | { type: 'unbind'; signs: string[] }

export interface NightProgress {
  version: 1
  seed: number
  current: string
  visited: string[]
  choices: Record<string, string>
  flags: string[]
  doorOpen: boolean
  events: NightEvent[]
}

export function newHoshimoriNightProgress(seed: number): NightProgress {
  return {
    version: 1,
    seed,
    current: '1,1',
    visited: ['1,1'],
    choices: {},
    flags: [],
    doorOpen: false,
    events: [],
  }
}

export function hoshimoriNightOrder(seed: number): readonly string[] {
  const shift = seed % SIGNS.length
  return [SIGNS[shift]!, SIGNS[(shift + 2) % 4]!, SIGNS[(shift + 3) % 4]!]
}

export function hoshimoriNightClues(
  progress: NightProgress,
): readonly string[] {
  const order = hoshimoriNightOrder(progress.seed)
  return HOSHIMORI_NIGHT_CLUE_SITES.flatMap((key, index) =>
    progress.choices[key] ? [order[index]!] : [],
  )
}

function adjacent(a: string, b: string): boolean {
  const [ax, ay] = a.split(',').map(Number)
  const [bx, by] = b.split(',').map(Number)
  return Math.abs(ax! - bx!) + Math.abs(ay! - by!) === 1
}

export function canMoveHoshimoriNight(
  progress: NightProgress,
  to: string,
): boolean {
  if (!SITES.has(to) || !adjacent(progress.current, to)) return false
  if (
    !progress.doorOpen &&
    ((progress.current === '4,2' && to === '4,3') ||
      (progress.current === '4,3' && to === '4,2'))
  )
    return false
  return true
}

function validEvent(event: NightEvent): boolean {
  if (!event || typeof event !== 'object') return false
  const keys = Object.keys(event).sort().join(',')
  if (event.type === 'move')
    return keys === 'to,type' && typeof event.to === 'string'
  if (event.type === 'choose')
    return keys === 'id,type' && typeof event.id === 'string'
  return (
    event.type === 'unbind' &&
    keys === 'signs,type' &&
    Array.isArray(event.signs) &&
    event.signs.length === 3 &&
    event.signs.every((sign) => typeof sign === 'string')
  )
}

export function advanceHoshimoriNight(
  progress: NightProgress,
  event: NightEvent,
): NightProgress {
  if (
    progress.events.length >= HOSHIMORI_NIGHT_MAX_EVENTS ||
    !validEvent(event)
  )
    return progress
  if (event.type === 'move') {
    if (!canMoveHoshimoriNight(progress, event.to)) return progress
    return {
      ...progress,
      current: event.to,
      visited: progress.visited.includes(event.to)
        ? progress.visited
        : [...progress.visited, event.to],
      events: [...progress.events, event],
    }
  }
  if (event.type === 'choose') {
    if (progress.choices[progress.current]) return progress
    const choice = SITES.get(progress.current)?.choices.find(
      (item) => item.id === event.id,
    )
    if (!choice) return progress
    const doorOpen =
      progress.doorOpen ||
      (progress.current === '4,2' && choice.id === 'accept-the-mark')
    return {
      ...progress,
      choices: { ...progress.choices, [progress.current]: choice.id },
      flags: [...progress.flags, choice.flag],
      doorOpen,
      events: [...progress.events, event],
    }
  }
  if (
    progress.current !== '4,2' ||
    progress.doorOpen ||
    hoshimoriNightClues(progress).length !== 3 ||
    event.signs.join(':') !== hoshimoriNightOrder(progress.seed).join(':')
  )
    return progress
  return {
    ...progress,
    doorOpen: true,
    flags: [...progress.flags, 'wall-unbound'],
    events: [...progress.events, event],
  }
}

export function hoshimoriNightCouncil(progress: NightProgress): string | null {
  if (
    !progress.choices['2,2'] ||
    !progress.choices['3,3'] ||
    !progress.choices['4,4']
  )
    return null
  return [
    progress.choices['2,2'] === 'seal-the-children'
      ? 'Pip sealed the children’s addresses from the public ledger.'
      : 'Independent witnesses corrected the false rescue census.',
    progress.choices['3,3'] === 'protect-the-map'
      ? 'Vesper kept escape routes confidential while accepting accountability.'
      : 'Refugees gained recallable custody of their own routes.',
    progress.choices['4,4'] === 'allow-departure'
      ? 'The council guaranteed a right to leave without forfeiting care.'
      : 'Every protection must be renewed by the people affected.',
  ].join(' ')
}

/** Replay every legal event rather than trusting client-supplied flags or routes. */
export function restoreHoshimoriNight(value: unknown): NightProgress | null {
  if (!value || typeof value !== 'object') return null
  const saved = value as Partial<NightProgress>
  if (
    saved.version !== 1 ||
    !Number.isSafeInteger(saved.seed) ||
    saved.seed! < 0 ||
    saved.seed! > 2147483647 ||
    !Array.isArray(saved.events) ||
    saved.events.length > HOSHIMORI_NIGHT_MAX_EVENTS
  )
    return null
  let replay = newHoshimoriNightProgress(saved.seed!)
  for (const event of saved.events) {
    const next = advanceHoshimoriNight(replay, event)
    if (next === replay) return null
    replay = next
  }
  const keys: (keyof NightProgress)[] = [
    'version',
    'seed',
    'current',
    'visited',
    'choices',
    'flags',
    'doorOpen',
    'events',
  ]
  return keys.every(
    (key) => JSON.stringify(saved[key]) === JSON.stringify(replay[key]),
  )
    ? replay
    : null
}

export function validateHoshimoriNight(): string[] {
  const errors: string[] = []
  if (SITES.size !== 16) errors.push('Expected sixteen unique night sites')
  const choiceIds = HOSHIMORI_NIGHT_SITES.flatMap((site) =>
    site.choices.map((choice) => choice.id),
  )
  if (new Set(choiceIds).size !== choiceIds.length)
    errors.push('Duplicate choice IDs')
  for (const site of HOSHIMORI_NIGHT_SITES) {
    const [x, y] = site.key.split(',').map(Number)
    if (
      !Number.isInteger(x) ||
      !Number.isInteger(y) ||
      x! < 1 ||
      x! > 8 ||
      y! < 1 ||
      y! > 8 ||
      !site.title ||
      !site.opening ||
      site.choices.length !== 2 ||
      site.choices.some(
        (choice) => !choice.label || !choice.outcome || !choice.flag,
      )
    )
      errors.push('Incomplete site ' + site.key)
  }
  const reached = new Set(['1,1'])
  const queue = ['1,1']
  while (queue.length) {
    const from = queue.shift()!
    for (const site of HOSHIMORI_NIGHT_SITES) {
      if (
        !reached.has(site.key) &&
        adjacent(from, site.key) &&
        !(from === '4,2' && site.key === '4,3') &&
        !(from === '4,3' && site.key === '4,2')
      ) {
        reached.add(site.key)
        queue.push(site.key)
      }
    }
  }
  if (reached.size !== 16)
    errors.push('A night site requires a blind or sealed crossing')
  if (!SITES.has('1,4') || SITES.has('6,7'))
    errors.push('e08 photo reservations drifted')
  return errors
}
