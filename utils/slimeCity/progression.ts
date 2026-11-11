// Slime City account progression rules. Pure seeded rewards/pack draws used by
// the authenticated server, which exclusively owns wallet and inventory writes.
// The real-money/cash-out path is deliberately absent.
import { MERCENARY_RARE_IDS } from './mercenaryCards'
import { BASE_CARD_IDS, BASE_CARD_SET } from './baseCollection'
import { GUTTER_CROWN_WAVE_THREE_RARE_IDS } from './gutterCrownWaveThree'
import { GUTTER_CROWN_FINALE_A_RARE_IDS } from './gutterCrownFinaleA'
import { GUTTER_CROWN_FINALE_B_RARE_IDS } from './gutterCrownFinaleB'
import {
  CARDS,
  TEAMS,
  seededHash,
  type Card,
  type Command,
  type MatchState,
  type Side,
  type TeamId,
} from './prototypes'

export const PACK_COST = 100
export const PACK_SIZE = 3
export const DAILY_PAID_BATTLES = 10
export type Rarity = 'common' | 'uncommon' | 'rare'
export type ChallengePeriod = 'daily' | 'weekly'
export type ChallengeMetric =
  'battles' | 'wins' | 'blackoutWins' | 'creatures' | 'plays' | 'crews'
export interface Challenge {
  id: string
  period: ChallengePeriod
  title: string
  description: string
  metric: ChallengeMetric
  target: number
  meat: number
  xp: number
}
export interface ChallengeWindow {
  key: string
  battles: number
  wins: number
  blackoutWins: number
  creatures: number
  plays: number
  crews: string[]
  paidBattles: number
  claimed: string[]
}
export interface Progression {
  version: 1
  meat: number
  xp: number
  wins: number
  losses: number
  draws: number
  cards: string[]
  receipts: string[]
  opened: number
  lastPack: string[]
  daily: ChallengeWindow
  weekly: ChallengeWindow
  lastReward: string
}
export const CHALLENGES: Challenge[] = [
  {
    id: 'daily-entry',
    period: 'daily',
    title: 'Punch the Meat Clock',
    description: 'Finish one CPU bout. Every shift pays in Meat.',
    metric: 'battles',
    target: 1,
    meat: 20,
    xp: 20,
  },
  {
    id: 'daily-victor',
    period: 'daily',
    title: 'Fresh Cut',
    description: 'Win a Clash battle while the Meat is still warm.',
    metric: 'blackoutWins',
    target: 1,
    meat: 35,
    xp: 35,
  },
  {
    id: 'daily-summons',
    period: 'daily',
    title: 'Stock the Freezer',
    description: 'Play three creature cards in CPU bouts.',
    metric: 'creatures',
    target: 3,
    meat: 25,
    xp: 25,
  },
  {
    id: 'weekly-victories',
    period: 'weekly',
    title: 'Prime Cut Champion',
    description: 'Win five CPU bouts. The Exchange weighs every victory.',
    metric: 'wins',
    target: 5,
    meat: 125,
    xp: 150,
  },
  {
    id: 'weekly-crews',
    period: 'weekly',
    title: 'Mixed Grill',
    description: 'Fight using three different crews.',
    metric: 'crews',
    target: 3,
    meat: 85,
    xp: 100,
  },
  {
    id: 'weekly-cards',
    period: 'weekly',
    title: 'Butcher-Paper Riot',
    description: 'Play 24 cards in CPU bouts.',
    metric: 'plays',
    target: 24,
    meat: 110,
    xp: 120,
  },
]
const RARE_IDS = new Set([
  ...TEAMS.flatMap((t) => [
    t.signature,
    t.special[0]!,
    t.special[2]!,
    ...(t.id === 'catgirls' || t.id === 'undertow' ? [t.special[4]!] : []),
  ]),
  // Four rare reserves preserve one rare + two normal cards for all 24 packs.
  'splice-runner',
  'pogo-punk',
  'union-millwright',
  'pipe-seer',
  // Wave two has one marquee creature and one tactical rare per crew.
  's1-roof-phantom',
  's1-surgical-piercers',
  's1-riot-choir',
  's1-confetti-cannon',
  's1-walking-foundry',
  's1-forge-spark',
  's1-blast-radius',
  's1-no-witnesses',
  's1-basement-ghost',
  's1-blue-ink-deadfall',
  's1-executive-repo',
  's1-margin-call',
])
export function rarityOf(card: Card): Rarity {
  if (
    RARE_IDS.has(card.id) ||
    MERCENARY_RARE_IDS.has(card.id) ||
    GUTTER_CROWN_WAVE_THREE_RARE_IDS.has(card.id) ||
    GUTTER_CROWN_FINALE_A_RARE_IDS.has(card.id) ||
    GUTTER_CROWN_FINALE_B_RARE_IDS.has(card.id)
  )
    return 'rare'
  return card.cost >= 3 ? 'uncommon' : 'common'
}
export const RARE_COUNT = CARDS.filter(
  (card) => rarityOf(card) === 'rare',
).length

