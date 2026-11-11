// CLASH is Slime City's canonical match rules. Older arena formats live in Legacy.
// Seeded, pure commands: client, CPU and replay all use the same transition rules.
// Silas, 2026-11-06 PT: "Attacks should have animation and happen lane to lane
// automatically after the second play." Once a side's card plays are spent, its
// fighters strike straight across their own alley, left to right, one strike
// command per alley so the board can animate each blow.
import { alleyDeck } from './alleys'
import { clashTwistText } from './clashTwists'
import {
  clashEvolutionStage,
  clashEvolutionStats,
  clashEvolutionText,
  clashEvolutionChoice,
  clashEvolutionCpuPick,
  type EvoPick,
} from './clashEvolutions'
import type {
  EvoAction,
  EvoCondition,
  EvoScope,
  EvoStage,
  EvoStatic,
  EvoTrigger,
} from './evolutions/dsl'
import type { AllianceDeck } from './alliance'
import { factionPower } from './factionPowers'
import {
  cardById,
  type Card,
  type Keyword,
  type Side,
  type TeamId,
} from './prototypes'

export const CLASH_LANES = 5
export const CLASH_BOSS_HP = 40
/**
 * The crew that moves second starts its boss with extra life (Hearthstone's
 * coin). CPU sweeps, 2026-11-07: at boss 20, +0 let the first seat win
 * ~63% and +5 ~51.5%. Boss 40 (Silas: "Hit points should be higher I'm
 * thinking 40") with card leveling and +8 held it near 53.5%. Once the first
 * player opens with a single card play (Silas, 2026-11-07 PT), that handicap
 * alone evens the seats (first seat ~48%), so both bosses start equal.
 */
export const CLASH_SECOND_SEAT_BONUS = 0
/** A side's boss life cap this match (bout terms can move it). */
export function clashBossCap(s: ClashState, side: Side): number {
  return s.bossMax?.[side] ?? clashBossMax(side)
}
export function clashBossMax(side: Side): number {
  return CLASH_BOSS_HP + (side === 'enemy' ? CLASH_SECOND_SEAT_BONUS : 0)
}
/** Bout terms may move a boss's life only within this band. */
export const CLASH_BOSS_RANGE: [number, number] = [20, 60]
export const CLASH_PLAYS = 2
/**
 * Silas, 2026-11-07 PT: "first player should only get one card play, not two."
 * The crew that opens the match (always 'player') gets one play on round 1.
 */
export function clashPlayLimit(s: ClashState, side: Side): number {
  if (s.round !== 1 || side !== 'player') return CLASH_PLAYS
  // Opening-hand guarantee (slime-city/t-028): still ONE card, but when the
  // opener holds no legal one-slot play its one card may be a power card, so
  // an all-heavy opening hand is never a forced pass. Only widens legality,
  // so every saved transcript replays unchanged.
  if (s.plays.player >= CLASH_PLAYS) return CLASH_PLAYS
  return s.plays.player === 0 && !openerHasOneSlotPlay(s) ? CLASH_PLAYS : 1
}
function openerHasOneSlotPlay(s: ClashState): boolean {
  return s.hands.player.some((id) => {
    const card = cardById(id)
    return (
      clashEffectivePlayCost(s, 'player', card) <= 1 &&
      Array.from({ length: CLASH_LANES }, (_, lane) => lane).some((lane) =>
        placementLegal(s, 'player', card, lane),
      )
    )
  })
}
export const CLASH_DECK_SIZE = 20
export const CLASH_HAND_SIZE = 5
export const CLASH_ROUND_LIMIT = 24
/**
 * Solforge-style leveling (Silas, 2026-11-07 PT): "cards that evolve as you
 * play them. So something might be weak first round, but have a great round
 * three." Every card starts a match at level 1; each time a crew plays it,
 * that crew's copy comes back one level stronger, up to level 3.
 */
export const CLASH_MAX_LEVEL = 3

export type ClashPhase = 'play' | 'attack'
export interface ClashUnit {
  uid: number
  cardId: string
  side: Side
  lane: number
  hp: number
  maxHp: number
  attack: number
  armor: number
  keywords: Keyword[]
  surge: number
  rooted: boolean
  ambushUsed: boolean
  attacked: boolean
  /** Landed this turn. */
  fresh: boolean
  gear: string[]
  /** Authored equipment levels are recorded on the wearer, not the catalog. */
  gearLevels?: Record<string, number>
  /** One triggered near-death reversal from Ninth Life Collar. */
  ninthLife?: 2 | 3
  /** The next stun/root is ignored, then this ward is consumed. */
  snareWard?: boolean
  /** Clockwork Grandmother saves one adjacent fighter per copy, per match. */
  grandmaSaveUsed?: boolean
  level: number
  /** A battlefield-only summon, not another card in the deck. */
  token?: boolean
  /** ALLIANCE Union Wall: extra armor until this side's next turn. */
  guard?: number
  /** Data evolutions: once-per-fighter abilities already spent. */
  evoUsed?: string[]
  /** Survives the next lethal hit at 1 life (Nine Lives, No Refunds). */
  /** Survives the next lethal hit at 1 life; the card that granted it. */
  lastChance?: string
  /** A choose-one level three played as its alternative stage. */
  evoChoice?: 1
}
export interface ClashTrap {
  side: Side
  lane: number
  cardId: string
  level: number
  /** Extra network segment, not a second collectible card. */
  token?: boolean
}
export interface ClashStrike {
  side: Side
  lane: number
  attacker: string
  target: 'unit' | 'boss'
  defender?: string
  dealt: number
  returned: number
  attackerFell: boolean
  defenderFell: boolean
  /** Trap card that sprang on an unblocked strike. */
  trap?: string
}
export interface ClashLog {
  round: number
  text: string
  lane?: number
  kind: 'play' | 'clash' | 'death' | 'boss' | 'turn' | 'trap'
}
/** One replayable signature moment from a card, anchored to its command. */
export interface ClashEvolutionMoment {
  cardId: string
  side: Side
  lane: number
  detail: string
  effect: 'summon' | 'heal' | 'blast' | 'control' | 'strike'
  commandIndex: number
}
export type ClashCommand =
  /** `choice: 1` picks a choose-one level three's alternative stage. */
  | { t: 'play'; side: Side; card: string; lane: number; choice?: 1 }
  | { t: 'pass'; side: Side }
  | { t: 'strike'; side: Side }
  | { t: 'end'; side: Side }
  /**
   * A one-time faction power (lane ignored if untargeted). `team` names an
   * ALLIANCE ally's power; omitted, it is the side's own crew (the general).
   */
  | { t: 'power'; side: Side; lane: number; team?: TeamId }

export type ClashFormat = 'standard' | 'alliance'
export interface ClashOptions {
  /** ALLIANCE: each side's 20-card two-crew deck; `teams` become the generals. */
  alliance?: Record<Side, AllianceDeck>
  /** SOLO CLASH: a side's own 20-card deck instead of its canonical deck. */
  decks?: Partial<Record<Side, string[]>>
  /** City and Story terms: each side's starting (and maximum) boss life. */
  bosses?: Partial<Record<Side, number>>
}

export interface ClashState {
  seed: number
  rng: number
  teams: Record<Side, TeamId>
  round: number
  active: Side
  phase: ClashPhase
  /** Number of card-play slots used during this side's current turn. */
  plays: Record<Side, number>
  /** Optional for replay compatibility; at most one conditional free play per turn. */
  freePlays?: Record<Side, number>
  boss: Record<Side, number>
  decks: Record<Side, string[]>
  hands: Record<Side, string[]>
  discards: Record<Side, string[]>
  units: ClashUnit[]
  traps: ClashTrap[]
  log: ClashLog[]
  /** Next alley the active crew's automatic attack sweep resolves. */
  cursor: number
  /** Most recent resolved alley strike, for the board's hit animation. */
  strike: ClashStrike | null
  victor: Side | 'draw' | null
  nextUid: number
  commands: ClashCommand[]
  /** Each crew's card levels this match; a missing id is level 1. */
  levels: Record<Side, Record<string, number>>
  /** Knockout bonuses persist independently of the three play levels. */
  deathMarks: Record<Side, Record<string, number>>
  /** A real knockout ledger: unplayed discarded cards do not count as dead. */
  fallen?: Record<Side, string[]>
  /** Evolution draws earned off-turn (a trap, a strike, a last breath),
   * added to that side's next turn draw so the hand discard never eats them. */
  pendingDraw?: Record<Side, number>
  /** Last named ability activation, not a second random effects engine. */
  lastEvolution?: ClashEvolutionMoment
  /** Omitted on older saves and replays: standard Clash. */
  format?: ClashFormat
  /** ALLIANCE: each side's second crew, or null. */
  allies?: Record<Side, TeamId | null>
  /** The faction powers each side has fired (each once per match). */
  powersUsed?: Record<Side, TeamId[]>
  /** Bout terms: boss life caps; omitted means clashBossMax. */
  bossMax?: Record<Side, number>
}
export interface ClashCardBalance {
  /** All 300 catalog cards get a separate, Clash-only balance profile. */
  plays: 1 | 2
  level: number
  attack: number
  hp: number
  armor: number
  power: number
  /** Permanent power from sharpen and power gear. */
  bonus: number
}

const opponent = (s: Side): Side => (s === 'player' ? 'enemy' : 'player')
const inside = (lane: number): boolean =>
  Number.isInteger(lane) && lane >= 0 && lane < CLASH_LANES
const clamp = (n: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, n))
const unitAt = (
  state: ClashState,
  side: Side,
  lane: number,
): ClashUnit | undefined =>
  state.units.find((u) => u.side === side && u.lane === lane)
export const clashUnitAt = unitAt
const has = (u: ClashUnit, k: Keyword): boolean => u.keywords.includes(k)
const nameOf = (u: ClashUnit): string => cardById(u.cardId).name
const note = (
  s: ClashState,
  text: string,
  kind: ClashLog['kind'],
  lane?: number,
): void => {
  s.log.push({ round: s.round, text, kind, lane })
  if (s.log.length > 75) s.log.shift()
}
const evolutionMoment = (
  s: ClashState,
  cardId: string,
  side: Side,
  lane: number,
  detail: string,
  effect: ClashEvolutionMoment['effect'],
): void => {
  s.lastEvolution = {
    cardId,
    side,
    lane,
    detail,
    effect,
    commandIndex: s.commands.length + 1,
  }
  note(s, detail, 'clash', lane)
}

/**
 * A card's old mana cost becomes a balance tier, NOT a second resource.
 * Signature cards and 4+-tier cards are power plays, consuming both slots.
 */
export function clashPlayCost(card: Card): 1 | 2 {
  // Encore or Die grants one vulnerable singer LEECH on its first play.
  // It must be a usable 1-slot support choice, not a two-slot blank upgrade
  // tax. This override is CLASH-only; legacy mana cost stays unchanged.
  if (card.id === 's3-bloodfairies-encore') return 1
  return card.signature || card.cost >= 4 ? 2 : 1
}
/**
 * Clash budgets (2026-11-07 rebalance). The grid-era stats were tuned around
 * movement, range and action points; in five fixed alleys a fighter is only
 * its strike, its toughness and its traits. Every fighter spends one stat
 * budget per play tier and level: power costs 2, armor CLASH_ARMOR_COST, each trait its listed price,
 * and the remainder becomes life. The grid card's attack still sets the
 * character's shape, so bruisers, glass cannons and walls stay distinct.
 * Tuned with `npm run balance:slime-city-clash` CPU sweeps.
 */
/**
 * Stat budget by play tier, then by level 1-3. Silas, 2026-11-07 PT: "there
 * needs to be real ramping of power between levels 1-3. we want it to be
 * appealing to upgrade in most cases." Level 3 is roughly double level 1.
 */
export const CLASH_FOLLOWER_BUDGET: Record<1 | 2, [number, number, number]> = {
  1: [11, 16, 22],
  2: [21, 29, 38],
}
const LIFE_CAP: Record<1 | 2, [number, number, number]> = {
  1: [8, 12, 16],
  2: [12, 17, 22],
}
/** Spell, trap and heal power added at each level over level 1. */
const POWER_RAMP: [number, number, number] = [0, 1, 3]
export const CLASH_TRAIT_COST: Record<Keyword, number> = {
  ambush: 1,
  regen: 1,
  swarm: 2,
  leech: 1.5,
  // Bulldoze only matters on overkill, and its slow walls wait out summoning
  // sickness, so it pays back a point of budget.
  bulldoze: -1,
  volatile: 0,
  pierce: 1.5,
  snare: 2,
  collect: 0.5,
}
/**
 * Crew calibration (2026-11-07 CPU sweeps): Undertow's snare-and-wait crew sat
 * ~5 points under even once fighters lost round-end healing and gained
 * summoning sickness; half a point of fighter budget closes it.
 */
/**
 * Armor price per point (slime-city/t-047, 2026-11-09 PT). It was 2.5, which
 * the life rounding turned into 2 life per point, yet one point of block is
 * worth about one life in five fixed alleys: most followers take one or two
 * hits before they fall, and pierce, zaps through gaps and volatile bursts
 * already bite through it. The overprice is why the plated Ironjaw lizards sat
 * at 35% in CLASH while Riot (64%) and the Bloodfairies (60%) fed on them.
 * 1.5 rounds to one life per point. Held-out 3,000-game CPU sweeps: crew
 * spread 30 points -> 6-7, every crew 45-54%.
 */
export const CLASH_ARMOR_COST = 1.5
/**
 * Volatile's base 1-damage death burst is free (it trades into armor and
 * empty-lane boss chip, and Riot's crew identity rests on it). A bigger
 * printed burst is not: each point of burst above 1 costs this much budget.
 * Big Top Detonator (80% when played) and Flaming High Diver pay one life for their
 * 2-damage blasts (slime-city/t-047).
 */
