// Slime City comparison lab: shared data plus a pure, seeded rules engine
// for the three square-grid formats (conductor slime-city t-001, t-002).
// Every rule here is deterministic from (mode, teams, seed, commands), so a
// match can be replayed exactly from its command record, and the CPU only
// ever decides from observe(), the redacted per-side view.
import { chooseCpuAction } from './cpu'

export type Color = 'red' | 'blue' | 'purple' | 'green' | 'gold'
export type TeamId =
  'catgirls' | 'bloodfairies' | 'ironjaw' | 'riot' | 'undertow' | 'exchange'
export type ModeId = 'blackout' | 'gridiron' | 'bloodrush'
export type CardKind = 'creature' | 'spell' | 'trap' | 'equipment'
export type Side = 'player' | 'enemy'
export type WinPath = 'flag' | 'score' | 'rout' | 'time'

export interface Team {
  id: TeamId
  name: string
  color: Color
  district: string
  motto: string
  hook: string
  insignia: string
  creatures: [string, string, string]
  special: [string, string, string]
}

export interface Card {
  id: string
  name: string
  kind: CardKind
  team: TeamId
  cost: number
  hp?: number
  attack?: number
  armor?: number
  ap?: number
  effect?: 'zap' | 'heal' | 'chaos' | 'snare' | 'armor' | 'boost'
  text: string
  symbol: string
}

export interface Fighter {
  id: number
  cardId: string
  side: Side
  x: number
  y: number
  hp: number
  maxHp: number
  attack: number
  armor: number
  ap: number
  maxAp: number
  hidden: boolean
  carryingFlag: boolean
}

export interface Trap {
  x: number
  y: number
  side: Side
  damage: number
}

/** One recorded input. Replaying these from createMatch rebuilds a match. */
export type Command =
  | { t: 'deploy'; side: Side; card: string; x: number; y: number }
  | { t: 'move'; side: Side; id: number; x: number; y: number }
  | { t: 'reveal'; side: Side; id: number }
  | { t: 'end' }

export interface MatchStats {
  plays: Record<Side, Record<CardKind, number>>
  knockouts: Record<Side, number>
  trapsSprung: number
  flagDrops: number
  flagPickups: number
  clogs: number
  sidesteps: number
}

export interface MatchState {
  mode: ModeId
  width: number
  height: number
  /** Round number in the turn formats, tick number in BLOODRUSH. */
  round: number
  maxRounds: number
  /** The human (player) side's mana. */
  mana: number
  enemyMana: number
  score: [number, number]
  seed: number
  nextId: number
  teamId: TeamId
  foeId: TeamId
  units: Fighter[]
  traps: Trap[]
  bossHp: number
  flag: { x: number; y: number }
  victor: Side | 'draw' | null
  winPath: WinPath | null
  log: string[]
  commands: Command[]
  stats: MatchStats
  /** Round/tick from which each side may play each card again. */
  cooldowns: Record<Side, Record<string, number>>
}

/** What one side may know: hidden opposing identities and traps removed. */
export interface ViewFighter {
  id: number
  side: Side
  x: number
  y: number
  hidden: boolean
  /** False for a concealed opposing fighter: every stat below is null. */
  known: boolean
  cardId: string | null
  hp: number | null
  maxHp: number | null
  attack: number | null
  armor: number | null
  ap: number | null
  maxAp: number | null
  carryingFlag: boolean
}

export interface MatchView {
  side: Side
  mode: ModeId
  width: number
  height: number
  round: number
  maxRounds: number
  fieldCap: number
  trapCap: number
  mana: number
  opponentMana: number
  /** [own, opponent] */
  score: [number, number]
  /** Per-side tie-break salt; never the match seed itself. */
  salt: number
  flag: { x: number; y: number }
  units: ViewFighter[]
  traps: Trap[]
  hand: Card[]
  victor: Side | 'draw' | null
}

export type CpuAction =
  | { t: 'deploy'; card: string; x: number; y: number }
  | { t: 'move'; id: number; x: number; y: number }

export const MODES: {
  id: ModeId
  title: string
  subtitle: string
  size: string
  cadence: string
  detail: string
}[] = [
  {
    id: 'blackout',
    title: 'BLACKOUT',
    subtitle: 'Hidden army · Stratego test',
    size: '8 × 8',
    cadence: 'TURN-BASED',
    detail:
      'Five fighters deployed face-down on each side. Reveal by moving, uncover the enemy, and steal the flag.',
  },
  {
    id: 'gridiron',
    title: 'MEATBALL',
    subtitle: 'Lane battle · football test',
    size: '12 × 6',
    cadence: 'TURN-BASED',
    detail:
      'Spend growing mana to deploy runners into six lanes. Push through the defense and score at the far end.',
  },
  {
    id: 'bloodrush',
    title: 'BLOODRUSH',
    subtitle: 'Wave battle · real-time test',
    size: '14 × 6',
    cadence: 'REAL-TIME',
    detail:
      'Launch units and special cards while both teams advance on a live clock. First to three touchdowns wins.',
  },
]

