// /server/utils/aquariumCollect.ts
//
// Click-for-coins collectibles and the coin-bought upgrade track
// (cthulhuquarium/t-071) -- DESIGN-BRIEF "MVP scope" items 2 ("Click drifting
// collectibles for coins") and 4 ("Spend coins on upgrades"). Pure math only,
// same discipline as aquariumEconomy.ts: no prisma, no Nuxt/H3, unit-tested by
// utils/scripts/verifyAquariumCollect.test.ts (`npm run test:aquarium-collect`).
//
// SERVER-AUTHORITATIVE by construction. The client only ever reports how many
// shed scales it clicked; the server credits at most what the elapsed time
// since the tank's collect anchor could have spawned (collectAllowance below),
// never more than COLLECT_MAX_BANKED at once, never more than
// COLLECT_MAX_PER_REQUEST per call, valued off the tank's CURRENT production
// as the server computes it (tankProductionPerTick). A client that lies about
// `count` can only ever claim scales the clock already owed it.
//
// Numbers are v1 estimates tied to conductor projects/cthulhuquarium/
// ECONOMY.md, which does not yet carry a click-income section -- economy.yaml
// only says coins are "earned by producing and clicking". Mirror them into
// economy.yaml on the next balance pass (same hand-sync discipline as
// aquariumEconomy.ts's header comment).

import type { Rarity } from '~/prisma/generated/prisma/client'
import { evaluateRivalry } from './aquariumRivalry'
import {
  debrisMultiplier,
  effectiveTickSeconds,
  hungerMultiplier,
  incomePerTick,
  OFFLINE_INCOME_RATE_MULTIPLIER,
  TICK_SECONDS,
} from './aquariumEconomy'

// ---------------------------------------------------------------------------
// Collectibles
// ---------------------------------------------------------------------------

// One scale sheds every 15s at drop-speed level 0 = 4 per TICK_SECONDS (60s).
export const COLLECT_BASE_SPAWN_SECONDS = 15

// Each scale is worth a quarter of one tick's gross production. At base speed
// a player who catches every scale earns 4 x 0.25 = 1.0x gross per minute on
// top of settleTick's 0.5x (OFFLINE_INCOME_RATE_MULTIPLIER), so an attentive
// player runs at 1.5x gross against an idle tank's 0.5x -- the same 3.0x
// active-vs-idle gap ECONOMY.md's two-hour simulation measured and accepted
// ("3.0x net worth by minute 120"), rather than a new, larger one.
export const COLLECT_VALUE_FRACTION_OF_TICK = 0.25

// Floor: any tank that is producing at all pays at least 1 coin per scale, so
// a single free-starter fish (gross 1/tick -> 0.25/scale) still pays for
// clicking. Only applies while production > 0 -- a tank whose fish are all
// starving (hunger 0) sheds nothing worth collecting, which keeps feeding the
// thing that matters. Early game this makes clicking up to ~9x idle for one
// COMMON; the gap converges to the 3x above once gross production reaches
// 1 / COLLECT_VALUE_FRACTION_OF_TICK = 4 coins/tick (e.g. two UNCOMMONs).
export const COLLECT_MIN_COINS_PER_SCALE = 1

// Cap: scales that nobody clicks pile up at the surface, at most this many.
// This is what keeps collecting an ACTIVE channel -- a closed tank banks at
// most 8 scales (~2 minutes of base spawns), never hours, so offline income
// stays entirely settleTick's capped 0.5x path.
export const COLLECT_MAX_BANKED = 8

// Per-call max: the store batches a click spree into one request (same
// debounce idea as flushClean). Equal to the bank cap, so one request can
// always drain everything the server would credit anyway.
export const COLLECT_MAX_PER_REQUEST = COLLECT_MAX_BANKED

export interface CollectFishState {
  id: number
  rarity: Rarity
  hunger: number
  yieldPerTick?: number | null
  tickIntervalSeconds?: number | null
  slug?: string | null
  dietRole?: string | null
  schoolRole?: string | null
}

