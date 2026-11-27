// /utils/collectibles/engine.ts
//
// Pure collectible rules shared by every set: daily claims and streaks, pack
// rolls with a guaranteed floor and pity, duplicate refunds and back unlocks.
// Randomness is injected so the server can use crypto and tests can seed it.

import type {
  CollectibleCard,
  CollectibleRarity,
  CollectibleSet,
} from './types'
import { COLLECTIBLE_RARITIES } from './types'

export type Rand = () => number

const rank = (rarity: CollectibleRarity) => COLLECTIBLE_RARITIES.indexOf(rarity)

/** YYYY-MM-DD for an instant in a zone. */
export function collectibleDay(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant)
  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? '00'
  return `${value('year')}-${value('month')}-${value('day')}`
}

export function previousDay(day: string): string {
  const date = new Date(`${day}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().slice(0, 10)
}

export type DailyClaim =
  | { allowed: false; reason: 'already-claimed' }
  | {
      allowed: true
      streak: number
      reward: number
      tickets: number
    }

export function dailyClaimFor(
  set: CollectibleSet,
  wallet: { lastClaimDay: string | null; streak: number },
  today: string,
): DailyClaim {
  if (wallet.lastClaimDay === today) {
    return { allowed: false, reason: 'already-claimed' }
  }
  const continued = wallet.lastClaimDay === previousDay(today)
  const streak = continued ? wallet.streak + 1 : 1
  const economy = set.economy
  const bonusDays = Math.min(streak, economy.dailyStreakCap) - 1
  const reward = economy.dailyBase + economy.dailyStreakStep * bonusDays
  const tickets =
    (streak % economy.ticketEvery === 0 ? 1 : 0) +
    (wallet.lastClaimDay === null ? economy.welcomeTickets : 0)
  return { allowed: true, streak, reward, tickets }
}

export function rollRarity(
  weights: Record<CollectibleRarity, number>,
  rand: Rand,
  floor: CollectibleRarity = 'common',
): CollectibleRarity {
  const pool = COLLECTIBLE_RARITIES.filter(
    (rarity) => rank(rarity) >= rank(floor) && weights[rarity] > 0,
  )
  const total = pool.reduce((sum, rarity) => sum + weights[rarity], 0)
  let roll = rand() * total
  for (const rarity of pool) {
    roll -= weights[rarity]
    if (roll < 0) return rarity
  }
  return pool[pool.length - 1] ?? floor
}

export type PackCard = { key: string; rarity: CollectibleRarity }

/**
 * One pack. The last slot honors the floor; any slot reaching the pity count
 * becomes top rarity. Within a rarity, unowned cards are twice as likely,
 * which keeps completion reachable without removing duplicates entirely.
 */
export function openPack(
  set: CollectibleSet,
  state: { pullsSinceTop: number; owned: ReadonlySet<string> },
  rand: Rand,
): { cards: PackCard[]; pullsSinceTop: number } {
  const economy = set.economy
  const top = COLLECTIBLE_RARITIES[COLLECTIBLE_RARITIES.length - 1]!
  let sinceTop = state.pullsSinceTop
  const owned = new Set(state.owned)
  const cards: PackCard[] = []
  for (let slot = 0; slot < economy.packSize; slot++) {
    const floor = slot === economy.packSize - 1 ? economy.packFloor : 'common'
    let rarity = rollRarity(economy.rarityWeights, rand, floor)
    if (sinceTop + 1 >= economy.pityAt) rarity = top
    const card = pickCard(set.cards, rarity, owned, rand)
    cards.push({ key: card.key, rarity: card.rarity })
    owned.add(card.key)
    sinceTop = card.rarity === top ? 0 : sinceTop + 1
  }
  return { cards, pullsSinceTop: sinceTop }
}

function pickCard(
  cards: readonly CollectibleCard[],
  rarity: CollectibleRarity,
  owned: ReadonlySet<string>,
  rand: Rand,
): CollectibleCard {
  const pool = cards.filter((card) => card.rarity === rarity)
  const candidates = pool.length ? pool : [...cards]
  const weighted = candidates.map((card) => ({
    card,
    weight: owned.has(card.key) ? 1 : 2,
  }))
  const total = weighted.reduce((sum, entry) => sum + entry.weight, 0)
  let roll = rand() * total
  for (const entry of weighted) {
    roll -= entry.weight
    if (roll < 0) return entry.card
  }
  return weighted[weighted.length - 1]!.card
}

/** Keys of every back the player has earned with this progress. */
export function earnedBacks(
  set: CollectibleSet,
  progress: { bestStreak: number; owned: ReadonlySet<string> },
): string[] {
  return set.backs
    .filter((back) => {
      const unlock = back.unlock
      if (unlock.kind === 'default') return true
      if (unlock.kind === 'streak') return progress.bestStreak >= unlock.days
      if (unlock.kind === 'unique') {
        return (
          set.cards.filter((card) => progress.owned.has(card.key)).length >=
          unlock.count
        )
      }
      const group = set.cards.filter((card) => card.group === unlock.group)
      return (
        group.length > 0 && group.every((card) => progress.owned.has(card.key))
      )
    })
    .map((back) => back.key)
}

/** Expected pulls until a given rarity; used by the odds panel. */
export function rarityOdds(set: CollectibleSet) {
  const weights = set.economy.rarityWeights
  const total = COLLECTIBLE_RARITIES.reduce((sum, r) => sum + weights[r], 0)
  return COLLECTIBLE_RARITIES.map((rarity) => ({
    rarity,
    percent: Math.round((weights[rarity] / total) * 1000) / 10,
    count: set.cards.filter((card) => card.rarity === rarity).length,
  }))
}

export type BonusState = { day: string; tasks: string[] }

export function parseBonusState(raw: string | null | undefined): BonusState {
  try {
    const value = JSON.parse(raw || '{}') as Partial<BonusState>
    return {
      day: typeof value.day === 'string' ? value.day : '',
      tasks: Array.isArray(value.tasks)
        ? value.tasks.filter((task): task is string => typeof task === 'string')
        : [],
    }
  } catch {
    return { day: '', tasks: [] }
  }
}
