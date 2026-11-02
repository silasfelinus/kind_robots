// Slime City comparison lab: shared data plus a pure, seeded rules engine
// for the three square-grid formats (conductor slime-city t-001, t-002).
// Every rule here is deterministic from (mode, teams, seed, commands), so a
// match can be replayed exactly from its command record, and the CPU only
// ever decides from observe(), the redacted per-side view.
import { chooseCpuAction } from './cpu'
import { RESERVE_CARDS } from './reserveCards'
import { GUTTER_CROWN_WAVE_TWO } from './gutterCrownWaveTwo'

export type Color = 'red' | 'blue' | 'purple' | 'green' | 'gold'
export type TeamId =
  'catgirls' | 'bloodfairies' | 'ironjaw' | 'riot' | 'undertow' | 'exchange'
export type ModeId = 'blackout' | 'gridiron' | 'bloodrush'
export type CardKind = 'creature' | 'spell' | 'trap' | 'equipment'
export type Side = 'player' | 'enemy'
export type AttackStyle =
  'claw' | 'arrow' | 'spell' | 'sword' | 'hammer' | 'blast'
export type WinPath = 'flag' | 'score' | 'rout' | 'time' | 'monster'

/**
 * Optional objective and pacing rules (conductor slime-city t-003). Every one
 * is off by default, so the default formats play exactly as compared in the
 * t-016 report; the lab can switch them on per match for side-by-side tests.
 * Choosing which become standard is Silas's call (t-013).
 */
export interface RuleVariants {
  /** Lanes: a tie at the limit goes to the side whose fighters stand further upfield. */
  tiebreak: boolean
  /** Tied at the limit: sudden-death extra time, first breakthrough wins. */
  overtime: boolean
  /** Lanes: in a scoring drought, fighters in the opponent's half surge. */
  momentum: boolean
  /** A neutral giant monster holds the centre; the killing blow wins. */
  monster: boolean
  /** Lanes: the first crew to knock out ROUT_TARGET enemy fighters wins. */
  rout: boolean
  /** BLOODRUSH: which side acts last before the board steps alternates by beat. */
  rushAlternate: boolean
  /** Legacy hidden-army fixture only; the normal Blackout game is open. */
  classicFog?: boolean
}
export type Keyword =
  | 'ambush'
  | 'regen'
  | 'swarm'
  | 'leech'
  | 'bulldoze'
  | 'volatile'
  | 'pierce'
  | 'snare'
  | 'collect'
export type Effect =
  | 'zap'
  | 'heal'
  | 'chaos'
  | 'snare'
  | 'armor'
  | 'boost'
  | 'blast'
  | 'root'
  | 'debt'
  | 'sharpen'
  | 'grant'
  | 'scan'

export interface Team {
  id: TeamId
  name: string
  color: Color
  district: string
  motto: string
  hook: string
  insignia: string
  /** How the crew wants to win, in one breath. */
  pattern: string
  /** How to beat it: the named counterplay. */
  counters: string
  /** The crew's signature card. */
  signature: string
  /** Hidden traps this crew may keep armed at once. */
  trapCap: number
  /** Deck order: four creatures, then six specials. */
  creatures: string[]
  special: string[]
  /** BLACKOUT: the five creatures that start face-down. */
  army: string[]
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
  effect?: Effect
  /** Damage or healing; 2 when omitted. */
  power?: number
  /** Creature keywords; equipment with effect 'grant' hands out grants. */
  keywords?: Keyword[]
  grants?: Keyword[]
  /** VOLATILE explosion damage; 1 when omitted. */
  burst?: number
  /** blast: who else beside the target is hit. */
  splash?: 'enemies' | 'all'
  /** A trap that also costs its victim the next move. */
  roots?: boolean
  /** Mana debt this card puts on the other crew. */
  debt?: number
  /** A boost that also readies the fighter's AMBUSH again. */
  rearm?: boolean
  signature?: boolean
  text: string
  symbol: string
  range?: number
  attackStyle?: AttackStyle
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
  range?: number
  attackStyle?: AttackStyle
  summonedRound?: number
  attackedRound?: number
  /** Absent on hand-built fixtures: no keywords. */
  keywords?: Keyword[]
  burst?: number
  /** AMBUSH already spent. */
  struck?: boolean
  /** Cannot move in any round up to and including this one. */
  rootedUntil?: number
}

/** The neutral giant monster (t-003 monster variant). */
export interface Monster {
  x: number
  y: number
  hp: number
  maxHp: number
  attack: number
  armor: number
}

export interface Trap {
  x: number
  y: number
  side: Side
  damage: number
  roots?: boolean
  debt?: number
}

/** One recorded input. Replaying these from createMatch rebuilds a match. */
export type Command =
  | { t: 'deploy'; side: Side; card: string; x: number; y: number }
  | { t: 'move'; side: Side; id: number; x: number; y: number }
  | { t: 'reveal'; side: Side; id: number }
  | { t: 'attack'; side: Side; id: number; target: number }
  | { t: 'end' }

export interface MatchStats {
  plays: Record<Side, Record<CardKind, number>>
  knockouts: Record<Side, number>
  trapsSprung: number
  flagDrops: number
  flagPickups: number
  clogs: number
  sidesteps: number
  /** VOLATILE fighters that went off. */
  explosions: number
  /** Mana debt charged, both sides together. */
  debt: number
  /** Moves lost to roots and snares. */
  roots: number
  /** BULLDOZE shoves in the lanes. */
  shoves: number
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
  /** Optional non-rewarding customized deck for the player. */
  playerDeck?: string[]
  units: Fighter[]
  traps: Trap[]
  /** Optional authored scenario bonuses, applied to fighters deployed later. */
  scenarioBonus?: { playerHp: number; enemyArmor: number; fewerRivals: number }
  flag: { x: number; y: number }
  rules: RuleVariants
  /** Present only with the monster variant, until it falls. */
  monster: Monster | null
  /** Damage each side has dealt the monster (its tie-break). */
  monsterDamage: Record<Side, number>
  /** Sudden-death extra time is running. */
  overtime: boolean
  /** Round (tick) of the last breakthrough, for MOMENTUM. */
  lastBreak: number
  victor: Side | 'draw' | null
  winPath: WinPath | null
  log: string[]
  commands: Command[]
  stats: MatchStats
  /** BLACKOUT draw pile, playable hand, spent pile and seeded reshuffle count. */
  piles: Record<Side, string[]>
  hands: Record<Side, string[]>
  discards: Record<Side, string[]>
  shuffles: Record<Side, number>
  /** Round/tick from which each side may play each card again. */
  cooldowns: Record<Side, Record<string, number>>
  /** Mana each side owes; it comes out of that side's next refill. */
  debt: Record<Side, number>
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
  keywords: Keyword[] | null
  /** Its AMBUSH has not struck yet. */
  ambushReady: boolean | null
  carryingFlag: boolean
  range: number | null
  attackStyle: AttackStyle | null
  summonedRound: number | null
  attackedRound: number | null
  /** Public: a rooted fighter visibly cannot move this round. */
  rooted: boolean
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
  /** [own, opponent] mana owed at the next refill. */
  debt: [number, number]
  /** Per-side tie-break salt; never the match seed itself. */
  salt: number
  flag: { x: number; y: number }
  /** The neutral monster, which both sides can always see. */
  monster: Monster | null
  units: ViewFighter[]
  traps: Trap[]
  hand: Card[]
  victor: Side | 'draw' | null
}

export type CpuAction =
  | { t: 'deploy'; card: string; x: number; y: number }
  | { t: 'move'; id: number; x: number; y: number }
  | { t: 'attack'; id: number; target: number }

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
    subtitle: 'Open-arena tactical cards · primary mode',
    size: '10 × 6',
    cadence: 'TURN-BASED',
    detail:
      'Deploy visible monsters from a four-card hand, cross no-man’s-land and capture the flag. Only stealth specialists hide.',
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

/**
 * The formats a player can pick. BLACKOUT is the game; BLOODRUSH is the
 * arcade alternative. MEATBALL (gridiron) is retired from play and stays only
 * as an engine fixture for the deterministic contract tests.
 */
export const PLAYER_MODES = MODES.filter((mode) => mode.id !== 'gridiron')

/**
 * Creature keywords. Each one belongs to a crew's play pattern and has a
 * named counter elsewhere in the city, so no crew is a pure upgrade.
 */
export const KEYWORDS: Record<Keyword, { label: string; text: string }> = {
  ambush: {
    label: 'AMBUSH',
    text: 'Its first blow of the match deals +2.',
  },
  regen: {
    label: 'REGEN',
    text: 'Licks its wounds: heals 1 HP at the end of any round (BLOODRUSH: beat) it ends with no enemy beside it.',
  },
  swarm: {
    label: 'SWARM',
    text: '+1 attack while a friendly fighter stands beside it.',
  },
  leech: {
    label: 'LEECH',
    text: 'Heals 1 HP whenever its blow deals damage.',
  },
  bulldoze: {
    label: 'BULLDOZE',
    text: 'Lanes: blocked head-on by an enemy, it shoves that enemy one square back.',
  },
  volatile: {
    label: 'VOLATILE',
    text: 'When it falls it explodes, hitting every fighter beside it, friend or foe.',
  },
  pierce: {
    label: 'PIERCE',
    text: 'Its blows ignore 1 armor.',
  },
  snare: {
    label: 'SNARE',
    text: 'A fighter it damages loses its next move.',
  },
  collect: {
    label: 'COLLECT',
    text: 'Each damaging blow puts the other crew 1 mana in debt (most 3).',
  },
}