// Gross production of ONE tick at the tank's current state -- the exact
// per-fish formula settleTick's loop body uses (tier/override yield x rate
// scale x hunger band x debris band x rivalry), without the loop, hunger
// decay, or OFFLINE_INCOME_RATE_MULTIPLIER discount.
export function tankProductionPerTick(
  fish: readonly CollectFishState[],
  debrisLevel: number,
  equippedSetKinds: readonly string[] = [],
): number {
  const rivalry = evaluateRivalry(
    fish.map((entry) => ({
      id: entry.id,
      slug: entry.slug ?? `__no-slug-${entry.id}`,
      dietRole: entry.dietRole,
      schoolRole: entry.schoolRole,
    })),
    equippedSetKinds.includes('peace_ward'),
  )
  const debrisMult = debrisMultiplier(debrisLevel)
  return fish.reduce((sum, entry) => {
    const rateScale =
      TICK_SECONDS / effectiveTickSeconds(entry.tickIntervalSeconds)
    return (
      sum +
      incomePerTick(entry.rarity, entry.yieldPerTick) *
        rateScale *
        hungerMultiplier(entry.hunger) *
        debrisMult *
        (rivalry.multiplierByFishId.get(entry.id) ?? 1)
    )
  }, 0)
}

export function coinsPerScale(productionPerTick: number): number {
  if (!(productionPerTick > 0)) return 0
  return Math.max(
    COLLECT_MIN_COINS_PER_SCALE,
    productionPerTick * COLLECT_VALUE_FRACTION_OF_TICK,
  )
}

export function collectSpawnSeconds(dropSpeedLevel: number): number {
  return (
    COLLECT_BASE_SPAWN_SECONDS /
    (1 +
      DROP_SPEED_SPAWN_BONUS_PER_LEVEL *
        clampLevel(dropSpeedLevel, DROP_SPEED_MAX_LEVEL))
  )
}

export interface CollectAllowanceInput {
  // Aquarium.collectAnchorAt: the moment scales started accumulating from.
  // null (never collected) is treated as a full bank.
  anchorAt: Date | null
  now: Date
  dropSpeedLevel: number
  requested: number
}

export interface CollectAllowanceResult {
  available: number
  credited: number
  newAnchorAt: Date
}

// How many scales this call may credit, and where the anchor moves to. The
// anchor never lags `now` by more than COLLECT_MAX_BANKED spawns (anything
// older is forfeited, like settleTick's accrual cap), and advances by exactly
// `credited` spawn intervals -- so uncollected scales stay claimable and a
// burst of tiny requests can never claim more than one large one.
export function collectAllowance(
  input: CollectAllowanceInput,
): CollectAllowanceResult {
  const spawnMs = collectSpawnSeconds(input.dropSpeedLevel) * 1000
  const nowMs = input.now.getTime()
  const oldestMs = nowMs - COLLECT_MAX_BANKED * spawnMs
  const anchorMs = Math.min(
    nowMs,
    Math.max(oldestMs, input.anchorAt ? input.anchorAt.getTime() : oldestMs),
  )
  const available = Math.min(
    COLLECT_MAX_BANKED,
    Math.floor((nowMs - anchorMs) / spawnMs),
  )
  const requested = Number.isFinite(input.requested)
    ? Math.max(0, Math.floor(input.requested))
    : 0
  const credited = Math.min(available, requested, COLLECT_MAX_PER_REQUEST)
  return {
    available,
    credited,
    newAnchorAt: new Date(anchorMs + credited * spawnMs),
  }
}

// Floored like settleTick: a fractional remainder is only ever lost, never
// fabricated, however the client chunks its requests.
export function collectCoins(
  credited: number,
  productionPerTick: number,
): number {
  if (credited <= 0) return 0
  return Math.floor(credited * coinsPerScale(productionPerTick))
}

// Reference ratio for the comment above: active (all scales caught) vs idle
// gross income per minute at a given drop-speed level, for a tank past the
// floor. Exported for the test only.
export function activeToIdleIncomeRatio(dropSpeedLevel: number): number {
  const scalesPerTick = TICK_SECONDS / collectSpawnSeconds(dropSpeedLevel)
  return (
    (OFFLINE_INCOME_RATE_MULTIPLIER +
      scalesPerTick * COLLECT_VALUE_FRACTION_OF_TICK) /
    OFFLINE_INCOME_RATE_MULTIPLIER
  )
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

// Drop speed: each level adds 25% spawn rate (max 4 levels = 2x, one scale
// every 7.5s). At max level a perfect clicker reaches 1.5x -> 2.5x gross, i.e.
// 5x idle -- bought, and bounded by the same COLLECT_MAX_BANKED.
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
    description: 'Scales drift up 25% more often per level.',
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
