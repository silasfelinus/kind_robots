// /server/utils/aquariumCollect.ts
//
// Click-for-coins and the coin-bought upgrade track. Pure math only, same
// discipline as aquariumEconomy.ts: no prisma, no Nuxt/H3, unit-tested by
// utils/scripts/verifyAquariumCollect.test.ts (`npm run test:aquarium-collect`).
//
// The fun loop (cthulhuquarium/t-080, conductor projects/cthulhuquarium/
// LOOP.md and economy.yaml `fun_loop`): EVERY fed fish drops a coin on its own
// timer, worth a fixed amount for its rarity, so coin income grows with the
// number of fish -- more fish, more coins, more fish. This replaced t-071's
// single tank-wide shed scale (one every 15 s however many fish you had),
// which Silas found left "nothing really to do".
//
// SERVER-AUTHORITATIVE by construction. The client reports the total VALUE of
// the coins it clicked. The server accrues value from the tank's collect
// anchor at the tank's current drop rate (coinRatePerSecond), credits at most
// what the clock owed (coinAllowance), and never looks further back than
// COIN_BANK_SECONDS. Over any span of time the credited total can never
// exceed rate x elapsed, however the client lies or chunks its requests.

import type { Rarity } from '~/prisma/generated/prisma/client'

// ---------------------------------------------------------------------------
// Coin drops -- economy.yaml `fun_loop`
// ---------------------------------------------------------------------------

// fun_loop.coin_drop_seconds_per_fish: each fish drops one coin this often at
// drop-speed level 0.
export const COIN_DROP_SECONDS_PER_FISH = 15

// fun_loop.coin_value_by_tier: what one dropped coin is worth. At one coin per
// 15 s that is 12 / 32 / 80 / 200 / 500 / 1200 coins per fish-minute, against
// settleTick's passive 0.5 / 1.5 / 4 / ... -- clicking is the game.
export const COIN_VALUE_BY_TIER: Readonly<Record<Rarity, number>> = {
  COMMON: 3,
  UNCOMMON: 8,
  RARE: 20,
  EPIC: 50,
  LEGENDARY: 125,
  MYTHIC: 300,
}

// fun_loop.coin_visible_seconds: a coin drifts down, rests on the gravel, then
// fades. The canvas removes it after this long.
export const COIN_VISIBLE_SECONDS = 12

// How far back the server accrues. A coin can be clicked up to
// COIN_VISIBLE_SECONDS after it drops, and a fish's next coin can be up to one
// drop interval away, so a one-fish tank still gets paid the full value of
// the single coin on screen. Anything older has faded.
export const COIN_BANK_SECONDS =
  COIN_DROP_SECONDS_PER_FISH + COIN_VISIBLE_SECONDS

// Hard ceiling on one request's claim: well above a full 40-fish MYTHIC
// tank's whole bank. Rejects absurd bodies before any math runs.
export const COIN_MAX_CLAIM_PER_REQUEST = 500_000

export function coinValueForTier(rarity: Rarity): number {
  return COIN_VALUE_BY_TIER[rarity] ?? COIN_VALUE_BY_TIER.COMMON
}

export function coinDropSeconds(dropSpeedLevel: number): number {
  return (
    COIN_DROP_SECONDS_PER_FISH /
    (1 +
      DROP_SPEED_SPAWN_BONUS_PER_LEVEL *
        clampLevel(dropSpeedLevel, DROP_SPEED_MAX_LEVEL))
  )
}

export interface CoinFishState {
  rarity: Rarity
  hunger: number
}

// Coins per second the whole tank drops right now. A starving fish (hunger 0)
// drops nothing -- the one rule a player sees: fed fish drop coins. Hunger
// does not otherwise scale coin value, and debris/rivalry no longer touch
// coin drops at all (they still shape settleTick's passive income).
export function coinRatePerSecond(
  fish: readonly CoinFishState[],
  dropSpeedLevel: number,
): number {
  const interval = coinDropSeconds(dropSpeedLevel)
  return fish.reduce(
    (sum, entry) =>
      entry.hunger > 0 ? sum + coinValueForTier(entry.rarity) / interval : sum,
    0,
  )
}

export interface CoinAllowanceInput {
  // Aquarium.collectAnchorAt: the moment value started accruing from. null
  // (never collected) is treated as a full bank.
  anchorAt: Date | null
  now: Date
  ratePerSecond: number
  claimed: number
}

export interface CoinAllowanceResult {
  available: number
  credited: number
  newAnchorAt: Date
}