export const TEAMS: Team[] = [
  {
    id: 'catgirls',
    name: 'GENE RIOT CATGIRLS',
    color: 'blue',
    district: 'CHIMERA HEIGHTS',
    motto: 'Nine lives. Zero patents.',
    hook: 'Escaped genetic experiments who turned their old laboratory into a neighborhood sanctuary. Ambushes and tactical regeneration.',
    insignia: '✦',
    creatures: ['lynx', 'mau', 'chimera'],
    special: ['pounce', 'scentmine', 'reknit'],
  },
  {
    id: 'bloodfairies',
    name: 'PUNK BLOODFAIRIES',
    color: 'purple',
    district: 'NEEDLE ALLEY',
    motto: 'Small wings. Big knives.',
    hook: 'A riotous crew of tiny blood-magic punks who treat the megacity as one very loud mosh pit. Cheap swarms and surprise strikes.',
    insignia: '❋',
    creatures: ['sprite', 'razor', 'queen'],
    special: ['mosh', 'bloodwire', 'spurs'],
  },
  {
    id: 'ironjaw',
    name: 'IRONJAW CHROME OGRES',
    color: 'green',
    district: 'THE FOUNDRY',
    motto: 'More chrome. More teeth.',
    hook: 'Industrial-size cybernetic ogres fighting for freedom from the factories that built their bodies. Armor, hardware and bulldozing.',
    insignia: '⬡',
    creatures: ['scrapper', 'bulldozer', 'juggernaut'],
    special: ['overclock', 'shocktrap', 'plating'],
  },
  {
    id: 'riot',
    name: 'RIOT SAINTS',
    color: 'red',
    district: 'REDLINE RIOT',
    motto: 'Make it explode twice.',
    hook: 'Joyfully irresponsible demolition gladiators in a city where nobody has read the fire code. High-risk chaos cards.',
    insignia: '✸',
    creatures: ['rat', 'firebrand', 'bomber'],
    special: ['firestorm', 'badluck', 'fuse'],
  },
  {
    id: 'undertow',
    name: 'UNDERTOW INTELLIGENCE',
    color: 'blue',
    district: 'THE UNDERTOW',
    motto: 'We already saw you.',
    hook: 'Sewer spies, surveillance witches and amphibious informants who rig every intersection before a fight begins.',
    insignia: '◈',
    creatures: ['watcher', 'frogtrooper', 'oracle'],
    special: ['blackout', 'tripwire', 'visor'],
  },
  {
    id: 'exchange',
    name: 'MEAT EXCHANGE',
    color: 'gold',
    district: 'CROWN MARKET',
    motto: 'Terms and conditions apply.',
    hook: 'Gold-toothed arena monopolists who buy muscle, sell favors and collect battlefield debts.',
    insignia: '◆',
    creatures: ['collector', 'broker', 'mogul'],
    special: ['collection', 'debttrap', 'contract'],
  },
]

export const CARDS: Card[] = [
  {
    id: 'lynx',
    name: 'Neon Lynx',
    kind: 'creature',
    team: 'catgirls',
    cost: 1,
    hp: 2,
    attack: 1,
    armor: 0,
    ap: 2,
    text: 'Fast prototype scout.',
    symbol: '✦',
  },
  {
    id: 'mau',
    name: 'Mau-77',
    kind: 'creature',
    team: 'catgirls',
    cost: 2,
    hp: 3,
    attack: 2,
    armor: 0,
    ap: 2,
    text: 'Designer-claw enforcer.',
    symbol: '◉',
  },
  {
    id: 'chimera',
    name: 'Madame Chimera',
    kind: 'creature',
    team: 'catgirls',
    cost: 4,
    hp: 5,
    attack: 2,
    armor: 1,
    ap: 2,
    text: 'Nine life signatures.',
    symbol: '✹',
  },
  {
    id: 'pounce',
    name: 'Catnip Overdrive',
    kind: 'spell',
    team: 'catgirls',
    cost: 2,
    effect: 'boost',
    text: 'Grant a friendly fighter 2 extra AP.',
    symbol: '⚡',
  },
  {
    id: 'scentmine',
    name: 'Scent Mine',
    kind: 'trap',
    team: 'catgirls',
    cost: 1,
    effect: 'snare',
    text: 'Hidden square trap, 2 damage.',
    symbol: '◇',
  },
  {
    id: 'reknit',
    name: 'Reknit Serum',
    kind: 'spell',
    team: 'catgirls',
    cost: 1,
    effect: 'heal',
    text: 'Restore two HP.',
    symbol: '✚',
  },
  {
    id: 'sprite',
    name: 'Bloodsprite',
    kind: 'creature',
    team: 'bloodfairies',
    cost: 1,
    hp: 1,
    attack: 2,
    armor: 0,
    ap: 2,
    text: 'Small, mean and loud.',
    symbol: '❋',
  },
  {
    id: 'razor',
    name: 'Razorwing',
    kind: 'creature',
    team: 'bloodfairies',
    cost: 2,
    hp: 2,
    attack: 2,
    armor: 0,
    ap: 3,
    text: 'Moves in a blur.',
    symbol: '✣',
  },
  {
    id: 'queen',
    name: 'Queen Safety Pin',
    kind: 'creature',
    team: 'bloodfairies',
    cost: 4,
    hp: 4,
    attack: 3,
    armor: 0,
    ap: 2,
    text: 'Union leader of the damned.',
    symbol: '✷',
  },
  {
    id: 'mosh',
    name: 'Moshpit Massacre',
    kind: 'spell',
    team: 'bloodfairies',
    cost: 2,
    effect: 'zap',
    text: 'Deal 2 damage to an enemy.',
    symbol: '⚡',
  },
  {
    id: 'bloodwire',
    name: 'Bloodwire',
    kind: 'trap',
    team: 'bloodfairies',
    cost: 1,
    effect: 'snare',
    text: 'Hidden square trap, 2 damage.',
    symbol: '◇',
  },
  {
    id: 'spurs',
    name: 'Razor Spurs',
    kind: 'equipment',
    team: 'bloodfairies',
    cost: 2,
    effect: 'boost',
    text: 'Grant a fighter 2 AP.',
    symbol: '✧',
  },
  {
    id: 'scrapper',
    name: 'Chrome Scrapper',
    kind: 'creature',
    team: 'ironjaw',
    cost: 1,
    hp: 3,
    attack: 1,
    armor: 1,
    ap: 1,
    text: 'Scrap-metal fist fighter.',
    symbol: '⬡',
  },
  {
    id: 'bulldozer',
    name: 'Bulld-Ogre',
    kind: 'creature',
    team: 'ironjaw',
    cost: 3,
    hp: 5,
    attack: 2,
    armor: 1,
    ap: 1,
    text: 'Armored wallbreaker.',
    symbol: '▣',
  },
  {
    id: 'juggernaut',
    name: 'Maw-9000',
    kind: 'creature',
    team: 'ironjaw',
    cost: 5,
    hp: 7,
    attack: 3,
    armor: 2,
    ap: 1,
    text: 'A tank with opinions.',
    symbol: '⬢',
  },
  {
    id: 'overclock',
    name: 'Overclock Core',
    kind: 'spell',
    team: 'ironjaw',
    cost: 2,
    effect: 'boost',
    text: 'Grant a fighter 2 AP.',
    symbol: '⚡',
  },
  {
    id: 'shocktrap',
    name: 'Shock Plate',
    kind: 'trap',
    team: 'ironjaw',
    cost: 2,
    effect: 'snare',
    text: 'Hidden square trap, 2 damage.',
    symbol: '◇',
  },
  {
    id: 'plating',
    name: 'Foundry Plating',
    kind: 'equipment',
    team: 'ironjaw',
    cost: 2,
    effect: 'armor',
    text: 'Give a fighter +1 armor.',
    symbol: '⬟',
  },
  {
    id: 'rat',
    name: 'Riot Rat',
    kind: 'creature',
    team: 'riot',
    cost: 1,
    hp: 2,
    attack: 1,
    armor: 0,
    ap: 2,
    text: 'All teeth, no planning.',
    symbol: '✸',
  },
  {
    id: 'firebrand',
    name: 'Firebrand',
    kind: 'creature',
    team: 'riot',
    cost: 2,
    hp: 3,
    attack: 2,
    armor: 0,
    ap: 2,
    text: 'Carries six lit fuses.',
    symbol: '✴',
  },
  {
    id: 'bomber',
    name: 'Grand Detonator',
    kind: 'creature',
    team: 'riot',
    cost: 4,
    hp: 4,
    attack: 3,
    armor: 0,
    ap: 1,
    text: 'Makes the stadium shake.',
    symbol: '✺',
  },
  {
    id: 'firestorm',
    name: 'Accidental Firestorm',
    kind: 'spell',
    team: 'riot',
    cost: 2,
    effect: 'chaos',
    text: 'Deal 1–3 damage, seeded.',
    symbol: '⚡',
  },
  {
    id: 'badluck',
    name: 'Whoops Grenade',
    kind: 'trap',
    team: 'riot',
    cost: 1,
    effect: 'snare',
    text: 'Hidden square trap, 2 damage.',
    symbol: '◇',
  },
  {
    id: 'fuse',
    name: 'Illegal Booster',
    kind: 'equipment',
    team: 'riot',
    cost: 2,
    effect: 'boost',
    text: 'Grant a fighter 2 AP.',
    symbol: '✧',
  },
  {
    id: 'watcher',
    name: 'Sewer Watcher',
    kind: 'creature',
    team: 'undertow',
    cost: 1,
    hp: 2,
    attack: 1,
    armor: 0,
    ap: 2,
    text: 'Knows every drain.',
    symbol: '◈',
  },
  {
    id: 'frogtrooper',
    name: 'Frog Trooper',
    kind: 'creature',
    team: 'undertow',
    cost: 2,
    hp: 3,
    attack: 2,
    armor: 0,
    ap: 2,
    text: 'Silent wet boots.',
    symbol: '◉',
  },
  {
    id: 'oracle',
    name: 'Drowned Oracle',
    kind: 'creature',
    team: 'undertow',
    cost: 4,
    hp: 4,
    attack: 3,
    armor: 1,
    ap: 1,
    text: 'Sees tomorrow’s ambush.',
    symbol: '◉',
  },
  {
    id: 'blackout',
    name: 'Signal Blackout',
    kind: 'spell',
    team: 'undertow',
    cost: 2,
    effect: 'zap',
    text: 'Deal 2 damage to an enemy.',
    symbol: '⚡',
  },
  {
    id: 'tripwire',
    name: 'Tripwire',
    kind: 'trap',
    team: 'undertow',
    cost: 1,
    effect: 'snare',
    text: 'Hidden square trap, 2 damage.',
    symbol: '◇',
  },
  {
    id: 'visor',
    name: 'Spyglass Visor',
    kind: 'equipment',
    team: 'undertow',
    cost: 2,
    effect: 'armor',
    text: 'Give a fighter +1 armor.',
    symbol: '✧',
  },
  {
    id: 'collector',
    name: 'Debt Collector',
    kind: 'creature',
    team: 'exchange',
    cost: 1,
    hp: 3,
    attack: 1,
    armor: 0,
    ap: 1,
    text: 'Interest compounds daily.',
    symbol: '◆',
  },
  {
    id: 'broker',
    name: 'Flesh Broker',
    kind: 'creature',
    team: 'exchange',
    cost: 3,
    hp: 4,
    attack: 2,
    armor: 1,
    ap: 1,
    text: 'Premium collections agent.',
    symbol: '◇',
  },
  {
    id: 'mogul',
    name: 'The Meat Mogul',
    kind: 'creature',
    team: 'exchange',
    cost: 5,
    hp: 6,
    attack: 3,
    armor: 1,
    ap: 1,
    text: 'Owns the arena.',
    symbol: '◈',
  },
  {
    id: 'collection',
    name: 'Hostile Collection',
    kind: 'spell',
    team: 'exchange',
    cost: 2,
    effect: 'zap',
    text: 'Deal 2 damage to an enemy.',
    symbol: '⚡',
  },
  {
    id: 'debttrap',
    name: 'Hidden Fees',
    kind: 'trap',
    team: 'exchange',
    cost: 1,
    effect: 'snare',
    text: 'Hidden square trap, 2 damage.',
    symbol: '◇',
  },
  {
    id: 'contract',
    name: 'Iron Contract',
    kind: 'equipment',
    team: 'exchange',
    cost: 2,
    effect: 'armor',
    text: 'Give a fighter +1 armor.',
    symbol: '⬟',
  },
]

