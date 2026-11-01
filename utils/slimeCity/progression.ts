// Slime City account progression rules. Pure seeded rewards/pack draws used by
// the authenticated server, which exclusively owns wallet and inventory writes.
// The real-money/cash-out path is deliberately absent.
import {
  CARDS,
  TEAMS,
  seededHash,
  type Card,
  type Command,
  type MatchState,
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
    title: 'Clock In',
    description: 'Finish one CPU bout.',
    metric: 'battles',
    target: 1,
    meat: 20,
    xp: 20,
  },
  {
    id: 'daily-victor',
    period: 'daily',
    title: 'Own the Pit',
    description: 'Win a Blackout battle.',
    metric: 'blackoutWins',
    target: 1,
    meat: 35,
    xp: 35,
  },
  {
    id: 'daily-summons',
    period: 'daily',
    title: 'Union of Monsters',
    description: 'Play three creature cards in CPU bouts.',
    metric: 'creatures',
    target: 3,
    meat: 25,
    xp: 25,
  },
  {
    id: 'weekly-victories',
    period: 'weekly',
    title: 'Street Champion',
    description: 'Win five CPU bouts.',
    metric: 'wins',
    target: 5,
    meat: 125,
    xp: 150,
  },
  {
    id: 'weekly-crews',
    period: 'weekly',
    title: 'Six-Crew Sampler',
    description: 'Fight using three different crews.',
    metric: 'crews',
    target: 3,
    meat: 85,
    xp: 100,
  },
  {
    id: 'weekly-cards',
    period: 'weekly',
    title: 'Cardboard Riot',
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
])
export function rarityOf(card: Card): Rarity {
  if (RARE_IDS.has(card.id)) return 'rare'
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
    cards: [],
    receipts: [],
    opened: 0,
    lastPack: [],
    daily: window(now, 'daily'),
    weekly: window(now, 'weekly'),
    lastReward: 'Win CPU battles to earn virtual Meat and XP.',
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
export function awardBattle(
  original: Progression,
  match: MatchState,
  now = new Date(),
): Progression {
  if (!match.victor || !match.commands.some((c) => c.t === 'end'))
    return original
  const receipt = battleReceipt(match)
  if (original.receipts.includes(receipt)) return original
  const state = refreshPeriods(original, now)
  const victory = match.victor === 'player'
  const draw = match.victor === 'draw'
  const paid = state.daily.paidBattles < DAILY_PAID_BATTLES
  const earnedXp = !paid ? 0 : victory ? 80 : draw ? 35 : 25
  const earnedMeat = !paid ? 0 : victory ? 45 : draw ? 15 : 10
  const events = match.commands.filter(
    (c): c is Extract<Command, { t: 'deploy' }> =>
      c.t === 'deploy' && c.side === 'player',
  )
  const creatures = events.filter((c) =>
    CARDS.some((card) => card.id === c.card && card.kind === 'creature'),
  ).length
  const updateWindow = (win: ChallengeWindow): ChallengeWindow => ({
    ...win,
    battles: win.battles + 1,
    wins: win.wins + Number(victory),
    blackoutWins:
      win.blackoutWins + Number(victory && match.mode === 'blackout'),
    creatures: win.creatures + creatures,
    plays: win.plays + events.length,
    crews: win.crews.includes(match.teamId)
      ? win.crews
      : [...win.crews, match.teamId],
    paidBattles: win.paidBattles + Number(paid),
  })
  return {
    ...state,
    xp: state.xp + earnedXp,
    meat: state.meat + earnedMeat,
    wins: state.wins + Number(victory),
    losses: state.losses + Number(match.victor === 'enemy'),
    draws: state.draws + Number(draw),
    receipts: [...state.receipts.slice(-255), receipt],
    daily: updateWindow(state.daily),
    weekly: updateWindow(state.weekly),
    lastReward: paid
      ? `CPU ${victory ? 'win' : draw ? 'draw' : 'loss'} · +${earnedXp} XP · +${earnedMeat} Meat`
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
export function canBuyPack(progress: Progression): boolean {
  const unowned = CARDS.filter((card) => !progress.cards.includes(card.id))
  return (
    progress.meat >= PACK_COST &&
    unowned.filter((c) => rarityOf(c) === 'rare').length >= 1 &&
    unowned.filter((c) => rarityOf(c) !== 'rare').length >= PACK_SIZE - 1
  )
}
/** Pack has EXACTLY one rare, two non-rares and zero duplicates, until sold out. */
export function buyPack(original: Progression, entropy: number): Progression {
  if (!canBuyPack(original)) return original
  const unowned = CARDS.filter((card) => !original.cards.includes(card.id))
  const rare = chooseOne(
    unowned.filter((c) => rarityOf(c) === 'rare'),
    entropy,
    original.opened * 3,
  )
  const normals = unowned.filter((c) => rarityOf(c) !== 'rare')
  const second = chooseOne(normals, entropy, original.opened * 3 + 1)
  const third = chooseOne(
    normals.filter((c) => c.id !== second.id),
    entropy,
    original.opened * 3 + 2,
  )
  const gained = [rare.id, second.id, third.id]
  return {
    ...original,
    meat: original.meat - PACK_COST,
    cards: [...original.cards, ...gained],
    opened: original.opened + 1,
    lastPack: gained,
    lastReward:
      'Street Pack opened · one guaranteed rare + two other NEW cards.',
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
  const cards = [
    ...new Set(
      p.cards.filter(
        (id): id is string => typeof id === 'string' && ids.has(id),
      ),
    ),
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