// How many coins this call may credit, and where the anchor moves to. The
// anchor never lags `now` by more than COIN_BANK_SECONDS (older value is
// forfeited, like settleTick's accrual cap) and advances by exactly the time
// it took to accrue what was credited -- so unclaimed value stays claimable
// and many small requests can never claim more than one large one.
export function coinAllowance(input: CoinAllowanceInput): CoinAllowanceResult {
  const nowMs = input.now.getTime()
  const rate = Number.isFinite(input.ratePerSecond)
    ? Math.max(0, input.ratePerSecond)
    : 0
  if (rate <= 0) {
    return { available: 0, credited: 0, newAnchorAt: input.now }
  }
  const oldestMs = nowMs - COIN_BANK_SECONDS * 1000
  const anchorMs = Math.min(
    nowMs,
    Math.max(oldestMs, input.anchorAt ? input.anchorAt.getTime() : oldestMs),
  )
  // The epsilon absorbs float error (0.2 coins/s x 15 s = 2.9999...), so an
  // honest click of a coin the clock fully owed is never floored away.
  const available = Math.floor((rate * (nowMs - anchorMs)) / 1000 + 1e-6)
  const claimed = Number.isFinite(input.claimed)
    ? Math.max(0, Math.floor(input.claimed))
    : 0
  const credited = Math.min(available, claimed, COIN_MAX_CLAIM_PER_REQUEST)
  return {
    available,
    credited,
    newAnchorAt: new Date(anchorMs + (credited / rate) * 1000),
  }
}

// ---------------------------------------------------------------------------
// Upgrades -- coins buy breadth, never room.
//
// Two tracks only: food and drop speed. The brief's third example, "more tank
// slots", is deliberately NOT a coin upgrade: economy.yaml's `slots` block
// says capacity growth is "entirely landmark-driven ... never purchased with
// coins -- coins buy breadth, milestones buy room" (SYSTEMS.md "Two economies,
// pacing each other"), and the_last_aquarium was designed at +0 capacity
// specifically so that rule has no exception. The one existing coin-adjacent
// capacity valve (the extra_species_slot set piece) is already the tuned
// pressure release; a second one here would bypass the milestone ladder.
// ---------------------------------------------------------------------------

export type UpgradeTrack = 'food' | 'dropSpeed'

export interface UpgradeTrackConfig {
  track: UpgradeTrack
  title: string
  description: string
  maxLevel: number
  baseCost: number
  costGrowth: number
}

// Food: each level cuts feed cost by 15% (max 3 levels = 45% off). Chosen
// over "stays fed longer" because hunger is an Int column settled a tick at a
// time -- a fractional decay rate would round away on every 1-tick settle --
// and over "restores more" because a feed already restores to the 100 max.
export const FOOD_DISCOUNT_PER_LEVEL = 0.15
export const FOOD_MAX_LEVEL = 3

// Drop speed: each level adds 25% to every fish's drop rate (max 4 levels =
// 2x, one coin per fish every 7.5 s).
export const DROP_SPEED_SPAWN_BONUS_PER_LEVEL = 0.25
export const DROP_SPEED_MAX_LEVEL = 4

// Prices escalate geometrically. First levels cost 2-3 COMMON unlocks
// (economy.yaml COMMON unlock_cost 50) so they compete with early breadth;
// the last levels land near a RARE unlock (750-1000) -- mid-game purchases,
// not a first-session sweep.
export const UPGRADE_CATALOG: Readonly<
  Record<UpgradeTrack, UpgradeTrackConfig>
> = {
  food: {
    track: 'food',
    title: 'Hardier food',
    description: 'Each feeding costs 15% less per level.',
    maxLevel: FOOD_MAX_LEVEL,
    baseCost: 150,
    costGrowth: 2.5,
  },
  dropSpeed: {
    track: 'dropSpeed',
    title: 'Faster shedding',
    description: 'Every fish drops coins 25% more often per level.',
    maxLevel: DROP_SPEED_MAX_LEVEL,
    baseCost: 100,
    costGrowth: 2.2,
  },
}

export const UPGRADE_TRACKS: readonly UpgradeTrack[] = ['food', 'dropSpeed']

export function isKnownUpgradeTrack(value: unknown): value is UpgradeTrack {
  return (
    typeof value === 'string' &&
    (UPGRADE_TRACKS as readonly string[]).includes(value)
  )
}

function clampLevel(level: number, maxLevel: number): number {
  if (!Number.isFinite(level)) return 0
  return Math.min(maxLevel, Math.max(0, Math.floor(level)))
}

// Price of buying the NEXT level from `currentLevel`; null once maxed.
export function upgradeCost(
  track: UpgradeTrack,
  currentLevel: number,
): number | null {
  const config = UPGRADE_CATALOG[track]
  const level = clampLevel(currentLevel, config.maxLevel)
  if (level >= config.maxLevel) return null
  return Math.round(config.baseCost * config.costGrowth ** level)
}

export function discountedFeedCost(
  baseCost: number,
  foodLevel: number,
): number {
  const level = clampLevel(foodLevel, FOOD_MAX_LEVEL)
  return Math.max(
    1,
    Math.round(baseCost * (1 - FOOD_DISCOUNT_PER_LEVEL * level)),
  )
}