export const DISTRICTS = [
  {
    id: 'pitworks',
    name: 'THE PITWORKS',
    x: 49,
    y: 62,
    summary: 'Arenas and training bouts',
    team: 'riot' as TeamId,
  },
  {
    id: 'chimera',
    name: 'CHIMERA HEIGHTS',
    x: 27,
    y: 25,
    summary: 'Gene-lab catgirl uprising',
    team: 'catgirls' as TeamId,
  },
  {
    id: 'needles',
    name: 'NEEDLE ALLEY',
    x: 72,
    y: 33,
    summary: 'Punk bloodfairy rooftops',
    team: 'bloodfairies' as TeamId,
  },
  {
    id: 'foundry',
    name: 'THE FOUNDRY',
    x: 18,
    y: 70,
    summary: 'Cyber-ogre resistance',
    team: 'ironjaw' as TeamId,
  },
  {
    id: 'undertow',
    name: 'THE UNDERTOW',
    x: 44,
    y: 86,
    summary: 'Blue espionage tunnels',
    team: 'undertow' as TeamId,
  },
  {
    id: 'crown',
    name: 'CROWN MARKET',
    x: 80,
    y: 73,
    summary: 'Meat shop and contracts',
    team: 'exchange' as TeamId,
  },
  {
    id: 'redline',
    name: 'REDLINE RIOT',
    x: 62,
    y: 17,
    summary: 'Chaotic street gauntlets',
    team: 'riot' as TeamId,
  },
]