export const CLASH_BURST_COST = 1
export const CLASH_CREW_BUDGET: Partial<Record<TeamId, number>> = {
  undertow: 0.5,
}
export const CLASH_TRAIT_TEXT: Record<Keyword, string> = {
  ambush: 'Ambush: attacks immediately; +1 first strike.',
  regen: 'Regen: heals 1 after each round.',
  swarm: 'Swarm: +1 power next to an ally.',
  leech: 'Leech: heals 1 when it hits.',
  bulldoze: 'Bulldoze: overkill hits the boss.',
  volatile: 'Volatile: explodes on defeat.',
  pierce: 'Pierce: ignores 1 armor.',
  snare: 'Snare: struck rivals skip a strike.',
  collect: 'Collect: gains +1 power on a kill.',
}
/** No changes to CARDS or the legacy battle engines. */
export function clashBalance(card: Card, level = 1): ClashCardBalance {
  const plays = clashPlayCost(card)
  const heavy = plays === 2
  const lv = clamp(Math.round(level), 1, CLASH_MAX_LEVEL)
  const tier = (lv - 1) as 0 | 1 | 2
  const ramp = POWER_RAMP[tier]
  const bonus = (heavy ? 2 : 1) + (lv - 1)
  if (card.kind !== 'creature')
    return {
      plays,
      level: lv,
      attack: 0,
      hp: 0,
      armor: 0,
      bonus,
      // Traps spend a play on nothing visible, so they hit harder than zaps.
      power:
        card.kind === 'trap'
          ? clamp(Math.max(1, card.power ?? 2) + 1 + ramp, 2, heavy ? 10 : 8)
          : clamp(Math.max(1, card.power ?? 2) + ramp, 1, heavy ? 9 : 7),
    }
  const armor = clamp(card.armor ?? 0, 0, 1)
  const attack = clamp(
    (card.attack ?? 2) + (heavy ? 2 : 1) + (lv - 1),
    2,
    (heavy ? 6 : 4) + (lv - 1),
  )
  const keywords = card.keywords ?? []
  const traits =
    keywords.reduce((sum, k) => sum + CLASH_TRAIT_COST[k], 0) +
    (keywords.includes('volatile')
      ? (clamp(card.burst ?? 1, 1, 2) - 1) * CLASH_BURST_COST
      : 0)
  const hp = clamp(
    Math.round(
      CLASH_FOLLOWER_BUDGET[plays][tier] +
        (card.team === 'mercenary' ? 0 : (CLASH_CREW_BUDGET[card.team] ?? 0)) -
        attack * 2 -
        armor * CLASH_ARMOR_COST -
        traits,
    ),
    heavy ? 5 : 2,
    LIFE_CAP[plays][tier],
  )
  let evolvedAttack = attack
  let evolvedHp = hp
  if (card.id === 'chimera') {
    if (lv === 1) evolvedAttack = 1
    if (lv === 3) {
      evolvedAttack = Math.min(8, attack + 2)
      evolvedHp = Math.min(22, hp + 3)
    }
  }
  if (card.id === 'juggernaut') {
    if (lv === 1) evolvedAttack = 1
    if (lv === 3) evolvedAttack = Math.min(8, attack + 2)
  }
  if (
    lv === 3 &&
    (card.id === 'calico' ||
      card.id === 'watcher' ||
      card.id === 'merc-roof-dentist')
  )
    evolvedAttack = 0
  // Crafted trajectories (CLASH-EVOLUTION-PLAN.md): a card's curve can bend
  // away from the shared ramp. Late bloomers start low; rare early bloomers
  // shrink at level 3 for a big moment.
  const curve = clashEvolutionStats(card.id, lv)
  if (curve?.attack) evolvedAttack = clamp(evolvedAttack + curve.attack, 0, 12)
  // Crafted life bonuses still respect the tier's life cap (t-047: cheaper
  // armor lifted plated bases, and the bonus must not stack past the cap).
  if (curve?.hp)
    evolvedHp = clamp(evolvedHp + curve.hp, 1, LIFE_CAP[plays][tier])
  return {
    plays,
    level: lv,
    attack: evolvedAttack,
    hp: evolvedHp,
    armor,
    power: 0,
    bonus,
  }
}
export function clashLevel(s: ClashState, side: Side, id: string): number {
  return s.levels?.[side]?.[id] ?? 1
}
/** Hand-card badge: the effect in a few characters. */
export function clashCardBadge(card: Card, level = 1): string {
  const b = clashBalance(card, level)
  if (card.kind === 'creature') return b.attack + ' ⚔ · ' + b.hp + ' ♥'
  if (card.kind === 'trap') return 'TRAP ' + b.power
  switch (card.effect) {
    case 'heal':
      return '+' + b.power + ' ♥'
    case 'armor':
      return (
        '+' +
        (b.level >= 3 ? 2 : 1) +
        ' ARMOR' +
        (b.level > 1 ? ' +' + (b.level - 1) * 2 + ' ♥' : '')
      )
    case 'sharpen':
      return '+' + b.bonus + ' ⚔'
    case 'boost':
      return card.kind === 'equipment'
        ? '+' + b.bonus + ' ⚔'
        : '+' + b.power + ' ⚔ NOW'
    case 'grant':
      return (
        ((card.grants ?? []).join(' ').toUpperCase() || 'GEAR') +
        (b.level > 1 ? ' +' + (b.level - 1) : '')
      )
    case 'scan':
      return b.level > 1 ? 'DISARM +' + (b.level - 1) : 'DISARM'
    case 'root':
      return b.level > 1 ? 'STUN ' + (b.level - 1) : 'STUN'
    case 'chaos':
      return '1–' + b.power + ' DMG'
    case 'blast':
      return b.power + ' DMG +1'
    case 'snare':
    case 'debt':
      return b.power + ' DMG STUN'
    default:
      return b.power + ' DMG'
  }
}
/**
 * Clash rules text: only what makes the card special (Silas, 2026-11-07 PT:
 * "You don't need to say the power and toughness on the card description, nor
 * the stats for rounds two and three"). Stats live on the card's chip; other
 * levels are previewed on demand.
 */
export function clashCardText(card: Card, level = 1, pick?: EvoPick): string {
  const b = clashBalance(card, level)
  // Named spells, traps and gear now evolve their RULES as well as their stats.
  // The active level's promise must match its actual Clash handler.
  const evolvedText = clashTwistText(card.id, level)
  if (card.kind !== 'creature' && evolvedText)
    return isArmorCutterSnare(card)
      ? evolvedText + ' Cuts armor, defuses VOLATILE.'
      : evolvedText
  if (card.kind === 'creature')
    return [
      ...(b.armor ? ['Armor: blocks 1 damage per hit.'] : []),
      ...(card.keywords ?? []).map((k) => CLASH_TRAIT_TEXT[k]),
      clashTwistText(card.id, level),
      clashEvolutionText(card, level, pick),
    ]
      .filter(Boolean)
      .join(' ')
  const evolution = clashEvolutionText(card, level, pick)
  if (evolution) return clashBaseText(card, level) + ' ' + evolution
  return clashBaseText(card, level)
}
/** A spell, trap or gear card's base Clash rules at `level`. */
function clashBaseText(card: Card, level: number): string {
  const b = clashBalance(card, level)
  if (card.kind === 'trap')
    return (
      'Hits the next rival in this alley for ' +
      b.power +
      '.' +
      (card.roots ? ' It misses a strike.' : '') +
      (isArmorCutterSnare(card) ? ' Cuts armor, defuses VOLATILE.' : '')
    )
  switch (card.effect) {
    case 'heal':
      return 'Heal your fighter ' + b.power + '.'
    case 'armor':
      return (
        'Your fighter gains +' +
        (b.level >= 3 ? 2 : 1) +
        ' armor' +
        (b.level > 1 ? ' and heals ' + (b.level - 1) * 2 + '.' : '.')
      )
    case 'sharpen':
      return 'Your fighter gains +' + b.bonus + ' power for good.'
    case 'boost':
      return card.kind === 'equipment'
        ? 'Your fighter gains +' + b.bonus + ' power for good.'
        : 'Your fighter gains +' + b.power + ' power this round.'
    case 'grant':
      return (
        (card.grants ?? []).map((k) => CLASH_TRAIT_TEXT[k] ?? k).join(' ') +
        (b.level > 1 ? ' Also +' + (b.level - 1) + ' power for good.' : '')
      )
    case 'scan':
      return (
        'Disarm a rival trap here' +
        (b.level >= 3
          ? ' and draw two cards.'
          : b.level > 1
            ? ' and draw a card.'
            : '.')
      )
    case 'chaos':
      return 'Deal 1–' + b.power + ' to a rival fighter.'
    case 'root':
      return (
        'Stun a rival fighter: no block now, no strike next turn.' +
        (b.level > 1 ? ' Deals ' + (b.level - 1) + '.' : '')
      )
    case 'snare':
    case 'debt':
      return 'Deal ' + b.power + ' and stun the fighter.'
    case 'blast':
      return 'Deal ' + b.power + ', plus 1 to its neighbors.'
    default:
      return 'Deal ' + b.power + ' to a rival fighter.'
  }
}
export function clashPower(s: ClashState, u: ClashUnit): number {
  const statics = evoStatics(u)
  if (statics.some((r) => r.pacifist)) return 0
  if (
    u.level === 3 &&
    (u.cardId === 'calico' ||
      u.cardId === 'watcher' ||
      u.cardId === 'merc-roof-dentist')
  )
    return 0
  let power = u.attack + u.surge
  if (has(u, 'ambush') && !u.ambushUsed) power++
  if (
    has(u, 'swarm') &&
    s.units.some(
      (v) =>
        v.uid !== u.uid && v.side === u.side && Math.abs(v.lane - u.lane) === 1,
    )
  )
    power++
  if (
    u.cardId === 'frogtrooper' &&
    u.level >= 2 &&
    unitAt(s, opponent(u.side), u.lane)?.rooted
  )
    power++
  for (const ally of s.units.filter(
    (v) => v.side === u.side && v.uid !== u.uid,
  )) {
    if (
      ally.level >= 2 &&
      (ally.cardId === 'queen' || ally.cardId === 'merc-union-owl') &&
      (ally.level === 3 || Math.abs(ally.lane - u.lane) === 1)
    )
      power++
    if (has(u, 'swarm') && ally.gearLevels?.choker === 3 && ally.uid !== u.uid)
      power++
    if (
      ally.cardId === 'mogul' &&
      ally.level >= 2 &&
      has(u, 'collect') &&
      (ally.level === 3 || Math.abs(ally.lane - u.lane) === 1)
    )
      power++
  }
  const beside = s.units.some(
    (v) =>
      v.uid !== u.uid && v.side === u.side && Math.abs(v.lane - u.lane) === 1,
  )
  for (const r of statics) {
    if (r.pack && beside) power += r.pack
    if (r.lone && !beside) power += r.lone
    if (r.bully && unitAt(s, opponent(u.side), u.lane)?.rooted) power += r.bully
  }
  for (const v of s.units) {
    if (v.uid === u.uid) continue
    for (const r of evoStatics(v)) {
      if (v.side === u.side && r.aura)
        if (r.aura.to === 'otherAllies' || Math.abs(v.lane - u.lane) === 1)
          power += r.aura.n
      if (v.side !== u.side && r.hex)
        if (
          r.hex.to === 'laneFoes'
            ? Math.abs(v.lane - u.lane) <= 1
            : v.lane === u.lane
        )
          power -= r.hex.n
    }
  }
  for (const spy of s.units.filter(
    (v) => v.side !== u.side && v.level >= 2 && v.cardId === 'watcher',
  )) {
    if (
      spy.level === 3 ? Math.abs(spy.lane - u.lane) <= 1 : spy.lane === u.lane
    )
      power--
  }
  return Math.max(0, power)
}
function random(state: ClashState): number {
  state.rng = (state.rng + 0x6d2b79f5) >>> 0
  let n = state.rng
  n = Math.imul(n ^ (n >>> 15), n | 1)
  n ^= n + Math.imul(n ^ (n >>> 7), n | 61)
  return ((n ^ (n >>> 14)) >>> 0) / 4294967296
}
function shuffle(s: ClashState, list: string[]): string[] {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random(s) * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}
function draw(s: ClashState, side: Side, extra = 0): void {
  while (s.hands[side].length < CLASH_HAND_SIZE + extra) {
    if (!s.decks[side].length) {
      if (!s.discards[side].length) break
      s.decks[side] = shuffle(s, s.discards[side])
      s.discards[side] = []
    }
    const id = s.decks[side].shift()
    if (!id) break
    s.hands[side].push(id)
  }
}
function discardHand(s: ClashState, side: Side): void {
  s.discards[side].push(...s.hands[side])
  s.hands[side] = []
}
function startTurn(s: ClashState, side: Side): void {
  s.active = side
  s.phase = 'play'
  s.plays[side] = 0
  ;(s.freePlays ??= { player: 0, enemy: 0 })[side] = 0
  s.cursor = 0
  for (const u of s.units.filter((v) => v.side === side)) {
    u.attacked = false
    if (u.guard) u.guard = 0
  }
  // Defensive engines only charge once per own turn. Remove last turn's
  // shields before adding fresh ones; stack is capped to avoid a stalemate.
  for (const guardian of s.units.filter(
    (u) => u.side === side && u.level >= 2,
  )) {
    const friends = s.units.filter((u) => u.side === side)
    const adjacent = friends.filter(
      (u) => Math.abs(u.lane - guardian.lane) === 1,
    )
    let guarded: ClashUnit[] = []
    let shield = 1
    if (guardian.cardId === 'scrapper')
      guarded = guardian.level === 3 ? friends : adjacent
    if (guardian.cardId === 'oracle') {
      guarded = guardian.level === 3 ? [guardian, ...adjacent] : [guardian]
      shield = 2
    }
    if (guardian.cardId === 'merc-fungal-bouncer') {
      guarded = guardian.level === 3 ? adjacent : adjacent.slice(0, 1)
      shield = 2
    }
    if (guardian.cardId === 'merc-clock-grandma') guarded = adjacent
    for (const ally of guarded)
      ally.guard = clamp((ally.guard ?? 0) + shield, 0, 3)
  }
  const owed = s.pendingDraw?.[side] ?? 0
  if (owed) s.pendingDraw![side] = 0
  draw(s, side, owed)
  for (const u of s.units.filter((v) => v.side === side && v.hp > 0))
    unitEvo(s, u, 'turnStart')
  casualties(s)
  checkWinner(s)
  note(
    s,
    (side === 'player' ? 'YOUR TURN' : 'RIVAL TURN') +
      ': two card plays, then every fighter strikes across its alley.',
    'turn',
  )
}
/** A curated neutral guest per crew keeps mercenary synergies in standard Clash. */
export const CLASH_GUESTS: Record<TeamId, string> = {
  catgirls: 'merc-roof-dentist',
  bloodfairies: 'merc-smog-moth',
  ironjaw: 'merc-union-owl',
  riot: 'merc-bribe-rat',
  undertow: 'merc-fungal-bouncer',
  exchange: 'merc-debt-slug',
}
/**
 * The crafted-evolution pilot plays as a full Solo Clash side (Silas,
 * 2026-11-08 PT: "You need a sample of at least 20 from one faction ... to
 * make one side of a match"): the ten Catgirls with hand-built twists plus
 * ten crafted in evolutions/catgirls.ts, so every card in the deck has its
 * own level-two and level-three story. Eleven fighters hold the five alleys
 * (each fighter traded for a special cost ~4 points in CPU sweeps), so the
 * crafted Second Pounce Rig is a deck-builder pick rather than a starter.
 */