/** Every crew deck: exactly this many cards and this many creatures. */
export const DECK_SIZE = 10
export const BLACKOUT_HAND_SIZE = 4
export const DECK_CREATURES = 4
/** Unpaid debt never stacks past this; it comes out of the next refill. */
export const DEBT_CAP = 2

export const TEAMS: Team[] = [
  {
    id: 'catgirls',
    name: 'GENE RIOT CATGIRLS',
    color: 'blue',
    district: 'CHIMERA HEIGHTS',
    motto: 'Nine lives. Zero patents.',
    hook: 'Escaped genetic experiments who turned their old laboratory into a neighborhood sanctuary. Ambushes and tactical regeneration.',
    insignia: '✦',
    pattern:
      'Hit first, hit hard, then lick your wounds. Ambushers land one huge opening blow and regenerating veterans outlast the trade.',
    counters:
      'Spread the damage out: Riot Saints explosions and Bloodfairy moshpits hit many cats at once, and a regenerating cat that is snared or taxed still has to finish the fight.',
    signature: 'chimera',
    trapCap: 1,
    creatures: ['lynx', 'mau', 'calico', 'chimera'],
    special: [
      'pounce',
      'scentmine',
      'reknit',
      'shredders',
      'ninthlife',
      'laser',
    ],
    army: ['calico', 'calico', 'calico', 'lynx', 'lynx'],
  },
  {
    id: 'bloodfairies',
    name: 'PUNK BLOODFAIRIES',
    color: 'purple',
    district: 'NEEDLE ALLEY',
    motto: 'Small wings. Big knives.',
    hook: 'A riotous crew of tiny blood-magic punks who treat the megacity as one very loud mosh pit. Cheap swarms and surprise strikes.',
    insignia: '❋',
    pattern:
      'Flood the street. Cheap fighters hit harder in a pack, leech back their health and the moshpit punishes anyone who bunches up.',
    counters:
      'Armor shrugs off small blows (Ironjaw plating), one explosion can pop a whole pack (Riot Saints), and any lone fairy loses its swarm bonus.',
    signature: 'queen',
    trapCap: 1,
    creatures: ['sprite', 'pogo', 'razor', 'queen'],
    special: ['mosh', 'bloodwire', 'spurs', 'pinprick', 'choker', 'feedback'],
    army: ['pogo', 'pogo', 'razor', 'razor', 'queen'],
  },
  {
    id: 'ironjaw',
    name: 'IRONJAW CHROME OGRES',
    color: 'green',
    district: 'THE FOUNDRY',
    motto: 'More chrome. More teeth.',
    hook: 'Industrial-size cybernetic ogres fighting for freedom from the factories that built their bodies. Armor, hardware and bulldozing.',
    insignia: '⬡',
    pattern:
      'A slow wall that wins every trade. Armored ogres bulldoze blockers out of the lane, and plating turns a good fighter into a fortress.',
    counters:
      'Pierce goes through plating (Undertow, Riot Saints), debt starves the expensive upgrades (Meat Exchange), and a snared ogre is a very large paperweight.',
    signature: 'juggernaut',
    trapCap: 1,
    creatures: ['scrapper', 'welder', 'bulldozer', 'juggernaut'],
    special: [
      'overclock',
      'shocktrap',
      'plating',
      'wreckingfist',
      'ducttape',
      'slap',
    ],
    army: ['scrapper', 'welder', 'welder', 'bulldozer', 'bulldozer'],
  },
  {
    id: 'riot',
    name: 'RIOT SAINTS',
    color: 'red',
    district: 'REDLINE RIOT',
    motto: 'Make it explode twice.',
    hook: 'Joyfully irresponsible demolition gladiators in a city where nobody has read the fire code. High-risk chaos cards.',
    insignia: '✸',
    pattern:
      'Everything explodes, including you. Volatile fighters go off when they fall, chaos cards roll the dice and confetti cannons hit everyone nearby.',
    counters:
      'Keep your distance and keep your armor: explosions deal 1 or 2, so plated or healing crews shrug them off, and spread-out fighters give the blast nothing to chain through.',
    signature: 'bomber',
    trapCap: 1,
    creatures: ['rat', 'firebrand', 'kaboom', 'bomber'],
    special: ['firestorm', 'badluck', 'fuse', 'confetti', 'fusevest', 'drink'],
    army: ['rat', 'rat', 'firebrand', 'firebrand', 'kaboom'],
  },
  {
    id: 'undertow',
    name: 'UNDERTOW INTELLIGENCE',
    color: 'blue',
    district: 'THE UNDERTOW',
    motto: 'We already saw you.',
    hook: 'Sewer spies, surveillance witches and amphibious informants who rig every intersection before a fight begins.',
    insignia: '◈',
    pattern:
      'Rig the route. The only crew that keeps two traps armed, it snares runners in place and pierces armor while the sonar disarms your tricks.',
    counters:
      'Bodies beat traps: a swarm or a regenerating front line walks through two traps and keeps coming. Their fighters are fragile once you reach them.',
    signature: 'oracle',
    trapCap: 2,
    creatures: ['watcher', 'frogtrooper', 'eel', 'oracle'],
    special: ['blackout', 'tripwire', 'visor', 'grate', 'sonar', 'drysuit'],
    army: ['frogtrooper', 'frogtrooper', 'eel', 'eel', 'oracle'],
  },
  {
    id: 'exchange',
    name: 'MEAT EXCHANGE',
    color: 'gold',
    district: 'CROWN MARKET',
    motto: 'Terms and conditions apply.',
    hook: 'Gold-toothed arena monopolists who buy muscle, sell favors and collect battlefield debts.',
    insignia: '◆',
    pattern:
      'Tax them dry, then buy the arena. Collectors put every blow on your tab so you start rounds short of mana, until the Meat Mogul arrives.',
    counters:
      'Rush them early: collectors are slow, the Mogul costs 6 and the champions have thin armor. Cheap swarms and pierce get there before the interest does.',
    signature: 'mogul',
    trapCap: 1,
    creatures: ['repo', 'collector', 'broker', 'mogul'],
    special: [
      'collection',
      'debttrap',
      'contract',
      'foreclosure',
      'handshake',
      'hushmoney',
    ],
    army: ['repo', 'repo', 'repo', 'repo', 'collector'],
  },
]