/** How long the shared log runs; the full input record lives in commands. */
export const LOG_LIMIT = 60
/** BLOODRUSH advances one fixed tick per interval while running. */
export const RUSH_TICK_MS = 1000
/** BLOODRUSH mana accrues instead of refilling: +1 every N ticks. */
export const RUSH_MANA_EVERY = 2
export const MANA_CAP = 10
export const DEFAULT_SEED = 4817
export const ROUND_LIMITS: Record<ModeId, number> = {
  blackout: 20,
  gridiron: 30,
  bloodrush: 150,
}
export const SCORE_TO_WIN = 3
/** BLOODRUSH: ticks before the same card can be played again. */
export const RUSH_COOLDOWN = 4
/** BLOODRUSH: fighters step on every Nth tick; blows land every tick. */
export const RUSH_MOVE_EVERY = 2
/** Most hidden traps one side may have armed at once. */
export const TRAP_CAP = 1
/** Formats whose CPU alternates initiative (player, CPU, CPU, player...). */
export const ALTERNATING_INITIATIVE: Record<ModeId, boolean> = {
  blackout: true,
  gridiron: true,
  bloodrush: false,
}
/** Most fighters one side may have on the board at once. */
export const FIELD_CAP: Record<ModeId, number> = {
  blackout: 7,
  gridiron: 6,
  bloodrush: 6,
}

export interface ModeGuide {
  goal: string
  steps: string[]
  limits: string[]
}

/** First-time tester instructions shown beside each board. */
export const MODE_GUIDES: Record<ModeId, ModeGuide> = {
  blackout: {
    goal: 'Grab the ⚑ flag and carry it to your back column, the far left edge. Or wipe out every enemy fighter. After 20 rounds, the side with more total HP left wins.',
    steps: [
      'Your five fighters start face-down. Tap one, then an adjacent square to move it: one square per AP, AP refills each round.',
      'Moving reveals that fighter. Enemy fighters show as ? until they move, fight or are hit.',
      'Tap a card, then a square: creatures deploy face-down in your home columns, a trap goes on an empty square, spells and equipment go on a fighter. Each card once per round.',
      'Press END ROUND. The CPU moves and plays cards, then every fighter beside an enemy strikes at once for attack minus armor.',
      'A fighter still standing on the flag at the end of the round picks it up. Carriers walk one square per round; if one falls, the flag drops on its square.',
    ],
    limits: [
      'Local prototype: the CPU sees where fighters stand but not hidden identities or your trap.',
      'Initiative alternates (you, CPU, CPU, you …): on even rounds the CPU has already moved when your turn starts.',
      'Fixed six-card deck, no hand draw. Mana refills each round: 1, 2, 3 … up to 10. One armed trap per side.',
      'Nothing is saved: no Meat, cards or online results.',
    ],
  },
  gridiron: {
    goal: 'Score 3 breakthroughs by reaching the far-right column. After 30 rounds, the higher score wins.',
    steps: [
      'Tap a creature card, then an empty square in your left column to deploy it in that lane.',
      'Press END ROUND. Every fighter advances one square; fighters with 3+ AP sprint two.',
      'Blocked by anyone, a fighter steps into a free neighbouring lane instead of queueing; with no gap it holds.',
      'At end of round every fighter beside an enemy strikes at once for attack minus armor.',
      'Spells hit or heal a fighter, one trap hides on a mid-field square, equipment upgrades a fighter for good. Each card once per round.',
    ],
    limits: [
      'Local prototype: the CPU plays the same six-card deck rules as you.',
      'Initiative alternates (you, CPU, CPU, you …) so neither side always acts first.',
      'Nothing is saved: no Meat, cards or online results.',
    ],
  },
  bloodrush: {
    goal: 'Score 3 breakthroughs on a live clock. After 150 ticks, the higher score wins.',
    steps: [
      'Press RUN ▶. One tick per second; every second tick the board steps forward and adjacent enemies trade blows.',
      'Mana does not refill: it builds by +1 every 2 ticks, up to 10. Spend it now or bank it for a wave.',
      'Tap a card and a square at any time, running or paused. Your play lands before the next tick. A card rests 4 ticks after use.',
      'PAUSE ■ freezes the clock exactly; RUN ▶ continues from the same tick.',
      'The CPU banks mana and sends waves, but spends at once to defend its endzone.',
    ],
    limits: [
      'Local prototype: a fixed-tick simulation, not an action game. Same six-card deck, one armed trap per side.',
      'Nothing is saved: no Meat, cards or online results.',
    ],
  },
}

export function cardById(id: string): Card {
  const found = CARDS.find((card) => card.id === id)
  if (!found) throw new Error('Unknown Slime City card: ' + id)
  return found
}

export function teamById(id: TeamId): Team {
  const found = TEAMS.find((team) => team.id === id)
  if (!found) throw new Error('Unknown Slime City team: ' + id)
  return found
}

export function legalNeighbor(
  a: { x: number; y: number },
  b: { x: number; y: number },
): boolean {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1
}

/** The four orthogonal squares that exist on this board. */
export function neighbors(
  state: { width: number; height: number },
  x: number,
  y: number,
): { x: number; y: number }[] {
  return [
    { x: x + 1, y },
    { x: x - 1, y },
    { x, y: y + 1 },
    { x, y: y - 1 },
  ].filter(
    (c) => c.x >= 0 && c.y >= 0 && c.x < state.width && c.y < state.height,
  )
}

export function unitAt(
  state: MatchState,
  x: number,
  y: number,
): Fighter | undefined {
  return state.units.find((unit) => unit.hp > 0 && unit.x === x && unit.y === y)
}

/** Deterministic 32-bit mix of the seed and any integers. */
export function seededHash(...parts: number[]): number {
  let h = 0x811c9dc5
  for (const part of parts) {
    h = Math.imul(h ^ (part >>> 0), 0x01000193)
    h ^= h >>> 15
    h = Math.imul(h, 0x2c1b3c6d)
    h ^= h >>> 12
  }
  return h >>> 0
}

export function normalizeSeed(seed: number | undefined): number {
  if (seed === undefined || !Number.isFinite(seed)) return DEFAULT_SEED
  return Math.floor(Math.abs(seed)) % 4294967296
}

function other(side: Side): Side {
  return side === 'player' ? 'enemy' : 'player'
}

function teamOf(state: MatchState, side: Side): TeamId {
  return side === 'player' ? state.teamId : state.foeId
}

function manaOf(state: MatchState, side: Side): number {
  return side === 'player' ? state.mana : state.enemyMana
}

