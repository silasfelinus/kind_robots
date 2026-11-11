// Slime City comparison lab: shared data plus a pure, seeded rules engine
// for the three square-grid formats (conductor slime-city t-001, t-002).
// Every rule here is deterministic from (mode, teams, seed, commands), so a
// match can be replayed exactly from its command record, and the CPU only
// ever decides from observe(), the redacted per-side view.
import { chooseCpuAction } from './cpu'
import { RESERVE_CARDS } from './reserveCards'
import { GUTTER_CROWN_WAVE_TWO } from './gutterCrownWaveTwo'
import { GUTTER_CROWN_WAVE_THREE } from './gutterCrownWaveThree'
import { GUTTER_CROWN_FINALE_A } from './gutterCrownFinaleA'
import { GUTTER_CROWN_FINALE_B } from './gutterCrownFinaleB'
import { MERCENARY_CARDS } from './mercenaryCards'

export type Color = 'red' | 'blue' | 'purple' | 'green' | 'gold'
export type TeamId =
  'catgirls' | 'bloodfairies' | 'ironjaw' | 'riot' | 'undertow' | 'exchange'
export type ModeId = 'blackout' | 'gridiron' | 'bloodrush' | 'turf'
export type CardKind = 'creature' | 'spell' | 'trap' | 'equipment'
export type Side = 'player' | 'enemy'
export type AttackStyle =
  'claw' | 'arrow' | 'spell' | 'sword' | 'hammer' | 'blast'
export type WinPath =
  'flag' | 'score' | 'rout' | 'time' | 'monster' | 'base' | 'territory'
/**
 * Arena orders (Silas, 2026-11-02): creatures fight on their own, so the
 * player's only board decision is whether each one pushes for the enemy base
 * and flag or holds the line at home.
 */
export type Stance = 'attack' | 'defend'

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
  /** One play a turn, no mana, every card normalized to one budget. */
  parity?: boolean
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
  team: TeamId | 'mercenary'
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
  /** Arena formats: absent means 'attack'. */
  stance?: Stance
  /** TURF: its group cannot be captured through this round. */
  wardedUntil?: number
  /** TURF: REGEN already spent surviving a capture. */
  revived?: boolean
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

/**
 * TURF board events (Silas, 2026-11-04: animate captures, crushes, pounces and
 * tripwires). `side` is the side that made it happen; `from` is where a shoved
 * stone started.
 */
export type TurfFxKind =
  | 'capture'
  | 'boom'
  | 'crush'
  | 'pounce'
  | 'trip'
  | 'slime'
  | 'ward'
  | 'wash'
  | 'shove'
  | 'cling'
export interface TurfFx {
  seq: number
  kind: TurfFxKind
  x: number
  y: number
  side: Side
  from?: { x: number; y: number }
}
/** TURF: board events kept for the arena (it plays the ones it has not seen). */
export const TURF_FX_KEEP = 32

export interface Trap {
  x: number
  y: number
  side: Side
  damage: number
  roots?: boolean
  debt?: number
  /** Campaign set piece (t-009): armed before round one, outside the cap. */
  set?: boolean
}

/** One recorded input. Replaying these from createMatch rebuilds a match. */
export type Command =
  | { t: 'deploy'; side: Side; card: string; x: number; y: number }
  | { t: 'move'; side: Side; id: number; x: number; y: number }
  | { t: 'reveal'; side: Side; id: number }
  | { t: 'end' }
  | { t: 'discard'; side: Side; card: string }
  | { t: 'stance'; side: Side; id: number; stance: Stance }

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
  /** Arena formats: damage dealt to bases, both sides together. */
  baseDamage: number
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
  scenarioBonus?: {
    playerHp: number
    enemyArmor: number
    fewerRivals: number
    /** TURF: story terms as points at the count (+ yours, - the rival's). */
    turfPoints?: number
  }
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
  /** Cards the player deliberately marked to cycle at the next round. */
  markedDiscards: Record<Side, string[]>
  /** Played cards in the current turn; never drawn in the next deal. */
  playedThisRound: Record<Side, string[]>
  shuffles: Record<Side, number>
  /** Round/tick from which each side may play each card again. */
  cooldowns: Record<Side, Record<string, number>>
  /** Mana each side owes; it comes out of that side's next refill. */
  debt: Record<Side, number>
  /** Arena formats: each side's base, the whole far-back column, by HP. */
  bases: Record<Side, number>
  /**
   * Arena formats: each side's own flag, planted inside its base. The id of
   * the opposing fighter carrying it, or null while it stands at home.
   */
  flags: Record<Side, ArenaFlag>
  /** TURF: slime puddles fill a point (a liberty) through round `until`. */
  puddles: { x: number; y: number; until: number }[]
  /** TURF: what just happened on the board, for the arena to animate. */
  turfFx?: TurfFx[]
  /** TURF: stones each side has captured. */
  prisoners: Record<Side, number>
  /** TURF: the last eight positions, for the ko rule. */
  history: string[]
  /** PARITY: how many of each side's next plays will fizzle. */
  jammed: Record<Side, number>
  /** PARITY: free (faction-bonus) plays used this turn. */
  freePlays: Record<Side, number>
  /**
   * Campaign HOLD OUT objective (t-009): at the round limit the player wins
   * if their base still stands and their flag is not in rival hands, instead
   * of the healthier base winning.
   */
  holdout?: boolean
  /**
   * Campaign HEIST objective (t-009): the rival base cannot be damaged and
   * the bell goes to the rival, so only carrying their flag home wins.
   */
  heist?: boolean
}

export interface ArenaFlag {
  x: number
  y: number
  carrier: number | null
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
  /** Public battle orders. */
  stance: Stance
  /** TURF: its group is warded against capture this round. */
  warded: boolean
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
  /** Creatures move and fight on their own; bases and two flags. */
  auto: boolean
  /** The format deals a five-card hand (arena formats and TURF). */
  dealt: boolean
  /** TURF: slime puddles, [own, opponent] prisoners and area score, komi included. */
  puddles: { x: number; y: number; until: number }[]
  /** TURF: the latest board events, oldest first (public: each one is seen). */
  turfFx: TurfFx[]
  prisoners: [number, number]
  turfScore: [number, number]
  /** TURF: this side already placed its token this round. */
  turfPlayed: boolean
  /** PARITY is on: no mana, one play a turn, normalized cards. */
  parity: boolean
  /** PARITY: [own, opponent] jammed plays still to fizzle. */
  jammed: [number, number]
  /** PARITY: this side's free card kind, and whether this turn's play is spent. */
  freeKind: CardKind | null
  playSpent: boolean
  /** [own, opponent] base HP. */
  bases: [number, number]
  baseMax: number
  /** [own, opponent] flags. */
  flags: [ArenaFlag, ArenaFlag]
  /** [own, opponent] home squares of the two flags; creatures never deploy there. */
  flagHomes: [{ x: number; y: number }, { x: number; y: number }]
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
  | { t: 'stance'; id: number; stance: Stance }

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
      'Deploy creatures from a five-card hand and give each one orders: ATTACK pushes for the enemy base and flag, DEFEND guards your own. At END ROUND every creature moves and fights on its own. Smash the enemy base or carry their flag home.',
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
    subtitle: 'The Blackout arena on a live clock',
    size: '14 × 6',
    cadence: 'REAL-TIME',
    detail:
      'Same crews, hand, bases and flags as Blackout, but the clock never stops: mana drips in every two ticks, creatures march and fight on every beat, and your hand refills as you play.',
  },
  {
    id: 'turf',
    title: 'TURF',
    subtitle: 'Go on the streets · one token a turn',
    size: '9 × 9',
    cadence: 'TURN-BASED',
    detail:
      'Every card is a token. Each turn place one on an empty point: surround enemy groups to capture them, never fill your own last liberty, and claim the most turf. Each card lands with its own TURF effect.',
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
    text: 'BLACKOUT: push an adjacent enemy one square if the space behind them is clear (one movement AP). Lanes: shove enemies blocking your path.',
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
export const BLACKOUT_HAND_SIZE = 5
/** BLACKOUT grants three new mana each turn; leftovers bank to the cap. */
export const BLACKOUT_MANA_GAIN = 3
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
      'Spread the damage out: Anarkiss explosions and Bloodfairy moshpits hit many cats at once, and a regenerating cat that is snared or taxed still has to finish the fight.',
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
    name: 'QUEEN PIN & THE BLOODFAIRIES',
    color: 'purple',
    district: 'NEEDLE ALLEY',
    motto: 'Small wings. Big amps.',
    hook: 'Needle Alley’s loudest punk band, plus the swarm of tiny blood-magic fans, roadies and backup singers who follow it from rooftop to rooftop. Every fight is a gig. Cheap swarms, surprise strikes and encores.',
    insignia: '❋',
    pattern:
      'Pack the pit. Cheap fighters hit harder beside their bandmates, leech back their health off every blow, and the mosh pit punishes anyone who bunches up.',
    counters:
      'Armor shrugs off small blows (Ironjaw plating), one explosion can pop a whole pack (Anarkiss), and a solo act loses its swarm bonus.',
    signature: 'queen',
    trapCap: 1,
    creatures: ['sprite', 'pogo', 'razor', 'queen'],
    special: ['mosh', 'bloodwire', 'spurs', 'pinprick', 'choker', 'feedback'],
    army: ['pogo', 'pogo', 'razor', 'razor', 'queen'],
  },
  {
    id: 'ironjaw',
    name: 'IRONJAW CHROME LIZARDS',
    color: 'green',
    district: 'THE FOUNDRY',
    motto: 'Escaped. Mutated. Unionized.',
    hook: 'Cold-blooded mutant lizards who broke out of a sealed bio-lab’s reptile wing, grew up in the sewers and took over the foundry their makers built. Chrome jaws, union cards and grudges. Armor, hardware and bulldozing.',
    insignia: '⬡',
    pattern:
      'A slow wall that wins every trade. Armored lizards bulldoze blockers out of the lane, and plating turns a good fighter into a fortress.',
    counters:
      'Pierce goes through plating (Undertow, Anarkiss), debt starves the expensive upgrades (Meat Exchange), and a snared lizard is a very large, very sulky paperweight.',
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
    name: 'ANARKISS',
    color: 'red',
    district: 'REDLINE RIOT',
    motto: 'Get Anarkissed.',
    hook: 'An anarchy circus that stages a glam midnight musical in the ruins every night: fishnets, corsets, glitter lipstick, human cannonballs and pyrotechnics nobody insured. The audience is part of the show, and so is the explosion. High-risk chaos cards.',
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
    motto: 'The contract is older than the city.',
    hook: 'A drowned butcher-priesthood that kneels to the Thing That Hungers beneath Crown Market. They mint the city’s Meat in its name, sign every debt in blood, and collect in flesh by candlelight. Nobody reads the fine print twice.',
    insignia: '◆',
    pattern:
      'Tenderize them, then buy the arena. Collectors put every blow on your tab so you start rounds short of mana, until the Meat Mogul arrives.',
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
    armor: 1, // t-021 founder balance: was 2 (Catgirls 63% → 56%)
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
  // --- QUEEN PIN & THE BLOODFAIRIES (the band): swarm and leech
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
    text: 'Backup screamer. Small, mean and loud. Louder with the band.',
    symbol: '❋',
  },
  {
    id: 'pogo',
    name: 'Pogo Brat',
    kind: 'creature',
    team: 'bloodfairies',
    cost: 1,
    hp: 3, // t-021 founder balance: was 2 (Bloodfairies 34% → 47%)
    attack: 1,
    armor: 0,
    ap: 2,
    keywords: ['swarm'],
    text: 'Stage diver. Bounces off heads. Yours, then everyone else’s.',
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
    text: 'Lead guitar. Shreds in a blur and drinks the applause.',
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
    text: 'Frontwoman and union leader of the damned. Never crowd-surfs alone.',
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
  // --- IRONJAW CHROME LIZARDS: armor and bulldozing
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
    armor: 1, // t-021 founder balance: was 0 (Ironjaw 41% → 46%)
    ap: 1,
    text: 'Fixes the line and sets the opposition on fire, a little.',
    symbol: '⚒',
  },
  {
    id: 'bulldozer',
    name: 'Bulldozard',
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
  // --- ANARKISS: explosions and dice
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
    text: "The chapel's smallest acolyte pries loose the nails of the living. Every scrap goes on the Meat scale.",
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
    text: 'Each blow rings the drowned tithe-bell. The debt is measured in Meat, never money.',
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
    armor: 0, // t-021 founder balance: was 1 (Exchange 71% → 59%)
    ap: 1,
    keywords: ['collect'],
    text: 'The butcher-priest takes payment in teeth, then whispers the balance into the drain.',
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
    text: 'The thing beneath Crown Market wears a merchant's face. Every pound of Meat belongs to it.',
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
    text: 'The butcher-priests answer a summons: 2 damage to an enemy.',
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
    text: 'A sigil opens underfoot: 1 damage, and the victim's crew owes 2 mana.',
    symbol: '◇',
  },
  {
    id: 'contract',
    name: 'Iron Contract',
    kind: 'equipment',
    team: 'exchange',
    cost: 2,
    effect: 'armor',
    text: 'Stitched from a drowned saint's hide. A fighter gains +1 armor for good.',
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
    text: 'The chapel takes its tithe: 1 damage to an enemy, and its crew owes 2 mana.',
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
    text: 'The oath is sealed with a blackened palm. A fighter gains COLLECT.',
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
    text: 'The altar gives back what it swallowed: restore 3 HP to a friendly fighter.',
    symbol: '✚',
  },
  ...RESERVE_CARDS,
  ...GUTTER_CROWN_WAVE_TWO,
  ...GUTTER_CROWN_WAVE_THREE,
  ...GUTTER_CROWN_FINALE_A,
  ...GUTTER_CROWN_FINALE_B,
  ...MERCENARY_CARDS,
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
    summary: 'Cyber-lizard resistance',
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
    summary: 'The Meat mint, the shop and every contract',
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
  // A safety clock, not the usual ending: 9 x 9 TURF with slime, traps and
  // pounces runs about 57 rounds before both CPUs pass (t-024 sweep).
  turf: 70,
  blackout: 30,
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
/** TURF: what a SWARM stone counts for in the final score. */
export const TURF_SWARM_WORTH = 1.5
/** TURF under PARITY: what a COLLECT stone counts for (interest). */
export const TURF_PARITY_INTEREST = 2
/** TURF under PARITY: COLLECT has no mana to take, so it earns interest. */
export const TURF_PARITY_COLLECT =
  'earns interest: counts double in the final count (PARITY has no mana to collect).'