export const CARDS: Card[] = [
  // --- GENE RIOT CATGIRLS: ambush and regeneration
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
    keywords: ['ambush'],
    text: 'Fast prototype scout. Opens with a lightning claw swipe.',
    symbol: '✦',
  },
  {
    id: 'mau',
    name: 'Mau-77',
    kind: 'creature',
    team: 'catgirls',
    cost: 2,
    hp: 3,
    attack: 3,
    armor: 0,
    ap: 2,
    keywords: ['ambush'],
    text: 'Designer-claw enforcer. The first scratch is the one you remember.',
    symbol: '◉',
  },
  {
    id: 'calico',
    name: 'Clinic Calico',
    kind: 'creature',
    team: 'catgirls',
    cost: 2,
    hp: 3,
    attack: 1,
    armor: 0,
    ap: 2,
    keywords: ['regen'],
    text: 'Stole the lab’s healing vats and now runs a free clinic out of them.',
    symbol: '✚',
  },
  {
    id: 'chimera',
    name: 'Madame Chimera',
    kind: 'creature',
    team: 'catgirls',
    cost: 4,
    hp: 5,
    attack: 2,
    armor: 2,
    ap: 2,
    keywords: ['ambush', 'regen'],
    signature: true,
    text: 'Nine life signatures. She pounces first and stitches herself up after.',
    symbol: '✹',
  },
  {
    id: 'pounce',
    name: 'Catnip Overdrive',
    kind: 'spell',
    team: 'catgirls',
    cost: 2,
    effect: 'boost',
    rearm: true,
    text: 'A friendly fighter gains 2 extra AP this round, and its AMBUSH is ready to pounce again.',
    symbol: '⚡',
  },
  {
    id: 'scentmine',
    name: 'Scent Mine',
    kind: 'trap',
    team: 'catgirls',
    cost: 1,
    effect: 'snare',
    power: 1,
    roots: true,
    text: 'Hidden trap: 1 damage, and the victim stops to sniff it (loses its next move).',
    symbol: '◇',
  },
  {
    id: 'reknit',
    name: 'Reknit Serum',
    kind: 'spell',
    team: 'catgirls',
    cost: 1,
    effect: 'heal',
    power: 3,
    text: 'Restore 3 HP to a friendly fighter.',
    symbol: '✚',
  },
  {
    id: 'shredders',
    name: 'Patent Shredders',
    kind: 'equipment',
    team: 'catgirls',
    cost: 2,
    effect: 'sharpen',
    text: 'Lab-grown claws, formerly corporate property. A fighter gains +1 attack for good.',
    symbol: '⟋',
  },
  {
    id: 'ninthlife',
    name: 'Ninth Life Collar',
    kind: 'equipment',
    team: 'catgirls',
    cost: 2,
    effect: 'grant',
    grants: ['regen'],
    text: 'A bell that rings when you should already be dead. A fighter gains REGEN.',
    symbol: '◎',
  },
  {
    id: 'laser',
    name: 'Laser Pointer',
    kind: 'spell',
    team: 'catgirls',
    cost: 1,
    effect: 'root',
    power: 0,
    text: 'The red dot. An enemy fighter stares at it and loses its next move.',
    symbol: '•',
  },
  // --- PUNK BLOODFAIRIES: swarm and leech
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
    keywords: ['swarm'],
    text: 'Small, mean and loud. Louder with friends.',
    symbol: '❋',
  },
  {
    id: 'pogo',
    name: 'Pogo Brat',
    kind: 'creature',
    team: 'bloodfairies',
    cost: 1,
    hp: 2,
    attack: 1,
    armor: 0,
    ap: 2,
    keywords: ['swarm'],
    text: 'Bounces off heads. Yours, then everyone else’s.',
    symbol: '✱',
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
    keywords: ['leech'],
    text: 'Moves in a blur and drinks the applause.',
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
    keywords: ['swarm', 'leech'],
    signature: true,
    text: 'Union leader of the damned. Never crowd-surfs alone.',
    symbol: '✷',
  },
  {
    id: 'mosh',
    name: 'Moshpit Massacre',
    kind: 'spell',
    team: 'bloodfairies',
    cost: 1,
    effect: 'blast',
    power: 1,
    splash: 'enemies',
    text: 'Start a pit on an enemy: 1 damage to it and to every enemy beside it.',
    symbol: '⚡',
  },
  {
    id: 'bloodwire',
    name: 'Bloodwire',
    kind: 'trap',
    team: 'bloodfairies',
    cost: 1,
    effect: 'snare',
    power: 2,
    text: 'Hidden trap: a tripline of glittery razor floss, 2 damage.',
    symbol: '◇',
  },
  {
    id: 'spurs',
    name: 'Razor Spurs',
    kind: 'equipment',
    team: 'bloodfairies',
    cost: 2,
    effect: 'boost',
    text: 'A fighter gains +1 AP every round for good.',
    symbol: '✧',
  },
  {
    id: 'pinprick',
    name: 'Safety-Pin Stab',
    kind: 'spell',
    team: 'bloodfairies',
    cost: 1,
    effect: 'zap',
    power: 2,
    text: 'A cheap shot from nowhere: 2 damage to an enemy.',
    symbol: '⟊',
  },
  {
    id: 'choker',
    name: 'Spiked Choker',
    kind: 'equipment',
    team: 'bloodfairies',
    cost: 1,
    effect: 'grant',
    grants: ['swarm'],
    text: 'Matching jewelry for the whole gang. A fighter gains SWARM.',
    symbol: '⊛',
  },
  {
    id: 'feedback',
    name: 'Amp-Stack Feedback',
    kind: 'spell',
    team: 'bloodfairies',
    cost: 3,
    effect: 'zap',
    power: 3,
    text: 'Turn every amp in Needle Alley to eleven: 3 damage to an enemy.',
    symbol: '♫',
  },
  // --- IRONJAW CHROME OGRES: armor and bulldozing
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
    text: 'Scrap-metal fist fighter. Dents are a personality.',
    symbol: '⬡',
  },
  {
    id: 'welder',
    name: 'Spark Welder',
    kind: 'creature',
    team: 'ironjaw',
    cost: 2,
    hp: 3,
    attack: 2,
    armor: 0,
    ap: 1,
    text: 'Fixes the line and sets the opposition on fire, a little.',
    symbol: '⚒',
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
    keywords: ['bulldoze'],
    text: 'Armored wallbreaker. Does not wait for you to move.',
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
    keywords: ['bulldoze'],
    signature: true,
    text: 'A tank with opinions, and the opinion is: move.',
    symbol: '⬢',
  },
  {
    id: 'overclock',
    name: 'Overclock Core',
    kind: 'spell',
    team: 'ironjaw',
    cost: 2,
    effect: 'boost',
    text: 'Grant a friendly fighter 2 extra AP this round.',
    symbol: '⚡',
  },
  {
    id: 'shocktrap',
    name: 'Shock Plate',
    kind: 'trap',
    team: 'ironjaw',
    cost: 2,
    effect: 'snare',
    power: 2,
    roots: true,
    text: 'Hidden trap: 2 damage, and the victim is welded to the floor (loses its next move).',
    symbol: '◇',
  },
  {
    id: 'plating',
    name: 'Foundry Plating',
    kind: 'equipment',
    team: 'ironjaw',
    cost: 2,
    effect: 'armor',
    text: 'Bolt on another layer: a fighter gains +1 armor for good.',
    symbol: '⬟',
  },
  {
    id: 'wreckingfist',
    name: 'Wrecking Fist',
    kind: 'equipment',
    team: 'ironjaw',
    cost: 2,
    effect: 'sharpen',
    text: 'A hand-sized wrecking ball on a chain. A fighter gains +1 attack for good.',
    symbol: '⊗',
  },
  {
    id: 'ducttape',
    name: 'Duct-Tape Weld',
    kind: 'spell',
    team: 'ironjaw',
    cost: 1,
    effect: 'heal',
    power: 2,
    text: 'It is not up to code. Restore 2 HP to a friendly fighter.',
    symbol: '✚',
  },
  {
    id: 'slap',
    name: 'Hydraulic Slap',
    kind: 'spell',
    team: 'ironjaw',
    cost: 3,
    effect: 'zap',
    power: 2,
    text: 'An open-palm piston strike: 2 damage to an enemy.',
    symbol: '✋',
  },
  // --- RIOT SAINTS: explosions and dice
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
    keywords: ['volatile'],
    text: 'All teeth, no planning, one firecracker in each cheek.',
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
    keywords: ['volatile'],
    text: 'Carries six lit fuses and no water.',
    symbol: '✴',
  },
  {
    id: 'kaboom',
    name: 'Sister Kaboom',
    kind: 'creature',
    team: 'riot',
    cost: 3,
    hp: 4,
    attack: 3,
    armor: 0,
    ap: 2,
    keywords: ['pierce'],
    text: 'Blesses every wall she knocks down. Her drill bit goes through plating.',
    symbol: '✝',
  },
  {
    id: 'bomber',
    name: 'Grand Detonator',
    kind: 'creature',
    team: 'riot',
    cost: 4,
    hp: 4,
    attack: 2,
    armor: 0,
    ap: 1,
    keywords: ['volatile'],
    burst: 2,
    signature: true,
    text: 'Makes the stadium shake. Goes out with a 2-damage bang.',
    symbol: '✺',
  },
  {
    id: 'firestorm',
    name: 'Accidental Firestorm',
    kind: 'spell',
    team: 'riot',
    cost: 2,
    effect: 'chaos',
    text: 'Deal 1–3 damage to an enemy, seeded. Nobody meant it.',
    symbol: '⚡',
  },
  {
    id: 'badluck',
    name: 'Whoops Grenade',
    kind: 'trap',
    team: 'riot',
    cost: 1,
    effect: 'snare',
    power: 2,
    text: 'Hidden trap: someone dropped a grenade, 2 damage.',
    symbol: '◇',
  },
  {
    id: 'fuse',
    name: 'Illegal Booster',
    kind: 'equipment',
    team: 'riot',
    cost: 2,
    effect: 'boost',
    text: 'A rocket strapped on backwards. A fighter gains +1 AP every round for good.',
    symbol: '✧',
  },
  {
    id: 'confetti',
    name: 'Confetti Cannon',
    kind: 'spell',
    team: 'riot',
    cost: 2,
    effect: 'blast',
    power: 2,
    splash: 'all',
    text: 'Party at the target: 2 damage to an enemy, 1 to every fighter beside it. Yes, yours too.',
    symbol: '✲',
  },
  {
    id: 'fusevest',
    name: 'Lit-Fuse Vest',
    kind: 'equipment',
    team: 'riot',
    cost: 1,
    effect: 'grant',
    grants: ['volatile'],
    text: 'Safety orange, technically. A fighter gains VOLATILE.',
    symbol: '⧖',
  },
  {
    id: 'drink',
    name: 'Hold My Drink',
    kind: 'spell',
    team: 'riot',
    cost: 1,
    effect: 'boost',
    text: 'Famous last words: a friendly fighter gains 2 extra AP this round.',
    symbol: '⚑',
  },
  // --- UNDERTOW INTELLIGENCE: traps, snares and pierce
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
    keywords: ['pierce'],
    text: 'Knows every drain and every weak rivet.',
    symbol: '◈',
  },
  {
    id: 'frogtrooper',
    name: 'Frog Trooper',
    kind: 'creature',
    team: 'undertow',
    cost: 2,
    hp: 4,
    attack: 2,
    armor: 0,
    ap: 2,
    keywords: ['snare'],
    text: 'Silent wet boots and a very sticky tongue.',
    symbol: '◉',
  },
  {
    id: 'eel',
    name: 'Eel Courier',
    kind: 'creature',
    team: 'undertow',
    cost: 2,
    hp: 4,
    attack: 2,
    armor: 0,
    ap: 3,
    keywords: ['pierce'],
    text: 'Delivers secrets through the storm drains, and a shock through your armor.',
    symbol: '∿',
  },
  {
    id: 'oracle',
    name: 'Drowned Oracle',
    kind: 'creature',
    team: 'undertow',
    cost: 4,
    hp: 4,
    attack: 4,
    armor: 1,
    ap: 1,
    keywords: ['snare', 'pierce'],
    signature: true,
    text: 'Sees tomorrow’s ambush and is already standing in it.',
    symbol: '☉',
  },
  {
    id: 'blackout',
    name: 'Signal Blackout',
    kind: 'spell',
    team: 'undertow',
    cost: 2,
    effect: 'root',
    power: 1,
    text: 'Cut the streetlights: 1 damage to an enemy, and it loses its next move.',
    symbol: '⚡',
  },
  {
    id: 'tripwire',
    name: 'Tripwire',
    kind: 'trap',
    team: 'undertow',
    cost: 1,
    effect: 'snare',
    power: 1,
    roots: true,
    text: 'Hidden trap: 1 damage, and the victim goes face-first (loses its next move).',
    symbol: '◇',
  },
  {
    id: 'visor',
    name: 'Spyglass Visor',
    kind: 'equipment',
    team: 'undertow',
    cost: 2,
    effect: 'grant',
    grants: ['pierce'],
    text: 'Shows every seam in the enemy’s armor. A fighter gains PIERCE.',
    symbol: '✧',
  },
  {
    id: 'grate',
    name: 'Leech Grate',
    kind: 'trap',
    team: 'undertow',
    cost: 2,
    effect: 'snare',
    power: 3,
    text: 'Hidden trap: a storm grate full of something hungry, 3 damage.',
    symbol: '▦',
  },
  {
    id: 'sonar',
    name: 'Drain Sonar',
    kind: 'spell',
    team: 'undertow',
    cost: 1,
    effect: 'scan',
    text: 'Ping from a friendly fighter: reveal every enemy within 2 squares and disarm enemy traps there.',
    symbol: '◌',
  },
  {
    id: 'drysuit',
    name: 'Rubber Drysuit',
    kind: 'equipment',
    team: 'undertow',
    cost: 2,
    effect: 'armor',
    text: 'Smells like the river. A fighter gains +1 armor for good.',
    symbol: '⬟',
  },
  // --- MEAT EXCHANGE: debt, contracts and one expensive champion
  {
    id: 'repo',
    name: 'Repo Goblin',
    kind: 'creature',
    team: 'exchange',
    cost: 1,
    hp: 2,
    attack: 2,
    armor: 0,
    ap: 1,
    text: 'Repossesses anything not bolted down, then the bolts.',
    symbol: '¤',
  },
  {
    id: 'collector',
    name: 'Debt Collector',
    kind: 'creature',
    team: 'exchange',
    cost: 2,
    hp: 2,
    attack: 1,
    armor: 0,
    ap: 1,
    keywords: ['collect'],
    text: 'Interest compounds daily. Every punch goes on your tab.',
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
    keywords: ['collect'],
    text: 'Premium collections agent. Accepts payment in mana or teeth.',
    symbol: '◇',
  },
  {
    id: 'mogul',
    name: 'The Meat Mogul',
    kind: 'creature',
    team: 'exchange',
    cost: 6,
    hp: 7,
    attack: 3,
    armor: 1,
    ap: 1,
    keywords: ['collect'],
    signature: true,
    text: 'Owns the arena, the hot dogs and, contractually, you.',
    symbol: '♛',
  },
  {
    id: 'collection',
    name: 'Hostile Collection',
    kind: 'spell',
    team: 'exchange',
    cost: 2,
    effect: 'zap',
    power: 2,
    text: 'Send the boys round: 2 damage to an enemy.',
    symbol: '⚡',
  },
  {
    id: 'debttrap',
    name: 'Hidden Fees',
    kind: 'trap',
    team: 'exchange',
    cost: 2,
    effect: 'snare',
    power: 1,
    debt: 2,
    text: 'Hidden trap: 1 damage, and the victim’s crew owes 2 mana.',
    symbol: '◇',
  },
  {
    id: 'contract',
    name: 'Iron Contract',
    kind: 'equipment',
    team: 'exchange',
    cost: 2,
    effect: 'armor',
    text: 'Binding in every jurisdiction. A fighter gains +1 armor for good.',
    symbol: '⬟',
  },
  {
    id: 'foreclosure',
    name: 'Foreclosure',
    kind: 'spell',
    team: 'exchange',
    cost: 2,
    effect: 'debt',
    power: 1,
    debt: 2,
    text: 'Seize the furniture: 1 damage to an enemy, and its crew owes 2 mana.',
    symbol: '⚖',
  },
  {
    id: 'handshake',
    name: 'Golden Handshake',
    kind: 'equipment',
    team: 'exchange',
    cost: 2,
    effect: 'grant',
    grants: ['collect'],
    text: 'A very firm grip with a very small print. A fighter gains COLLECT.',
    symbol: '✋',
  },
  {
    id: 'hushmoney',
    name: 'Hush Money',
    kind: 'spell',
    team: 'exchange',
    cost: 1,
    effect: 'heal',
    power: 3,
    text: 'Pay off the medic: restore 3 HP to a friendly fighter.',
    symbol: '✚',
  },
  ...RESERVE_CARDS,
  ...GUTTER_CROWN_WAVE_TWO,
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
/** Every rule variant off: the formats as first compared. */
export const DEFAULT_RULES: RuleVariants = {
  tiebreak: false,
  overtime: false,
  momentum: false,
  monster: false,
  rout: false,
  rushAlternate: false,
}
/** Lab toggles, with the formats each one changes. */
export const RULE_VARIANTS: {
  id: keyof RuleVariants
  label: string
  modes: ModeId[]
  text: string
}[] = [
  {
    id: 'monster',
    label: 'GIANT MONSTER',
    modes: ['blackout', 'gridiron', 'bloodrush'],
    text: 'A neutral giant monster squats in the centre and swats whoever stands beside it. Land the killing blow to win outright.',
  },
  {
    id: 'rout',
    label: 'ROUT',
    modes: ['gridiron', 'bloodrush'],
    text: 'Lanes: the first crew to knock out 26 enemy fighters (BLOODRUSH: 18) wins.',
  },
  {
    id: 'momentum',
    label: 'LANE MOMENTUM',
    modes: ['gridiron', 'bloodrush'],
    text: 'Lanes: after 4 rounds without a breakthrough (BLOODRUSH: 4 beats), fighters in the opponent’s half surge one extra square per move until someone scores.',
  },
  {
    id: 'overtime',
    label: 'SUDDEN DEATH',
    modes: ['blackout', 'gridiron', 'bloodrush'],
    text: 'Tied when the clock runs out: extra time, and the next breakthrough wins.',
  },
  {
    id: 'tiebreak',
    label: 'YARDAGE TIEBREAK',
    modes: ['gridiron', 'bloodrush'],
    text: 'Lanes: still tied at the end, the crew whose fighters stand further upfield wins.',
  },
  {
    id: 'rushAlternate',
    label: 'RUSH INITIATIVE SWAP',
    modes: ['bloodrush'],
    text: 'BLOODRUSH: on every other beat the CPU commits its plays before yours, instead of always reacting to them.',
  },
]
/** MOMENTUM: rounds (BLOODRUSH beats) of drought per +1. */
export const MOMENTUM_EVERY = 4
/** Extra rounds (ticks) of sudden death. */
export const OVERTIME: Record<ModeId, number> = {
  blackout: 4,
  gridiron: 6,
  bloodrush: 30,
}
/** Lane rout variant: enemy knockouts needed to win. */
export const ROUT_TARGET: Record<ModeId, number> = {
  blackout: 0,
  gridiron: 26,
  bloodrush: 18,
}
/** The neutral giant monster's stats per format. */
export const MONSTER_STATS: Record<ModeId, Omit<Monster, 'x' | 'y'>> = {
  blackout: { hp: 20, maxHp: 20, attack: 2, armor: 1 },
  gridiron: { hp: 36, maxHp: 36, attack: 3, armor: 1 },
  bloodrush: { hp: 30, maxHp: 30, attack: 3, armor: 1 },
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
    goal: 'Deploy visible monsters from a shuffled hand and cross the no-man’s-land. Grab the ⚑ flag and carry it to your back column, the far left edge. Or wipe out every enemy fighter. After 20 rounds, the side with more total HP left wins.',
    steps: [
      'Begin with four cards drawn from your faction’s ten-card deck. Tap a card to inspect its art, cost and abilities, then choose a valid square.',
      'No fighters start concealed. Spies and specialist stealth cards can hide; other crews play visible monsters.',
      'Summon creatures into the left two columns. Traps belong on empty squares; spells and equipment target fighters.',
      'Press END ROUND. The CPU moves and plays cards, then every fighter beside an enemy strikes at once for attack minus armor.',
      'A fighter still standing on the flag at the end of the round picks it up. Carriers walk one square per round; if one falls, the flag drops on its square.',
    ],
    limits: [
      'Local prototype: the CPU sees where fighters stand but not hidden identities or your trap.',
      'Initiative alternates (you, CPU, CPU, you …): on even rounds the CPU has already moved when your turn starts.',
      'Ten unique cards per crew, four drawn each round. Played cards leave your hand. Discards recycle only after the deck empties. Mana: 1, 2, 3 … up to 10, minus debt.',
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
      'Local prototype: the CPU plays the same ten-card crew deck rules as you. Keywords are explained in THE ARMORY.',
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
      'Local prototype: a fixed-tick simulation, not an action game. Same ten-card crew decks, one armed trap per side (Undertow: two).',
      'Nothing is saved: no Meat, cards or online results.',
    ],
  },
}