function spend(state: MatchState, side: Side, cost: number): void {
  if (side === 'player') state.mana -= cost
  else state.enemyMana -= cost
}

/** Squares where a side may deploy creatures. */
export function inDeployZone(
  state: { mode: ModeId; width: number },
  side: Side,
  x: number,
): boolean {
  if (state.mode === 'blackout')
    return side === 'player' ? x <= 1 : x >= state.width - 2
  return side === 'player' ? x === 0 : x === state.width - 1
}

/** Squares where a side may hide a trap (never in either deploy zone). */
export function inTrapZone(
  state: { mode: ModeId; width: number },
  side: Side,
  x: number,
): boolean {
  if (state.mode === 'blackout') return !inDeployZone(state, other(side), x)
  return x > 0 && x < state.width - 1
}

/** BLACKOUT: a carrier standing here wins for its side. */
export function inFlagHome(
  state: { width: number },
  side: Side,
  x: number,
): boolean {
  return side === 'player' ? x === 0 : x === state.width - 1
}

/** Lane squares advanced per round or tick. */
export function laneSteps(unit: { ap: number }): number {
  return unit.ap >= 3 ? 2 : 1
}

function emptyStats(): MatchStats {
  const kinds = () => ({ creature: 0, spell: 0, trap: 0, equipment: 0 })
  return {
    plays: { player: kinds(), enemy: kinds() },
    knockouts: { player: 0, enemy: 0 },
    trapsSprung: 0,
    flagDrops: 0,
    flagPickups: 0,
    clogs: 0,
    sidesteps: 0,
  }
}

function copy(state: MatchState): MatchState {
  return {
    ...state,
    score: [state.score[0], state.score[1]],
    flag: { ...state.flag },
    units: state.units.map((u) => ({ ...u })),
    traps: state.traps.map((t) => ({ ...t })),
    log: [...state.log],
    commands: state.commands.map((c) => ({ ...c })),
    stats: {
      plays: {
        player: { ...state.stats.plays.player },
        enemy: { ...state.stats.plays.enemy },
      },
      knockouts: { ...state.stats.knockouts },
      trapsSprung: state.stats.trapsSprung,
      flagDrops: state.stats.flagDrops,
      flagPickups: state.stats.flagPickups,
      clogs: state.stats.clogs,
      sidesteps: state.stats.sidesteps,
    },
    cooldowns: {
      player: { ...state.cooldowns.player },
      enemy: { ...state.cooldowns.enemy },
    },
  }
}

/** Each card is playable once per round (BLOODRUSH: once per few ticks). */
export function cardReady(
  state: Pick<MatchState, 'round' | 'cooldowns'>,
  side: Side,
  cardId: string,
): boolean {
  return (state.cooldowns[side][cardId] ?? 0) <= state.round
}

function message(state: MatchState, line: string): void {
  state.log = [line, ...state.log].slice(0, LOG_LIMIT)
}

function name(unit: Fighter): string {
  return cardById(unit.cardId).name
}

/** How the opponent may name a fighter without leaking a hidden identity. */
function publicName(unit: Fighter): string {
  if (unit.side === 'player') return name(unit)
  return unit.hidden ? 'A concealed enemy' : 'Enemy ' + name(unit)
}

function addFighter(
  state: MatchState,
  cardId: string,
  side: Side,
  x: number,
  y: number,
  hidden = false,
): Fighter {
  const card = cardById(cardId)
  const fighter: Fighter = {
    id: state.nextId++,
    cardId,
    side,
    x,
    y,
    hp: card.hp || 2,
    maxHp: card.hp || 2,
    attack: card.attack || 1,
    armor: card.armor || 0,
    ap: card.ap || 1,
    maxAp: card.ap || 1,
    hidden,
    carryingFlag: false,
  }
  state.units.push(fighter)
  return fighter
}

function shuffledCells(
  cells: { x: number; y: number }[],
  seed: number,
  salt: number,
): { x: number; y: number }[] {
  return cells
    .map((cell, i) => ({ cell, key: seededHash(seed, salt, i) }))
    .sort((a, b) => a.key - b.key)
    .map((item) => item.cell)
}

export function createMatch(
  mode: ModeId,
  teamId: TeamId,
  foeId: TeamId = 'ironjaw',
  seed: number = DEFAULT_SEED,
): MatchState {
  const m = MODES.find((item) => item.id === mode)
  if (!m) throw new Error('Unknown Slime City match mode')
  const dimensions = m.size.split(' × ')
  const width = Number(dimensions[0]!)
  const height = Number(dimensions[1]!)
  const s = normalizeSeed(seed)
  const rush = mode === 'bloodrush'
  const state: MatchState = {
    mode,
    width,
    height,
    round: 1,
    maxRounds: ROUND_LIMITS[mode],
    mana: rush ? 3 : 1,
    enemyMana: rush ? 3 : 1,
    score: [0, 0],
    seed: s,
    nextId: 1,
    teamId,
    // Mirror matches are allowed: a district rival may share your crew.
    foeId,
    units: [],
    traps: [],
    bossHp: 6,
    // Even widths have no centre column, so the seed picks one of the
    // central four squares and neither side is always one step closer.
    flag: {
      x: width / 2 - 1 + (seededHash(s, 1) % 2),
      y: Math.floor(height / 2) - 1 + (seededHash(s, 2) % 2),
    },
    victor: null,
    winPath: null,
    log: ['Arena loaded · seed ' + s + '. Choose a fighter or special.'],
    commands: [],
    stats: emptyStats(),
    cooldowns: { player: {}, enemy: {} },
  }
  if (mode === 'blackout') {
    for (const side of ['player', 'enemy'] as Side[]) {
      const team = teamById(teamOf(state, side))
      const lineup = [0, 0, 1, 1, 2].map((i) => team.creatures[i]!)
      const zone: { x: number; y: number }[] = []
      for (let x = 0; x < width; x++)
        for (let y = 0; y < height; y++)
          if (inDeployZone(state, side, x)) zone.push({ x, y })
      const cells = shuffledCells(zone, s, side === 'player' ? 3 : 4)
      lineup.forEach((cardId, i) =>
        addFighter(state, cardId, side, cells[i]!.x, cells[i]!.y, true),
      )
    }
  } else {
    addFighter(
      state,
      teamById(teamId).creatures[0]!,
      'player',
      0,
      seededHash(s, 5) % height,
    )
    addFighter(
      state,
      teamById(state.foeId).creatures[0]!,
      'enemy',
      width - 1,
      seededHash(s, 6) % height,
    )
  }
  return state
}