export const CLASH_CRAFTED_DECKS: Partial<Record<TeamId, string[]>> = {
  catgirls: [
    'lynx',
    'mau',
    'calico',
    'chimera',
    's3-catgirls-glasswalker',
    's1-roof-phantom',
    'splice-runner',
    's2-catgirls-parapet-ghost-kitten',
    's3-catgirls-escaped-tiger',
    's1-alley-vet',
    'pounce',
    'scentmine',
    'reknit',
    'shredders',
    's3-catgirls-alley-vet',
    's3-catgirls-patent-saboteur',
    'mutual-aid',
    's1-nine-lives',
    's3-catgirls-bicycle-clinic',
    's2-catgirls-backstreet-organ-donor',
  ],
}
/**
 * Fighters first (Silas, 2026-11-10 PT, from the Catgirls playtest: "the game
 * should be built around fighters that do cool stuff"). Each starter trades
 * two of its extra spells, traps or gear for two more of its own fighters, so
 * every crew fields 13 fighters of 20 like the Catgirls crafted deck. Then
 * (2026-11-11, "yes on gear to fighters") a gear card folds into a fighter
 * that already carries its ability: Roadie Megaphone (Swarm), Sparkler Corset
 * (Volatile) and Rubber Drysuit go, and Exchange drops Executive Health
 * Coverage. Ironjaw keeps Spare Pistons: every Ironjaw fighter is already
 * armored, and every fold tried pushed the crew past 58%. Picks are by CPU
 * sweep, keeping each crew near an even win rate.
 */
export const CLASH_FIGHTERS_FIRST: Partial<
  Record<TeamId, { out: string[]; in: string[] }>
> = {
  bloodfairies: {
    out: [
      's3-bloodfairies-tripcord',
      's3-bloodfairies-van-radio',
      's2-bloodfairies-roadie-megaphone',
    ],
    in: [
      's3-bloodfairies-mosh-firefly',
      's3-bloodfairies-pollen-queen',
      's1-riot-choir',
    ],
  },
  ironjaw: {
    out: ['s1-forge-spark', 's3-ironjaw-bonus-plate'],
    in: ['s2-ironjaw-foundry-lion', 's1-scrap-welder'],
  },
  riot: {
    out: ['s2-riot-homemade-bottle-rocket', 'firebreak-parade', 'fusevest'],
    in: [
      's3-riot-alley-prophet',
      's1-blast-radius',
      's2-riot-radioactive-parade-float',
    ],
  },
  undertow: {
    out: [
      's3-undertow-floodgate-clamp',
      's2-undertow-culvert-tollwire',
      'drysuit',
    ],
    in: [
      's1-static-listener',
      's3-undertow-quiet-listener',
      's3-undertow-needle-rain-agent',
    ],
  },
  exchange: {
    out: ['s3-exchange-escrow-snare', 's2-exchange-executive-health-coverage'],
    in: ['audit-fiend', 's3-exchange-mortgage-minotaur'],
  },
}
export function clashDeck(team: TeamId): string[] {
  const crafted = CLASH_CRAFTED_DECKS[team]
  if (crafted) return [...crafted]
  const swap = CLASH_FIGHTERS_FIRST[team]
  const roster = alleyDeck(team)
    .slice(0, 19)
    .map((id) => {
      const at = swap?.out.indexOf(id) ?? -1
      return at < 0 ? id : swap!.in[at]!
    })
  return [...roster, CLASH_GUESTS[team]]
}
/**
 * Twenty unique catalog cards (thirty in ALLIANCE), seeded draws and no
 * retained hand between turns. With `options.alliance` the generals replace
 * `player`/`enemy` as the crews.
 */
export function createClash(
  player: TeamId = 'catgirls',
  enemy: TeamId = 'ironjaw',
  seed = 1,
  options: ClashOptions = {},
): ClashState {
  const alliance = options.alliance
  if (alliance) {
    player = alliance.player.general
    enemy = alliance.enemy.general
  }
  const s: ClashState = {
    seed,
    rng: seed >>> 0,
    teams: { player, enemy },
    round: 1,
    active: 'player',
    phase: 'play',
    plays: { player: 0, enemy: 0 },
    freePlays: { player: 0, enemy: 0 },
    boss: { player: clashBossMax('player'), enemy: clashBossMax('enemy') },
    decks: { player: [], enemy: [] },
    hands: { player: [], enemy: [] },
    discards: { player: [], enemy: [] },
    units: [],
    traps: [],
    log: [],
    cursor: 0,
    strike: null,
    victor: null,
    nextUid: 1,
    commands: [],
    levels: { player: {}, enemy: {} },
    deathMarks: { player: {}, enemy: {} },
    fallen: { player: [], enemy: [] },
    powersUsed: { player: [], enemy: [] },
  }
  if (alliance) {
    s.format = 'alliance'
    s.allies = { player: alliance.player.ally, enemy: alliance.enemy.ally }
  }
  if (options.bosses) {
    const cap = (side: Side) =>
      clamp(
        Math.round(options.bosses?.[side] ?? clashBossMax(side)),
        CLASH_BOSS_RANGE[0],
        CLASH_BOSS_RANGE[1],
      )
    s.bossMax = { player: cap('player'), enemy: cap('enemy') }
    s.boss = { ...s.bossMax }
  }
  s.decks.player = shuffle(
    s,
    alliance?.player.cards ?? options.decks?.player ?? clashDeck(player),
  )
  s.decks.enemy = shuffle(
    s,
    alliance?.enemy.cards ?? options.decks?.enemy ?? clashDeck(enemy),
  )
  startTurn(s, 'player')
  return s
}
function aim(card: Card): 'own' | 'enemy' | 'lane' {
  if (
    card.kind === 'creature' ||
    card.kind === 'trap' ||
    card.effect === 'scan'
  )
    return 'lane'
  if (
    card.kind === 'equipment' ||
    ['heal', 'boost', 'armor', 'sharpen', 'grant'].includes(card.effect ?? '')
  )
    return 'own'
  return 'enemy'
}
/** Reprices only the *play slot*, not a card's stats or card balance tier.
 * No free action after the attack phase has begun, and never more than
 * one free card per side per turn. Old matches without freePlays still load.
 */
export function clashEffectivePlayCost(
  s: ClashState,
  side: Side,
  card: Card,
): 0 | 1 | 2 {
  const level = clashLevel(s, side, card.id)
  const freeIf = clashEvolutionStage(card.id, level)?.freeIf
  if (
    freeIf &&
    (s.freePlays?.[side] ?? 0) < 1 &&
    evoCondition(s, { side, lane: 0, cardId: card.id, level }, freeIf)
  )
    return 0
  return clashPlayCost(card)
}
export function canClashPlay(
  s: ClashState,
  side: Side,
  id: string,
  lane: number,
): boolean {
  if (
    s.victor ||
    s.active !== side ||
    s.phase !== 'play' ||
    !inside(lane) ||
    !s.hands[side].includes(id)
  )
    return false
  const card = cardById(id)
  if (
    card.team !== s.teams[side] &&
    card.team !== 'mercenary' &&
    card.team !== s.allies?.[side]
  )
    return false
  if (
    s.plays[side] + clashEffectivePlayCost(s, side, card) >
    clashPlayLimit(s, side)
  )
    return false
  return placementLegal(s, side, card, lane)
}
/** Crew, slot budget aside: can `card` land in `lane` right now? */
function placementLegal(
  s: ClashState,
  side: Side,
  card: Card,
  lane: number,
): boolean {
  if (
    card.team !== s.teams[side] &&
    card.team !== 'mercenary' &&
    card.team !== s.allies?.[side]
  )
    return false
  if (card.kind === 'creature') return true // Friendly replacement allowed.
  if (card.kind === 'trap')
    return !s.traps.some((t) => t.side === side && t.lane === lane)
  if (card.effect === 'scan') return true
  return aim(card) === 'own'
    ? !!unitAt(s, side, lane)
    : !!unitAt(s, opponent(side), lane)
}
function damage(u: ClashUnit, amount: number, pierce = 0): number {
  const armor = u.armor + (u.guard ?? 0)
  const dealt = Math.max(0, amount - Math.max(0, armor - pierce))
  u.hp -= dealt
  return dealt
}
function stun(u: ClashUnit): void {
  if (u.snareWard) u.snareWard = false
  else u.rooted = true
}
/** One-play snares are armor-cutters (see springTrap). */
function isArmorCutterSnare(card: Card): boolean {
  return (
    card.kind === 'trap' && card.effect === 'snare' && clashPlayCost(card) === 1
  )
}
/** Central trap detonation, including network copies which never enter a draw pile. */
function springTrap(s: ClashState, trap: ClashTrap, victim: ClashUnit): number {
  const card = cardById(trap.cardId)
  // Cheap snares are armor-cutters: a one-play trap pierces one point of armor,
  // hits an armored catch for one extra, and shears one permanent point off the plated fighter it catches, so it is
  // the answer to armored bruisers rather than a flat tax on them.
  const cutter = isArmorCutterSnare(card)
  const armored = victim.armor + (victim.guard ?? 0) > 0
  const dealt = damage(
    victim,
    clashBalance(card, trap.level).power + (cutter && armored ? 1 : 0),
    cutter ? 1 : 0,
  )
  if (cutter && victim.armor > 0) {
    victim.armor -= 1
    note(
      s,
      'The snare shears plating off ' + nameOf(victim) + '!',
      'trap',
      trap.lane,
    )
  }
  // ...and they defuse: a VOLATILE fighter caught by a one-play snare loses its
  // death burst, so laying one where a Riot bomber will strike or land is a real
  // read rather than a flat tax (slime-city/t-048).
  if (cutter && victim.keywords.includes('volatile')) {
    victim.keywords = victim.keywords.filter((k) => k !== 'volatile')
    note(
      s,
      'The snare snips the fuse on ' + nameOf(victim) + '!',
      'trap',
      trap.lane,
    )
  }
  if (card.roots || (trap.cardId === 'grate' && trap.level >= 2)) stun(victim)
  s.traps = s.traps.filter((t) => t !== trap)
  if (!trap.token) s.discards[trap.side].push(trap.cardId)
  if (trap.level >= 2) {
    const neighbors = s.units.filter(
      (u) => u.side !== trap.side && Math.abs(u.lane - trap.lane) === 1,
    )
    if (trap.cardId === 'badluck') {
      let hit = 0
      for (const neighbor of trap.level === 3
        ? neighbors
        : neighbors.slice(0, 1)) {
        if (random(s) < 0.5) {
          damage(neighbor, trap.level === 3 ? 3 : 2)
          hit++
        }
      }
      note(
        s,
        hit
          ? 'Trapdoor Surprise ricochets into ' + hit + ' alley!'
          : 'Trapdoor Surprise fizzles after its first blast.',
        'trap',
        trap.lane,
      )
      evolutionMoment(
        s,
        'badluck',
        trap.side,
        trap.lane,
        hit ? 'Grenade ricochet!' : 'The gamble fizzles.',
        'blast',
      )
    }
    if (
      ['scentmine', 'shocktrap', 'bloodwire', 'grate'].includes(trap.cardId)
    ) {
      for (const neighbor of trap.level === 3
        ? neighbors
        : neighbors.slice(0, 1)) {
        if (trap.cardId === 'scentmine') {
          stun(neighbor)
          if (trap.level === 3) damage(neighbor, 1)
        } else if (trap.cardId === 'grate') {
          if (trap.level === 3) damage(neighbor, 2)
        } else {
          damage(neighbor, trap.level === 3 ? 2 : 1)
          if (trap.cardId === 'shocktrap' && trap.level === 3) stun(neighbor)
        }
      }
      evolutionMoment(
        s,
        trap.cardId,
        trap.side,
        trap.lane,
        card.name + ' chains into a neighboring alley!',
        'control',
      )
    }
  }
  note(s, card.name + ' springs on ' + nameOf(victim) + '!', 'trap', trap.lane)
  const evolved = clashEvolutionStage(trap.cardId, trap.level)
  if (evolved)
    runEvoStage(s, evolved, 'spring', {
      side: trap.side,
      lane: trap.lane,
      cardId: trap.cardId,
      level: trap.level,
      target: victim,
      trap,
    })
  return dealt
}
/** Battlefield-only echoes are NOT deck cards. Each arrival uses the same trap
 * resolution as a real creature, and every lane remains single-occupancy. */
function summonEcho(
  s: ClashState,
  side: Side,
  cardId: string,
  lane: number,
  hp = 2,
  attack = 1,
  keywords: Keyword[] = [],
): void {
  if (!inside(lane) || unitAt(s, side, lane)) return
  const unit: ClashUnit = {
    uid: s.nextUid++,
    cardId,
    side,
    lane,
    hp,
    maxHp: hp,
    attack,
    armor: 0,
    keywords: [...keywords],
    surge: 0,
    rooted: false,
    ambushUsed: false,
    attacked: false,
    fresh: true,
    gear: [],
    level: 1,
    token: true,
  }
  s.units.push(unit)
  note(
    s,
    cardById(cardId).name + ' echo joins alley ' + (lane + 1) + '.',
    'play',
    lane,
  )
  const trap = s.traps.find((t) => t.side === opponent(side) && t.lane === lane)
  if (trap) {
    springTrap(s, trap, unit)
    casualties(s)
  }
}

function nearestFreeAlley(s: ClashState, side: Side, center: number): number {
  return (
    Array.from({ length: CLASH_LANES }, (_, lane) => lane)
      .sort((a, b) => Math.abs(a - center) - Math.abs(b - center) || a - b)
      .find((lane) => !unitAt(s, side, lane)) ?? -1
  )
}