/** TURF under PARITY: BULLDOZE's crush is narrower, since every card is free. */
export const TURF_PARITY_BULLDOZE =
  'shoves one enemy stone beside it a point straight back; a lone stone shoved into the board’s edge, or one already on its last liberty, is crushed and captured.'
/** TURF: hidden tripwires each side may keep armed at once. */
export const TURF_TRAP_CAP = 3
/** Formats whose CPU alternates initiative (player, CPU, CPU, player...). */
export const ALTERNATING_INITIATIVE: Record<ModeId, boolean> = {
  turf: false,
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
  parity: false,
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
    modes: ['gridiron'],
    text: 'Lanes: the first crew to knock out 26 enemy fighters (BLOODRUSH: 18) wins.',
  },
  {
    id: 'momentum',
    label: 'LANE MOMENTUM',
    modes: ['gridiron'],
    text: 'Lanes: after 4 rounds without a breakthrough (BLOODRUSH: 4 beats), fighters in the opponent’s half surge one extra square per move until someone scores.',
  },
  {
    id: 'overtime',
    label: 'SUDDEN DEATH',
    modes: ['blackout', 'gridiron', 'bloodrush'],
    text: 'Tied when the clock runs out: extra time to settle it.',
  },
  {
    id: 'tiebreak',
    label: 'YARDAGE TIEBREAK',
    modes: ['gridiron'],
    text: 'Lanes: still tied at the end, the crew whose fighters stand further upfield wins.',
  },
  {
    id: 'parity',
    label: 'PARITY',
    modes: ['blackout', 'bloodrush', 'turf'],
    text: 'One card a turn and no mana: every card is normalized to the same strength. Mana debt becomes JAM (the other crew’s next plays fizzle), and each crew has one card kind that does not use up its play.',
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
  turf: 0,
  blackout: 4,
  gridiron: 6,
  bloodrush: 30,
}
/** Lane rout variant: enemy knockouts needed to win. */
export const ROUT_TARGET: Record<ModeId, number> = {
  turf: 0,
  blackout: 0,
  gridiron: 26,
  bloodrush: 18,
}
/** The neutral giant monster's stats per format. */
export const MONSTER_STATS: Record<ModeId, Omit<Monster, 'x' | 'y'>> = {
  turf: { hp: 20, maxHp: 20, attack: 2, armor: 1 },
  blackout: { hp: 20, maxHp: 20, attack: 2, armor: 1 },
  gridiron: { hp: 36, maxHp: 36, attack: 3, armor: 1 },
  bloodrush: { hp: 30, maxHp: 30, attack: 3, armor: 1 },
}
/** Most fighters one side may have on the board at once. */
export const FIELD_CAP: Record<ModeId, number> = {
  turf: 81,
  blackout: 7,
  gridiron: 6,
  bloodrush: 7,
}
/** Arena formats: HP of the base that fills each side's far-back column. */
export const BASE_HP: Record<ModeId, number> = {
  turf: 0,
  blackout: 16,
  gridiron: 0,
  bloodrush: 16,
}
/** TURF: points the second player (the CPU) is given for moving second. */
export const TURF_KOMI = 2.5
/** TURF: mana each side gains a round; leftovers bank to the cap. */
export const TURF_MANA_GAIN = 2
/** Arena formats: an attacker turns on any enemy this close to it. */
export const AGGRO_RANGE = 2
/** BLACKOUT: march-and-clash beats resolved at every END ROUND. */
export const BLACKOUT_BEATS = 2

export interface ModeGuide {
  goal: string
  steps: string[]
  limits: string[]
}