/** Remove the fallen; a dying carrier drops the flag where it fell. */
function removeDead(state: MatchState): void {
  for (const unit of state.units) {
    if (unit.hp > 0) continue
    state.stats.knockouts[unit.side]++
    if (unit.carryingFlag) {
      unit.carryingFlag = false
      state.flag = { x: unit.x, y: unit.y }
      state.stats.flagDrops++
      message(
        state,
        'The flag carrier falls! The flag drops at square ' +
          (unit.x + 1) +
          ', ' +
          (unit.y + 1) +
          '.',
      )
    }
  }
  state.units = state.units.filter((u) => u.hp > 0)
}

function triggerTrapAt(state: MatchState, unit: Fighter): void {
  const index = state.traps.findIndex(
    (trap) => trap.x === unit.x && trap.y === unit.y && trap.side !== unit.side,
  )
  if (index < 0) return
  const trap = state.traps[index]!
  state.traps.splice(index, 1)
  unit.hp -= trap.damage
  unit.hidden = false
  state.stats.trapsSprung++
  message(
    state,
    'A hidden trap explodes under ' + name(unit) + ' for ' + trap.damage + '!',
  )
}

/**
 * BLACKOUT flag bookkeeping. The carrier's flag follows it and wins on
 * reaching home. A loose flag is only picked up at end of round, after the
 * blows, so whoever steps onto it must survive one exchange first.
 */
function settleFlag(state: MatchState, pickup = false): void {
  if (state.mode !== 'blackout' || state.victor) return
  const carrier = state.units.find((u) => u.carryingFlag && u.hp > 0)
  if (carrier) {
    state.flag = { x: carrier.x, y: carrier.y }
    if (inFlagHome(state, carrier.side, carrier.x)) {
      state.victor = carrier.side
      state.winPath = 'flag'
      message(state, 'FLAG RUN! The ' + carrier.side + ' side wins.')
    }
    return
  }
  const claimant = pickup ? unitAt(state, state.flag.x, state.flag.y) : null
  if (claimant) {
    claimant.carryingFlag = true
    claimant.hidden = false
    state.stats.flagPickups++
    message(state, publicName(claimant) + ' grabs the flag! Return it to base.')
    if (inFlagHome(state, claimant.side, claimant.x)) settleFlag(state)
  }
}

function applyDeploy(
  state: MatchState,
  side: Side,
  cardId: string,
  x: number,
  y: number,
): boolean {
  const card = CARDS.find((item) => item.id === cardId)
  if (!card || state.victor || card.team !== teamOf(state, side)) return false
  if (card.cost > manaOf(state, side)) return false
  if (!cardReady(state, side, cardId)) return false
  if (x < 0 || y < 0 || x >= state.width || y >= state.height) return false
  const target = unitAt(state, x, y)
  const hidden = side === 'enemy' && state.mode === 'blackout'
  let line: string
  if (card.kind === 'creature') {
    if (target || !inDeployZone(state, side, x)) return false
    if (
      state.units.filter((u) => u.side === side).length >= FIELD_CAP[state.mode]
    )
      return false
    addFighter(state, cardId, side, x, y, state.mode === 'blackout')
    line = hidden
      ? 'The enemy deploys a concealed fighter.'
      : (side === 'enemy' ? 'Enemy deploys ' : 'You deploy ') + card.name + '.'
  } else if (card.kind === 'trap') {
    if (target || !inTrapZone(state, side, x)) return false
    // Only your own traps block a square: refusing over a hidden enemy trap
    // would tell you where it is.
    if (state.traps.some((t) => t.side === side && t.x === x && t.y === y))
      return false
    if (state.traps.filter((t) => t.side === side).length >= TRAP_CAP)
      return false
    state.traps.push({ x, y, side, damage: 2 })
    line =
      side === 'enemy'
        ? 'The enemy hides a trap somewhere.'
        : 'You hide ' +
          card.name +
          ' at square ' +
          (x + 1) +
          ', ' +
          (y + 1) +
          '.'
  } else if (
    card.effect === 'heal' ||
    card.kind === 'equipment' ||
    card.effect === 'boost'
  ) {
    if (!target || target.side !== side) return false
    if (card.effect === 'heal') {
      if (target.hp >= target.maxHp) return false
      target.hp = Math.min(target.maxHp, target.hp + 2)
    } else if (card.effect === 'armor') target.armor += 1
    else if (card.kind === 'equipment') {
      // Equipment is permanent: one extra AP every round from now on.
      target.maxAp += 1
      target.ap += 1
    } else target.ap += 2
    line =
      (side === 'enemy' ? 'Enemy plays ' : 'You play ') +
      card.name +
      ' on ' +
      publicName(target) +
      '.'
  } else {
    if (!target || target.side === side) return false
    const damage =
      card.effect === 'chaos'
        ? 1 + (seededHash(state.seed, state.round, target.id, state.nextId) % 3)
        : 2
    target.hp -= damage
    target.hidden = false
    line =
      (side === 'enemy' ? 'Enemy casts ' : 'You cast ') +
      card.name +
      ': ' +
      damage +
      ' damage to ' +
      name(target) +
      '.'
  }
  spend(state, side, card.cost)
  state.cooldowns[side][cardId] =
    state.round + (state.mode === 'bloodrush' ? RUSH_COOLDOWN : 1)
  state.stats.plays[side][card.kind]++
  message(state, line)
  removeDead(state)
  settleFlag(state)
  return true
}

function applyMove(
  state: MatchState,
  side: Side,
  id: number,
  x: number,
  y: number,
): boolean {
  if (state.victor || state.mode !== 'blackout') return false
  if (x < 0 || y < 0 || x >= state.width || y >= state.height) return false
  if (unitAt(state, x, y)) return false
  const unit = state.units.find((u) => u.id === id && u.side === side)
  if (!unit || unit.ap < 1 || !legalNeighbor(unit, { x, y })) return false
  unit.x = x
  unit.y = y
  unit.ap--
  unit.hidden = false
  message(
    state,
    publicName(unit) + ' moves to ' + (x + 1) + ', ' + (y + 1) + '.',
  )
  triggerTrapAt(state, unit)
  removeDead(state)
  settleFlag(state)
  return true
}