// ------------------------------------------------ data evolutions (dsl.ts)
interface EvoContext {
  side: Side
  lane: number
  cardId: string
  level: number
  /** The fighter that owns (or wears) the evolution. */
  self?: ClashUnit
  /** Spell target, strike defender or trap victim. */
  target?: ClashUnit
  /** The sprung trap, for re-arming. */
  trap?: ClashTrap
}
/** Every evolution stage a fighter carries: its own and its gear's. */
function evoStages(
  u: ClashUnit,
): { id: string; level: number; st: EvoStage }[] {
  const out: { id: string; level: number; st: EvoStage }[] = []
  if (!u.token) {
    const st = clashEvolutionStage(u.cardId, u.level, u.evoChoice ?? 0)
    if (st) out.push({ id: u.cardId, level: u.level, st })
  }
  for (const [id, level] of Object.entries(u.gearLevels ?? {})) {
    const st = clashEvolutionStage(id, level)
    if (st) out.push({ id, level, st })
  }
  return out
}
function evoStatics(u: ClashUnit): EvoStatic[] {
  return evoStages(u).flatMap(({ st }) => (st.static ? [st.static] : []))
}
function evoScope(s: ClashState, ctx: EvoContext, to: EvoScope): ClashUnit[] {
  const foe = opponent(ctx.side)
  const alive = (u: ClashUnit) => u.hp > 0
  const mine = s.units.filter((u) => u.side === ctx.side && alive(u))
  const theirs = s.units.filter((u) => u.side === foe && alive(u))
  const near = (u: ClashUnit) => Math.abs(u.lane - ctx.lane) === 1
  switch (to) {
    case 'self':
      return ctx.self && alive(ctx.self) && s.units.includes(ctx.self)
        ? [ctx.self]
        : []
    case 'target':
      return ctx.target && alive(ctx.target) && s.units.includes(ctx.target)
        ? [ctx.target]
        : []
    case 'across': {
      const u = unitAt(s, foe, ctx.lane)
      return u && alive(u) ? [u] : []
    }
    case 'adjacentAllies':
      return mine.filter(near)
    case 'allies':
      return mine
    case 'otherAllies':
      return mine.filter((u) => u !== ctx.self)
    case 'adjacentFoes':
      return theirs.filter(near)
    case 'laneFoes':
      return theirs.filter((u) => Math.abs(u.lane - ctx.lane) <= 1)
    case 'allFoes':
      return theirs
    case 'randomFoe':
      return theirs.length
        ? [theirs[Math.floor(random(s) * theirs.length)]!]
        : []
    case 'weakestFoe':
      return theirs.length
        ? [[...theirs].sort((a, b) => a.hp - b.hp || a.lane - b.lane)[0]!]
        : []
    case 'strongestFoe':
      return theirs.length
        ? [
            [...theirs].sort(
              (a, b) => clashPower(s, b) - clashPower(s, a) || a.lane - b.lane,
            )[0]!,
          ]
        : []
    case 'woundedAllies':
      return mine.filter((u) => u.hp < u.maxHp)
    case 'healthyAllies':
      return mine.filter((u) => u.hp >= u.maxHp)
    case 'woundedAlly': {
      const hurt = mine
        .filter((u) => u.hp < u.maxHp)
        .sort((a, b) => b.maxHp - b.hp - (a.maxHp - a.hp) || a.lane - b.lane)
      return hurt.slice(0, 1)
    }
  }
}
function evoAct(s: ClashState, ctx: EvoContext, a: EvoAction): void {
  const foe = opponent(ctx.side)
  switch (a.do) {
    case 'damage':
      for (const u of evoScope(s, ctx, a.to)) damage(u, a.n, a.pierce ? 9 : 0)
      return
    case 'execute':
      for (const u of evoScope(s, ctx, a.to))
        if (u.side === foe && u.hp < u.maxHp && u.hp <= a.threshold && !u.token)
          u.hp = 0
      return
    case 'promote': {
      const cards = s[a.zone === 'hand' ? 'hands' : 'decks'][ctx.side]
      const target = [...cards]
        .filter(
          (id) =>
            id !== ctx.cardId && clashLevel(s, ctx.side, id) < CLASH_MAX_LEVEL,
        )
        .sort(
          (left, right) =>
            clashLevel(s, ctx.side, left) - clashLevel(s, ctx.side, right) ||
            left.localeCompare(right),
        )[0]
      if (!target) return
      const next = clashLevel(s, ctx.side, target) + 1
      s.levels[ctx.side][target] = next
      note(
        s,
        cardById(target).name + ' is promoted to level ' + next + '!',
        'play',
        ctx.lane,
      )
      return
    }
    case 'heal':
      for (const u of evoScope(s, ctx, a.to))
        u.hp = Math.min(u.maxHp, u.hp + a.n)
      return
    case 'power':
      for (const u of evoScope(s, ctx, a.to))
        if (a.lasting) u.attack = clamp(u.attack + a.n, 0, 12)
        else u.surge += a.n
      return
    case 'life':
      for (const u of evoScope(s, ctx, a.to)) {
        u.maxHp += a.n
        u.hp += a.n
      }
      return
    case 'armor':
      for (const u of evoScope(s, ctx, a.to))
        u.armor = clamp(u.armor + a.n, 0, 3)
      return
    case 'guard':
      for (const u of evoScope(s, ctx, a.to)) u.guard = (u.guard ?? 0) + a.n
      return
    case 'stun':
      for (const u of evoScope(s, ctx, a.to)) stun(u)
      return
    case 'cleanse':
      for (const u of evoScope(s, ctx, a.to)) u.rooted = false
      return
    case 'grant':
      for (const u of evoScope(s, ctx, a.to))
        if (!u.keywords.includes(a.keyword)) u.keywords.push(a.keyword)
      return
    case 'summon': {
      const lanes =
        a.where === 'neighbors'
          ? [ctx.lane - 1, ctx.lane + 1]
          : a.where === 'everyEmpty'
            ? Array.from({ length: CLASH_LANES }, (_, lane) => lane)
            : [nearestFreeAlley(s, ctx.side, ctx.lane)]
      for (const lane of lanes)
        if (inside(lane) && !unitAt(s, ctx.side, lane))
          summonEcho(s, ctx.side, ctx.cardId, lane, a.hp, a.attack, a.keywords)
      return
    }
    case 'boss':
      s.boss[foe] -= a.n
      return
    case 'mend':
      s.boss[ctx.side] = Math.min(
        clashBossCap(s, ctx.side),
        s.boss[ctx.side] + a.n,
      )
      return
    case 'draw':
      // Exactly n more cards, whatever the hand size (never a refill). Off
      // the side's own play phase, the cards wait for its next turn.
      if (s.active === ctx.side && s.phase === 'play')
        draw(s, ctx.side, s.hands[ctx.side].length + a.n - CLASH_HAND_SIZE)
      else (s.pendingDraw ??= { player: 0, enemy: 0 })[ctx.side] += a.n
      return
    case 'chance':
      if (random(s) * 100 < a.p) for (const x of a.then) evoAct(s, ctx, x)
      return
    case 'if':
      if (evoCondition(s, ctx, a.cond))
        for (const x of a.then) evoAct(s, ctx, x)
      return
    case 'revive': {
      const ledger = s.fallen?.[ctx.side] ?? []
      const free = nearestFreeAlley(s, ctx.side, ctx.lane)
      if (ledger.length && free >= 0) {
        const fallen = ledger.pop()!
        summonEcho(s, ctx.side, fallen, free, a.hp, a.attack)
      }
      return
    }
    case 'shift': {
      const mover = a.to === 'self' ? ctx.self : ctx.target
      if (
        !mover ||
        mover.side !== ctx.side ||
        mover.rooted ||
        mover.hp <= 0 ||
        !s.units.includes(mover)
      )
        return
      const candidates = [mover.lane - 1, mover.lane + 1].filter(
        (lane) =>
          inside(lane) &&
          !unitAt(s, mover.side, lane) &&
          (a.where === 'safe' ? !unitAt(s, foe, lane) : !!unitAt(s, foe, lane)),
      )
      const destination = candidates[0]
      if (destination === undefined) return
      mover.lane = destination
      note(
        s,
        nameOf(mover) + ' slips into alley ' + (destination + 1) + '.',
        'play',
        destination,
      )
      const hazard = s.traps.find(
        (trap) => trap.side === foe && trap.lane === destination,
      )
      if (hazard) {
        springTrap(s, hazard, mover)
        casualties(s)
      }
      return
    }
    case 'retreat': {
      const u = ctx.self
      if (!u || u.token || !s.units.includes(u)) return
      s.units = s.units.filter((v) => v !== u)
      s.decks[u.side].unshift(u.cardId)
      note(s, nameOf(u) + ' vanishes over the rooftops.', 'play', u.lane)
      return
    }
    case 'duel': {
      const u = ctx.self
      if (!u || u.hp <= 0) return
      for (const foe of evoScope(s, ctx, a.to)) {
        const back = foe.rooted ? 0 : clashPower(s, foe)
        damage(foe, clashPower(s, u), has(u, 'pierce') ? 1 : 0)
        damage(u, back, has(foe, 'pierce') ? 1 : 0)
        note(s, nameOf(u) + ' hunts ' + nameOf(foe) + '!', 'clash', foe.lane)
      }
      return
    }
    case 'rescue':
      for (const u of evoScope(s, ctx, a.to)) u.lastChance = ctx.cardId
      return
    case 'rearm':
      if (ctx.trap && !ctx.trap.token)
        s.traps.push({ ...ctx.trap, token: true })
      return
    case 'pounce': {
      const u = ctx.self
      if (u && u.hp > 0) s.boss[foe] -= clashPower(s, u)
      return
    }
  }
}
function evoCondition(
  s: ClashState,
  ctx: EvoContext,
  cond: EvoCondition,
): boolean {
  switch (cond) {
    case 'acrossEmpty':
      return !unitAt(s, opponent(ctx.side), ctx.lane)
    case 'allyFell':
      return (s.fallen?.[ctx.side]?.length ?? 0) > 0
    case 'targetHeavy':
      return !!ctx.target && clashPlayCost(cardById(ctx.target.cardId)) === 2
    case 'crowd':
      return (
        s.units.filter((u) => u.side === ctx.side && u !== ctx.self && u.hp > 0)
          .length >= 2
      )
    case 'foesPresent':
      return s.units.some((u) => u.side !== ctx.side && u.hp > 0)
    case 'crewWhole':
      return (
        s.units.filter((u) => u.side === ctx.side && u.hp > 0 && u.hp < u.maxHp)
          .length < 2
      )
  }
}
function evoMomentEffect(
  a: EvoAction | undefined,
): ClashEvolutionMoment['effect'] {
  switch (a?.do) {
    case 'summon':
      return 'summon'
    case 'heal':
    case 'mend':
    case 'life':
    case 'cleanse':
      return 'heal'
    case 'damage':
    case 'boss':
      return 'blast'
    case 'power':
      return 'strike'
    case 'chance':
    case 'if':
      return evoMomentEffect(a.then[0])
    case 'revive':
      return 'summon'
    case 'rescue':
      return 'heal'
    case 'duel':
    case 'pounce':
      return 'strike'
    default:
      return 'control'
  }
}
/** Run one stage's abilities for a trigger. Level threes always announce
 * themselves with an evolution moment (the cinematic layer reads it). */
function runEvoStage(
  s: ClashState,
  st: EvoStage,
  when: EvoTrigger,
  ctx: EvoContext,
): void {
  let first: EvoAction | undefined
  st.abilities.forEach((ab, i) => {
    if (ab.when !== when) return
    if (ab.once && ctx.self) {
      const key = ctx.cardId + ':' + ctx.level + ':' + i
      if (ctx.self.evoUsed?.includes(key)) return
      ;(ctx.self.evoUsed ??= []).push(key)
    }
    first ??= ab.do[0]
    for (const a of ab.do) evoAct(s, ctx, a)
  })
  if (!first) return
  const name = cardById(ctx.cardId).name
  if (ctx.level >= 3)
    evolutionMoment(
      s,
      ctx.cardId,
      ctx.side,
      ctx.lane,
      name + ': ' + st.title + '!',
      evoMomentEffect(first),
    )
  else note(s, name + ' · ' + st.title, 'play', ctx.lane)
}
/** Fire every stage a fighter carries for `when`. */
function unitEvo(
  s: ClashState,
  u: ClashUnit,
  when: EvoTrigger,
  target?: ClashUnit,
): void {
  for (const { id, level, st } of evoStages(u))
    runEvoStage(s, st, when, {
      side: u.side,
      lane: u.lane,
      cardId: id,
      level,
      self: u,
      target,
    })
}