/** Calendar windows reset at midnight MONDAY (weekly) and midnight daily in Pacific time. */
export function pacificPeriod(date: Date, period: ChallengePeriod): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const val = (part: string) =>
    parts.find((item) => item.type === part)?.value ?? '00'
  const y = Number(val('year')),
    m = Number(val('month')),
    d = Number(val('day'))
  const day = new Date(Date.UTC(y, m - 1, d))
  if (period === 'weekly') {
    const offset = (day.getUTCDay() + 6) % 7
    day.setUTCDate(day.getUTCDate() - offset)
  }
  return day.toISOString().slice(0, 10)
}
function window(date: Date, period: ChallengePeriod): ChallengeWindow {
  return {
    key: pacificPeriod(date, period),
    battles: 0,
    wins: 0,
    blackoutWins: 0,
    creatures: 0,
    plays: 0,
    crews: [],
    paidBattles: 0,
    claimed: [],
  }
}
export function newProgression(now = new Date()): Progression {
  return {
    version: 1,
    meat: 0,
    xp: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    cards: [...BASE_CARD_IDS],
    receipts: [],
    opened: 0,
    lastPack: [],
    daily: window(now, 'daily'),
    weekly: window(now, 'weekly'),
    lastReward:
      'Win CPU battles to earn virtual Meat and XP. In Slime City, Meat is money.',
  }
}
export function refreshPeriods(
  progress: Progression,
  now = new Date(),
): Progression {
  const daily = pacificPeriod(now, 'daily'),
    weekly = pacificPeriod(now, 'weekly')
  if (progress.daily.key === daily && progress.weekly.key === weekly)
    return progress
  return {
    ...progress,
    daily: progress.daily.key === daily ? progress.daily : window(now, 'daily'),
    weekly:
      progress.weekly.key === weekly ? progress.weekly : window(now, 'weekly'),
  }
}
export function levelFor(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1
}
export function nextLevelXp(xp: number): number {
  const level = levelFor(xp)
  return level * level * 100
}
export function challengeValue(
  win: ChallengeWindow,
  metric: ChallengeMetric,
): number {
  return metric === 'crews' ? win.crews.length : win[metric]
}
export function currentChallenges(progress: Progression, now = new Date()) {
  const fresh = refreshPeriods(progress, now)
  return CHALLENGES.map((c) => {
    const win = fresh[c.period]
    const value = challengeValue(win, c.metric)
    return {
      ...c,
      value,
      ready: value >= c.target && !win.claimed.includes(c.id),
      claimed: win.claimed.includes(c.id),
    }
  })
}
/** A battle receipt is based on the actual recorded engine command history. */
export function battleReceipt(match: MatchState): string {
  return JSON.stringify([
    match.mode,
    match.teamId,
    match.foeId,
    match.seed,
    match.rules,
    match.commands,
  ])
}
export interface BattleOutcome {
  victor: Side | 'draw'
  /** Unique per battle: the same transcript is never paid twice. */
  receipt: string
  /** 'blackout' (legacy) or 'clash'. Clash wins count as the pit's wins. */
  mode: string
  teamId: TeamId
  /** The player's card plays and how many of them were creatures. */
  plays: string[]
  /**
   * Clash pays by the after-match report (matchReport.ts): base plus life
   * kept, flawless, damage dealt and knockouts. Absent: the flat base.
   */
  meat?: number
}
export function awardBattle(
  original: Progression,
  match: MatchState,
  now = new Date(),
): Progression {
  if (!match.victor || !match.commands.some((c) => c.t === 'end'))
    return original
  return awardOutcome(
    original,
    {
      victor: match.victor,
      receipt: battleReceipt(match),
      mode: match.mode,
      teamId: match.teamId,
      plays: match.commands
        .filter(
          (c): c is Extract<Command, { t: 'deploy' }> =>
            c.t === 'deploy' && c.side === 'player',
        )
        .map((c) => c.card),
    },
    now,
  )
}
/** Pay one verified battle: base XP and Meat, bounty counters, receipts. */
export function awardOutcome(
  original: Progression,
  outcome: BattleOutcome,
  now = new Date(),
): Progression {
  const receipt = outcome.receipt
  if (original.receipts.includes(receipt)) return original
  const state = refreshPeriods(original, now)
  const victory = outcome.victor === 'player'
  const draw = outcome.victor === 'draw'
  const paid = state.daily.paidBattles < DAILY_PAID_BATTLES
  const earnedXp = !paid ? 0 : victory ? 80 : draw ? 35 : 25
  const earnedMeat = !paid
    ? 0
    : (outcome.meat ?? (victory ? 45 : draw ? 15 : 10))
  const creatures = outcome.plays.filter((id) =>
    CARDS.some((card) => card.id === id && card.kind === 'creature'),
  ).length
  const updateWindow = (win: ChallengeWindow): ChallengeWindow => ({
    ...win,
    battles: win.battles + 1,
    wins: win.wins + Number(victory),
    blackoutWins:
      win.blackoutWins +
      Number(
        victory && (outcome.mode === 'blackout' || outcome.mode === 'clash'),
      ),
    creatures: win.creatures + creatures,
    plays: win.plays + outcome.plays.length,
    crews: win.crews.includes(outcome.teamId)
      ? win.crews
      : [...win.crews, outcome.teamId],
    paidBattles: win.paidBattles + Number(paid),
  })
  return {
    ...state,
    xp: state.xp + earnedXp,
    meat: state.meat + earnedMeat,
    wins: state.wins + Number(victory),
    losses: state.losses + Number(outcome.victor === 'enemy'),
    draws: state.draws + Number(draw),
    receipts: [...state.receipts.slice(-255), receipt],
    daily: updateWindow(state.daily),
    weekly: updateWindow(state.weekly),
    lastReward: paid
      ? `CPU ${victory ? 'win' : draw ? 'draw' : 'loss'} · +${earnedXp} XP · your cut: +${earnedMeat} Meat`
      : 'Battle recorded · daily base-reward cap reached (10 bouts).',
  }
}
export function claimChallenge(
  original: Progression,
  id: string,
  now = new Date(),
): Progression {
  const c = CHALLENGES.find((item) => item.id === id)
  if (!c) return original
  const state = refreshPeriods(original, now)
  const win = state[c.period]
  if (win.claimed.includes(id) || challengeValue(win, c.metric) < c.target)
    return state
  return {
    ...state,
    meat: state.meat + c.meat,
    xp: state.xp + c.xp,
    [c.period]: { ...win, claimed: [...win.claimed, id] },
    lastReward: `${c.title} claimed · +${c.xp} XP · +${c.meat} Meat`,
  }
}
function chooseOne(pool: Card[], seed: number, index: number): Card {
  return [...pool].sort(
    (a, b) =>
      seededHash(seed, index, a.id.length, CARDS.indexOf(a)) -
      seededHash(seed, index, b.id.length, CARDS.indexOf(b)),
  )[0]!
}
/**
 * Silas, 2026-11-11 PT: "we should have the possibility of duplicates, but the
 * pool is all the non-starter cards, so you won't get something that you
 * already had from minute one. But duplicates should have a meat recovery
 * bonus. No more than 50% returned if all three are duplicates."
 */