function applyReveal(state: MatchState, side: Side, id: number): boolean {
  if (state.victor) return false
  const unit = state.units.find((u) => u.id === id && u.side === side)
  if (!unit || !unit.hidden) return false
  unit.hidden = false
  message(state, name(unit) + ' unmasked.')
  return true
}

function recorded(
  state: MatchState,
  command: Command,
  apply: (draft: MatchState) => boolean,
): MatchState {
  const next = copy(state)
  if (!apply(next)) return state
  next.commands.push(command)
  return next
}

/** Play a card as the human player. Returns the same object when illegal. */
export function deploy(
  state: MatchState,
  cardId: string,
  x: number,
  y: number,
): MatchState {
  return deployAs(state, 'player', cardId, x, y)
}

export function deployAs(
  state: MatchState,
  side: Side,
  cardId: string,
  x: number,
  y: number,
): MatchState {
  return recorded(state, { t: 'deploy', side, card: cardId, x, y }, (draft) =>
    applyDeploy(draft, side, cardId, x, y),
  )
}

export function reveal(state: MatchState, id: number): MatchState {
  return revealAs(state, 'player', id)
}

export function revealAs(
  state: MatchState,
  side: Side,
  id: number,
): MatchState {
  return recorded(state, { t: 'reveal', side, id }, (draft) =>
    applyReveal(draft, side, id),
  )
}

export function move(
  state: MatchState,
  id: number,
  x: number,
  y: number,
): MatchState {
  return moveAs(state, 'player', id, x, y)
}

export function moveAs(
  state: MatchState,
  side: Side,
  id: number,
  x: number,
  y: number,
): MatchState {
  return recorded(state, { t: 'move', side, id, x, y }, (draft) =>
    applyMove(draft, side, id, x, y),
  )
}

/** The redacted state a side is allowed to see (UI and CPU both use it). */
export function observe(state: MatchState, side: Side): MatchView {
  return {
    side,
    mode: state.mode,
    width: state.width,
    height: state.height,
    round: state.round,
    maxRounds: state.maxRounds,
    fieldCap: FIELD_CAP[state.mode],
    trapCap: TRAP_CAP,
    mana: manaOf(state, side),
    opponentMana: manaOf(state, other(side)),
    score:
      side === 'player'
        ? [state.score[0], state.score[1]]
        : [state.score[1], state.score[0]],
    salt: seededHash(state.seed, side === 'player' ? 101 : 202),
    flag: { ...state.flag },
    units: state.units
      .filter((u) => u.hp > 0)
      .map((u) => {
        const known = u.side === side || !u.hidden
        return {
          id: u.id,
          side: u.side,
          x: u.x,
          y: u.y,
          hidden: u.hidden,
          known,
          cardId: known ? u.cardId : null,
          hp: known ? u.hp : null,
          maxHp: known ? u.maxHp : null,
          attack: known ? u.attack : null,
          armor: known ? u.armor : null,
          ap: known ? u.ap : null,
          maxAp: known ? u.maxAp : null,
          carryingFlag: u.carryingFlag,
        }
      }),
    traps: state.traps.filter((t) => t.side === side).map((t) => ({ ...t })),
    hand: CARDS.filter(
      (card) =>
        card.team === teamOf(state, side) && cardReady(state, side, card.id),
    ),
    victor: state.victor,
  }
}

/** Let the CPU act for one side on a draft until it passes. */
function runCpu(
  state: MatchState,
  side: Side,
  apply: (action: CpuAction) => boolean,
): void {
  const tried = new Set<string>()
  for (let i = 0; i < 80 && !state.victor; i++) {
    const action = chooseCpuAction(observe(state, side), tried)
    if (!action) return
    if (!apply(action)) tried.add(cpuActionKey(action))
  }
}

export function cpuActionKey(action: CpuAction): string {
  return action.t === 'deploy'
    ? 'd:' + action.card + ':' + action.x + ':' + action.y
    : 'm:' + action.id + ':' + action.x + ':' + action.y
}

/**
 * Let the CPU take the player's side for one turn (headless playtests).
 * Its plays are recorded as ordinary commands, so the match still replays.
 */
export function cpuTurn(state: MatchState, side: Side = 'player'): MatchState {
  let current = state
  const tried = new Set<string>()
  for (let i = 0; i < 80 && !current.victor; i++) {
    const action = chooseCpuAction(observe(current, side), tried)
    if (!action) break
    const next =
      action.t === 'deploy'
        ? deployAs(current, side, action.card, action.x, action.y)
        : moveAs(current, side, action.id, action.x, action.y)
    if (next === current) tried.add(cpuActionKey(action))
    current = next
  }
  return current
}

/** Both lane formats: every fighter advances; teammates flow around jams. */
function laneMovement(state: MatchState): void {
  // Who steps first alternates by movement beat, so neither side always
  // claims a contested square (BLOODRUSH only moves on every Nth tick).
  const beat =
    state.mode === 'bloodrush'
      ? Math.floor(state.round / RUSH_MOVE_EVERY)
      : state.round
  const order: Side[] =
    beat % 2 === 1 ? ['player', 'enemy'] : ['enemy', 'player']
  for (const side of order) {
    const dir = side === 'player' ? 1 : -1
    const goal = side === 'player' ? state.width - 1 : 0
    const units = state.units
      .filter((u) => u.side === side && u.hp > 0)
      .sort((a, b) => (b.x - a.x) * dir || a.id - b.id)
    for (const unit of units) {
      for (let step = 0; step < laneSteps(unit); step++) {
        if (unit.hp <= 0 || unit.x === goal) break
        const ahead = unitAt(state, unit.x + dir, unit.y)
        if (!ahead) {
          unit.x += dir
        } else {
          // Blocked by anyone: step into a free neighbouring lane if the
          // square beyond it is open too, rather than queueing behind.
          const lanes = [unit.y - 1, unit.y + 1]
          if (seededHash(state.seed, state.round, unit.id) % 2) lanes.reverse()
          const lane = lanes.find(
            (y) =>
              y >= 0 &&
              y < state.height &&
              !unitAt(state, unit.x, y) &&
              !unitAt(state, unit.x + dir, y),
          )
          if (lane === undefined) {
            if (ahead.side === side) state.stats.clogs++
            break
          }
          unit.y = lane
          state.stats.sidesteps++
        }
        unit.hidden = false
        triggerTrapAt(state, unit)
        if (unit.hp > 0 && unit.x === goal) {
          state.score[side === 'player' ? 0 : 1]++
          unit.hp = 0
          message(
            state,
            (side === 'player' ? name(unit) : 'Enemy ' + name(unit)) +
              ' breaks through! ' +
              state.score[0] +
              '–' +
              state.score[1] +
              '.',
          )
          break
        }
      }
    }
    // Scorers leave the field; trap victims die here too.
    state.units = state.units.filter((u) => {
      if (u.hp > 0) return true
      const scored = u.x === (u.side === 'player' ? state.width - 1 : 0)
      if (!scored) state.stats.knockouts[u.side]++
      return false
    })
  }
}