function casualties(s: ClashState): void {
  // A rescue must happen before the death ledger, explosion, and discard.
  // No fighter can be rescued twice by the same collar or grandmother.
  for (const endangered of s.units.filter((u) => u.hp <= 0)) {
    if (endangered.lastChance) {
      const source = endangered.lastChance
      endangered.lastChance = undefined
      endangered.hp = 1
      evolutionMoment(
        s,
        source,
        endangered.side,
        endangered.lane,
        nameOf(endangered) +
          (source === 's1-nine-lives'
            ? ' spends a spare life. No refunds!'
            : ' survives at 1 life: ' + cardById(source).name + '!'),
        'heal',
      )
      continue
    }
    if (endangered.ninthLife) {
      const level = endangered.ninthLife
      endangered.ninthLife = undefined
      endangered.hp =
        level === 3 ? Math.max(1, Math.ceil(endangered.maxHp / 2)) : 1
      if (level === 3) endangered.attack = clamp(endangered.attack + 2, 0, 10)
      evolutionMoment(
        s,
        'ninthlife',
        endangered.side,
        endangered.lane,
        'The Ninth Life Collar pulls its wearer back from a fatal hit!',
        'heal',
      )
      continue
    }
    const grandma = s.units.find(
      (u) =>
        u.side === endangered.side &&
        u.uid !== endangered.uid &&
        u.hp > 0 &&
        u.level === 3 &&
        u.cardId === 'merc-clock-grandma' &&
        !u.grandmaSaveUsed &&
        Math.abs(u.lane - endangered.lane) === 1,
    )
    if (grandma) {
      grandma.grandmaSaveUsed = true
      endangered.hp = 1
      evolutionMoment(
        s,
        'merc-clock-grandma',
        grandma.side,
        grandma.lane,
        'Clockwork Grandmother rewinds one fatal blow!',
        'heal',
      )
    }
  }
  const fallen = s.units.filter((u) => u.hp <= 0)
  s.units = s.units.filter((u) => u.hp > 0)
  for (const u of fallen) {
    unitEvo(s, u, 'death')
    if (!u.token) {
      s.discards[u.side].push(u.cardId)
      ;(s.fallen ??= { player: [], enemy: [] })[u.side].push(u.cardId)
    }
    if (u.cardId === 'rat' && !u.token) {
      s.deathMarks[u.side].rat = Math.min(
        3,
        (s.deathMarks[u.side].rat ?? 0) + 1,
      )
      if (u.level === 3) {
        for (const nearby of s.units.filter(
          (v) => v.side !== u.side && Math.abs(v.lane - u.lane) === 1,
        ))
          damage(nearby, 2)
      }
    }
    for (const collector of s.units.filter(
      (v) => v.side !== u.side && v.cardId === 'collector' && v.level >= 2,
    )) {
      collector.attack = clamp(collector.attack + 1, 0, 10)
      if (collector.level === 3)
        collector.hp = Math.min(collector.maxHp, collector.hp + 1)
    }
    // Death is an event with consequences, never a bonus level-up.
    if (u.cardId === 'bomber' && u.level >= 2) {
      for (const rival of s.units.filter(
        (v) =>
          v.side !== u.side &&
          (u.level === 3 || Math.abs(v.lane - u.lane) === 1),
      ))
        damage(rival, 2)
      if (u.level === 3)
        for (const friend of s.units.filter(
          (v) => v.side === u.side && Math.abs(v.lane - u.lane) === 1,
        ))
          damage(friend, 1)
      evolutionMoment(
        s,
        'bomber',
        u.side,
        u.lane,
        'Big Top Detonator detonates across the streets!',
        'blast',
      )
    }
    for (const survivor of s.units.filter((v) => v.side === u.side)) {
      if (survivor.cardId === 'repo' && survivor.level >= 2) {
        survivor.attack = clamp(
          survivor.attack + (survivor.level === 3 ? 2 : 1),
          0,
          10,
        )
        if (survivor.level === 3) {
          s.boss[u.side] = Math.min(clashBossCap(s, u.side), s.boss[u.side] + 1)
          evolutionMoment(
            s,
            'repo',
            u.side,
            survivor.lane,
            'Repo Goblin turns a fallen friend into two power and a refund!',
            'strike',
          )
        }
      }
      if (
        survivor.cardId === 'kaboom' &&
        survivor.level >= 2 &&
        has(u, 'volatile')
      ) {
        survivor.attack = clamp(
          survivor.attack + (survivor.level === 3 ? 2 : 1),
          0,
          10,
        )
        if (survivor.level === 3) s.boss[opponent(u.side)] -= 1
        evolutionMoment(
          s,
          'kaboom',
          u.side,
          survivor.lane,
          'Jackhammer Kaboom feeds the blast into her drill and the rival boss!',
          'blast',
        )
      }
      if (survivor.cardId === 'merc-discount-angel' && survivor.level >= 2) {
        for (const friend of s.units.filter(
          (v) =>
            v.side === u.side &&
            Math.abs(v.lane - survivor.lane) === 1 &&
            v.hp > 0,
        ))
          friend.hp = Math.min(friend.maxHp, friend.hp + 2)
        if (
          survivor.level === 3 &&
          s.deathMarks[u.side]['angel-rescue-round'] !== s.round
        ) {
          s.deathMarks[u.side]['angel-rescue-round'] = s.round
          const free = nearestFreeAlley(s, u.side, survivor.lane)
          if (free >= 0) {
            summonEcho(s, u.side, u.cardId, free, 2, 1)
            evolutionMoment(
              s,
              'merc-discount-angel',
              u.side,
              survivor.lane,
              'Discount Archangel rescues a fallen fighter!',
              'summon',
            )
          }
        }
      }
    }
    for (const slug of s.units.filter(
      (v) =>
        v.cardId === 'merc-debt-slug' &&
        v.level >= 2 &&
        (v.side === u.side || v.level === 3),
    )) {
      slug.attack = clamp(slug.attack + 1, 0, 10)
      if (slug.level === 3) {
        slug.maxHp = clamp(slug.maxHp + 1, 1, 22)
        slug.hp = Math.min(slug.maxHp, slug.hp + 1)
        evolutionMoment(
          s,
          'merc-debt-slug',
          slug.side,
          slug.lane,
          'Debt-Eating Slug devours a casualty and grows!',
          'heal',
        )
      }
    }
    note(
      s,
      nameOf(u) + ' falls in alley ' + (u.lane + 1) + '.',
      'death',
      u.lane,
    )
    if (has(u, 'volatile')) {
      const foe = unitAt(s, opponent(u.side), u.lane)
      const burst = clamp(cardById(u.cardId).burst ?? 1, 1, 2)
      if (foe) damage(foe, burst)
      else s.boss[opponent(u.side)] -= burst
    }
    const vest = u.gearLevels?.fusevest ?? 0
    if (vest >= 2) {
      for (const enemy of s.units.filter(
        (v) =>
          v.side !== u.side && (vest === 3 || Math.abs(v.lane - u.lane) === 1),
      ))
        damage(enemy, 1)
      if (vest === 3)
        for (const friend of s.units.filter(
          (v) => v.side === u.side && Math.abs(v.lane - u.lane) === 1,
        ))
          damage(friend, 1)
      evolutionMoment(
        s,
        'fusevest',
        u.side,
        u.lane,
        'The Sparkler Corset bursts beyond its own lane!',
        'blast',
      )
    }
  }
  if (s.units.some((u) => u.hp <= 0)) casualties(s)
}
function checkWinner(s: ClashState): void {
  if (s.boss.player <= 0 && s.boss.enemy <= 0) s.victor = 'draw'
  else if (s.boss.player <= 0) s.victor = 'enemy'
  else if (s.boss.enemy <= 0) s.victor = 'player'
  if (s.victor)
    note(
      s,
      s.victor === 'draw'
        ? 'Double knockout!'
        : s.victor === 'player'
          ? 'YOU WIN!'
          : 'RIVAL WINS!',
      'turn',
    )
}
export function playClash(
  input: ClashState,
  side: Side,
  id: string,
  lane: number,
  choice?: EvoPick,
): ClashState {
  if (!canClashPlay(input, side, id, lane)) return input
  const s = structuredClone(input)
  const card = cardById(id)
  const level = clashLevel(s, side, id)
  const profile = clashBalance(card, level)
  const playSlots = clashEffectivePlayCost(input, side, card)
  // A choose-one level three: only a real alternative is recorded.
  const pick: EvoPick = choice === 1 && clashEvolutionChoice(id, level) ? 1 : 0
  s.hands[side].splice(s.hands[side].indexOf(id), 1)
  const foe = opponent(side)
  if (card.kind === 'creature') {
    const old = unitAt(s, side, lane)
    if (old) {
      if (id === 'broker' && level >= 2) {
        // A real sacrifice: triggers Volatile, Repo, Angel, Slug and Kaboom.
        old.hp = 0
        casualties(s)
      } else {
        s.units = s.units.filter((u) => u.uid !== old.uid)
        if (!old.token) s.discards[side].push(old.cardId)
      }
      // A death-triggered rescue could have occupied the lane. The broker
      // still buys that slot, but an echo never enters the regular discard.
      const echo = unitAt(s, side, lane)
      if (echo) {
        s.units = s.units.filter((u) => u.uid !== echo.uid)
        if (!echo.token) s.discards[side].push(echo.cardId)
      }
      note(s, nameOf(old) + ' makes way for ' + card.name + '.', 'play', lane)
    }
    const unit: ClashUnit = {
      uid: s.nextUid++,
      cardId: id,
      side,
      lane,
      hp: profile.hp,
      maxHp: profile.hp,
      attack: profile.attack,
      armor: profile.armor,
      keywords: [...(card.keywords ?? [])],
      surge: 0,
      rooted: false,
      ambushUsed: false,
      attacked: false,
      fresh: true,
      gear: [],
      level,
      ...(pick ? { evoChoice: 1 as const } : {}),
    }
    if (id === 'rat')
      unit.attack = Math.min(10, unit.attack + (s.deathMarks[side].rat ?? 0))
    if (id === 'lynx' && level >= 2 && !unitAt(s, foe, lane))
      unit.attack = Math.min(10, unit.attack + 1)
    if (id === 'broker' && level >= 2 && old) {
      const attackGain = level === 3 ? 3 : 2
      const lifeGain = level === 3 ? 4 : 2
      unit.attack = Math.min(10, unit.attack + attackGain)
      unit.hp += lifeGain
      unit.maxHp += lifeGain
      note(
        s,
        'Flesh Broker buys out an ally for a stronger body.',
        'play',
        lane,
      )
    }
    s.units.push(unit)
    note(s, card.name + ' enters alley ' + (lane + 1) + '.', 'play', lane)
    if (id === 'juggernaut' && level === 3) {
      for (const ally of s.units.filter(
        (u) =>
          u.side === side &&
          u.uid !== unit.uid &&
          Math.abs(u.lane - lane) === 1,
      ))
        ally.armor = Math.min(3, ally.armor + 1)
    }
    const trap = s.traps.find((t) => t.side === foe && t.lane === lane)
    if (trap) {
      springTrap(s, trap, unit)
      casualties(s)
    }
    if (unit.hp > 0) {
      unitEvo(s, unit, 'enter')
      casualties(s)
    }
    if (unit.hp > 0 && id === 'lynx' && level === 3) {
      const free = [lane - 1, lane + 1].find(
        (neighbor) => inside(neighbor) && !unitAt(s, side, neighbor),
      )
      if (free !== undefined) summonEcho(s, side, id, free, 2, 1, ['ambush'])
    }
    if (id === 'merc-grease-oracle' && level === 3 && unit.hp > 0) {
      // The oracle's prophecy is an ongoing seeded strike aura, not an RNG
      // reroll in the UI. All rolls happen inside strike commands.
      evolutionMoment(
        s,
        id,
        side,
        lane,
        'The Oracle is certain now.',
        'control',
      )
    }
    if (id === 'merc-bus-driver' && level >= 2 && unit.hp > 0) {
      const passengers = s.units
        .filter(
          (friend) =>
            friend.side === side &&
            friend.uid !== unit.uid &&
            Math.abs(friend.lane - lane) === 1,
        )
        .sort((a, b) => a.lane - b.lane)
      for (const passenger of level === 3
        ? passengers
        : passengers.slice(0, 1)) {
        const destination = nearestFreeAlley(s, side, lane)
        if (destination < 0) break
        passenger.lane = destination
        note(
          s,
          'Gutterbus reroutes ' +
            nameOf(passenger) +
            ' to alley ' +
            (destination + 1) +
            '.',
          'play',
          destination,
        )
        const hazard = s.traps.find(
          (t) => t.side === foe && t.lane === destination,
        )
        if (hazard) {
          springTrap(s, hazard, passenger)
          casualties(s)
        }
      }
    }
    if (
      (id === 'sprite' || id === 'merc-smog-moth') &&
      level >= 2 &&
      unit.hp > 0
    ) {
      const free = [lane - 1, lane + 1].filter(
        (neighbor) => inside(neighbor) && !unitAt(s, side, neighbor),
      )
      for (const neighbor of level === 3 ? free : free.slice(0, 1))
        summonEcho(
          s,
          side,
          id,
          neighbor,
          2,
          1,
          id === 'sprite' ? ['swarm'] : [],
        )
    }
  } else if (card.kind === 'trap') {
    s.traps.push({ side, lane, cardId: id, level })
    note(s, 'Trap armed in alley ' + (lane + 1) + '.', 'trap', lane)
    if ((id === 'tripwire' || id === 'debttrap') && level >= 2) {
      const free = [lane - 1, lane + 1].filter(
        (neighbor) =>
          inside(neighbor) &&
          !s.traps.some((trap) => trap.side === side && trap.lane === neighbor),
      )
      for (const neighbor of level === 3 ? free : free.slice(0, 1)) {
        s.traps.push({ side, lane: neighbor, cardId: id, level, token: true })
        note(
          s,
          card.name + ' extends to alley ' + (neighbor + 1) + '.',
          'trap',
          neighbor,
        )
      }
    }
  } else {
    const target = unitAt(s, aim(card) === 'own' ? side : foe, lane)
    const power = profile.power
    if (card.effect === 'scan') {
      const removed = s.traps.filter(
        (t) =>
          t.side === foe &&
          (id === 'sonar' && level >= 3
            ? true
            : id === 'sonar' && level === 2
              ? Math.abs(t.lane - lane) <= 1
              : t.lane === lane),
      )
      s.traps = s.traps.filter((t) => !removed.includes(t))
      for (const trap of removed)
        if (!trap.token) s.discards[foe].push(trap.cardId)
      if (level > 1) draw(s, side, id === 'sonar' ? level - 1 : level - 2)
    } else if (target) {
      switch (card.effect) {
        case 'heal':
          target.hp = Math.min(target.maxHp, target.hp + power)
          if (id === 'hushmoney' && level >= 2) {
            s.boss[side] = Math.min(
              clashBossCap(s, side),
              s.boss[side] + (level === 3 ? 2 : 1),
            )
            if (level === 3) target.guard = clamp((target.guard ?? 0) + 2, 0, 3)
          }
          if (id === 'ducttape' && level >= 2) {
            target.armor = clamp(target.armor + 1, 0, 3)
            if (level === 3) {
              const ledger = s.fallen?.[side] ?? []
              const free = nearestFreeAlley(s, side, lane)
              if (free >= 0 && ledger.length) {
                const recoveredId = ledger.pop()!
                summonEcho(s, side, recoveredId, free, 3, 1)
                const rebuilt = unitAt(s, side, free)
                if (rebuilt?.token) rebuilt.armor = 1
              }
            }
          }
          if (id === 'reknit' && level >= 2) {
            for (const friend of s.units.filter(
              (u) => u.side === side && Math.abs(u.lane - lane) === 1,
            ))
              friend.hp = Math.min(friend.maxHp, friend.hp + 2)
            if (level === 3) {
              const ledger = s.fallen?.[side] ?? []
              const index = ledger.length - 1
              const free = nearestFreeAlley(s, side, lane)
              if (index >= 0 && free >= 0) {
                const fallen = ledger[index]!
                summonEcho(s, side, fallen, free, 2, 1)
                ledger.splice(index, 1)
              }
            }
          }
          break
        case 'armor':
          target.armor = clamp(target.armor + (level >= 3 ? 2 : 1), 0, 3)
          if (id === 'contract' && level >= 2)
            (target.gearLevels ??= {}).contract = level
          target.hp = Math.min(target.maxHp, target.hp + (level - 1) * 2)
          if (id === 'drysuit' && level >= 2) {
            target.snareWard = true
            target.rooted = false
            if (level === 3)
              for (const friend of s.units.filter(
                (u) => u.side === side && Math.abs(u.lane - lane) === 1,
              )) {
                friend.snareWard = true
                friend.rooted = false
              }
          }
          if (id === 'plating' && level >= 2)
            for (const friend of s.units.filter(
              (u) =>
                u.side === side &&
                u.uid !== target.uid &&
                (level === 3 || Math.abs(u.lane - lane) === 1),
            ))
              friend.armor = clamp(friend.armor + 1, 0, 3)
          break
        case 'sharpen':
          target.attack = clamp(target.attack + profile.bonus, 1, 10)
          if (id === 'shredders' && level >= 2) {
            if (!has(target, 'pierce')) target.keywords.push('pierce')
            if (level === 3) (target.gearLevels ??= {}).shredders = level
          }
          if (id === 'wreckingfist' && level >= 2) {
            if (!has(target, 'bulldoze')) target.keywords.push('bulldoze')
            if (level === 3) (target.gearLevels ??= {}).wreckingfist = level
          }
          break
        case 'boost':
          if (card.kind === 'equipment')
            target.attack = clamp(target.attack + profile.bonus, 1, 10)
          else target.surge += power
          if (id === 'spurs' && level >= 2) {
            const neighbors = s.units
              .filter(
                (u) =>
                  u.side === side &&
                  u.uid !== target.uid &&
                  Math.abs(u.lane - lane) === 1,
              )
              .sort((a, b) => a.lane - b.lane)
            for (const friend of level === 3
              ? neighbors
              : neighbors.slice(0, 1))
              friend.attack = clamp(
                friend.attack + (level === 3 ? 2 : 1),
                0,
                10,
              )
          }
          if (id === 'fuse' && level >= 2) {
            const neighbors = s.units
              .filter(
                (u) =>
                  u.side === side &&
                  u.uid !== target.uid &&
                  Math.abs(u.lane - lane) === 1,
              )
              .sort((a, b) => a.hp - b.hp || a.lane - b.lane)
            if (level === 3 && neighbors.length) {
              const offered = neighbors[0]!
              offered.hp = 0
              target.attack = clamp(target.attack + 4, 0, 10)
              evolutionMoment(
                s,
                id,
                side,
                lane,
                'Cannonball Booster burns an ally for permanent power!',
                'blast',
              )
              casualties(s)
            } else {
              damage(target, level === 3 ? 2 : 1)
            }
          }
          if (id === 'overclock' && level >= 2) {
            target.surge += level === 3 ? 4 : 2
            damage(target, level === 3 ? 3 : 1)
            if (level === 3)
              for (const rival of s.units.filter(
                (u) => u.side === foe && Math.abs(u.lane - lane) === 1,
              ))
                damage(rival, 2)
          }
          if (id === 'drink' && level >= 2) {
            const success = random(s) < (level === 3 ? 0.75 : 0.5)
            if (success) target.surge += level === 3 ? 6 : 2
            else damage(target, level === 3 ? 2 : 1)
            note(
              s,
              success
                ? 'Hold My Sequins pays off!'
                : 'Hold My Sequins scatters!',
              'clash',
              lane,
            )
          }
          if (id === 'pounce') {
            target.ambushUsed = false
            if (level >= 2) {
              const adjacent = s.units.filter(
                (u) => u.side === side && Math.abs(u.lane - lane) === 1,
              )
              for (const friend of level === 3
                ? adjacent
                : adjacent.slice(0, 1)) {
                friend.ambushUsed = false
                friend.surge += level === 3 ? 2 : 1
              }
            }
          }
          break
        case 'grant':
          for (const keyword of card.grants ?? [])
            if (!target.keywords.includes(keyword))
              target.keywords.push(keyword)
          target.attack = clamp(target.attack + (level - 1), 1, 10)
          if (id === 'ninthlife' && level >= 2)
            target.ninthLife = level === 3 ? 3 : 2
          if (id === 'fusevest' && level >= 2)
            (target.gearLevels ??= {})[id] = level
          if (id === 'choker' && level >= 2) {
            ;(target.gearLevels ??= {}).choker = level
            for (const friend of s.units.filter(
              (u) =>
                u.side === side &&
                u.uid !== target.uid &&
                Math.abs(u.lane - lane) === 1,
            ))
              if (!has(friend, 'swarm')) friend.keywords.push('swarm')
          }
          if (id === 'visor' && level >= 2) {
            target.attack = clamp(target.attack + 1, 0, 10)
            const neighbors = s.traps
              .filter(
                (trap) => trap.side === foe && Math.abs(trap.lane - lane) === 1,
              )
              .sort((a, b) => a.lane - b.lane)
            for (const trap of level === 3
              ? neighbors
              : neighbors.slice(0, 1)) {
              s.traps = s.traps.filter((t) => t !== trap)
              if (!trap.token) s.discards[foe].push(trap.cardId)
            }
            if (level === 3) {
              for (const friend of s.units.filter(
                (u) => u.side === side && Math.abs(u.lane - lane) === 1,
              ))
                if (!has(friend, 'pierce')) friend.keywords.push('pierce')
            }
          }
          if (id === 'handshake' && level >= 2) {
            for (const friend of s.units.filter(
              (u) =>
                u.side === side &&
                (level === 3 || Math.abs(u.lane - lane) === 1),
            ))
              if (!has(friend, 'collect')) friend.keywords.push('collect')
          }
          break
        case 'root':
          stun(target)
          if (level > 1) damage(target, level - 1)
          if ((id === 'laser' || id === 'blackout') && level >= 2) {
            const nearby = s.units.filter(
              (u) => u.side === foe && Math.abs(u.lane - lane) === 1,
            )
            for (const rival of level === 3 ? nearby : nearby.slice(0, 1)) {
              stun(rival)
              if (id === 'blackout' && level === 3) damage(rival, 1)
            }
          }
          break
        case 'snare':
        case 'debt':
          damage(target, power)
          stun(target)
          if (id === 'foreclosure' && level >= 2 && target.hp <= 0) {
            s.boss[side] = Math.min(clashBossCap(s, side), s.boss[side] + 2)
            if (level === 3) {
              const free = nearestFreeAlley(s, side, lane)
              if (free >= 0) summonEcho(s, side, 'repo', free, 2, 1)
            }
          }
          break
        case 'chaos': {
          let blast = 1 + Math.floor(random(s) * power)
          if (id === 'firestorm' && level >= 2 && blast <= 2)
            blast = Math.max(blast, 1 + Math.floor(random(s) * power))
          damage(target, blast)
          if (id === 'firestorm' && level === 3) {
            for (const rival of s.units.filter(
              (u) => u.side === foe && Math.abs(u.lane - lane) === 1,
            ))
              damage(rival, 2)
            for (const friend of s.units.filter(
              (u) => u.side === side && Math.abs(u.lane - lane) === 1,
            ))
              damage(friend, 1)
          }
          break
        }
        default: {
          let hit = power
          const hurt = target.hp < target.maxHp
          if (id === 'pinprick' && level >= 2) {
            const critical = level === 3 || hurt
            if (critical) hit *= 2
            note(
              s,
              critical
                ? 'Safety-Pin critical connects!'
                : 'Safety-Pin ordinary hit.',
              'clash',
              lane,
            )
          }
          const dealt = damage(target, hit)
          if (id === 'slap' && level >= 2 && dealt >= 2) {
            stun(target)
            if (level === 3)
              for (const rival of s.units.filter(
                (u) => u.side === foe && Math.abs(u.lane - lane) === 1,
              )) {
                damage(rival, 2)
                stun(rival)
              }
          }
          if (id === 'pinprick' && level === 3 && hurt)
            for (const rival of s.units.filter(
              (u) => u.side === foe && Math.abs(u.lane - lane) === 1,
            ))
              damage(rival, 2)
          if (id === 'feedback' && level >= 2) {
            const choir = s.units.filter((u) => u.side === side).length
            if (level === 3 && choir >= 4) {
              for (const rival of s.units.filter(
                (u) => u.side === foe && u.uid !== target.uid,
              ))
                damage(rival, 2)
            } else if (
              s.units.some(
                (u) => u.side === side && Math.abs(u.lane - lane) === 1,
              )
            ) {
              for (const rival of s.units.filter(
                (u) => u.side === foe && Math.abs(u.lane - lane) === 1,
              ))
                damage(rival, 1)
            }
          }
          if (id === 'collection' && level >= 2 && dealt > 0) {
            s.boss[side] = Math.min(
              clashBossCap(s, side),
              s.boss[side] + (level === 3 ? 2 : 1),
            )
            if (level === 3) {
              for (const friend of s.units.filter(
                (u) =>
                  u.side === side &&
                  has(u, 'collect') &&
                  Math.abs(u.lane - lane) === 1,
              ))
                friend.attack = clamp(friend.attack + 1, 0, 10)
            }
          }
          if (card.effect === 'blast') {
            for (const nearby of s.units.filter(
              (u) => u.side === foe && Math.abs(u.lane - lane) === 1,
            ))
              damage(nearby, id === 'confetti' && level >= 2 ? 2 : 1)
            if (id === 'mosh' && level >= 2) {
              for (const rival of s.units.filter(
                (u) =>
                  u.side === foe &&
                  (level === 3
                    ? Math.abs(u.lane - lane) >= 2
                    : Math.abs(u.lane - lane) === 2),
              ))
                damage(rival, 1)
              if (level === 3)
                for (const friend of s.units.filter((u) => u.side === side))
                  damage(friend, 1)
            }
            if (id === 'confetti') {
              if (level === 3)
                for (const rival of s.units.filter(
                  (u) => u.side === foe && Math.abs(u.lane - lane) >= 2,
                ))
                  damage(rival, 2)
              for (const friend of s.units.filter(
                (u) =>
                  u.side === side &&
                  (level === 3 || Math.abs(u.lane - lane) === 1),
              ))
                damage(friend, 1)
            }
          }
          break
        }
      }
      if (card.kind === 'equipment') target.gear.push(id)
    }
    const evolved = clashEvolutionStage(id, level, pick)
    if (evolved && card.kind === 'equipment' && target) {
      ;(target.gearLevels ??= {})[id] = level
      runEvoStage(s, evolved, 'enter', {
        side,
        lane: target.lane,
        cardId: id,
        level,
        self: target,
        target,
      })
    } else if (evolved)
      runEvoStage(s, evolved, 'enter', {
        side,
        lane,
        cardId: id,
        level,
        target,
      })
    note(s, card.name + ' played in alley ' + (lane + 1) + '.', 'play', lane)
    casualties(s)
    s.discards[side].push(id)
  }
  if (level < CLASH_MAX_LEVEL) {
    s.levels[side][id] = level + 1
    note(s, card.name + ' levels up to ' + (level + 1) + '!', 'play', lane)
  }
  if (playSlots === 0) {
    ;(s.freePlays ??= { player: 0, enemy: 0 })[side] += 1
    note(s, card.name + ' plays for free!', 'play', lane)
  } else s.plays[side] += playSlots
  if (s.plays[side] >= clashPlayLimit(s, side)) {
    s.phase = 'attack'
    s.cursor = 0
  }
  s.commands.push(
    pick
      ? { t: 'play', side, card: id, lane, choice: 1 }
      : { t: 'play', side, card: id, lane },
  )
  checkWinner(s)
  return s
}
/** Finish placement early. Remaining plays are forfeited, alley strikes begin. */
export function passClash(input: ClashState, side: Side): ClashState {
  if (input.victor || input.active !== side || input.phase !== 'play')
    return input
  const s = structuredClone(input)
  s.phase = 'attack'
  s.cursor = 0
  note(s, (side === 'player' ? 'You' : 'Rival') + ' send the crew in.', 'play')
  s.commands.push({ t: 'pass', side })
  return s
}
/** Next alley (left to right) where `side` still has a ready fighter, or -1. */
export function nextClashStrike(s: ClashState, side: Side): number {
  if (s.victor || s.active !== side || s.phase !== 'attack') return -1
  for (let lane = s.cursor; lane < CLASH_LANES; lane++) {
    const u = unitAt(s, side, lane)
    // Summoning sickness (Silas, 2026-11-07 PT): a fighter that just landed
    // can block but not strike, unless a special ability (Ambush) says so.
    if (
      u &&
      !u.rooted &&
      !u.attacked &&
      clashPower(s, u) > 0 &&
      !(u.fresh && !has(u, 'ambush'))
    )
      return lane
  }
  return -1
}
/**
 * Automatic alley strike: the fighter hits whatever stands across its own
 * alley. A blocker strikes back at the same moment, so lethal hits trade; an
 * empty alley means the rival boss takes the blow.
 */
