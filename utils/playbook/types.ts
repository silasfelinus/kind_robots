// The Playbook Manager's game-neutral view of an authored story game: routes as
// chains of nodes, each node a beat with sub-choices that lead to other nodes.
// Each game supplies an adapter (utils/playbook/<game>.ts) that reads its own
// authored source and fills these shapes; the manager never imports a game's
// engine state or stores.

export type NodeKind =
  | 'opening'
  | 'spine'
  | 'fork'
  | 'encounter'
  | 'crossroads'
  | 'boss'
  | 'quest'
  | 'follower'
  | 'thread'
  | 'ending'

export type PlaybookCheck = { skill: string; target: number }

export type PlaybookChoice = {
  id: string
  label: string
  check?: PlaybookCheck
  cost?: string
  locked?: string
  tags: string[]
  success?: { text: string }
  failure?: { text: string }
  /** What the choice changes, as a short readable summary. */
  effect?: string
  leadsTo?: string
}

export type PlaybookVariation = {
  axis: string
  key: string
  label: string
  text: string
}

export type PlaybookPlacement = {
  route: string
  routeName: string
  day: number
  dayName: string
  step: number
}

export type PlaybookNode = {
  key: string
  kind: NodeKind
  title: string
  place: string
  placements: PlaybookPlacement[]
  chapter: number | null
  /** Who the beat is written for: companions, followers, or 'alone'. Ids from Playbook.people. */
  companions: string[]
  /** Variation tags the beat carries (lenses, marks, factions...). Ids from Playbook.variations. */
  lenses: string[]
  body: string[]
  variations: PlaybookVariation[]
  choices: PlaybookChoice[]
  /** Fork nodes: the cards their draw can deal. */
  pool: string[]
  /** Ecotone only: the code-drawn scene shown when no painting exists. */
  scene?: string
  /** A game asset key (Ecotone) for nodes drawn by the game's own scene component. */
  art: string | null
  artUrl: string | null
  needsArt: boolean
  /**
   * The authored art prompt: the picture in plain prose (who, where, what is
   * happening). Never built from titles or chapter text; a beat without one
   * gets a prompt-writing task, not a render (Silas, 2026-10-26).
   */
  artPrompt?: string
  /** Authored identity transformations (student, hero, villain), with real render slots. */
  artVariants?: {
    id: string
    label: string
    imageUrl: string | null
    stats?: Record<string, number>
  }[]
  /** Where the game reads this beat's picture from the image store (/images/…, not in git); the ledger API reports whether it exists. */
  artPath?: string
  provenance: string
  editable: boolean
  /** Text-overlay games: which parts the overlay can replace (titles always). */
  editFields?: { body: boolean; outcomes: boolean; labels?: boolean }
}

export type PlaybookRoute = {
  id: string
  name: string
  kind: string
  steps: string[]
  /** Divider labels keyed by step index (a new day, land, floor or chapter). */
  headings: Record<number, string>
}

export type PlaybookSection = { title: string; blurb: string; keys: string[] }

export type PlaybookOption = { id: string; label: string }

export type Playbook = {
  game: string
  title: string
  blurb: string
  routes: PlaybookRoute[]
  nodes: Record<string, PlaybookNode>
  /** Every node in story order. */
  order: string[]
  /** Extra highlighted groups shown under the chains: endings, follower lines, quest lines. */
  sections: PlaybookSection[]
  /** Required pictures used outside story beats (outcomes, emotional portraits, etc.). */
  artRequirements?: { key: string; title: string; url: string }[]
  people: PlaybookOption[]
  peopleLabel: string
  variations: PlaybookOption[]
  variationLabel: string
  dayLabel: string
  kindLabels: Partial<Record<NodeKind, string>>
  /** Ledger and gallery section names, for games whose beats are not story kinds (a Fishopedia, a Bestiary). */
  sectionLabels?: Partial<Record<NodeKind, string>>
  /** Text edits can go live in play (the game reads /api/playbook/<game>/live). Ecotone takes full card edits; the others a text overlay. */
  editable: boolean
  /** Conductor project slug that art requests are tagged to. */
  artProject: string
  /** Preferred art lanes, first is the default. */
  artLanes: string[]
  /** Extra negative prompt for this game's art (Ecotone: never anthro). */
  artNegative?: string
  /** The game's own palette and setting words, appended to every art request after the prompt. */
  artStyle?: string
  /** Art for this game is queued by a Conductor pipeline (named here); the Forge never submits it. */
  artPipeline?: string
  /** Every beat still to paint has an authored, engine-literal art prompt (held by verifyPlaybookArtPrompts). */
  artPromptsComplete?: boolean
}

export function blankNode(
  key: string,
  kind: NodeKind,
  title: string,
): PlaybookNode {
  return {
    key,
    kind,
    title,
    place: '',
    placements: [],
    chapter: null,
    companions: [],
    lenses: [],
    body: [],
    variations: [],
    choices: [],
    pool: [],
    art: null,
    artUrl: null,
    needsArt: false,
    provenance: '',
    editable: false,
  }
}

export function uniq<T>(items: T[]): T[] {
  return [...new Set(items)]
}

export function humanize(id: string): string {
  const text = id.replace(/[-_:]+/g, ' ').trim()
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** "+2 goodwill · −1 nerve · flag x" style summaries from a flat number map. */
export function signedParts(
  values: Record<string, number | undefined>,
): string[] {
  return Object.entries(values).flatMap(([key, value]) =>
    value ? [`${key} ${value > 0 ? '+' : '−'}${Math.abs(value)}`] : [],
  )
}

/** Story order: every route's chain first, then the remaining nodes in the given order. */
export function storyOrder(routes: PlaybookRoute[], rest: string[]): string[] {
  return uniq([...routes.flatMap((route) => route.steps), ...rest])
}