function combat(state: MatchState): void {
  const damage = new Map<number, number>()
  for (const fighter of state.units) {
    if (fighter.hp <= 0) continue
    const foes = state.units.filter(
      (o) => o.side !== fighter.side && o.hp > 0 && legalNeighbor(fighter, o),
    )
    if (!foes.length) continue
    const hit = (o: Fighter) => Math.max(0, fighter.attack - o.armor)
    const victim = [...foes].sort(
      (a, b) =>
        Number(b.carryingFlag) - Number(a.carryingFlag) ||
        Number(b.hp <= hit(b)) - Number(a.hp <= hit(a)) ||
        a.hp - b.hp ||
        a.id - b.id,
    )[0]!
    damage.set(victim.id, (damage.get(victim.id) || 0) + hit(victim))
    fighter.hidden = false
    victim.hidden = false
  }
  if (!damage.size) return
  let falls = 0
  for (const unit of state.units) {
    unit.hp -= damage.get(unit.id) || 0
    if (unit.hp <= 0) falls++
  }
  message(
    state,
    damage.size +
      ' fighters trade blows' +
      (falls ? '; ' + falls + ' fall.' : '.'),
  )
  removeDead(state)
}

function hpTotal(state: MatchState, side: Side): number {
  return state.units
    .filter((u) => u.side === side)
    .reduce((sum, u) => sum + u.hp, 0)
}

function finish(state: MatchState, victor: Side | 'draw', path: WinPath) {
  state.victor = victor
  state.winPath = path
}

function checkEnd(state: MatchState): void {
  if (state.victor) return
  if (state.mode === 'blackout') {
    const p = state.units.some((u) => u.side === 'player')
    const e = state.units.some((u) => u.side === 'enemy')
    if (!p || !e) {
      finish(state, p === e ? 'draw' : p ? 'player' : 'enemy', 'rout')
      return
    }
  } else if (state.score[0] >= SCORE_TO_WIN || state.score[1] >= SCORE_TO_WIN) {
    const [a, b] = state.score
    finish(state, a === b ? 'draw' : a > b ? 'player' : 'enemy', 'score')
    return
  }
  if (state.round >= state.maxRounds) {
    const a =
      state.mode === 'blackout' ? hpTotal(state, 'player') : state.score[0]
    const b =
      state.mode === 'blackout' ? hpTotal(state, 'enemy') : state.score[1]
    finish(state, a === b ? 'draw' : a > b ? 'player' : 'enemy', 'time')
  }
}

/** Turn formats: does the human act before the CPU this round? */
export function playerHasInitiative(
  state: Pick<MatchState, 'round' | 'mode'>,
): boolean {
  return !ALTERNATING_INITIATIVE[state.mode] || state.round % 2 === 1
}

/**
 * End the player's round (turn formats) or run one fixed tick (BLOODRUSH):
 * the enemy CPU plays, the board resolves, and the next round begins.
 */
export function advance(state: MatchState): MatchState {
  if (state.victor) return state
  const next = copy(state)
  next.commands.push({ t: 'end' })
  const enemyTurn = () =>
    runCpu(next, 'enemy', (a) =>
      a.t === 'deploy'
        ? applyDeploy(next, 'enemy', a.card, a.x, a.y)
        : applyMove(next, 'enemy', a.id, a.x, a.y),
    )
  // Initiative alternates in the turn formats (player, CPU, CPU, player...):
  // on odd rounds the CPU answers now; on even rounds it already moved first.
  if (playerHasInitiative(next)) enemyTurn()
  if (!next.victor) {
    if (
      next.mode === 'gridiron' ||
      (next.mode === 'bloodrush' && next.round % RUSH_MOVE_EVERY === 0)
    )
      laneMovement(next)
    if (next.mode !== 'bloodrush' || next.round % RUSH_MOVE_EVERY === 0)
      combat(next)
    settleFlag(next, true)
    checkEnd(next)
  }
  if (!next.victor) {
    next.round++
    if (next.mode === 'bloodrush') {
      if (next.round % RUSH_MANA_EVERY === 0) {
        next.mana = Math.min(MANA_CAP, next.mana + 1)
        next.enemyMana = Math.min(MANA_CAP, next.enemyMana + 1)
      }
    } else {
      next.mana = Math.min(MANA_CAP, next.round)
      next.enemyMana = next.mana
      message(
        next,
        'Round ' + next.round + ' · ' + next.mana + ' mana available.',
      )
    }
    // Carriers lumber: one square per round, unless a card boosts them.
    for (const unit of next.units) unit.ap = unit.carryingFlag ? 1 : unit.maxAp
    if (!playerHasInitiative(next)) {
      message(next, 'The CPU has the initiative this round.')
      enemyTurn()
    }
  }
  if (next.victor) {
    const how =
      next.winPath === 'flag'
        ? 'by flag run'
        : next.winPath === 'score'
          ? 'by breakthroughs'
          : next.winPath === 'rout'
            ? 'by rout'
            : 'on the clock'
    message(
      next,
      next.victor === 'draw'
        ? 'DRAW ' + how + '.'
        : next.victor.toUpperCase() + ' WINS THE PIT ' + how + '.',
    )
  }
  return next
}

export interface MatchSetup {
  mode: ModeId
  teamId: TeamId
  foeId: TeamId
  seed: number
}

/** Rebuild a match from its setup and command record. */
export function replayMatch(
  setup: MatchSetup,
  commands: Command[],
): MatchState {
  let state = createMatch(setup.mode, setup.teamId, setup.foeId, setup.seed)
  for (const c of commands) {
    if (c.t === 'end') state = advance(state)
    else if (c.t === 'deploy') state = deployAs(state, c.side, c.card, c.x, c.y)
    else if (c.t === 'move') state = moveAs(state, c.side, c.id, c.x, c.y)
    else state = revealAs(state, c.side, c.id)
  }
  return state
}