export function strikeClash(input: ClashState, side: Side): ClashState {
  const lane = nextClashStrike(input, side)
  if (lane < 0) return input
  const s = structuredClone(input)
  const attacker = unitAt(s, side, lane)!
  const foeSide = opponent(side)
  const defender = unitAt(s, foeSide, lane)
  let attackPower = clashPower(s, attacker)
  if (
    attacker.cardId === 'mau' &&
    attacker.level >= 2 &&
    defender &&
    defender.hp < defender.maxHp
  )
    attackPower += attacker.level === 3 ? 2 : 1
  if (attacker.cardId === 'firebrand' && attacker.level >= 2) {
    const failed = random(s) < (attacker.level === 2 ? 0.5 : 0.25)
    attackPower = failed ? 0 : attackPower * 2
    note(
      s,
      failed
        ? 'Firebrand Dolly misfires!'
        : 'Firebrand Dolly doubles her fire!',
      'clash',
      lane,
    )
  }
  for (const oracle of s.units.filter(
    (u) =>
      u.side === side &&
      u.cardId === 'merc-grease-oracle' &&
      u.level >= 2 &&
      u.uid !== attacker.uid &&
      Math.abs(u.lane - lane) === 1,
  )) {
    attackPower += oracle.level === 3 ? 2 : 1
    evolutionMoment(
      s,
      'merc-grease-oracle',
      side,
      oracle.lane,
      'The Oracle foresaw a stronger strike!',
      'strike',
    )
  }
  if (attacker.cardId === 'pogo' && attacker.level >= 2) {
    const friend = s.units.some(
      (u) => u.side === side && Math.abs(u.lane - lane) === 1,
    )
    if (attacker.level === 3 || friend) {
      attackPower *= 2
      evolutionMoment(
        s,
        'pogo',
        side,
        lane,
        'Pogo Brat doubles its strike!',
        'strike',
      )
    }
  }
  attacker.attacked = true
  attacker.ambushUsed = true
  s.cursor = lane + 1
  const strike: ClashStrike = {
    side,
    lane,
    attacker: attacker.cardId,
    target: defender ? 'unit' : 'boss',
    defender: defender?.cardId,
    dealt: 0,
    returned: 0,
    attackerFell: false,
    defenderFell: false,
  }
  // An unblocked strike runs through the alley first, springing any trap there.
  const trap = defender
    ? undefined
    : s.traps.find((t) => t.side === foeSide && t.lane === lane)
  if (trap) {
    strike.dealt = 0
    strike.returned = springTrap(s, trap, attacker)
    strike.attackerFell = attacker.hp <= 0
    strike.trap = trap.cardId
  } else if (!defender) {
    s.boss[foeSide] -= attackPower
    strike.dealt = attackPower
    note(
      s,
      nameOf(attacker) + ' hits the rival boss for ' + attackPower + '.',
      'boss',
      lane,
    )
    if (attacker.hp > 0) unitEvo(s, attacker, 'boss')
  } else {
    const bribed =
      attacker.cardId === 'merc-bribe-rat' &&
      attacker.level >= 2 &&
      random(s) < (attacker.level === 3 ? 0.75 : 0.5)
    if (bribed)
      evolutionMoment(
        s,
        'merc-bribe-rat',
        side,
        lane,
        'The rival accepts an outrageous bribe!',
        'control',
      )
    const defensePower = defender.rooted || bribed ? 0 : clashPower(s, defender)
    const dealt = damage(
      defender,
      attackPower,
      (has(attacker, 'pierce') ? 1 : 0) +
        (attacker.cardId === 'bulldozer' && attacker.level >= 2 ? 1 : 0),
    )
    const returned = damage(
      attacker,
      defensePower,
      has(defender, 'pierce') ? 1 : 0,
    )
    defender.ambushUsed = true
    strike.dealt = dealt
    strike.returned = returned
    note(
      s,
      nameOf(attacker) +
        ' deals ' +
        dealt +
        ' to ' +
        nameOf(defender) +
        ' and takes ' +
        returned +
        ' back.',
      'clash',
      lane,
    )
    if (has(attacker, 'bulldoze') && defender.hp < 0)
      s.boss[foeSide] += defender.hp
    if (dealt > 0 && attacker.gearLevels?.shredders === 3) {
      const victim = s.units.find(
        (u) =>
          u.side === foeSide &&
          u.uid !== defender.uid &&
          Math.abs(u.lane - lane) === 1,
      )
      if (victim) damage(victim, Math.max(1, Math.ceil(dealt / 2)))
    }
    if (dealt > 0 && attacker.gearLevels?.wreckingfist === 3) {
      s.boss[foeSide] -= 2
      const victim = s.units.find(
        (u) =>
          u.side === foeSide &&
          u.uid !== defender.uid &&
          Math.abs(u.lane - lane) === 1,
      )
      if (victim) damage(victim, 1)
    }
    if (
      bribed &&
      attacker.level === 3 &&
      defender.hp <= 0 &&
      defender.attack <= 3 &&
      !defender.token
    ) {
      const free = nearestFreeAlley(s, side, lane)
      if (free >= 0) {
        summonEcho(s, side, defender.cardId, free, 2, 1)
        evolutionMoment(
          s,
          'merc-bribe-rat',
          side,
          lane,
          'Bribe-Licked Rat recruits a defeated rival!',
          'summon',
        )
      }
    }
    if (attacker.cardId === 'bulldozer' && attacker.level === 3 && dealt > 0) {
      s.boss[foeSide] -= 2
      evolutionMoment(
        s,
        'bulldozer',
        side,
        lane,
        'Bulldozard drives through the blocker for 2 boss damage!',
        'blast',
      )
    }
    if (
      dealt > 0 &&
      attacker.cardId === 'mau' &&
      attacker.level === 3 &&
      defender.hp < defender.maxHp
    ) {
      const victim = s.units.find(
        (u) =>
          u.side === foeSide &&
          u.uid !== defender.uid &&
          Math.abs(u.lane - lane) === 1,
      )
      if (victim) {
        damage(victim, 2)
        evolutionMoment(
          s,
          'mau',
          side,
          lane,
          'Mau-77 follows through into the neighboring alley!',
          'strike',
        )
      }
    }
    if (dealt > 0 && has(attacker, 'snare')) stun(defender)
    if (
      dealt > 0 &&
      attacker.cardId === 'frogtrooper' &&
      attacker.level === 3
    ) {
      for (const nearby of s.units.filter(
        (v) => v.side === foeSide && Math.abs(v.lane - lane) === 1,
      ))
        stun(nearby)
    }
    if (dealt > 0 && has(attacker, 'leech'))
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + 1)
    if (dealt > 0 && attacker.cardId === 'razor' && attacker.level >= 2) {
      let healed = 0
      for (const friend of s.units.filter(
        (u) =>
          u.side === side &&
          (attacker.level === 3 || Math.abs(u.lane - lane) === 1),
      )) {
        if (friend.hp < friend.maxHp) healed++
        friend.hp = Math.min(friend.maxHp, friend.hp + 1)
      }
      if (healed)
        evolutionMoment(
          s,
          'razor',
          side,
          lane,
          'Razorwing shares a blood chorus with ' + healed + ' friends!',
          'heal',
        )
    }
    if (dealt > 0 && attacker.cardId === 'eel' && attacker.level >= 2) {
      const shocked =
        attacker.level === 3
          ? s.units.filter(
              (u) =>
                u.side === foeSide &&
                u.uid !== defender.uid &&
                s.traps.some((t) => t.side === foeSide && t.lane === u.lane),
            )
          : defender.rooted
            ? s.units
                .filter(
                  (u) => u.side === foeSide && Math.abs(u.lane - lane) === 1,
                )
                .slice(0, 1)
            : []
      for (const rival of shocked) damage(rival, attacker.level === 3 ? 2 : 1)
      if (shocked.length)
        evolutionMoment(
          s,
          'eel',
          side,
          lane,
          'Eel Courier arcs electricity into ' +
            shocked.length +
            ' distant rival lanes!',
          'blast',
        )
    }
    if (returned > 0 && has(defender, 'leech'))
      defender.hp = Math.min(defender.maxHp, defender.hp + 1)
    if (defender.hp <= 0 && has(attacker, 'collect')) {
      attacker.attack = clamp(attacker.attack + 1, 1, 10)
      if (
        s.units.some(
          (u) => u.side === side && u.cardId === 'mogul' && u.level === 3,
        )
      ) {
        s.boss[side] = Math.min(clashBossCap(s, side), s.boss[side] + 1)
        evolutionMoment(
          s,
          'mogul',
          side,
          lane,
          'The Meat Mogul cashes a collector knockout for boss life!',
          'heal',
        )
      }
    }
    if (attacker.hp <= 0 && has(defender, 'collect')) {
      defender.attack = clamp(defender.attack + 1, 1, 10)
      if (
        s.units.some(
          (u) => u.side === foeSide && u.cardId === 'mogul' && u.level === 3,
        )
      ) {
        s.boss[foeSide] = Math.min(
          clashBossCap(s, foeSide),
          s.boss[foeSide] + 1,
        )
        evolutionMoment(
          s,
          'mogul',
          foeSide,
          lane,
          'The Meat Mogul cashes a defender knockout for boss life!',
          'heal',
        )
      }
    }
    strike.attackerFell = attacker.hp <= 0
    strike.defenderFell = defender.hp <= 0
  }
  if (defender && attacker.hp > 0) {
    if (strike.dealt > 0) unitEvo(s, attacker, 'hit', defender)
    if (defender.hp <= 0) unitEvo(s, attacker, 'kill', defender)
  }
  if (attacker.hp > 0) unitEvo(s, attacker, 'strike', defender)
  s.strike = strike
  casualties(s)
  // Fatal-hit rescues happen during casualties: present the surviving unit
  // correctly rather than flashing a false knockout in the combat UI.
  strike.attackerFell = !s.units.some((u) => u.uid === attacker.uid)
  if (defender)
    strike.defenderFell = !s.units.some((u) => u.uid === defender.uid)
  checkWinner(s)
  s.commands.push({ t: 'strike', side })
  return s
}
/**
 * End this side's turn once every ready fighter has struck. Unplayed hand
 * cards expire, never carry over.
 */