export const PACK_POOL: readonly Card[] = CARDS.filter(
  (card) => !BASE_CARD_SET.has(card.id),
)
/** Meat back per duplicate: three duplicates return just under half a pack. */
export const PACK_DUPLICATE_REFUND = Math.floor(PACK_COST / (2 * PACK_SIZE))
export function canBuyPack(progress: Progression): boolean {
  return progress.meat >= PACK_COST && PACK_POOL.length > 0
}
/**
 * One rare and two non-rares from the non-starter pool, three different cards
 * per pack. A card you already own can come again; each duplicate refunds
 * PACK_DUPLICATE_REFUND Meat.
 */
export function buyPack(original: Progression, entropy: number): Progression {
  if (!canBuyPack(original)) return original
  let pool = [...PACK_POOL]
  const gained: string[] = []
  for (let slot = 0; slot < PACK_SIZE && pool.length; slot++) {
    const wantRare = slot === 0
    const preferred = pool.filter((c) => (rarityOf(c) === 'rare') === wantRare)
    const card = chooseOne(
      preferred.length ? preferred : pool,
      entropy,
      original.opened * 3 + slot,
    )
    gained.push(card.id)
    pool = pool.filter((c) => c.id !== card.id)
  }
  const fresh = gained.filter((id) => !original.cards.includes(id))
  const duplicates = gained.length - fresh.length
  const refund = duplicates * PACK_DUPLICATE_REFUND
  return {
    ...original,
    meat: original.meat - PACK_COST + refund,
    cards: [...original.cards, ...fresh],
    opened: original.opened + 1,
    lastPack: gained,
    lastReward:
      'Butcher-paper pack unwrapped · ' +
      fresh.length +
      ' NEW' +
      (duplicates
        ? ' · ' +
          duplicates +
          (duplicates === 1 ? ' duplicate' : ' duplicates') +
          ' refunded ' +
          refund +
          ' Meat.'
        : '.'),
  }
}
/** Validate database JSON snapshots; the API owns all writes. */
export function restoreProgression(
  raw: unknown,
  now = new Date(),
): Progression {
  const blank = newProgression(now)
  if (!raw || typeof raw !== 'object') return blank
  const p = raw as Partial<Progression>
  if (
    p.version !== 1 ||
    typeof p.meat !== 'number' ||
    typeof p.xp !== 'number' ||
    !Number.isSafeInteger(p.meat) ||
    !Number.isSafeInteger(p.xp) ||
    p.meat < 0 ||
    p.xp < 0 ||
    !Array.isArray(p.cards) ||
    !Array.isArray(p.receipts) ||
    !p.daily ||
    !p.weekly
  )
    return blank
  const ids = new Set(CARDS.map((c) => c.id))
  // Every account owns the base collection (Silas, 2026-11-10 PT), whatever
  // an older save recorded.
  const cards = [
    ...new Set([
      ...BASE_CARD_IDS,
      ...p.cards.filter(
        (id): id is string => typeof id === 'string' && ids.has(id),
      ),
    ]),
  ]
  const cleanWin = (
    w: ChallengeWindow,
    period: ChallengePeriod,
  ): ChallengeWindow => {
    if (
      !w ||
      typeof w.key !== 'string' ||
      !Array.isArray(w.crews) ||
      !Array.isArray(w.claimed)
    )
      return window(now, period)
    const n = (value: number) =>
      Number.isSafeInteger(value) && value >= 0 ? value : 0
    return {
      key: w.key,
      battles: n(w.battles),
      wins: n(w.wins),
      blackoutWins: n(w.blackoutWins),
      creatures: n(w.creatures),
      plays: n(w.plays),
      paidBattles: n(w.paidBattles),
      crews: w.crews.filter((id) => TEAMS.some((t) => t.id === id)),
      claimed: w.claimed.filter((id) =>
        CHALLENGES.some((c) => c.id === id && c.period === period),
      ),
    }
  }
  return refreshPeriods(
    {
      ...blank,
      meat: p.meat!,
      xp: p.xp!,
      cards,
      wins:
        typeof p.wins === 'number' && Number.isSafeInteger(p.wins) ? p.wins : 0,
      losses:
        typeof p.losses === 'number' && Number.isSafeInteger(p.losses)
          ? p.losses
          : 0,
      draws:
        typeof p.draws === 'number' && Number.isSafeInteger(p.draws)
          ? p.draws
          : 0,
      receipts: p.receipts.filter((id): id is string => typeof id === 'string'),
      opened:
        typeof p.opened === 'number' && Number.isSafeInteger(p.opened)
          ? p.opened
          : 0,
      lastPack: Array.isArray(p.lastPack)
        ? p.lastPack.filter(
            (id): id is string => typeof id === 'string' && cards.includes(id),
          )
        : [],
      lastReward:
        typeof p.lastReward === 'string' && p.lastReward.length < 512
          ? p.lastReward
          : '',
      daily: cleanWin(p.daily, 'daily'),
      weekly: cleanWin(p.weekly, 'weekly'),
    },
    now,
  )
}