export function cardAttackRange(card: Card): number {
  return (
    card.range ??
    (['mau', 'razor', 'welder', 'firebrand', 'eel', 'broker'].includes(card.id)
      ? 2
      : 1)
  )
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

/** A deck can swap cards within the same crew, but must preserve its identity. */
export function loadoutProblems(
  teamId: TeamId,
  ids: readonly string[],
): string[] {
  const team = teamById(teamId)
  const out: string[] = []
  if (ids.length !== DECK_SIZE) out.push('Requires exactly ten cards')
  if (new Set(ids).size !== ids.length) out.push('Cannot repeat cards')
  const cards = ids.map((id) => CARDS.find((card) => card.id === id))
  if (cards.some((card) => !card)) return [...out, 'Unknown card']
  const known = cards as Card[]
  if (known.some((card) => card.team !== teamId))
    out.push('Cards must belong to your crew')
  if (
    known.filter((card) => card.kind === 'creature').length !== DECK_CREATURES
  )
    out.push('Requires exactly four creatures')
  for (const kind of ['spell', 'trap', 'equipment'] as CardKind[])
    if (!known.some((card) => card.kind === kind))
      out.push('Requires a ' + kind)
  if (
    known.filter((card) => card.signature).length !== 1 ||
    !ids.includes(team.signature)
  )
    out.push('Requires your crew signature')
  return out
}

/** A crew's playable deck, in deck order: creatures first. */
export function deckOf(id: TeamId): Card[] {
  const team = teamById(id)
  return [...team.creatures, ...team.special].map(cardById)
}

/**
 * Why a crew's deck is not legal, or an empty list. A legal deck has
 * exactly DECK_SIZE of its own cards, DECK_CREATURES creatures, at least one
 * spell, trap and equipment, no duplicates and exactly one signature card.
 */
export function deckProblems(team: Team): string[] {
  const ids = [...team.creatures, ...team.special]
  const out: string[] = []
  const cards = ids.map((id) => CARDS.find((c) => c.id === id))
  if (ids.length !== DECK_SIZE) out.push('deck has ' + ids.length + ' cards')
  if (new Set(ids).size !== ids.length) out.push('duplicate card')
  if (cards.some((c) => !c)) return [...out, 'unknown card']
  const known = cards as Card[]
  if (known.some((c) => c.team !== team.id)) out.push('another crew’s card')
  if (team.creatures.some((id) => cardById(id).kind !== 'creature'))
    out.push('non-creature in the creature slots')
  if (known.filter((c) => c.kind === 'creature').length !== DECK_CREATURES)
    out.push('needs ' + DECK_CREATURES + ' creatures')
  for (const kind of ['spell', 'trap', 'equipment'] as CardKind[])
    if (!known.some((c) => c.kind === kind)) out.push('no ' + kind)
  const signatures = known.filter((c) => c.signature)
  if (signatures.length !== 1 || signatures[0]!.id !== team.signature)
    out.push('signature card mismatch')
  return out
}

export function hasKeyword(
  unit: { keywords?: Keyword[] | null },
  keyword: Keyword,
): boolean {
  return !!unit.keywords?.includes(keyword)
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

export function monsterAt(
  state: Pick<MatchState, 'monster'>,
  x: number,
  y: number,
): boolean {
  return !!state.monster && state.monster.x === x && state.monster.y === y
}

/** A fighter or the monster stands here. */
function occupied(state: MatchState, x: number, y: number): boolean {
  return !!unitAt(state, x, y) || monsterAt(state, x, y)
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
    explosions: 0,
    debt: 0,
    roots: 0,
    shoves: 0,
  }
}

function copy(state: MatchState): MatchState {
  return {
    ...state,
    score: [state.score[0], state.score[1]],
    flag: { ...state.flag },
    ...(state.playerDeck ? { playerDeck: [...state.playerDeck] } : {}),
    units: state.units.map((u) => ({ ...u })),
    traps: state.traps.map((t) => ({ ...t })),
    ...(state.scenarioBonus
      ? { scenarioBonus: { ...state.scenarioBonus } }
      : {}),
    log: [...state.log],
    commands: state.commands.map((c) => ({ ...c })),
    stats: {
      ...state.stats,
      plays: {
        player: { ...state.stats.plays.player },
        enemy: { ...state.stats.plays.enemy },
      },
      knockouts: { ...state.stats.knockouts },
    },
    piles: { player: [...state.piles.player], enemy: [...state.piles.enemy] },
    hands: { player: [...state.hands.player], enemy: [...state.hands.enemy] },
    discards: {
      player: [...state.discards.player],
      enemy: [...state.discards.enemy],
    },
    shuffles: { ...state.shuffles },
    cooldowns: {
      player: { ...state.cooldowns.player },
      enemy: { ...state.cooldowns.enemy },
    },
    debt: { ...state.debt },
    rules: { ...state.rules },
    monster: state.monster ? { ...state.monster } : null,
    monsterDamage: { ...state.monsterDamage },
  }
}

/** Hidden traps a side may keep armed: Undertow rigs two. */
export function trapCapOf(state: MatchState, side: Side): number {
  return teamById(teamOf(state, side)).trapCap ?? TRAP_CAP
}

/**
 * Put a side in mana debt. The turn formats take it out of the next refill
 * (at most DEBT_CAP); BLOODRUSH banks mana, so it is taken from the bank now.
 */
function addDebt(state: MatchState, side: Side, amount: number): void {
  if (amount <= 0) return
  state.stats.debt += amount
  if (state.mode === 'bloodrush') {
    if (side === 'player') state.mana = Math.max(0, state.mana - amount)
    else state.enemyMana = Math.max(0, state.enemyMana - amount)
  } else state.debt[side] = Math.min(DEBT_CAP, state.debt[side] + amount)
}

/** Root a fighter now: it loses its current or next movement. */
function root(state: MatchState, unit: Fighter, later = false): void {
  // A snare at the end of a round must outlast the refill that follows it;
  // BLOODRUSH steps on a beat, so it reaches the next beat.
  const until = later
    ? state.round + (state.mode === 'bloodrush' ? RUSH_MOVE_EVERY : 1)
    : state.round + (state.mode === 'bloodrush' ? 1 : 0)
  unit.rootedUntil = Math.max(unit.rootedUntil ?? 0, until)
  if (!later) unit.ap = 0
  state.stats.roots++
}

function isRooted(state: MatchState, unit: Fighter): boolean {
  return (unit.rootedUntil ?? 0) >= state.round
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
    hp: Math.max(
      1,
      (card.hp || 2) +
        (side === 'player' ? (state.scenarioBonus?.playerHp ?? 0) : 0),
    ),
    maxHp: Math.max(
      1,
      (card.hp || 2) +
        (side === 'player' ? (state.scenarioBonus?.playerHp ?? 0) : 0),
    ),
    attack: card.attack || 1,
    armor: Math.max(
      0,
      (card.armor || 0) +
        (side === 'enemy' ? (state.scenarioBonus?.enemyArmor ?? 0) : 0),
    ),
    ap: card.ap || 1,
    maxAp: card.ap || 1,
    hidden,
    carryingFlag: false,
    range: cardAttackRange(card),
    attackStyle:
      card.attackStyle ??
      (
        {
          catgirls: 'claw',
          bloodfairies: 'arrow',
          ironjaw: 'hammer',
          riot: 'blast',
          undertow: 'spell',
          exchange: 'sword',
        } as Record<TeamId, AttackStyle>
      )[card.team],
    summonedRound: state.round,
    attackedRound: 0,
    keywords: [...(card.keywords ?? [])],
    burst: card.burst ?? 1,
    struck: false,
    rootedUntil: 0,
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

/** The seeded card order is stable for replays and different for both crews. */
function shuffledDeck(state: MatchState, side: Side): string[] {
  const salt = side === 'player' ? 811 : 977
  return (
    side === 'player' && state.playerDeck
      ? state.playerDeck.map(cardById)
      : deckOf(teamOf(state, side))
  )
    .map((card, index) => ({
      id: card.id,
      order: seededHash(state.seed, salt, state.shuffles[side], index),
    }))
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
    .map(({ id }) => id)
}

/** Clear unplayed cards and deal from the remaining pile without duplication. */
function drawHand(state: MatchState, side: Side): void {
  state.discards[side].push(...state.hands[side])
  state.hands[side] = []
  while (state.hands[side].length < BLACKOUT_HAND_SIZE) {
    if (!state.piles[side].length) {
      if (!state.discards[side].length) break
      state.shuffles[side]++
      const discarded = new Set(state.discards[side])
      state.piles[side] = shuffledDeck(state, side).filter((id) =>
        discarded.has(id),
      )
      state.discards[side] = []
    }
    const next = state.piles[side].shift()
    if (!next) break
    state.hands[side].push(next)
  }
}

export function createMatch(
  mode: ModeId,
  teamId: TeamId,
  foeId: TeamId = 'ironjaw',
  seed: number = DEFAULT_SEED,
  rules: Partial<RuleVariants> = {},
  playerDeck?: string[],
): MatchState {
  const m = MODES.find((item) => item.id === mode)
  if (!m) throw new Error('Unknown Slime City match mode')
  const dimensions = m.size.split(' × ')
  const width =
    mode === 'blackout' && rules.classicFog ? 8 : Number(dimensions[0]!)
  const height =
    mode === 'blackout' && rules.classicFog ? 8 : Number(dimensions[1]!)
  if (playerDeck && loadoutProblems(teamId, playerDeck).length)
    throw new Error('Illegal Slime City loadout')
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
    ...(playerDeck ? { playerDeck: [...playerDeck] } : {}),
    // Mirror matches are allowed: a district rival may share your crew.
    foeId,
    units: [],
    traps: [],
    // Even widths have no centre column, so the seed picks one of the
    // central four squares and neither side is always one step closer.
    flag: {
      x: width / 2 - 1 + (seededHash(s, 1) % 2),
      y: Math.floor(height / 2) - 1 + (seededHash(s, 2) % 2),
    },
    rules: { ...DEFAULT_RULES, ...rules },
    monster: null,
    monsterDamage: { player: 0, enemy: 0 },
    overtime: false,
    lastBreak: 0,
    victor: null,
    winPath: null,
    log: ['Arena loaded · seed ' + s + '. Choose a fighter or special.'],
    commands: [],
    stats: emptyStats(),
    piles: { player: [], enemy: [] },
    hands: { player: [], enemy: [] },
    discards: { player: [], enemy: [] },
    shuffles: { player: 0, enemy: 0 },
    cooldowns: { player: {}, enemy: {} },
    debt: { player: 0, enemy: 0 },
  }
  if (mode === 'blackout' && rules.classicFog) {
    for (const side of ['player', 'enemy'] as Side[]) {
      const lineup = teamById(teamOf(state, side)).army
      const zone: { x: number; y: number }[] = []
      for (let x = 0; x < width; x++)
        for (let y = 0; y < height; y++)
          if (inDeployZone(state, side, x)) zone.push({ x, y })
      const cells = shuffledCells(zone, s, side === 'player' ? 3 : 4)
      lineup.forEach((cardId, i) =>
        addFighter(state, cardId, side, cells[i]!.x, cells[i]!.y, true),
      )
    }
  } else if (mode === 'blackout') {
    for (const side of ['player', 'enemy'] as Side[]) {
      state.piles[side] = shuffledDeck(state, side)
      drawHand(state, side)
    }
    message(
      state,
      'Deploy a visible monster. Four cards in hand, the rest in your deck.',
    )
  }
  if (state.rules.monster) {
    // BLACKOUT: the central square diagonal from the flag. Lanes: a
    // seeded square in the two middle columns and the two middle rows.
    const x =
      mode === 'blackout'
        ? width - 1 - state.flag.x
        : width / 2 - 1 + (seededHash(s, 7) % 2)
    const y =
      mode === 'blackout'
        ? height - 1 - state.flag.y
        : height / 2 - 1 + (seededHash(s, 8) % 2)
    state.monster = { x, y, ...MONSTER_STATS[mode] }
    state.log = [
      'A giant monster wakes in the middle of the arena. Land the killing blow to win.',
      ...state.log,
    ]
  }
  if (mode !== 'blackout') {
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

/**
 * Remove the fallen; a dying carrier drops the flag where it fell. VOLATILE
 * fighters explode first, and an explosion can set off the next one. Lane
 * scorers leave the field without exploding or counting as knockouts.
 */
function removeDead(
  state: MatchState,
  scored: (unit: Fighter) => boolean = () => false,
): void {
  const blown = new Set<number>()
  for (;;) {
    const fuses = state.units.filter(
      (u) =>
        u.hp <= 0 &&
        hasKeyword(u, 'volatile') &&
        !blown.has(u.id) &&
        !scored(u),
    )
    if (!fuses.length) break
    for (const fuse of fuses) {
      blown.add(fuse.id)
      state.stats.explosions++
      const caught = state.units.filter(
        (o) => o.hp > 0 && legalNeighbor(o, fuse),
      )
      for (const o of caught) {
        o.hp -= fuse.burst ?? 1
        o.hidden = false
      }
      message(
        state,
        publicName(fuse) +
          ' explodes' +
          (caught.length
            ? ', hitting ' +
              caught.length +
              ' beside it for ' +
              (fuse.burst ?? 1)
            : '') +
          '!',
      )
    }
  }
  for (const unit of state.units) {
    if (unit.hp > 0 || scored(unit)) continue
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
  if (trap.roots) root(state, unit)
  if (trap.debt) addDebt(state, unit.side, trap.debt)
  message(
    state,
    'A hidden trap springs under ' +
      name(unit) +
      ' for ' +
      trap.damage +
      (trap.roots ? ' and pins it in place' : '') +
      (trap.debt ? '; its crew owes ' + trap.debt + ' mana' : '') +
      '!',
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
  if (
    state.mode === 'blackout' &&
    !state.rules.classicFog &&
    !state.hands[side].includes(cardId)
  )
    return false
  if (x < 0 || y < 0 || x >= state.width || y >= state.height) return false
  const target = unitAt(state, x, y)
  const hidden =
    side === 'enemy' && state.mode === 'blackout' && !!state.rules.classicFog
  let line: string
  if (card.kind === 'creature') {
    if (target || !inDeployZone(state, side, x)) return false
    if (
      state.units.filter((u) => u.side === side).length >=
      Math.max(
        1,
        FIELD_CAP[state.mode] -
          (side === 'enemy' ? (state.scenarioBonus?.fewerRivals ?? 0) : 0),
      )
    )
      return false
    addFighter(
      state,
      cardId,
      side,
      x,
      y,
      state.mode === 'blackout' && !!state.rules.classicFog,
    )
    line = hidden
      ? 'The enemy deploys a concealed fighter.'
      : (side === 'enemy' ? 'Enemy deploys ' : 'You deploy ') + card.name + '.'
  } else if (card.kind === 'trap') {
    if (target || monsterAt(state, x, y) || !inTrapZone(state, side, x))
      return false
    // Only your own traps block a square: refusing over a hidden enemy trap
    // would tell you where it is.
    if (state.traps.some((t) => t.side === side && t.x === x && t.y === y))
      return false
    if (
      state.traps.filter((t) => t.side === side).length >=
      trapCapOf(state, side)
    )
      return false
    const trap: Trap = { x, y, side, damage: card.power ?? 2 }
    if (card.roots) trap.roots = true
    if (card.debt) trap.debt = card.debt
    state.traps.push(trap)
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
    card.effect === 'scan' ||
    card.kind === 'equipment' ||
    card.effect === 'boost'
  ) {
    if (!target || target.side !== side) return false
    let extra = ''
    if (card.effect === 'heal') {
      if (target.hp >= target.maxHp) return false
      target.hp = Math.min(target.maxHp, target.hp + (card.power ?? 2))
    } else if (card.effect === 'scan') {
      // Sonar: reveal enemies within two squares and disarm their traps.
      const near = (c: { x: number; y: number }) =>
        Math.abs(c.x - target.x) + Math.abs(c.y - target.y) <= 2
      let seen = 0
      for (const u of state.units)
        if (u.side !== side && u.hidden && near(u)) {
          u.hidden = false
          seen++
        }
      const before = state.traps.length
      state.traps = state.traps.filter((t) => t.side === side || !near(t))
      extra =
        ': ' +
        seen +
        ' revealed, ' +
        (before - state.traps.length) +
        ' traps disarmed'
    } else if (card.effect === 'armor') target.armor += 1
    else if (card.effect === 'sharpen') target.attack += 1
    else if (card.effect === 'grant') {
      const fresh = (card.grants ?? []).filter((k) => !hasKeyword(target, k))
      if (!fresh.length) return false
      target.keywords = [...(target.keywords ?? []), ...fresh]
    } else if (card.kind === 'equipment') {
      // Equipment is permanent: one extra AP every round from now on.
      target.maxAp += 1
      target.ap += 1
    } else {
      target.ap += 2
      if (card.rearm) target.struck = false
    }
    line =
      (side === 'enemy' ? 'Enemy plays ' : 'You play ') +
      card.name +
      ' on ' +
      publicName(target) +
      extra +
      '.'
  } else if (
    !target &&
    monsterAt(state, x, y) &&
    (card.effect === 'zap' ||
      card.effect === 'chaos' ||
      card.effect === 'blast')
  ) {
    const damage =
      card.effect === 'chaos'
        ? 1 + (seededHash(state.seed, state.round, 999, state.nextId) % 3)
        : (card.power ?? 2)
    const dealt = Math.max(0, damage - state.monster!.armor)
    state.monster!.hp -= dealt
    state.monsterDamage[side] += dealt
    line =
      (side === 'enemy' ? 'Enemy casts ' : 'You cast ') +
      card.name +
      ' at the monster: ' +
      dealt +
      ' damage.'
    if (state.monster!.hp <= 0) slayMonster(state, side)
  } else {
    if (!target || target.side === side) return false
    const damage =
      card.effect === 'chaos'
        ? 1 + (seededHash(state.seed, state.round, target.id, state.nextId) % 3)
        : (card.power ?? 2)
    target.hp -= damage
    target.hidden = false
    let extra = ''
    if (card.effect === 'blast') {
      // Splash 1 to the fighters beside the target: enemies only, or all.
      const caught = state.units.filter(
        (o) =>
          o.hp > 0 &&
          o.id !== target.id &&
          legalNeighbor(o, target) &&
          (card.splash === 'all' || o.side !== side),
      )
      for (const o of caught) {
        o.hp -= 1
        o.hidden = false
      }
      if (caught.length) extra = ' and 1 to ' + caught.length + ' beside it'
    } else if (card.effect === 'root') {
      root(state, target)
      extra = '; it cannot move'
    } else if (card.effect === 'debt') {
      addDebt(state, target.side, card.debt ?? 1)
      extra = '; its crew owes ' + (card.debt ?? 1) + ' mana'
    }
    line =
      (side === 'enemy' ? 'Enemy casts ' : 'You cast ') +
      card.name +
      ': ' +
      damage +
      ' damage to ' +
      name(target) +
      extra +
      '.'
  }
  spend(state, side, card.cost)
  if (state.mode === 'blackout' && !state.rules.classicFog) {
    state.hands[side] = state.hands[side].filter((id) => id !== cardId)
    state.discards[side].push(cardId)
  }
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
  if (occupied(state, x, y)) return false
  const unit = state.units.find((u) => u.id === id && u.side === side)
  if (!unit || unit.ap < 1 || !legalNeighbor(unit, { x, y })) return false
  if (isRooted(state, unit)) return false
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

/** New Blackout uses deliberate attacks instead of automatic round damage. */
export function mayAttack(
  state: MatchState,
  attacker: Fighter,
  target: Fighter | Monster,
): boolean {
  if (state.mode !== 'blackout' || state.rules.classicFog || state.victor)
    return false
  if (attacker.hp <= 0 || attacker.attackedRound === state.round) return false
  if (attacker.summonedRound === state.round && !hasKeyword(attacker, 'ambush'))
    return false
  return (
    Math.abs(attacker.x - target.x) + Math.abs(attacker.y - target.y) <=
    (attacker.range ?? 1)
  )
}

function applyAttack(
  state: MatchState,
  side: Side,
  id: number,
  targetId: number,
): boolean {
  const attacker = state.units.find((u) => u.id === id && u.side === side)
  const victim = state.units.find((u) => u.id === targetId && u.side !== side)
  const monster = targetId === -1 ? state.monster : null
  if (!attacker || (!victim && !monster)) return false
  const target = victim ?? monster!
  if (!mayAttack(state, attacker, target)) return false
  const dealt = blowDamage(state, attacker, target)
  target.hp -= dealt
  attacker.attackedRound = state.round
  attacker.hidden = false
  if (victim) {
    victim.hidden = false
    if (dealt > 0 && hasKeyword(attacker, 'leech'))
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + 1)
    if (dealt > 0 && hasKeyword(attacker, 'snare') && victim.hp > 0)
      root(state, victim, true)
    if (dealt > 0 && hasKeyword(attacker, 'collect'))
      addDebt(state, victim.side, 1)
  } else {
    state.monsterDamage[side] += dealt
    if (monster!.hp <= 0) slayMonster(state, side)
  }
  if (hasKeyword(attacker, 'ambush')) attacker.struck = true
  message(
    state,
    (side === 'enemy' ? 'Enemy ' : '') +
      name(attacker) +
      ' attacks ' +
      (victim ? publicName(victim) : 'the monster') +
      ' (' +
      (attacker.attackStyle ?? 'strike') +
      '): ' +
      dealt +
      ' damage' +
      (target.hp <= 0 ? ' · KO!' : '.'),
  )
  removeDead(state)
  settleFlag(state)
  checkEnd(state)
  return true
}

export function attackAs(
  state: MatchState,
  side: Side,
  id: number,
  target: number,
): MatchState {
  return recorded(state, { t: 'attack', side, id, target }, (draft) =>
    applyAttack(draft, side, id, target),
  )
}

export function attack(
  state: MatchState,
  id: number,
  target: number,
): MatchState {
  return attackAs(state, 'player', id, target)
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
    fieldCap: Math.max(
      1,
      FIELD_CAP[state.mode] -
        (side === 'enemy' ? (state.scenarioBonus?.fewerRivals ?? 0) : 0),
    ),
    trapCap: trapCapOf(state, side),
    mana: manaOf(state, side),
    opponentMana: manaOf(state, other(side)),
    debt: [state.debt[side], state.debt[other(side)]],
    score:
      side === 'player'
        ? [state.score[0], state.score[1]]
        : [state.score[1], state.score[0]],
    salt: seededHash(state.seed, side === 'player' ? 101 : 202),
    flag: { ...state.flag },
    monster: state.monster ? { ...state.monster } : null,
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
          keywords: known ? [...(u.keywords ?? [])] : null,
          ambushReady: known ? hasKeyword(u, 'ambush') && !u.struck : null,
          carryingFlag: u.carryingFlag,
          range: known ? (u.range ?? 1) : null,
          attackStyle: known ? (u.attackStyle ?? 'sword') : null,
          summonedRound: known ? (u.summonedRound ?? 0) : null,
          attackedRound: known ? (u.attackedRound ?? 0) : null,
          rooted: isRooted(state, u),
        }
      }),
    traps: state.traps.filter((t) => t.side === side).map((t) => ({ ...t })),
    hand: (state.mode === 'blackout' && !state.rules.classicFog
      ? state.hands[side].map(cardById)
      : deckOf(teamOf(state, side))
    ).filter((card) => cardReady(state, side, card.id)),
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
    : action.t === 'attack'
      ? 'a:' + action.id + ':' + action.target
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
        : action.t === 'attack'
          ? attackAs(current, side, action.id, action.target)
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
      // Rooted and snared fighters hold this movement.
      if (isRooted(state, unit)) continue
      const steps = laneSteps(unit) + momentumSurge(state, unit)
      for (let step = 0; step < steps; step++) {
        if (unit.hp <= 0 || unit.x === goal) break
        const ahead = unitAt(state, unit.x + dir, unit.y)
        const shove = ahead && { x: ahead.x + dir, y: ahead.y }
        if (!ahead && !monsterAt(state, unit.x + dir, unit.y)) {
          unit.x += dir
        } else if (
          shove &&
          ahead.side !== side &&
          hasKeyword(unit, 'bulldoze') &&
          shove.x >= 0 &&
          shove.x < state.width &&
          !occupied(state, shove.x, shove.y)
        ) {
          // BULLDOZE: shove the blocker one square back toward its own end.
          ahead.x = shove.x
          ahead.hidden = false
          unit.x += dir
          state.stats.shoves++
          triggerTrapAt(state, ahead)
        } else {
          // Blocked by anyone: step into a free neighbouring lane if the
          // square beyond it is open too, rather than queueing behind.
          const lanes = [unit.y - 1, unit.y + 1]
          if (seededHash(state.seed, state.round, unit.id) % 2) lanes.reverse()
          const lane = lanes.find(
            (y) =>
              y >= 0 &&
              y < state.height &&
              !occupied(state, unit.x, y) &&
              !occupied(state, unit.x + dir, y),
          )
          if (lane === undefined) {
            if (ahead?.side === side) state.stats.clogs++
            break
          }
          unit.y = lane
          state.stats.sidesteps++
        }
        unit.hidden = false
        triggerTrapAt(state, unit)
        if (unit.hp > 0 && unit.x === goal) {
          state.score[side === 'player' ? 0 : 1]++
          state.lastBreak = state.round
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
    // Scorers leave the field; trap victims die (and explode) here too.
    removeDead(
      state,
      (u) => u.x === (u.side === 'player' ? state.width - 1 : 0),
    )
  }
}

/** One fighter's blow against one adjacent enemy, keywords included. */
export function blowDamage(
  state: MatchState,
  fighter: Fighter,
  victim: { armor: number },
): number {
  const swarm =
    hasKeyword(fighter, 'swarm') &&
    state.units.some(
      (o) =>
        o.side === fighter.side &&
        o.id !== fighter.id &&
        o.hp > 0 &&
        legalNeighbor(o, fighter),
    )
      ? 1
      : 0
  const ambush = hasKeyword(fighter, 'ambush') && !fighter.struck ? 2 : 0
  const armor = Math.max(
    0,
    victim.armor - (hasKeyword(fighter, 'pierce') ? 1 : 0),
  )
  return Math.max(0, fighter.attack + swarm + ambush - armor)
}

/**
 * MOMENTUM (lanes): after MOMENTUM_EVERY rounds without a breakthrough
 * (BLOODRUSH counts beats), fighters in the opponent's half surge one extra
 * square per move. A breakthrough resets the drought.
 */
export function momentumSurge(
  state: MatchState,
  fighter: { side: Side; x: number },
): number {
  if (!state.rules.momentum || state.mode === 'blackout') return 0
  const upfield =
    fighter.side === 'player'
      ? fighter.x >= state.width / 2
      : fighter.x < state.width / 2
  if (!upfield) return 0
  const beats =
    state.mode === 'bloodrush'
      ? Math.floor((state.round - state.lastBreak) / RUSH_MOVE_EVERY)
      : state.round - state.lastBreak
  return beats >= MOMENTUM_EVERY ? 1 : 0
}

/** The monster falls: its slayer's side wins (t-003 monster variant). */
function slayMonster(state: MatchState, side: Side | 'draw'): void {
  state.monster = null
  finish(state, side, 'monster')
  message(
    state,
    side === 'draw'
      ? 'The monster falls to both crews at once!'
      : 'The giant monster falls! ' +
          (side === 'player' ? 'You' : 'The enemy') +
          ' landed the killing blow.',
  )
}

function combat(state: MatchState): void {
  const damage = new Map<number, number>()
  const blows: { fighter: Fighter; victim: Fighter; dealt: number }[] = []
  const monster = state.monster
  const onMonster: Record<Side, number> = { player: 0, enemy: 0 }
  for (const fighter of state.units) {
    if (fighter.hp <= 0) continue
    const foes = state.units.filter(
      (o) => o.side !== fighter.side && o.hp > 0 && legalNeighbor(fighter, o),
    )
    if (!foes.length) {
      // With no enemy beside it, a fighter next to the monster hits it.
      if (monster && legalNeighbor(fighter, monster)) {
        const dealt = blowDamage(state, fighter, monster)
        onMonster[fighter.side] += dealt
        fighter.hidden = false
        if (hasKeyword(fighter, 'ambush')) fighter.struck = true
        if (dealt > 0 && hasKeyword(fighter, 'leech'))
          fighter.hp = Math.min(fighter.maxHp, fighter.hp + 1)
      }
      continue
    }
    const hit = (o: Fighter) => blowDamage(state, fighter, o)
    const victim = [...foes].sort(
      (a, b) =>
        Number(b.carryingFlag) - Number(a.carryingFlag) ||
        Number(b.hp <= hit(b)) - Number(a.hp <= hit(a)) ||
        a.hp - b.hp ||
        a.id - b.id,
    )[0]!
    const dealt = hit(victim)
    blows.push({ fighter, victim, dealt })
    damage.set(victim.id, (damage.get(victim.id) || 0) + dealt)
    fighter.hidden = false
    victim.hidden = false
  }
  if (monster) {
    // The monster swats the weakest fighter beside it, in the same exchange.
    const prey = state.units
      .filter((u) => u.hp > 0 && legalNeighbor(u, monster))
      .sort((a, b) => a.hp - b.hp || a.id - b.id)[0]
    if (prey) {
      const swat = Math.max(0, monster.attack - prey.armor)
      damage.set(prey.id, (damage.get(prey.id) || 0) + swat)
      prey.hidden = false
    }
    const total = onMonster.player + onMonster.enemy
    if (total) {
      monster.hp -= total
      state.monsterDamage.player += onMonster.player
      state.monsterDamage.enemy += onMonster.enemy
      message(
        state,
        'The monster takes ' +
          total +
          ' (' +
          Math.max(0, monster.hp) +
          ' HP left).',
      )
    }
  }
  if (damage.size) {
    let falls = 0
    for (const unit of state.units) {
      unit.hp -= damage.get(unit.id) || 0
      if (unit.hp <= 0) falls++
    }
    // Keywords that fire on a blow, after the simultaneous exchange.
    for (const { fighter, victim, dealt } of blows) {
      if (hasKeyword(fighter, 'ambush')) fighter.struck = true
      if (dealt <= 0) continue
      if (hasKeyword(fighter, 'leech') && fighter.hp > 0)
        fighter.hp = Math.min(fighter.maxHp, fighter.hp + 1)
      if (hasKeyword(fighter, 'snare') && victim.hp > 0)
        root(state, victim, true)
      if (hasKeyword(fighter, 'collect')) addDebt(state, other(fighter.side), 1)
    }
    message(
      state,
      damage.size +
        ' fighters trade blows' +
        (falls ? '; ' + falls + ' fall.' : '.'),
    )
    removeDead(state)
  }
  // REGEN licks its wounds only out of reach of the enemy.
  for (const unit of state.units)
    if (
      hasKeyword(unit, 'regen') &&
      unit.hp > 0 &&
      unit.hp < unit.maxHp &&
      !state.units.some(
        (o) => o.side !== unit.side && o.hp > 0 && legalNeighbor(o, unit),
      )
    )
      unit.hp++
  if (monster && monster.hp <= 0) {
    // The bigger share of the final exchange wins; then the whole match's.
    const [a, b] =
      onMonster.player !== onMonster.enemy
        ? [onMonster.player, onMonster.enemy]
        : [state.monsterDamage.player, state.monsterDamage.enemy]
    slayMonster(state, a === b ? 'draw' : a > b ? 'player' : 'enemy')
  }
}

/** Lanes: how far upfield a side's fighters stand, summed (yardage). */
function yardage(state: MatchState, side: Side): number {
  return state.units
    .filter((u) => u.side === side)
    .reduce(
      (sum, u) => sum + (side === 'player' ? u.x : state.width - 1 - u.x),
      0,
    )
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
    if ((!p || !e) && (state.round >= 4 || state.rules.classicFog)) {
      finish(state, p === e ? 'draw' : p ? 'player' : 'enemy', 'rout')
      return
    }
  } else {
    const [a, b] = state.score
    // Sudden death: in extra time the first breakthrough wins.
    if (a >= SCORE_TO_WIN || b >= SCORE_TO_WIN || (state.overtime && a !== b)) {
      finish(state, a === b ? 'draw' : a > b ? 'player' : 'enemy', 'score')
      return
    }
    if (state.rules.rout) {
      const target = ROUT_TARGET[state.mode]
      const p = state.stats.knockouts.enemy >= target
      const e = state.stats.knockouts.player >= target
      if (p || e) {
        const [kp, ke] = [
          state.stats.knockouts.enemy,
          state.stats.knockouts.player,
        ]
        finish(state, kp === ke ? 'draw' : kp > ke ? 'player' : 'enemy', 'rout')
        return
      }
    }
  }
  if (state.round >= state.maxRounds) {
    const lanes = state.mode !== 'blackout'
    let a = lanes ? state.score[0] : hpTotal(state, 'player')
    let b = lanes ? state.score[1] : hpTotal(state, 'enemy')
    if (a === b && state.rules.overtime && !state.overtime) {
      state.overtime = true
      state.maxRounds += OVERTIME[state.mode]
      message(
        state,
        'SUDDEN DEATH! ' +
          OVERTIME[state.mode] +
          (state.mode === 'bloodrush' ? ' extra ticks' : ' extra rounds') +
          (lanes ? ': the next breakthrough wins.' : '.'),
      )
      return
    }
    if (a === b && lanes && state.rules.tiebreak) {
      a = yardage(state, 'player')
      b = yardage(state, 'enemy')
      if (a !== b) message(state, 'Yardage tiebreak: ' + a + ' to ' + b + '.')
    }
    finish(state, a === b ? 'draw' : a > b ? 'player' : 'enemy', 'time')
  }
}

/** Turn formats: does the human act before the CPU this round? */
export function playerHasInitiative(
  state: Pick<MatchState, 'round' | 'mode'> & { rules?: RuleVariants },
): boolean {
  // BLOODRUSH swap: on every other beat the CPU commits its plays at the end
  // of the tick before, so the human side (not the CPU) acts last.
  if (state.mode === 'bloodrush' && state.rules?.rushAlternate)
    return state.round % (2 * RUSH_MOVE_EVERY) !== 0
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
        : a.t === 'attack'
          ? applyAttack(next, 'enemy', a.id, a.target)
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
      if (next.mode !== 'blackout' || next.rules.classicFog) combat(next)
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
      // Debt comes straight out of the refill, then is paid off.
      const base = Math.min(MANA_CAP, next.round)
      next.mana = Math.max(0, base - next.debt.player)
      next.enemyMana = Math.max(0, base - next.debt.enemy)
      message(
        next,
        'Round ' +
          next.round +
          ' · ' +
          next.mana +
          ' mana available' +
          (next.debt.player ? ' (' + next.debt.player + ' went on debt)' : '') +
          '.',
      )
      next.debt = { player: 0, enemy: 0 }
    }
    if (next.mode === 'blackout' && !next.rules.classicFog) {
      drawHand(next, 'player')
      drawHand(next, 'enemy')
      message(next, 'Four fresh cards dealt from your faction deck.')
    }
    // Carriers lumber: one square per round, unless a card boosts them.
    // Rooted fighters get no AP this round.
    for (const unit of next.units)
      unit.ap = isRooted(next, unit) ? 0 : unit.carryingFlag ? 1 : unit.maxAp
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
            : next.winPath === 'monster'
              ? 'by slaying the monster'
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
  rules?: Partial<RuleVariants>
  playerDeck?: string[]
}

/** Rebuild a match from its setup and command record. */
export function replayMatch(
  setup: MatchSetup,
  commands: Command[],
): MatchState {
  let state = createMatch(
    setup.mode,
    setup.teamId,
    setup.foeId,
    setup.seed,
    setup.rules,
    setup.playerDeck,
  )
  for (const c of commands) {
    if (c.t === 'end') state = advance(state)
    else if (c.t === 'deploy') state = deployAs(state, c.side, c.card, c.x, c.y)
    else if (c.t === 'move') state = moveAs(state, c.side, c.id, c.x, c.y)
    else if (c.t === 'attack') state = attackAs(state, c.side, c.id, c.target)
    else state = revealAs(state, c.side, c.id)
  }
  return state
}