/** First-time tester instructions shown beside each board. */
export const MODE_GUIDES: Record<ModeId, ModeGuide> = {
  turf: {
    goal: 'Go on the streets. Each turn place ONE card from your hand on an empty point. Hold more turf than the enemy when both crews pass: your stones plus the empty points only you surround. The enemy gets 2.5 points of komi for moving second.',
    steps: [
      'Drag a card onto any empty point (or tap it, then the point). Every card is a token; placing it ends your turn and the enemy answers.',
      'A group of touching stones lives while it has a liberty, an open point beside it. Fill an enemy group’s last liberty and it is captured.',
      'You may not fill your own group’s last liberty (unless that captures), and you may not repeat the position you just left (ko).',
      'Every card lands with its TURF effect: creatures carry their keywords as traits, attack spells slime an enemy liberty (never the last one), wards make a group uncapturable, wash off its slime and close its liberties to the enemy, and traps land as concealed stones whose tripwire captures the first enemy stone played beside them (three armed at once).',
      'Gain two mana a round and bank leftovers up to ten. PASS when no move helps you: two passes in a row end the game.',
    ],
    limits: [
      'Local prototype: the CPU reads the board like a beginner Go player and never sees your traps.',
      'Nothing is saved in practice matches.',
    ],
  },
  blackout: {
    goal: 'Two bases, two flags. Smash the enemy base (the far-right column) to zero, or have a creature grab the enemy ⚑ flag inside it and carry it back to your own base. After 20 rounds the healthier base wins.',
    steps: [
      'Begin with five cards from your ten-card deck and three mana. Gain three mana a round and bank leftovers up to ten.',
      'Drag a creature card onto your two back columns to summon it. Drag spells and equipment onto a fighter, traps onto an empty square. Or tap a card, then a square.',
      'Every creature starts on ATTACK. Tap its token to read its card and switch it to DEFEND: defenders guard your base and flag with +1 armor.',
      'Press END ROUND. The CPU plays, then every creature moves and fights on its own: attackers charge the nearest enemy, the enemy flag, then the enemy base.',
      'A creature that steps onto the enemy flag carries it home one square a round. Knock out a carrier and its flag snaps back to base.',
      'Drag cards you do not want onto the DISCARD pile; they are replaced at the end of the round. Tap the pile to take the last one back.',
    ],
    limits: [
      'Local prototype: the CPU sees where fighters stand but not hidden identities or your trap.',
      'Initiative alternates (you, CPU, CPU, you …): on even rounds the CPU has already played when your turn starts.',
      'Newly summoned creatures can march at once but strike from the next round (AMBUSH strikes at once).',
      'Nothing is saved in practice matches: only rewarded CPU battles pay XP and Meat.',
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
    goal: 'The Blackout arena on a live clock. Smash the enemy base or carry their ⚑ flag home. After 150 ticks the healthier base wins.',
    steps: [
      'Press RUN ▶. One tick per second; on every second tick creatures march and fight on their own.',
      'Mana does not refill: it drips in at +1 every 2 ticks, up to 10. Spend it now or bank it for a wave.',
      'Drag (or tap) cards onto the board at any time, running or paused. Your hand refills on every beat.',
      'Tap a token to read its card and set ATTACK or DEFEND, exactly as in Blackout.',
      'PAUSE ■ freezes the clock exactly; RUN ▶ continues from the same tick.',
    ],
    limits: [
      'Local prototype: a fixed-tick simulation. Same ten-card crew decks, one armed trap per side (Undertow: two).',
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
  if (known.some((card) => card.team !== teamId && card.team !== 'mercenary'))
    out.push('Cards must belong to your crew or the mercenary pool')
  if (known.filter((card) => card.team === 'mercenary').length > 3)
    out.push('At most three mercenaries per deck')
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
  if (state.mode === 'turf') return true
  if (state.mode !== 'gridiron')
    return side === 'player' ? x <= 1 : x >= state.width - 2
  return side === 'player' ? x === 0 : x === state.width - 1
}

/** Squares where a side may hide a trap (never in either deploy zone). */
export function inTrapZone(
  state: { mode: ModeId; width: number },
  side: Side,
  x: number,
): boolean {
  if (state.mode === 'turf') return true
  if (state.mode !== 'gridiron') return !inDeployZone(state, other(side), x)
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

/**
 * The arena formats (Silas, 2026-11-02): BLACKOUT and BLOODRUSH share one
 * board where creatures march and fight on their own, each side defends a
 * base along its far-back column with its own flag planted inside, and the
 * player's decisions are which cards to play and each creature's stance.
 * Only the legacy hidden-army fixture keeps manual movement.
 */
export function autoBattle(state: {
  mode: ModeId
  rules?: Partial<RuleVariants>
}): boolean {
  return (
    state.mode === 'bloodrush' ||
    (state.mode === 'blackout' && !state.rules?.classicFog)
  )
}

/** Formats that deal a five-card hand from a ten-card deck. */
export function dealsHands(state: {
  mode: ModeId
  rules?: Partial<RuleVariants>
}): boolean {
  return state.mode === 'turf' || autoBattle(state)
}

/** Arena formats: the column a side's base fills. */
export function baseColumn(state: { width: number }, side: Side): number {
  return side === 'player' ? 0 : state.width - 1
}

/** Where a side's flag stands at home: opposite ends, rotated by the seed. */
export function flagHome(
  state: { width: number; height: number; seed: number },
  side: Side,
): { x: number; y: number } {
  const row = Math.floor(state.height / 2) - 1 + (seededHash(state.seed, 3) % 2)
  return side === 'player'
    ? { x: 0, y: row }
    : { x: state.width - 1, y: state.height - 1 - row }
}

export function stanceOf(unit: { stance?: Stance }): Stance {
  return unit.stance ?? 'attack'
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
    baseDamage: 0,
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
    markedDiscards: {
      player: [...state.markedDiscards.player],
      enemy: [...state.markedDiscards.enemy],
    },
    playedThisRound: {
      player: [...state.playedThisRound.player],
      enemy: [...state.playedThisRound.enemy],
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
    bases: { ...state.bases },
    flags: {
      player: { ...state.flags.player },
      enemy: { ...state.flags.enemy },
    },
    puddles: state.puddles.map((p) => ({ ...p })),
    turfFx: (state.turfFx ?? []).map((f) => ({ ...f })),
    prisoners: { ...state.prisoners },
    history: [...state.history],
    jammed: { ...state.jammed },
    freePlays: { ...state.freePlays },
  }
}

/** Hidden traps a side may keep armed: Undertow rigs two. */
export function trapCapOf(state: MatchState, side: Side): number {
  const cap = teamById(teamOf(state, side)).trapCap ?? TRAP_CAP
  return state.mode === 'turf' ? Math.max(TURF_TRAP_CAP, cap) : cap
}

/** Traps a side armed from its hand (campaign set pieces do not count). */
function cardTraps(state: MatchState, side: Side): number {
  return state.traps.filter((t) => t.side === side && !t.set).length
}

/**
 * Put a side in mana debt. The turn formats take it out of the next refill
 * (at most DEBT_CAP); BLOODRUSH banks mana, so it is taken from the bank now.
 */
function addDebt(state: MatchState, side: Side, amount: number): void {
  if (amount <= 0) return
  state.stats.debt += amount
  if (parityOn(state)) {
    // TURF keeps one token a turn for both sides: a jam would hand the other
    // crew a double move, so PARITY TURF debt cards land as plain stones.
    if (state.mode !== 'turf')
      state.jammed[side] = Math.min(
        JAM_CAP,
        state.jammed[side] + Math.min(JAM_CAP, amount),
      )
    return
  }
  if (state.mode === 'bloodrush') {
    if (side === 'player') state.mana = Math.max(0, state.mana - amount)
    else state.enemyMana = Math.max(0, state.enemyMana - amount)
  } else
    state.debt[side] = Math.min(
      dealsHands(state) ? 6 : DEBT_CAP,
      state.debt[side] + amount,
    )
}

/**
 * COLLECT's passive debt. In PARITY a jammed turn is a lost turn, so only
 * cards whose whole job is to jam (debt spells and debt traps) may jam; the
 * keyword's chip-tax has no mana to bite on and does nothing.
 */
function collectDebt(state: MatchState, side: Side, amount: number): void {
  if (!parityOn(state)) addDebt(state, side, amount)
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
  const card = playedCard(state, cardById(cardId))
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
          mercenary: 'sword',
        } as Record<TeamId | 'mercenary', AttackStyle>
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

/**
 * Campaign set pieces (t-009): put a fighter on the board before round one,
 * outside either hand. A veteran may strike in the first round.
 */
export function placeFighter(
  state: MatchState,
  cardId: string,
  side: Side,
  x: number,
  y: number,
  options: { stance?: Stance; veteran?: boolean } = {},
): Fighter | null {
  if (
    x < 0 ||
    y < 0 ||
    x >= state.width ||
    y >= state.height ||
    unitAt(state, x, y) ||
    (state.monster && state.monster.x === x && state.monster.y === y)
  )
    return null
  const fighter = addFighter(state, cardId, side, x, y)
  if (options.stance) fighter.stance = options.stance
  if (options.veteran) fighter.summonedRound = 0
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

/** Keep unplayed cards, cycle only marked cards, and exclude last turn's plays. */
function drawHand(state: MatchState, side: Side): void {
  const marked = new Set(state.markedDiscards[side])
  state.discards[side].push(...state.hands[side].filter((id) => marked.has(id)))
  state.hands[side] = state.hands[side].filter((id) => !marked.has(id))
  state.markedDiscards[side] = []
  const forbidden = new Set(state.playedThisRound[side])
  while (state.hands[side].length < BLACKOUT_HAND_SIZE) {
    if (!state.piles[side].length) {
      const available = new Set(
        state.discards[side].filter((id) => !forbidden.has(id)),
      )
      if (!available.size) break
      state.shuffles[side]++
      state.piles[side] = shuffledDeck(state, side).filter((id) =>
        available.has(id),
      )
      state.discards[side] = state.discards[side].filter(
        (id) => !available.has(id),
      )
    }
    const next = state.piles[side].shift()
    if (!next) break
    state.hands[side].push(next)
  }
  state.playedThisRound[side] = []
  state.freePlays[side] = 0
}

/** CPU hand decisions use only its own cards and public board state. */
function chooseCpuDiscards(state: MatchState): void {
  const side: Side = 'enemy'
  if (!dealsHands(state)) return
  const availableMana = Math.min(
    MANA_CAP,
    state.enemyMana +
      (state.mode === 'bloodrush'
        ? 1
        : state.mode === 'turf'
          ? TURF_MANA_GAIN
          : BLACKOUT_MANA_GAIN),
  )
  const creatures = state.units.filter((unit) => unit.side === side).length
  const traps = cardTraps(state, side)
  const ordered = state.hands.enemy
    .map(cardById)
    .filter(
      (card) =>
        (card.kind === 'creature' && creatures >= FIELD_CAP[state.mode]) ||
        (card.kind === 'trap' && traps >= trapCapOf(state, side)) ||
        card.cost > availableMana + (state.round < 3 ? 1 : 0),
    )
    .sort((a, b) => b.cost - a.cost || a.id.localeCompare(b.id))
  state.markedDiscards.enemy = ordered.slice(0, 2).map((card) => card.id)
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
  const state: MatchState = {
    mode,
    width,
    height,
    round: 1,
    maxRounds: ROUND_LIMITS[mode],
    mana:
      mode === 'blackout' && !rules.classicFog
        ? BLACKOUT_MANA_GAIN
        : mode === 'bloodrush' || mode === 'turf'
          ? 3
          : 1,
    enemyMana:
      mode === 'blackout' && !rules.classicFog
        ? BLACKOUT_MANA_GAIN
        : mode === 'bloodrush' || mode === 'turf'
          ? 3
          : 1,
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
    markedDiscards: { player: [], enemy: [] },
    playedThisRound: { player: [], enemy: [] },
    shuffles: { player: 0, enemy: 0 },
    cooldowns: { player: {}, enemy: {} },
    debt: { player: 0, enemy: 0 },
    bases: { player: BASE_HP[mode], enemy: BASE_HP[mode] },
    flags: {
      player: {
        ...flagHome({ width, height, seed: s }, 'player'),
        carrier: null,
      },
      enemy: {
        ...flagHome({ width, height, seed: s }, 'enemy'),
        carrier: null,
      },
    },
    puddles: [],
    turfFx: [],
    prisoners: { player: 0, enemy: 0 },
    history: [],
    jammed: { player: 0, enemy: 0 },
    freePlays: { player: 0, enemy: 0 },
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
  } else if (dealsHands(state)) {
    for (const side of ['player', 'enemy'] as Side[]) {
      state.piles[side] = shuffledDeck(state, side)
      drawHand(state, side)
    }
    message(
      state,
      mode === 'turf'
        ? 'Five cards in hand. Place one token a turn and claim the turf.'
        : 'Five cards in hand. Smash the enemy base or carry their flag home.',
    )
  }
  if (state.rules.monster && mode !== 'turf') {
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
  if (mode === 'gridiron') {
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
    if (unit.carryingFlag && autoBattle(state)) {
      unit.carryingFlag = false
      const owner = other(unit.side)
      state.flags[owner] = { ...flagHome(state, owner), carrier: null }
      state.stats.flagDrops++
      message(
        state,
        owner === 'player'
          ? 'Your flag thief falls! Your flag snaps back to base.'
          : 'Your flag carrier falls! The enemy flag snaps back to base.',
      )
    } else if (unit.carryingFlag) {
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
  if (state.mode !== 'blackout' || state.victor || autoBattle(state)) return
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
  if (state.mode === 'turf') {
    // Captures and the suicide and ko checks run on a draft, so a refused
    // token leaves the live match untouched (the CPU applies directly).
    const draft = copy(state)
    if (!applyTurf(draft, side, cardId, x, y)) return false
    Object.assign(state, draft)
    return true
  }
  const found = CARDS.find((item) => item.id === cardId)
  const card = found && playedCard(state, found)
  if (
    !card ||
    state.victor ||
    (card.team !== teamOf(state, side) && card.team !== 'mercenary')
  )
    return false
  if (card.cost > manaOf(state, side)) return false
  if (!cardReady(state, side, cardId)) return false
  if (autoBattle(state) && !state.hands[side].includes(cardId)) return false
  if (parityOn(state)) {
    if (!parityMayPlay(state, side, card)) return false
    if (parityJam(state, side, card)) {
      state.stats.plays[side][card.kind]++
      return true
    }
  }
  if (x < 0 || y < 0 || x >= state.width || y >= state.height) return false
  const target = unitAt(state, x, y)
  const hidden =
    side === 'enemy' && state.mode === 'blackout' && !!state.rules.classicFog
  let line: string
  if (card.kind === 'creature') {
    if (target || monsterAt(state, x, y) || !inDeployZone(state, side, x))
      return false
    if (autoBattle(state) && flagSquare(state, x, y)) return false
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
    if (cardTraps(state, side) >= trapCapOf(state, side)) return false
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
    card.effect === 'armor' ||
    card.effect === 'sharpen' ||
    card.effect === 'grant' ||
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
    if (parityOn(state) && card.effect !== 'heal' && card.effect !== 'scan') {
      target.maxHp += PARITY_BUFF_HP
      target.hp += PARITY_BUFF_HP
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
  if (autoBattle(state)) {
    if (parityOn(state)) parityBook(state, side, card)
    state.hands[side] = state.hands[side].filter((id) => id !== cardId)
    state.discards[side].push(cardId)
    state.playedThisRound[side].push(cardId)
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
  // Manual movement survives only in the legacy hidden-army fixture.
  if (state.victor || state.mode !== 'blackout' || autoBattle(state))
    return false
  if (x < 0 || y < 0 || x >= state.width || y >= state.height) return false
  const unit = state.units.find((u) => u.id === id && u.side === side)
  if (!unit || unit.ap < 1 || !legalNeighbor(unit, { x, y })) return false
  if (isRooted(state, unit)) return false
  if (occupied(state, x, y)) return false
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

function applyStance(
  state: MatchState,
  side: Side,
  id: number,
  stance: Stance,
): boolean {
  if (state.victor || !autoBattle(state)) return false
  if (stance !== 'attack' && stance !== 'defend') return false
  const unit = state.units.find((u) => u.id === id && u.side === side)
  if (!unit || stanceOf(unit) === stance) return false
  unit.stance = stance
  message(
    state,
    publicName(unit) +
      (stance === 'defend'
        ? ' falls back to guard its base.'
        : ' charges for the enemy base.'),
  )
  return true
}

/** Give one of your creatures its orders: ATTACK or DEFEND. */
export function setStance(
  state: MatchState,
  id: number,
  stance: Stance,
): MatchState {
  return stanceAs(state, 'player', id, stance)
}

export function stanceAs(
  state: MatchState,
  side: Side,
  id: number,
  stance: Stance,
): MatchState {
  return recorded(state, { t: 'stance', side, id, stance }, (draft) =>
    applyStance(draft, side, id, stance),
  )
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

/** Record a voluntary discard toggle; only the current player may make it. */
export function toggleHandDiscard(
  state: MatchState,
  cardId: string,
): MatchState {
  return discardAs(state, 'player', cardId)
}

export function discardAs(
  state: MatchState,
  side: Side,
  cardId: string,
): MatchState {
  return recorded(state, { t: 'discard', side, card: cardId }, (draft) => {
    if (
      draft.victor ||
      side !== 'player' ||
      !dealsHands(draft) ||
      !draft.hands[side].includes(cardId)
    )
      return false
    const marked = draft.markedDiscards[side]
    draft.markedDiscards[side] = marked.includes(cardId)
      ? marked.filter((id) => id !== cardId)
      : [...marked, cardId]
    return true
  })
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
    // The view lists every own trap, set pieces too: lift the cap to match.
    trapCap:
      trapCapOf(state, side) +
      state.traps.filter((t) => t.side === side && t.set).length,
    mana: manaOf(state, side),
    opponentMana: manaOf(state, other(side)),
    debt: [state.debt[side], state.debt[other(side)]],
    score:
      side === 'player'
        ? [state.score[0], state.score[1]]
        : [state.score[1], state.score[0]],
    salt: seededHash(state.seed, side === 'player' ? 101 : 202),
    flag: { ...state.flag },
    auto: autoBattle(state),
    dealt: dealsHands(state),
    puddles: state.puddles.map((p) => ({ ...p })),
    turfFx: (state.turfFx ?? []).map((f) => ({ ...f })),
    prisoners: [state.prisoners[side], state.prisoners[other(side)]],
    turfScore: (() => {
      if (state.mode !== 'turf') return [0, 0] as [number, number]
      const { score } = turfTerritory(state)
      return [score[side], score[other(side)]] as [number, number]
    })(),
    turfPlayed: state.playedThisRound[side].length > 0,
    parity: parityOn(state),
    jammed: [state.jammed[side], state.jammed[other(side)]],
    freeKind:
      parityOn(state) && state.mode !== 'turf'
        ? PARITY_FREE_KIND[teamOf(state, side)]
        : null,
    playSpent: state.playedThisRound[side].length - state.freePlays[side] >= 1,
    bases: [state.bases[side], state.bases[other(side)]],
    baseMax: BASE_HP[state.mode],
    flags: [{ ...state.flags[side] }, { ...state.flags[other(side)] }],
    flagHomes: [flagHome(state, side), flagHome(state, other(side))],
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
          stance: stanceOf(u),
          warded: (u.wardedUntil ?? 0) >= state.round,
        }
      }),
    traps: state.traps.filter((t) => t.side === side).map((t) => ({ ...t })),
    hand: (dealsHands(state)
      ? state.hands[side].map((id) => playedCard(state, cardById(id)))
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
    : action.t === 'stance'
      ? 's:' + action.id + ':' + action.stance
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
        : action.t === 'stance'
          ? stanceAs(current, side, action.id, action.stance)
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
  victim: { armor: number; stance?: Stance },
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
    armorOf(victim) - (hasKeyword(fighter, 'pierce') ? 1 : 0),
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
      if (hasKeyword(fighter, 'collect'))
        collectDebt(state, other(fighter.side), 1)
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

/** Defenders dig in for +1 armor. */
function armorOf(unit: { armor: number; stance?: Stance }): number {
  return unit.armor + (unit.stance === 'defend' ? 1 : 0)
}

/** Arena: either side's flag stands at home on this square. */
export function flagSquare(
  state: { width: number; height: number; seed: number },
  x: number,
  y: number,
): boolean {
  return (['player', 'enemy'] as Side[]).some((side) => {
    const home = flagHome(state, side)
    return home.x === x && home.y === y
  })
}

function gap(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

function inHomeHalf(state: MatchState, side: Side, x: number): boolean {
  return side === 'player' ? x < state.width / 2 : x >= state.width / 2
}

/** An enemy or the monster is within this fighter's striking range. */
function engaged(state: MatchState, unit: Fighter): boolean {
  const reach = unit.range ?? 1
  return (
    state.units.some(
      (o) => o.side !== unit.side && o.hp > 0 && gap(o, unit) <= reach,
    ) ||
    (!!state.monster && gap(state.monster, unit) <= reach)
  )
}

/** Melee must stand in the enemy base column; range 2 hits from beside it. */
function baseInReach(state: MatchState, unit: Fighter): boolean {
  return (
    Math.abs(unit.x - baseColumn(state, other(unit.side))) < (unit.range ?? 1)
  )
}

function nearestTo(unit: Fighter, list: Fighter[]): Fighter | undefined {
  return [...list].sort((a, b) => gap(a, unit) - gap(b, unit) || a.id - b.id)[0]
}

/**
 * Where a creature heads next, or null to hold. Carriers run home. Defenders
 * hunt a flag thief, then intruders in their half, then guard their flag.
 * Attackers turn on nearby enemies, then go for the enemy flag, then the base.
 */
function marchGoal(
  state: MatchState,
  unit: Fighter,
): { x: number; y: number } | null {
  const foeSide = other(unit.side)
  if (state.flags[foeSide].carrier === unit.id)
    return { x: baseColumn(state, unit.side), y: unit.y }
  const foes = state.units.filter((o) => o.side !== unit.side && o.hp > 0)
  const thief = foes.find((o) => state.flags[unit.side].carrier === o.id)
  if (stanceOf(unit) === 'defend') {
    if (thief) return thief
    const intruder = nearestTo(
      unit,
      foes.filter(
        (o) =>
          inHomeHalf(state, unit.side, o.x) && gap(o, unit) <= AGGRO_RANGE + 1,
      ),
    )
    if (intruder) return intruder
    const post = flagHome(state, unit.side)
    return gap(unit, post) > 1 ? post : null
  }
  if (thief && gap(thief, unit) <= AGGRO_RANGE + 2) return thief
  const close = nearestTo(
    unit,
    foes.filter((o) => gap(o, unit) <= AGGRO_RANGE),
  )
  if (close) return close
  const flag = state.flags[foeSide]
  if (flag.carrier === null) return flag
  if (baseInReach(state, unit)) return null
  return { x: baseColumn(state, foeSide), y: unit.y }
}

/** Grab the enemy flag by stepping on it; carry it; bring it home to win. */
function carryFlag(state: MatchState, unit: Fighter): void {
  if (state.victor || unit.hp <= 0) return
  const flag = state.flags[other(unit.side)]
  if (flag.carrier === null && flag.x === unit.x && flag.y === unit.y) {
    flag.carrier = unit.id
    unit.carryingFlag = true
    unit.hidden = false
    state.stats.flagPickups++
    message(
      state,
      unit.side === 'player'
        ? name(unit) + ' grabs the enemy flag! Run it home.'
        : publicName(unit) + ' steals your flag!',
    )
  }
  if (flag.carrier !== unit.id) return
  flag.x = unit.x
  flag.y = unit.y
  if (unit.x === baseColumn(state, unit.side)) {
    finish(state, unit.side, 'flag')
    message(
      state,
      'FLAG RUN! ' +
        (unit.side === 'player' ? 'You capture' : 'The enemy captures') +
        ' the flag.',
    )
  }
}

/** One square toward the goal: around blockers, or BULLDOZE through them. */
function stepToward(
  state: MatchState,
  unit: Fighter,
  goal: { x: number; y: number },
): boolean {
  const here = gap(unit, goal)
  const ownFlag = state.flags[unit.side]
  const thief = state.units.some((o) => o.id === ownFlag.carrier)
  const open = (c: { x: number; y: number }) =>
    !occupied(state, c.x, c.y) &&
    // A side's own creatures step around their flag, so it stays grabbable.
    !(ownFlag.carrier === null && c.x === ownFlag.x && c.y === ownFlag.y) &&
    (stanceOf(unit) !== 'defend' ||
      unit.carryingFlag ||
      thief ||
      inHomeHalf(state, unit.side, c.x))
  const tie = (c: { x: number; y: number }) =>
    seededHash(state.seed, state.round, unit.id, c.x, c.y)
  const options = neighbors(state, unit.x, unit.y).filter(open)
  const closer = options
    .filter((c) => gap(c, goal) < here)
    .sort((a, b) => gap(a, goal) - gap(b, goal) || tie(a) - tie(b))
  let step = closer[0]
  if (!step) {
    // Blocked: sidestep to a square no further away, rather than queue.
    step = options
      .filter((c) => gap(c, goal) === here)
      .sort((a, b) => tie(a) - tie(b))[0]
    if (step) state.stats.sidesteps++
    else {
      state.stats.clogs++
      return false
    }
  }
  unit.x = step.x
  unit.y = step.y
  unit.hidden = false
  triggerTrapAt(state, unit)
  carryFlag(state, unit)
  return true
}

/**
 * BULLDOZE in the arena: an attacker that meets an enemy head-on, on its way
 * to the enemy base, shoves it one square back if the square behind is clear.
 */
function shoveForward(state: MatchState, unit: Fighter): boolean {
  if (!hasKeyword(unit, 'bulldoze') || stanceOf(unit) !== 'attack') return false
  const dir = unit.side === 'player' ? 1 : -1
  const ahead = unitAt(state, unit.x + dir, unit.y)
  const beyond = unit.x + 2 * dir
  if (
    !ahead ||
    ahead.side === unit.side ||
    beyond < 0 ||
    beyond >= state.width ||
    occupied(state, beyond, unit.y)
  )
    return false
  ahead.x = beyond
  ahead.hidden = false
  unit.x += dir
  unit.hidden = false
  state.stats.shoves++
  message(state, publicName(unit) + ' bulldozes ' + publicName(ahead) + '.')
  triggerTrapAt(state, ahead)
  carryFlag(state, ahead)
  triggerTrapAt(state, unit)
  carryFlag(state, unit)
  return true
}

/** Arena: every creature advances by its orders, front-runners first. */
function march(state: MatchState): void {
  const beat =
    state.mode === 'bloodrush'
      ? Math.floor(state.round / RUSH_MOVE_EVERY)
      : state.round
  const order: Side[] =
    beat % 2 === 1 ? ['player', 'enemy'] : ['enemy', 'player']
  for (const side of order) {
    const dir = side === 'player' ? 1 : -1
    const units = state.units
      .filter((u) => u.side === side && u.hp > 0)
      .sort((a, b) => (b.x - a.x) * dir || a.id - b.id)
    for (const unit of units) {
      if (state.victor) return
      if (unit.hp <= 0 || isRooted(state, unit)) continue
      // Everyone marches two squares (three with 3+ AP); carriers lumber.
      const steps = unit.carryingFlag
        ? Math.min(1, unit.ap)
        : unit.ap >= 3
          ? 3
          : unit.ap > 0
            ? 2
            : 0
      for (let i = 0; i < steps; i++) {
        if (!unit.carryingFlag && engaged(state, unit)) {
          if (i === 0 && shoveForward(state, unit)) continue
          break
        }
        const goal = marchGoal(state, unit)
        if (!goal || (goal.x === unit.x && goal.y === unit.y)) break
        if (!stepToward(state, unit, goal)) break
        if (unit.hp <= 0 || state.victor) break
      }
    }
    removeDead(state)
  }
}

/**
 * Arena: every creature in range strikes at once. Attackers with no enemy in
 * reach batter the enemy base; defenders never leave home to do so.
 */
function clash(state: MatchState): void {
  const damage = new Map<number, number>()
  const blows: { fighter: Fighter; victim: Fighter | null; dealt: number }[] =
    []
  const siege: Record<Side, number> = { player: 0, enemy: 0 }
  const monster = state.monster
  const onMonster: Record<Side, number> = { player: 0, enemy: 0 }
  for (const fighter of state.units) {
    if (fighter.hp <= 0) continue
    if (fighter.summonedRound === state.round) continue
    const reach = fighter.range ?? 1
    const foes = state.units.filter(
      (o) => o.side !== fighter.side && o.hp > 0 && gap(o, fighter) <= reach,
    )
    if (foes.length) {
      // Arena blows always chip: armor softens a hit but never stops it.
      const hit = (o: Fighter) => Math.max(1, blowDamage(state, fighter, o))
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
    } else if (monster && gap(monster, fighter) <= reach) {
      const dealt = blowDamage(state, fighter, monster)
      onMonster[fighter.side] += dealt
      fighter.hidden = false
      blows.push({ fighter, victim: null, dealt: 0 })
      if (dealt > 0 && hasKeyword(fighter, 'leech'))
        fighter.hp = Math.min(fighter.maxHp, fighter.hp + 1)
    } else if (
      stanceOf(fighter) === 'attack' &&
      !fighter.carryingFlag &&
      baseInReach(state, fighter)
    ) {
      const dealt = blowDamage(state, fighter, { armor: 0 })
      siege[other(fighter.side)] += dealt
      fighter.hidden = false
      blows.push({ fighter, victim: null, dealt: 0 })
    }
  }
  if (monster) {
    const prey = state.units
      .filter((u) => u.hp > 0 && legalNeighbor(u, monster))
      .sort((a, b) => a.hp - b.hp || a.id - b.id)[0]
    if (prey) {
      const swat = Math.max(0, monster.attack - armorOf(prey))
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
  let falls = 0
  for (const unit of state.units) {
    unit.hp -= damage.get(unit.id) || 0
    if (damage.has(unit.id) && unit.hp <= 0) falls++
  }
  for (const { fighter, victim, dealt } of blows) {
    if (hasKeyword(fighter, 'ambush')) fighter.struck = true
    if (!victim || dealt <= 0) continue
    if (hasKeyword(fighter, 'leech') && fighter.hp > 0)
      fighter.hp = Math.min(fighter.maxHp, fighter.hp + 1)
    if (hasKeyword(fighter, 'snare') && victim.hp > 0) root(state, victim, true)
    if (hasKeyword(fighter, 'collect'))
      collectDebt(state, other(fighter.side), 1)
  }
  if (damage.size)
    message(
      state,
      damage.size +
        ' fighters trade blows' +
        (falls ? '; ' + falls + ' fall.' : '.'),
    )
  removeDead(state)
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
  for (const side of ['enemy', 'player'] as Side[]) {
    if (!siege[side]) continue
    if (side === 'enemy' && state.heist) {
      message(
        state,
        'The vault walls shrug off ' +
          siege[side] +
          ' damage. Only their flag will do.',
      )
      continue
    }
    state.bases[side] = Math.max(0, state.bases[side] - siege[side])
    state.stats.baseDamage += siege[side]
    message(
      state,
      (side === 'enemy'
        ? 'Your crew batters the enemy base for '
        : 'The enemy batters your base for ') +
        siege[side] +
        ' (' +
        state.bases[side] +
        ' left).',
    )
  }
  if (monster && monster.hp <= 0) {
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
  if (autoBattle(state)) {
    const p = state.bases.player <= 0
    const e = state.bases.enemy <= 0
    if (p || e) {
      finish(state, p && e ? 'draw' : p ? 'enemy' : 'player', 'base')
      return
    }
  } else if (state.mode === 'blackout') {
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
    if ((state.holdout || state.heist) && autoBattle(state)) {
      // A base that fell would have ended the bout already: at the bell a
      // HOLD OUT has survived unless its flag is in rival hands, and a HEIST
      // has run out of time.
      const held = state.holdout && state.flags.player.carrier === null
      finish(state, held ? 'player' : 'enemy', 'time')
      return
    }
    const lanes = state.mode === 'gridiron'
    const arena = autoBattle(state)
    // Arena: the healthier base wins on the clock, then the healthier crew.
    let a = lanes
      ? state.score[0]
      : arena && state.bases.player !== state.bases.enemy
        ? state.bases.player
        : hpTotal(state, 'player')
    let b = lanes
      ? state.score[1]
      : arena && state.bases.player !== state.bases.enemy
        ? state.bases.enemy
        : hpTotal(state, 'enemy')
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
  if (next.mode === 'turf') return advanceTurf(next)
  const enemyTurn = () =>
    runCpu(next, 'enemy', (a) =>
      a.t === 'deploy'
        ? applyDeploy(next, 'enemy', a.card, a.x, a.y)
        : a.t === 'stance'
          ? applyStance(next, 'enemy', a.id, a.stance)
          : applyMove(next, 'enemy', a.id, a.x, a.y),
    )
  // Initiative alternates in the turn formats (player, CPU, CPU, player...):
  // on odd rounds the CPU answers now; on even rounds it already moved first.
  if (playerHasInitiative(next)) enemyTurn()
  const arena = autoBattle(next)
  // BLOODRUSH resolves the board on every Nth tick (a beat); turns every round.
  const beat = next.mode !== 'bloodrush' || next.round % RUSH_MOVE_EVERY === 0
  if (!next.victor) {
    if (arena) {
      // BLACKOUT plays out two beats per round so the board outpaces its
      // three-mana refill; BLOODRUSH drips one mana per beat instead.
      const beats = next.mode === 'blackout' ? BLACKOUT_BEATS : beat ? 1 : 0
      for (let i = 0; i < beats && !next.victor; i++) {
        march(next)
        if (!next.victor) clash(next)
      }
    } else {
      if (next.mode === 'gridiron') laneMovement(next)
      if (next.mode !== 'blackout' || next.rules.classicFog) combat(next)
      settleFlag(next, true)
    }
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
      if (next.mode === 'blackout' && !next.rules.classicFog) {
        for (const side of ['player', 'enemy'] as Side[]) {
          const paid = Math.min(BLACKOUT_MANA_GAIN, next.debt[side])
          const gain = BLACKOUT_MANA_GAIN - paid
          if (side === 'player')
            next.mana = Math.min(MANA_CAP, next.mana + gain)
          else next.enemyMana = Math.min(MANA_CAP, next.enemyMana + gain)
          next.debt[side] -= paid
        }
      } else {
        const base = Math.min(MANA_CAP, next.round)
        next.mana = Math.max(0, base - next.debt.player)
        next.enemyMana = Math.max(0, base - next.debt.enemy)
        next.debt = { player: 0, enemy: 0 }
      }
      message(next, 'Round ' + next.round + ' · ' + next.mana + ' banked mana.')
    }
    if (arena && beat) {
      chooseCpuDiscards(next)
      drawHand(next, 'player')
      drawHand(next, 'enemy')
      if (next.mode === 'blackout')
        message(next, 'Hands refilled to five; discards replaced.')
    }
    // Carriers lumber: one square per round, unless a card boosts them.
    // Rooted fighters get no AP this round. BLOODRUSH refills on the beat.
    if (beat)
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
        : next.winPath === 'base'
          ? 'by smashing the base'
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

// ---------------------------------------------------------------------------
// TURF (Silas, 2026-11-03): "a new version of this game, modeled after go.
// each turn you play a single token, but go rules apply. this needs a
// modified effect...which theoretically already exists due to the different
// games." Every card is a token: each turn a side places exactly one card on
// an empty point (or passes). Groups with no liberties are captured, suicide
// is illegal, the ko rule forbids repeating the position, and two passes end
// the game on area score plus komi. Each card keeps its identity through a
// Go-native TURF effect (turfText) that fires as it lands.
// ---------------------------------------------------------------------------

type Point = { x: number; y: number }

export function puddleAt(
  state: Pick<MatchState, 'puddles'>,
  x: number,
  y: number,
): boolean {
  return state.puddles.some((p) => p.x === x && p.y === y)
}

function turfBlocked(state: MatchState, x: number, y: number): boolean {
  return !!unitAt(state, x, y) || puddleAt(state, x, y)
}

/** The connected same-side stones through this stone. */
function turfGroup(state: MatchState, stone: Fighter): Fighter[] {
  const seen = new Set<number>([stone.id])
  const group = [stone]
  for (let i = 0; i < group.length; i++) {
    const at = group[i]!
    for (const n of neighbors(state, at.x, at.y)) {
      const next = unitAt(state, n.x, n.y)
      if (next && next.side === stone.side && !seen.has(next.id)) {
        seen.add(next.id)
        group.push(next)
      }
    }
  }
  return group
}

/** Empty, unslimed points beside a group. */
function turfLiberties(state: MatchState, group: Fighter[]): Point[] {
  const out = new Map<string, Point>()
  for (const stone of group)
    for (const n of neighbors(state, stone.x, stone.y))
      if (!turfBlocked(state, n.x, n.y)) out.set(n.x + ':' + n.y, n)
  return [...out.values()]
}

function turfGroups(state: MatchState, side: Side): Fighter[][] {
  const seen = new Set<number>()
  const groups: Fighter[][] = []
  for (const stone of [...state.units].sort((a, b) => a.id - b.id)) {
    if (stone.side !== side || seen.has(stone.id)) continue
    const group = turfGroup(state, stone)
    for (const s of group) seen.add(s.id)
    groups.push(group)
  }
  return groups
}

function warded(state: MatchState, group: Fighter[]): boolean {
  return group.some((s) => (s.wardedUntil ?? 0) >= state.round)
}

/** TURF: this point is a liberty of a warded enemy group (closed to `side`). */
export function turfNoGo(
  state: MatchState,
  side: Side,
  x: number,
  y: number,
): boolean {
  return neighbors(state, x, y).some((n) => {
    const stone = unitAt(state, n.x, n.y)
    return (
      !!stone && stone.side !== side && warded(state, turfGroup(state, stone))
    )
  })
}

/** The position, for the ko rule: stones and puddles only. */
function turfHash(state: MatchState): string {
  return [
    ...state.units.map((u) => u.side.charAt(0) + u.x + ',' + u.y),
    ...state.puddles.map((p) => 'p' + p.x + ',' + p.y),
  ]
    .sort()
    .join('|')
}

/**
 * Remove every `victim` group with no liberties. REGEN stones survive their
 * first capture; VOLATILE stones take the enemy stones beside them along.
 * Returns how many enemy stones the capturer took.
 */
function turfCapture(state: MatchState, victim: Side, piercing: boolean) {
  let taken = 0
  for (const group of turfGroups(state, victim)) {
    if (turfLiberties(state, group).length) continue
    if (!piercing && warded(state, group)) continue
    const blasts: Fighter[] = []
    for (const stone of group) {
      if (hasKeyword(stone, 'regen') && !stone.revived) {
        stone.revived = true
        message(state, publicName(stone) + ' regenerates and clings on!')
        turfFx(state, 'cling', stone, victim)
        continue
      }
      stone.hp = 0
      taken++
      turfFx(state, 'capture', stone, other(victim))
      if (hasKeyword(stone, 'volatile')) blasts.push(stone)
    }
    state.units = state.units.filter((u) => u.hp > 0)
    for (const bomb of blasts) {
      // VOLATILE takes the stone that captured it (the newest enemy stone
      // beside it), not the whole surround.
      const caught = state.units
        .filter((u) => u.side !== victim && legalNeighbor(u, bomb))
        .sort((a, b) => b.id - a.id)
        .slice(0, 1)
      turfFx(state, 'boom', bomb, victim)
      for (const u of caught) {
        if (warded(state, turfGroup(state, u))) continue
        u.hp = 0
        state.prisoners[victim]++
        turfFx(state, 'capture', u, victim)
      }
      state.stats.explosions++
      if (caught.length)
        message(state, publicName(bomb) + ' explodes as it is captured!')
      state.units = state.units.filter((u) => u.hp > 0)
    }
  }
  state.prisoners[other(victim)] += taken
  state.stats.knockouts[victim] += taken
  // A captured trap stone takes its tripwire with it.
  state.traps = state.traps.filter((t) =>
    state.units.some((u) => u.side === t.side && u.x === t.x && u.y === t.y),
  )
  return taken
}

const OFFENSIVE: Effect[] = ['zap', 'blast', 'chaos', 'root']

/** Record a TURF board event for the arena to animate. */
function turfFx(
  state: MatchState,
  kind: TurfFxKind,
  at: { x: number; y: number },
  side: Side,
  from?: { x: number; y: number },
): void {
  const list = state.turfFx ?? (state.turfFx = [])
  const seq = (list[list.length - 1]?.seq ?? 0) + 1
  list.push({ seq, kind, x: at.x, y: at.y, side, ...(from ? { from } : {}) })
  if (list.length > TURF_FX_KEEP) list.splice(0, list.length - TURF_FX_KEEP)
}

/** TURF: does this card slime as it lands? Under PARITY there is no mana to
 * squeeze, so debt spells slime a liberty instead. */
export function turfSlimes(card: Card, parity: boolean): boolean {
  return (
    !!card.effect &&
    card.kind !== 'creature' &&
    (OFFENSIVE.includes(card.effect) || (parity && card.effect === 'debt'))
  )
}

function onEdge(state: MatchState, p: Point): boolean {
  return (
    p.x === 0 ||
    p.y === 0 ||
    p.x === state.width - 1 ||
    p.y === state.height - 1
  )
}
const WARDING: Effect[] = ['heal', 'armor', 'sharpen', 'grant']

/** What a card does as a TURF token. Shown on the card in TURF. */
export function turfText(card: Card, parity = false): string {
  if (card.kind === 'creature') {
    const traits = (card.keywords ?? []).map(
      (k) =>
        KEYWORDS[k].label +
        ': ' +
        (parity && k === 'collect'
          ? TURF_PARITY_COLLECT
          : parity && k === 'bulldoze'
            ? TURF_PARITY_BULLDOZE
            : TURF_KEYWORDS[k]),
    )
    return [
      'A stone: it holds its point and counts as your turf.',
      ...traits,
    ].join(' ')
  }
  if (card.kind === 'trap')
    return (
      'A concealed stone wired with a tripwire: the first enemy stone played beside it is captured at once' +
      (card.roots ? ', and its point stays slimed for 2 turns' : '') +
      (card.debt ? '; its crew owes ' + card.debt + ' mana' : '') +
      '.'
    )
  const turns = turfDuration(card, 0)
  if (card.effect && turfSlimes(card, parity))
    return (
      'A stone that slimes a liberty of the weakest enemy group beside it for ' +
      (card.effect === 'chaos'
        ? '1–3 turns'
        : turns + (turns === 1 ? ' turn' : ' turns')) +
      '. Slime fills the point but never a group’s last liberty: it threatens, a stone captures.'
    )
  if (card.effect === 'debt')
    return (
      'A stone that puts the other crew ' +
      (card.debt ?? 1) +
      ' mana in debt as it lands.'
    )
  if (card.effect === 'boost')
    return 'A stone that scrubs the slime off every liberty of its group.'
  if (card.effect === 'scan')
    return 'A stone that finds and disarms enemy traps within two points.'
  const grants = (card.grants ?? []).map((k) => KEYWORDS[k].label)
  return (
    'A stone that wards its group for ' +
    turns +
    ' turns: it cannot be captured or slimed, its slime washes away, and enemy stones cannot be played on its liberties' +
    (grants.length ? '. It also gains ' + grants.join(', ') : '') +
    '.'
  )
}

/** Keyword traits a creature stone carries in TURF. */
export const TURF_KEYWORDS: Record<Keyword, string> = {
  ambush:
    'pounces: as it lands, it captures a lone enemy stone beside it on the board’s edge that is left in atari; it may also retake a ko at once.',
  regen: 'survives its first capture.',
  swarm: 'counts one and a half in the final count.',
  leech: 'each stone its landing captures refunds 1 mana.',
  bulldoze:
    'shoves one enemy stone beside it a point straight back; a lone stone with nowhere to go (edge, stone or slime behind it) is crushed and captured.',
  volatile: 'if captured, it explodes and takes the stone that captured it.',
  pierce: 'its landing captures warded groups too.',
  snare: 'strips the wards off enemy groups beside it.',
  collect:
    'each stone its landing captures puts the other crew 1 mana in debt.',
}

function turfDuration(card: Card, salt: number): number {
  const power = card.power ?? 2
  if (card.effect === 'root') return Math.min(3, power + 1)
  if (card.effect === 'chaos') return 1 + (salt % 3)
  if (card.effect === 'blast') return 1
  if (card.effect === 'heal') return Math.max(3, Math.min(4, power))
  if (card.effect === 'zap') return Math.max(1, Math.min(3, power))
  // Wards (Silas, 2026-11-03: "Stronger wards and traps") hold three turns.
  return 3
}

/** Area score: stones (SWARM counts twice) plus empty points only one side borders. */
export function turfTerritory(state: MatchState): {
  owner: Record<string, Side | null>
  score: Record<Side, number>
} {
  const owner: Record<string, Side | null> = {}
  const score: Record<Side, number> = { player: 0, enemy: 0 }
  // PARITY has no mana to collect, so COLLECT stones earn interest instead.
  const interest = parityOn(state)
  for (const u of state.units)
    score[u.side] +=
      interest && hasKeyword(u, 'collect')
        ? TURF_PARITY_INTEREST
        : hasKeyword(u, 'swarm')
          ? TURF_SWARM_WORTH
          : 1
  const seen = new Set<string>()
  for (let y = 0; y < state.height; y++)
    for (let x = 0; x < state.width; x++) {
      const key = x + ':' + y
      if (seen.has(key) || unitAt(state, x, y)) continue
      const region: Point[] = [{ x, y }]
      seen.add(key)
      const borders = new Set<Side>()
      for (let i = 0; i < region.length; i++) {
        const at = region[i]!
        for (const n of neighbors(state, at.x, at.y)) {
          const stone = unitAt(state, n.x, n.y)
          if (stone) borders.add(stone.side)
          else if (!seen.has(n.x + ':' + n.y)) {
            seen.add(n.x + ':' + n.y)
            region.push(n)
          }
        }
      }
      const side = borders.size === 1 ? [...borders][0]! : null
      for (const p of region) owner[p.x + ':' + p.y] = side
      if (side) score[side] += region.length
    }
  score.enemy += TURF_KOMI
  // Story terms in TURF (Silas, 2026-11-04: story mode through Turf).
  const terms = state.scenarioBonus?.turfPoints ?? 0
  if (terms > 0) score.player += terms
  else if (terms < 0) score.enemy -= terms
  return { owner, score }
}

function applyTurf(
  state: MatchState,
  side: Side,
  cardId: string,
  x: number,
  y: number,
): boolean {
  const found = CARDS.find((item) => item.id === cardId)
  const card = found && playedCard(state, found)
  if (
    !card ||
    state.victor ||
    (card.team !== teamOf(state, side) && card.team !== 'mercenary') ||
    card.cost > manaOf(state, side) ||
    !state.hands[side].includes(cardId) ||
    (parityOn(state)
      ? !parityMayPlay(state, side, card)
      : state.playedThisRound[side].length > 0)
  )
    return false
  if (parityJam(state, side, card)) {
    state.stats.plays[side][card.kind]++
    return true
  }
  if (x < 0 || y < 0 || x >= state.width || y >= state.height) return false
  if (turfBlocked(state, x, y)) return false
  // Your own traps block a point for you; an enemy's is invisible to you.
  if (state.traps.some((t) => t.side === side && t.x === x && t.y === y))
    return false
  const foe = other(side)
  // A warded group's liberties are a no-go zone for enemy stones; PIERCE and
  // SNARE exist to break wards, so they may land there.
  if (
    turfNoGo(state, side, x, y) &&
    !(card.keywords ?? []).some((k) => k === 'pierce' || k === 'snare')
  )
    return false
  let line: string
  // Traps (Silas, 2026-11-03: "Stronger wards and traps") land as a concealed
  // stone like every other card, wired with a hidden tripwire.
  const wiring = card.kind === 'trap'
  if (
    wiring &&
    state.traps.filter((t) => t.side === side).length >= trapCapOf(state, side)
  )
    return false
  const before = turfHash(state)
  const stone = addFighter(state, cardId, side, x, y, wiring)
  // A tripwire catches the first enemy stone played beside its stone.
  const sprung = state.traps.findIndex(
    (t) => t.side === foe && Math.abs(t.x - x) + Math.abs(t.y - y) <= 1,
  )
  if (sprung >= 0) {
    const trap = state.traps.splice(sprung, 1)[0]!
    state.units = state.units.filter((u) => u.id !== stone.id)
    turfFx(state, 'trip', stone, foe, trap)
    state.prisoners[foe]++
    state.stats.trapsSprung++
    if (trap.debt) addDebt(state, side, trap.debt)
    if (trap.roots) state.puddles.push({ x, y, until: state.round + 2 })
    const hash = turfHash(state)
    state.history = [...state.history, before, hash].slice(-8)
    line =
      publicName(stone) + ' trips a hidden wire and is captured on the spot!'
  } else {
    const extra = turfLanding(state, stone, card)
    const captured = turfCapture(state, foe, hasKeyword(stone, 'pierce'))
    // Suicide is illegal: every group of yours must keep a liberty.
    if (
      turfGroups(state, side).some(
        (g) => !turfLiberties(state, g).length && !warded(state, g),
      )
    )
      return false
    // Ko (as a small superko): never recreate a recent position.
    const hash = turfHash(state)
    if (!hasKeyword(stone, 'ambush') && state.history.includes(hash))
      return false
    const last = state.history[state.history.length - 1]
    state.history = [
      ...state.history,
      ...(last === before ? [] : [before]),
      hash,
    ].slice(-8)
    if (captured) {
      if (hasKeyword(stone, 'leech'))
        if (side === 'player')
          state.mana = Math.min(MANA_CAP, state.mana + captured)
        else state.enemyMana = Math.min(MANA_CAP, state.enemyMana + captured)
      if (hasKeyword(stone, 'collect'))
        collectDebt(state, foe, Math.min(3, captured))
    }
    if (
      card.kind !== 'creature' &&
      card.effect &&
      WARDING.includes(card.effect)
    ) {
      const until = state.round + turfDuration(card, 0)
      const libs = new Set<string>()
      for (const s of turfGroup(state, stone)) {
        s.wardedUntil = Math.max(s.wardedUntil ?? 0, until)
        for (const n of neighbors(state, s.x, s.y)) libs.add(n.x + ':' + n.y)
      }
      turfFx(state, 'ward', stone, side)
      // A ward washes the slime off its group's liberties.
      for (const p of state.puddles)
        if (libs.has(p.x + ':' + p.y)) turfFx(state, 'wash', p, side)
      state.puddles = state.puddles.filter((p) => !libs.has(p.x + ':' + p.y))
    }
    if (wiring) {
      const trap: Trap = { x, y, side, damage: 0 }
      if (card.roots) trap.roots = true
      if (card.debt) trap.debt = card.debt
      state.traps.push(trap)
    }
    line =
      (wiring && side === 'enemy'
        ? 'A concealed enemy stone'
        : (side === 'enemy' ? 'Enemy ' : '') + card.name) +
      ' lands on ' +
      String.fromCharCode(65 + x) +
      (state.height - y) +
      (wiring && side === 'player' ? ', wired with a tripwire' : '') +
      extra +
      (captured
        ? ' · captures ' + captured + (captured === 1 ? ' stone' : ' stones')
        : '') +
      '.'
  }
  spend(state, side, card.cost)
  parityBook(state, side, card)
  state.hands[side] = state.hands[side].filter((id) => id !== cardId)
  state.discards[side].push(cardId)
  state.playedThisRound[side].push(cardId)
  state.stats.plays[side][card.kind]++
  message(state, line)
  return true
}

/** A token's own effect as it lands, before captures resolve. */
function turfLanding(state: MatchState, stone: Fighter, card: Card): string {
  return turfPounce(state, stone) + turfEffect(state, stone, card)
}

/**
 * AMBUSH (Silas, 2026-11-04: "keep improving parity"): the stone pounces on a
 * lone enemy stone beside it on the board's edge that it leaves in atari.
 */
function turfPounce(state: MatchState, stone: Fighter): string {
  if (!hasKeyword(stone, 'ambush')) return ''
  const prey = neighbors(state, stone.x, stone.y)
    .map((n) => unitAt(state, n.x, n.y))
    .filter(
      (u): u is Fighter =>
        !!u &&
        u.side !== stone.side &&
        onEdge(state, u) &&
        turfGroup(state, u).length === 1 &&
        !warded(state, [u]) &&
        turfLiberties(state, [u]).length === 1,
    )
  if (!prey.length) return ''
  const ids = new Set(prey.map((u) => u.id))
  state.units = state.units.filter((u) => !ids.has(u.id))
  for (const u of prey) turfFx(state, 'pounce', u, stone.side, stone)
  state.prisoners[stone.side] += prey.length
  state.stats.knockouts[other(stone.side)] += prey.length
  return ' and pounces on ' + prey.map(publicName).join(' and ')
}

function turfEffect(state: MatchState, stone: Fighter, card: Card): string {
  const foe = other(stone.side)
  const beside = (s: Fighter) =>
    neighbors(state, s.x, s.y)
      .map((n) => unitAt(state, n.x, n.y))
      .filter((u): u is Fighter => !!u && u.side === foe)
  if (hasKeyword(stone, 'snare'))
    for (const enemy of beside(stone))
      for (const s of turfGroup(state, enemy)) s.wardedUntil = 0
  if (hasKeyword(stone, 'bulldoze')) {
    const stuck = (e: Fighter) => {
      const to = { x: 2 * e.x - stone.x, y: 2 * e.y - stone.y }
      return (
        to.x < 0 ||
        to.y < 0 ||
        to.x >= state.width ||
        to.y >= state.height ||
        turfBlocked(state, to.x, to.y)
      )
    }
    // A lone stone with nowhere to go is crushed (Silas, 2026-11-04). Under
    // PARITY every Ironjaw card is free, so the crush needs the edge behind
    // the stone or a stone already on its last liberty.
    const crushableUnderParity = (
      s: MatchState,
      by: Fighter,
      e: Fighter,
    ): boolean => {
      const to = { x: 2 * e.x - by.x, y: 2 * e.y - by.y }
      const offBoard =
        to.x < 0 || to.y < 0 || to.x >= s.width || to.y >= s.height
      return offBoard || turfLiberties(s, [e]).length <= 1
    }
    const crushed = beside(stone)
      .filter(
        (e) =>
          stuck(e) &&
          turfGroup(state, e).length === 1 &&
          !warded(state, [e]) &&
          (!parityOn(state) || crushableUnderParity(state, stone, e)),
      )
      .sort((a, b) => a.id - b.id)[0]
    if (crushed) {
      state.units = state.units.filter((u) => u.id !== crushed.id)
      turfFx(state, 'crush', crushed, stone.side, stone)
      state.prisoners[stone.side]++
      state.stats.knockouts[foe]++
      state.stats.shoves++
      return ' and crushes ' + publicName(crushed)
    }
    const target = beside(stone)
      .filter((e) => !stuck(e))
      .sort(
        (a, b) =>
          turfLiberties(state, turfGroup(state, a)).length -
            turfLiberties(state, turfGroup(state, b)).length || a.id - b.id,
      )[0]
    if (target) {
      const from = { x: target.x, y: target.y }
      target.x = 2 * target.x - stone.x
      target.y = 2 * target.y - stone.y
      state.stats.shoves++
      turfFx(state, 'shove', target, stone.side, from)
      return ' and shoves ' + publicName(target)
    }
  }
  if (card.kind === 'creature') return ''
  if (turfSlimes(card, parityOn(state))) {
    // Slime slides off a warded group.
    const groups = beside(stone)
      .map((e) => turfGroup(state, e))
      .filter((g) => !warded(state, g))
      .sort(
        (a, b) =>
          turfLiberties(state, a).length - turfLiberties(state, b).length ||
          a[0]!.id - b[0]!.id,
      )
    const target = groups[0]
    if (!target) return ''
    const own = (p: Point) =>
      neighbors(state, p.x, p.y).filter(
        (n) => unitAt(state, n.x, n.y)?.side === stone.side,
      ).length
    // Weaker slime (Silas, 2026-11-03: "make slime weaker"): one liberty a
    // spell, and never a group's last one, so slime threatens but a stone
    // has to make the capture.
    const open = turfLiberties(state, target)
    const spots = open
      .sort((a, b) => own(a) - own(b) || a.y - b.y || a.x - b.x)
      .slice(0, Math.min(1, open.length - 1))
    const turns = turfDuration(
      card,
      seededHash(state.seed, state.round, stone.id),
    )
    for (const p of spots) {
      state.puddles.push({ x: p.x, y: p.y, until: state.round + turns })
      turfFx(state, 'slime', p, stone.side)
    }
    return spots.length ? ' and slimes ' + spots.length + ' liberty' : ''
  }
  if (card.effect === 'debt') {
    addDebt(state, foe, card.debt ?? 1)
    return ' and squeezes ' + (card.debt ?? 1) + ' mana of debt'
  }
  if (card.effect === 'boost') {
    const libs = new Set<string>()
    for (const s of turfGroup(state, stone))
      for (const n of neighbors(state, s.x, s.y)) libs.add(n.x + ':' + n.y)
    const before = state.puddles.length
    for (const p of state.puddles)
      if (libs.has(p.x + ':' + p.y)) turfFx(state, 'wash', p, stone.side)
    state.puddles = state.puddles.filter((p) => !libs.has(p.x + ':' + p.y))
    return before > state.puddles.length ? ' and scrubs the slime away' : ''
  }
  if (card.effect === 'scan') {
    const before = state.traps.length
    state.traps = state.traps.filter(
      (t) =>
        t.side === stone.side ||
        Math.abs(t.x - stone.x) + Math.abs(t.y - stone.y) > 2,
    )
    return before > state.traps.length ? ' and disarms a trap' : ''
  }
  if (card.effect === 'grant') {
    const fresh = (card.grants ?? []).filter((k) => !hasKeyword(stone, k))
    stone.keywords = [...(stone.keywords ?? []), ...fresh]
  }
  return ''
}

/** TURF round: the CPU answers, two passes end it, slime dries, hands refill. */
function advanceTurf(next: MatchState): MatchState {
  const playerPassed = next.playedThisRound.player.length === 0
  runCpu(next, 'enemy', (a) =>
    a.t === 'deploy' ? applyDeploy(next, 'enemy', a.card, a.x, a.y) : false,
  )
  const enemyPassed = next.playedThisRound.enemy.length === 0
  if (playerPassed) message(next, 'You pass.')
  if (enemyPassed) message(next, 'The enemy passes.')
  if ((playerPassed && enemyPassed) || next.round >= next.maxRounds) {
    finishTurf(next)
    return next
  }
  next.round++
  next.puddles = next.puddles.filter((p) => p.until >= next.round)
  for (const side of ['player', 'enemy'] as Side[]) {
    const paid = Math.min(TURF_MANA_GAIN, next.debt[side])
    const gain = TURF_MANA_GAIN - paid
    if (side === 'player') next.mana = Math.min(MANA_CAP, next.mana + gain)
    else next.enemyMana = Math.min(MANA_CAP, next.enemyMana + gain)
    next.debt[side] -= paid
  }
  chooseCpuDiscards(next)
  drawHand(next, 'player')
  drawHand(next, 'enemy')
  message(next, 'Round ' + next.round + ' · ' + next.mana + ' mana.')
  return next
}

function finishTurf(state: MatchState): void {
  const { score } = turfTerritory(state)
  const a = score.player
  const b = score.enemy
  finish(state, a === b ? 'draw' : a > b ? 'player' : 'enemy', 'territory')
  message(
    state,
    'The turf is counted: you ' +
      a +
      ', enemy ' +
      b +
      ' (with ' +
      TURF_KOMI +
      ' komi). ' +
      (a > b
        ? 'YOU HOLD THE STREETS.'
        : a < b
          ? 'THE ENEMY HOLDS THE STREETS.'
          : 'A DEAD HEAT.'),
  )
}

// ---------------------------------------------------------------------------
// PARITY (Silas, 2026-11-03): "each turn you play one card. That's it. A card
// can have an effect to nullify the next x plays, or not register as a play
// (faction bonus) but in general, let's test a system where every card is
// theoretically as good as every other card." A lab variant: no mana, one
// play a turn, every card normalized to one power budget, mana debt becomes
// JAM (the other crew's next plays fizzle), and each crew has one card kind
// that does not use up its play.
// ---------------------------------------------------------------------------

/** Every creature's stats, keywords, reach and speed add up to this. */
export const PARITY_WORTH = 11
/**
 * Most plays a side can have jammed at once. A jam card spends your play to
 * cancel one of theirs: one for one, so JAM never stacks past a single play.
 */
export const JAM_CAP = 1
/** PARITY: a buff is a whole play, so it also toughens its target this much. */
export const PARITY_BUFF_HP = 2
/** Each crew's faction bonus: this kind of card does not use up the turn's play. */
export const PARITY_FREE_KIND: Record<TeamId, CardKind> = {
  catgirls: 'equipment',
  bloodfairies: 'trap',
  ironjaw: 'equipment',
  riot: 'trap',
  undertow: 'trap',
  exchange: 'equipment',
}
const PARITY_KEYWORD_WORTH: Record<Keyword, number> = {
  ambush: 1.5,
  regen: 1.5,
  swarm: 1,
  leech: 1,
  bulldoze: 1,
  volatile: 0.5,
  pierce: 1,
  snare: 1,
  collect: 1,
}

/** What a creature is worth beyond its hp, attack and armor. */
function parityExtras(card: Card): number {
  return (
    (card.keywords ?? []).reduce((sum, k) => sum + PARITY_KEYWORD_WORTH[k], 0) +
    (cardAttackRange(card) >= 2 ? 2 : 0) +
    0.5 * (card.ap || 1)
  )
}

/**
 * Crew calibration (Silas, 2026-11-03: "do it", the crew-balance pass). The
 * keyword price list cannot see a crew's synergies, so each crew's creatures
 * get a measured budget offset per format that brings every crew to an even
 * match in CPU round-robins (utils/scripts/tuneSlimeCityParityCrews.ts):
 * BLOODRUSH and TURF play differently enough to need their own.
 */
export type ParityMode = Exclude<ModeId, 'gridiron'>
export const PARITY_CREW_EDGE: Record<ParityMode, Record<TeamId, number>> = {
  // Re-tuned 2026-11-04 with dithered rounding, picked on 48 held-out seeds
  // (1,440 games): Blackout spread 0.079, Bloodrush 0.037.
  blackout: {
    catgirls: -0.75,
    bloodfairies: 1.5,
    ironjaw: -1.625,
    riot: 0.5,
    undertow: 1.375,
    exchange: -0.625,
  },
  bloodrush: {
    catgirls: -0.75,
    bloodfairies: 1.375,
    ironjaw: -2,
    riot: 0.625,
    undertow: 1.5,
    exchange: -1.25,
  },
  // TURF never fights with stats (a stone is a stone), so a creature budget
  // cannot move its crews; its balance needs a Go lever, not this one.
  turf: {
    catgirls: 0,
    bloodfairies: 0,
    ironjaw: 0,
    riot: 0,
    undertow: 0,
    exchange: 0,
  },
}

/** The total a creature is normalized to: the shared budget plus its crew's edge. */
export function parityBudget(
  card: Card,
  mode: ParityMode = 'blackout',
): number {
  return (
    PARITY_WORTH +
    (card.team === 'mercenary' ? 0 : PARITY_CREW_EDGE[mode][card.team])
  )
}

/** A creature's total PARITY worth: stats, keywords, reach and speed. */
export function parityWorth(card: Card): number {
  return (
    (card.hp || 2) +
    2 * (card.attack || 1) +
    2 * (card.armor || 0) +
    parityExtras(card)
  )
}

/** A card's fixed rounding offset in [0, 1), from its id. */
export function parityDither(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++)
    h = Math.imul(h ^ id.charCodeAt(i), 16777619)
  return ((h >>> 0) % 1000) / 1000
}

/** The card as PARITY plays it: free, and as strong as every other card. */
export function parityCard(card: Card, mode: ParityMode = 'blackout'): Card {
  if (card.kind === 'creature') {
    const budget = Math.max(4, parityBudget(card, mode) - parityExtras(card))
    const hp = card.hp || 2
    const attack = card.attack || 1
    const armor = card.armor || 0
    const scale = budget / (hp + 2 * attack + 2 * armor)
    let newAttack = Math.max(1, Math.round(attack * scale))
    let newArmor = Math.round(armor * scale)
    while (budget - 2 * newAttack - 2 * newArmor < 1) {
      if (newArmor > 0) newArmor--
      else if (newAttack > 1) newAttack--
      else break
    }
    // Dithered rounding: each card rounds by its own fixed offset, so a crew's
    // average body tracks a fractional budget instead of jumping a whole
    // point at once (the rounding cliff that stalled crew calibration).
    const newHp = Math.max(
      1,
      Math.floor(budget - 2 * newAttack - 2 * newArmor + parityDither(card.id)),
    )
    return {
      ...card,
      cost: 0,
      hp: newHp,
      attack: newAttack,
      armor: newArmor,
    }
  }
  const jam =
    card.debt || card.effect === 'debt'
      ? Math.max(1, Math.min(JAM_CAP, card.debt ?? 1))
      : undefined
  // A jam card spends your play to cancel one of theirs; that is its whole
  // value, so in PARITY it deals no damage on top.
  const power =
    jam !== undefined
      ? 0
      : card.effect === 'blast'
        ? 1
        : card.effect === 'zap' ||
            card.effect === 'chaos' ||
            card.effect === 'heal' ||
            card.kind === 'trap'
          ? 2
          : card.power
  return {
    ...card,
    cost: 0,
    ...(power === undefined ? {} : { power }),
    ...(jam === undefined ? {} : { debt: jam }),
  }
}

export function parityOn(state: {
  mode: ModeId
  rules?: Partial<RuleVariants>
}): boolean {
  return !!state.rules?.parity && dealsHands(state)
}

/** The card as this match plays it. */
export function playedCard(state: MatchState, card: Card): Card {
  if (parityOn(state)) return parityCard(card, state.mode as ParityMode)
  return state.mode === 'bloodrush' ? rushCard(card) : card
}

/**
 * BLOODRUSH crew calibration (t-025, 2026-11-05 PT). The timed lane plays so
 * differently from BLACKOUT that the founder stats tuned for BLACKOUT (t-021)
 * left it skewed (Catgirls 75%, Riot 27% on held-out seeds). Card stats cannot
 * move without undoing that pass, so each crew's own creatures get a
 * BLOODRUSH-only HP offset, shown on the card face like PARITY's budgets.
 * Mercenaries are unchanged. Tuned on held-out seeds; see the faction-balance
 * test for the measured spread.
 */
export const BLOODRUSH_CREW_HP: Record<TeamId, number> = {
  // Two 40-seed held-out sets (2,400 games each): spread 0.191 -> 0.064 and
  // 0.169 -> 0.068, every crew 40-60%. On the founder decks this dithers to
  // Chimera 5 -> 4 HP, Kaboom and Bomber 4 -> 5, Repo 2 -> 3.
  catgirls: -0.25,
  bloodfairies: 0,
  ironjaw: 0,
  riot: 0.25,
  undertow: 0,
  exchange: 0.25,
}

/**
 * A whole HP is too blunt for the lane (one point swung Catgirls 75% -> 15%),
 * so offsets are fractional and dithered: an offset of 0.5 gives a fixed half
 * of the crew's creature cards +1 HP, chosen by a hash of the card id.
 */
function rushCard(card: Card): Card {
  if (card.kind !== 'creature' || card.team === 'mercenary') return card
  const offset = BLOODRUSH_CREW_HP[card.team as TeamId] ?? 0
  if (!offset) return card
  let hash = 2166136261
  for (let i = 0; i < card.id.length; i++)
    hash = Math.imul(hash ^ card.id.charCodeAt(i), 16777619)
  const dither = (hash >>> 0) / 4294967296
  const shift = Math.floor(offset + dither)
  return shift ? { ...card, hp: Math.max(1, (card.hp || 2) + shift) } : card
}

/** PARITY: this card would not use up its side's play this turn. */
export function parityFree(state: MatchState, side: Side, card: Card): boolean {
  return (
    parityOn(state) &&
    // TURF is one token a turn, full stop: a free second stone is a double move.
    state.mode !== 'turf' &&
    state.freePlays[side] < 1 &&
    PARITY_FREE_KIND[teamOf(state, side)] === card.kind
  )
}

/** PARITY: may this side still play this card this turn? */
function parityMayPlay(state: MatchState, side: Side, card: Card): boolean {
  const used = state.playedThisRound[side].length - state.freePlays[side]
  return used < 1 || parityFree(state, side, card)
}

/** Book a PARITY play: the turn's first free-kind card never uses up the play. */
function parityBook(state: MatchState, side: Side, card: Card): void {
  if (parityFree(state, side, card)) state.freePlays[side]++
}

/** A jammed side's play fizzles: the card is spent and nothing happens. */
function parityJam(state: MatchState, side: Side, card: Card): boolean {
  if (!parityOn(state) || state.jammed[side] < 1) return false
  state.jammed[side]--
  parityBook(state, side, card)
  state.hands[side] = state.hands[side].filter((id) => id !== card.id)
  state.discards[side].push(card.id)
  state.playedThisRound[side].push(card.id)
  message(
    state,
    (side === 'enemy' ? 'Enemy ' : 'Your ') +
      card.name +
      ' fizzles: JAMMED' +
      (state.jammed[side] ? ' (' + state.jammed[side] + ' more)' : '') +
      '.',
  )
  return true
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
    else if (c.t === 'discard') state = discardAs(state, c.side, c.card)
    else if (c.t === 'deploy') state = deployAs(state, c.side, c.card, c.x, c.y)
    else if (c.t === 'move') state = moveAs(state, c.side, c.id, c.x, c.y)
    else if (c.t === 'stance') state = stanceAs(state, c.side, c.id, c.stance)
    else state = revealAs(state, c.side, c.id)
  }
  return state
}