export function endClashTurn(input: ClashState, side: Side): ClashState {
  if (input.victor || input.active !== side || input.phase !== 'attack')
    return input
  if (nextClashStrike(input, side) >= 0) return input
  const s = structuredClone(input)
  discardHand(s, side)
  // Contract shields its neighbors for the opponent's NEXT attack turn. Doing
  // this at round end would clear the first player's shields immediately.
  for (const holder of s.units.filter(
    (u) => u.side === side && u.gearLevels?.contract === 3,
  ))
    for (const neighbor of s.units.filter(
      (u) =>
        u.side === side &&
        u.uid !== holder.uid &&
        Math.abs(u.lane - holder.lane) === 1,
    ))
      neighbor.guard = clamp((neighbor.guard ?? 0) + 1, 0, 3)
  for (const u of s.units.filter((v) => v.side === side)) {
    u.rooted = false
    u.fresh = false
  }
  s.commands.push({ t: 'end', side })
  if (side === 'player') {
    startTurn(s, 'enemy')
    return s
  }
  // Both crews finished. Silas, 2026-11-07 PT: "fighters shouldn't heal
  // between rounds" — damage sticks; only Regen fighters patch themselves up.
  for (const healer of s.units.filter(
    (u) =>
      u.level >= 2 &&
      ['calico', 'welder', 'merc-roof-dentist'].includes(u.cardId),
  )) {
    for (const neighbor of s.units.filter(
      (u) =>
        u.side === healer.side &&
        u.uid !== healer.uid &&
        Math.abs(u.lane - healer.lane) === 1,
    ))
      neighbor.hp = Math.min(
        neighbor.maxHp,
        neighbor.hp + (healer.level === 3 ? 2 : 1),
      )
  }
  for (const unit of [...s.units]) if (unit.hp > 0) unitEvo(s, unit, 'roundEnd')
  casualties(s)
  checkWinner(s)
  if (s.victor) return s
  for (const unit of s.units) {
    if (has(unit, 'regen')) unit.hp = Math.min(unit.maxHp, unit.hp + 1)
    if ((unit.gearLevels?.contract ?? 0) >= 2) {
      s.boss[unit.side] = Math.min(
        clashBossCap(s, unit.side),
        s.boss[unit.side] + 1,
      )
      if (unit.gearLevels?.contract === 3)
        for (const friend of s.units.filter(
          (u) =>
            u.side === unit.side &&
            u.uid !== unit.uid &&
            Math.abs(u.lane - unit.lane) === 1,
        )) {
          friend.hp = Math.min(friend.maxHp, friend.hp + 1)
        }
    }
    unit.surge = 0
  }
  note(
    s,
    'ROUND END: Regen and clinic crews mend fighters; other wounds remain.',
    'turn',
  )
  if (s.round >= CLASH_ROUND_LIMIT) {
    s.victor =
      s.boss.player === s.boss.enemy
        ? 'draw'
        : s.boss.player > s.boss.enemy
          ? 'player'
          : 'enemy'
    note(s, 'Final bell! Highest boss health wins.', 'turn')
    return s
  }
  s.round++
  startTurn(s, 'player')
  return s
}
export function applyClashCommand(
  s: ClashState,
  command: ClashCommand,
): ClashState {
  switch (command.t) {
    case 'play':
      return playClash(
        s,
        command.side,
        command.card,
        command.lane,
        command.choice,
      )
    case 'pass':
      return passClash(s, command.side)
    case 'strike':
      return strikeClash(s, command.side)
    case 'end':
      return endClashTurn(s, command.side)
    case 'power':
      return useClashPower(s, command.side, command.lane, command.team)
  }
}
export function replayClash(
  player: TeamId,
  enemy: TeamId,
  seed: number,
  commands: ClashCommand[],
  options: ClashOptions = {},
): ClashState {
  return commands.reduce(
    applyClashCommand,
    createClash(player, enemy, seed, options),
  )
}

/** The faction powers `side` brings: its crew's, plus its ally's in ALLIANCE. */
export function clashPowers(s: ClashState, side: Side): TeamId[] {
  const ally = s.format === 'alliance' ? s.allies?.[side] : null
  return ally && ally !== s.teams[side]
    ? [s.teams[side], ally]
    : [s.teams[side]]
}
/** Whether `side` has already fired `team`'s power this match. */
export function clashPowerSpent(
  s: ClashState,
  side: Side,
  team: TeamId,
): boolean {
  return !!s.powersUsed?.[side]?.includes(team)
}
/** OVERCHARGED: boss at half life or less, or every alley holds a fighter. */
export function clashOvercharged(s: ClashState, side: Side): boolean {
  if (s.boss[side] * 2 <= clashBossCap(s, side)) return true
  for (let lane = 0; lane < CLASH_LANES; lane++)
    if (!unitAt(s, side, lane)) return false
  return true
}
/** Whether `side` may fire `team`'s power (default: its own crew's) at `lane` now. */
export function canClashPower(
  s: ClashState,
  side: Side,
  lane = 0,
  team: TeamId = s.teams[side],
): boolean {
  if (
    !clashPowers(s, side).includes(team) ||
    clashPowerSpent(s, side, team) ||
    s.victor ||
    s.active !== side ||
    s.phase !== 'play'
  )
    return false
  const power = factionPower(team)
  if (power.target === 'none') return true
  if (!inside(lane)) return false
  return !!unitAt(s, power.target === 'own' ? side : opponent(side), lane)
}
/**
 * Fire a faction power: each once per match, during your own card-play
 * phase, without spending a card play. Overcharged, it uses its bigger number.
 */
export function useClashPower(
  input: ClashState,
  side: Side,
  lane = 0,
  team: TeamId = input.teams[side],
): ClashState {
  if (!canClashPower(input, side, lane, team)) return input
  const s = structuredClone(input)
  const foe = opponent(side)
  const power = factionPower(team)
  const overcharged = clashOvercharged(s, side)
  const n = power.amount[overcharged ? 1 : 0]
  const mine = s.units.filter((u) => u.side === side)
  switch (power.team) {
    case 'catgirls':
      for (const u of mine) {
        u.hp = u.maxHp
        u.rooted = false
        u.fresh = false
        u.surge += n
      }
      break
    case 'bloodfairies':
      for (const u of mine) u.surge += n
      break
    case 'ironjaw':
      for (const u of mine) u.guard = n
      break
    case 'riot':
      for (const u of s.units.filter((v) => v.side === foe)) damage(u, n)
      break
    case 'undertow': {
      const u = unitAt(s, foe, lane)!
      u.hp -= n
      stun(u)
      break
    }
    case 'exchange':
      s.boss[foe] -= n
      s.boss[side] = Math.min(clashBossCap(s, side), s.boss[side] + n)
      break
  }
  s.powersUsed ??= { player: [], enemy: [] }
  s.powersUsed[side] = [...(s.powersUsed[side] ?? []), team]
  note(
    s,
    (side === 'player' ? 'You' : 'The rival') +
      (overcharged ? ' OVERCHARGE ' : ' unleash ') +
      power.name +
      (overcharged ? '! ' + power.overcharge : '!'),
    'play',
    power.target === 'none' ? undefined : lane,
  )
  casualties(s)
  s.commands.push(
    team === s.teams[side]
      ? { t: 'power', side, lane }
      : { t: 'power', side, lane, team },
  )
  checkWinner(s)
  return s
}

/**
 * How much the CPU wants its faction power right now, and where to aim it.
 * Public board facts only. Scores near 6+ are worth the one-time use.
 */
export function clashPowerValue(
  s: ClashState,
  side: Side,
  team: TeamId = s.teams[side],
): { value: number; lane: number } {
  const foe = opponent(side)
  const n = factionPower(team).amount[clashOvercharged(s, side) ? 1 : 0]
  const mine = s.units.filter((u) => u.side === side)
  const theirs = s.units.filter((u) => u.side === foe)
  const ready = (u: ClashUnit) =>
    !u.rooted && !u.attacked && (!u.fresh || has(u, 'ambush'))
  let best = { value: 0, lane: 0 }
  switch (team) {
    case 'catgirls':
      best.value = mine.reduce(
        (sum, u) =>
          sum +
          u.maxHp -
          u.hp +
          n * 0.75 +
          (u.rooted || (u.fresh && !has(u, 'ambush')) ? 2 : 0),
        0,
      )
      break
    case 'bloodfairies':
      best.value = mine.filter(ready).length * n * 0.8
      break
    case 'ironjaw':
      best.value =
        mine.length * n * 0.4 +
        theirs.filter((u) => !u.rooted && unitAt(s, side, u.lane)).length *
          n *
          0.4
      break
    case 'riot':
      best.value = theirs.reduce(
        (sum, u) =>
          sum +
          Math.min(Math.max(0, n - u.armor), u.hp) +
          (u.hp <= n - u.armor ? 2 + u.attack : 0),
        0,
      )
      break
    case 'undertow':
      for (const u of theirs) {
        // Save the snipe for a kill on a heavy hitter.
        const value =
          u.hp <= n ? 1 + clashPower(s, u) * 1.2 + (u.maxHp >= 8 ? 2 : 0) : 0
        if (value > best.value) best = { value, lane: u.lane }
      }
      break
    case 'exchange':
      best.value =
        s.boss[foe] <= n
          ? 99
          : Math.min(n, clashBossCap(s, side) - s.boss[side]) +
            (s.round >= 5 ? 3 : 0)
      break
  }
  return best
}
/**
 * Price an evolved card using the board it will meet. The old CPU awarded
 * every arrival effect the same flat bonus, even if no ally was hurt or no
 * rival stood within range. This estimate never mutates state or rolls RNG.
 */
function cpuEvolutionPayoff(
  s: ClashState,
  side: Side,
  card: Card,
  lane: number,
  level: number,
  pick: EvoPick,
): number {
  const evolved = clashEvolutionStage(card.id, level, pick)
  if (!evolved) return 0
  const foe = opponent(side)
  const own = unitAt(s, side, lane)
  const target = unitAt(s, aim(card) === 'own' ? side : foe, lane)
  const ctx: EvoContext = {
    side,
    lane,
    cardId: card.id,
    level,
    ...(card.kind === 'equipment' && own ? { self: own } : {}),
    ...(target ? { target } : {}),
  }
  // The real engine's randomFoe selector advances the match RNG. CPU
  // evaluation is read-only: estimating a random target must never roll it.
  const cpuTargets = (to: EvoScope): ClashUnit[] =>
    to === 'randomFoe'
      ? s.units.filter((u) => u.side === foe && u.hp > 0).slice(0, 1)
      : evoScope(s, ctx, to)
  const scopeCount = (to: EvoScope): number => {
    if (to === 'self' && card.kind === 'creature') return 1
    if (to === 'target' && card.kind === 'trap') return 1
    return cpuTargets(to).length
  }
  const friendly = (to: EvoScope): boolean =>
    [
      'self',
      'allies',
      'otherAllies',
      'adjacentAllies',
      'woundedAlly',
      'woundedAllies',
      'healthyAllies',
    ].includes(to) ||
    (to === 'target' && aim(card) === 'own')
  const evaluate = (a: EvoAction): number => {
    switch (a.do) {
      case 'chance':
        return (
          (a.p / 100) * a.then.reduce((sum, next) => sum + evaluate(next), 0)
        )
      case 'if':
        return evoCondition(s, ctx, a.cond)
          ? a.then.reduce((sum, next) => sum + evaluate(next), 0)
          : 0
      case 'summon': {
        const free = Array.from({ length: CLASH_LANES }, (_, i) => i).filter(
          (i) =>
            !unitAt(s, side, i) && (i !== lane || card.kind !== 'creature'),
        )
        const sites =
          a.where === 'everyEmpty'
            ? free.length
            : a.where === 'neighbors'
              ? free.filter((i) => Math.abs(i - lane) === 1).length
              : Math.min(1, free.length)
        return sites * (1.4 + a.attack * 0.75 + a.hp * 0.2)
      }
      case 'boss':
      case 'mend':
        return (
          a.n *
          (a.do === 'boss'
            ? 0.9
            : s.boss[side] < clashBossCap(s, side)
              ? 0.6
              : 0)
        )
      case 'draw':
        return a.n * 1.6
      case 'promote': {
        const cards = s[a.zone === 'hand' ? 'hands' : 'decks'][side]
        return cards.some(
          (id) => id !== card.id && clashLevel(s, side, id) < CLASH_MAX_LEVEL,
        )
          ? 2.2
          : 0
      }
      case 'execute':
        return cpuTargets(a.to).some(
          (u) =>
            u.side === foe && u.hp < u.maxHp && u.hp <= a.threshold && !u.token,
        )
          ? 6
          : 0
      case 'revive':
        return (s.fallen?.[side].length ?? 0) > 0 &&
          s.units.filter((u) => u.side === side).length < CLASH_LANES
          ? 3.8
          : 0
      case 'rearm':
        return 2.6
      case 'retreat':
        return 1
      case 'pounce':
        return (own?.attack ?? clashBalance(card, level).attack) * 0.7
      case 'duel':
        return scopeCount(a.to) * 1.5
      case 'damage':
        return scopeCount(a.to) * a.n * (friendly(a.to) ? -0.75 : 0.85)
      case 'heal': {
        const hurt = cpuTargets(a.to).reduce(
          (sum, u) => sum + Math.min(a.n, u.maxHp - u.hp),
          0,
        )
        return hurt * 0.85
      }
      case 'power':
        return (
          scopeCount(a.to) *
          a.n *
          (friendly(a.to) ? (a.lasting ? 1.8 : 1.1) : -1.1)
        )
      case 'life':
        return scopeCount(a.to) * a.n * 0.8
      case 'armor':
        return cpuTargets(a.to).reduce(
          (sum, u) => sum + Math.min(a.n, 3 - u.armor) * 2,
          0,
        )
      case 'guard':
        return scopeCount(a.to) * a.n * 0.7
      case 'stun':
        return cpuTargets(a.to).filter((u) => !u.rooted).length * 3
      case 'cleanse':
        return cpuTargets(a.to).filter((u) => u.rooted).length * 2
      case 'grant':
        return (
          cpuTargets(a.to).filter((u) => !u.keywords.includes(a.keyword))
            .length * 2.4
        )
      case 'rescue':
        return cpuTargets(a.to).filter((u) => !u.lastChance).length * 1.4
      case 'shift': {
        const mover = a.to === 'self' ? ctx.self : ctx.target
        if (mover?.rooted) return 0
        const source = mover?.lane ?? lane
        return [source - 1, source + 1].some(
          (destination) =>
            inside(destination) &&
            !unitAt(s, side, destination) &&
            (a.where === 'safe'
              ? !unitAt(s, foe, destination)
              : !!unitAt(s, foe, destination)),
        )
          ? 1.5
          : 0
      }
    }
  }
  const frequency: Record<EvoTrigger, number> = {
    enter: 1,
    spring: 0.65,
    hit: 0.45,
    kill: 0.3,
    boss: 0.4,
    strike: 0.45,
    death: 0.3,
    turnStart: 0.45,
    roundEnd: 0.4,
  }
  const abilities = evolved.abilities.reduce(
    (sum, ability) =>
      sum +
      frequency[ability.when] *
        ability.do.reduce((total, action) => total + evaluate(action), 0),
    0,
  )
  const friends = s.units.filter((u) => u.side === side && u.hp > 0)
  const rivals = s.units.filter((u) => u.side === foe && u.hp > 0)
  const nearby = friends.filter((u) => Math.abs(u.lane - lane) === 1).length
  const rules = evolved.static
  const passive = rules
    ? (rules.pacifist ? -2.5 : 0) +
      (rules.aura
        ? (rules.aura.to === 'adjacentAllies' ? nearby : friends.length) *
          rules.aura.n *
          1.1
        : 0) +
      (rules.hex
        ? rivals.filter((u) =>
            rules.hex?.to === 'across'
              ? u.lane === lane
              : Math.abs(u.lane - lane) <= 1,
          ).length * rules.hex.n
        : 0) +
      (rules.pack && nearby ? rules.pack * 1.3 : 0) +
      (rules.lone && !nearby ? rules.lone * 1.2 : 0) +
      (rules.bully
        ? rivals.filter((u) => u.rooted).length * rules.bully * 0.6
        : 0)
    : 0
  // Alliance's wider card pool and one-time general power already create many
  // swing turns. Discount speculative evolution payoffs in that format;
  // the board-read still chooses between actual useful stage effects.
  return (
    clamp(
      abilities +
        passive +
        (clashEffectivePlayCost(s, side, card) === 0 ? 3 : 0),
      -6,
      14,
    ) * (s.format === 'alliance' ? 0.35 : 0.65)
  )
}

/** The CPU fires its faction power once its value reaches this. */
export const CLASH_CPU_POWER_THRESHOLD = 7
/** Baseline retained for paired, seed-and-seat-controlled CPU evaluations. */
export type ClashCpuPolicy = 'baseline' | 'evolution-aware'

/** Deterministic CPU using public fighters + only its own hand. */
export function chooseClashCpu(
  s: ClashState,
  side: Side = 'enemy',
  policy: ClashCpuPolicy = 'evolution-aware',
): ClashCommand {
  if (s.victor || s.active !== side) return { t: 'end', side }
  if (s.phase === 'attack')
    return nextClashStrike(s, side) >= 0
      ? { t: 'strike', side }
      : { t: 'end', side }
  const threshold = s.round >= 10 ? 1 : CLASH_CPU_POWER_THRESHOLD
  let fire: { value: number; lane: number; team: TeamId } | undefined
  for (const team of clashPowers(s, side)) {
    if (clashPowerSpent(s, side, team)) continue
    const { value, lane } = clashPowerValue(s, side, team)
    if (
      value >= threshold &&
      (!fire || value > fire.value) &&
      canClashPower(s, side, lane, team)
    )
      fire = { value, lane, team }
  }
  if (fire)
    return fire.team === s.teams[side]
      ? { t: 'power', side, lane: fire.lane }
      : { t: 'power', side, lane: fire.lane, team: fire.team }
  const foeSide = opponent(side)
  let best:
    { score: number; card: string; lane: number; choice?: 1 } | undefined
  for (const id of s.hands[side]) {
    const card = cardById(id)
    const b = clashBalance(card, clashLevel(s, side, id))
    for (let lane = 0; lane < CLASH_LANES; lane++) {
      if (!canClashPlay(s, side, id, lane)) continue
      const mine = unitAt(s, side, lane)
      const foe = unitAt(s, foeSide, lane)
      let score: number
      if (card.kind === 'creature') {
        score = 2 + b.attack * 1.2 + b.hp * 0.5 + b.armor * 1.5
        if (mine) score -= 3 + mine.attack * 1.2 + mine.hp * 0.5
        if (foe) {
          const foePower = clashPower(s, foe)
          if (b.attack >= foe.hp + foe.armor) score += 3 + foe.attack
          if (foePower >= b.hp + b.armor) score -= 2.5
          // Blocking also shields our boss from that fighter's next strike.
          score += foePower * 0.6
        } else score += b.attack * 0.9
        if ((card.keywords ?? []).includes('swarm'))
          score += s.units.some(
            (u) => u.side === side && Math.abs(u.lane - lane) === 1,
          )
            ? 1.5
            : 0
      } else if (card.kind === 'trap') {
        score =
          foe && !mine
            ? 2 +
              Math.min(b.power, foe.hp) +
              (b.power >= foe.hp + foe.armor ? 2 : 0)
            : mine
              ? 0.4
              : 1.4
        // Value the snare's real payoff on the fighter that will spring it.
        if (foe && !mine) {
          if (isArmorCutterSnare(card)) {
            if (foe.armor > 0) score += 1.5
            if (has(foe, 'volatile')) score += 1.5
          }
          if (card.roots && !foe.snareWard) score += clashPower(s, foe) * 0.4
        }
      } else if (card.effect === 'scan')
        score = s.traps.some((t) => t.side === foeSide && t.lane === lane)
          ? 5
          : 0.5
      else if (aim(card) === 'own') {
        const across = unitAt(s, foeSide, lane)
        score =
          1.5 +
          (mine?.attack ?? 0) * 0.6 +
          (across ? 0.5 : 1.5) +
          (card.effect === 'heal' && mine
            ? Math.min(b.power, mine.maxHp - mine.hp) * 1.2 - 1.5
            : 0)
        if (
          (s.format !== 'alliance' || card.kind === 'equipment') &&
          mine &&
          card.effect === 'grant'
        ) {
          const missing = (card.grants ?? []).filter(
            (keyword) => !mine.keywords.includes(keyword),
          )
          score += missing.length * 2.8 + (b.level - 1) * 1.25
          if (!missing.length && b.level === 1) score -= 3
        }
        if (mine && card.kind === 'equipment') {
          // Gear survives turns; its price cannot be assessed as one small
          // immediate spell. Reward protecting a healthy, productive fighter.
          score +=
            1.8 + Math.min(mine.attack, 6) * 0.55 + (mine.hp >= 6 ? 1 : 0)
        }
        if (
          (s.format !== 'alliance' || card.kind === 'equipment') &&
          mine &&
          (card.effect === 'sharpen' || card.effect === 'boost')
        )
          score +=
            card.kind === 'equipment'
              ? Math.min(b.bonus, Math.max(0, 10 - mine.attack)) * 1.8
              : across
                ? b.power * 0.7
                : 0
        if (
          (s.format !== 'alliance' || card.kind === 'equipment') &&
          mine &&
          card.effect === 'armor'
        )
          score += Math.max(0, 3 - mine.armor) * 2
      } else
        score =
          2.2 +
          (foe && b.power >= foe.hp + foe.armor
            ? 5 + foe.attack
            : b.power * 0.8) +
          (foe && !mine ? 1 : 0)
      // A choose-one evolves toward the actual board, not a generic glow.
      const prefer = clashEvolutionChoice(id, b.level)
        ? clashEvolutionCpuPick(id)
        : undefined
      const choice =
        prefer &&
        !evoCondition(s, { side, lane, cardId: id, level: b.level }, prefer)
          ? (1 as const)
          : undefined
      if (s.format === 'alliance') {
        if (policy === 'baseline') {
          // Exact pre-change comparator for paired match/seat experiments.
          const evolved = clashEvolutionStage(id, b.level)
          if (evolved?.abilities.some((ability) => ability.when === 'enter'))
            score += b.level >= 3 ? 2.5 : 1.2
        } else {
          // A read-only estimate respects actual targets and conditions.
          // Keep the extra value bounded: two crew powers already make
          // Alliance swingy, and expensive combo cards still need fighters.
          score += clamp(
            cpuEvolutionPayoff(s, side, card, lane, b.level, choice ?? 0),
            -2,
            3,
          )
          if (b.level === 1)
            score += clamp(
              Math.max(0, cpuEvolutionPayoff(s, side, card, lane, 2, 0)) * 0.12,
              0,
              0.7,
            )
        }
      } else {
        score += cpuEvolutionPayoff(s, side, card, lane, b.level, choice ?? 0)
        // Reward deliberate future leveling without counting it as immediate.
        if (b.level === 1)
          score +=
            Math.max(0, cpuEvolutionPayoff(s, side, card, lane, 2, 0)) * 0.2
      }
      score /= b.plays
      if (!best || score > best.score)
        best = { score, card: id, lane, ...(choice ? { choice } : {}) }
    }
  }
  return best
    ? best.choice
      ? { t: 'play', side, card: best.card, lane: best.lane, choice: 1 }
      : { t: 'play', side, card: best.card, lane: best.lane }
    : { t: 'pass', side }
}
