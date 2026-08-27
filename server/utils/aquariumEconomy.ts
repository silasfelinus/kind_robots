// /server/utils/aquariumEconomy.ts
//
// Cthulhuquarium economy constants and pure balance math (cthulhuquarium/t-009).
// No prisma, no Nuxt/H3 imports -- unit-testable without a database, same
// discipline as server/utils/revenueSplit.ts (see
// utils/scripts/verifyAquariumEconomy.test.ts).
//
// SOURCE OF TRUTH: this is a committed TypeScript transcription of conductor's
// projects/cthulhuquarium/data/economy.yaml (schema_version 1, status
// draft-v1 as of 2026-08-25). That YAML lives in the separate conductor repo,
// which this deployed server has no runtime filesystem access to -- and this
// codebase's existing fs.readFileSync-a-repo-file patterns are documented as
// unreliable on this project's Vercel deploy target (see
// server/utils/folderNames.ts's own explicit Vercel fallback branch) -- so
// "read balance.yaml at runtime" is satisfied here as a same-shape,
// same-values TS module instead of a literal YAML parse at request time. A
// balance-pass edit to economy.yaml must be mirrored here by hand; nothing
// computes a hash or diff between the two files, so keeping them in sync is
// a human discipline, same as davinciDimensions.ts's relationship to
// conductor's ending-dimensions.yaml.
//
// Every number below traces to a section of economy.yaml. Nothing in
// server/api/aquarium/** or server/utils/aquarium.ts should hardcode a
// balance constant -- import it from here.

import type { Rarity } from '~/prisma/generated/prisma/client'

// economy.yaml: economy.tick_seconds
export const TICK_SECONDS = 60

// ---------------------------------------------------------------------------
// Rarity tiers -- economy.yaml `rarity_tiers`
// ---------------------------------------------------------------------------

export interface RarityTierConfig {
  incomePerTick: number
  unlockCost: number
}

export const RARITY_TIERS: Record<Rarity, RarityTierConfig> = {
  COMMON: { incomePerTick: 1, unlockCost: 50 },
  UNCOMMON: { incomePerTick: 3, unlockCost: 200 },
  RARE: { incomePerTick: 8, unlockCost: 750 },
  EPIC: { incomePerTick: 20, unlockCost: 3000 },
  LEGENDARY: { incomePerTick: 50, unlockCost: 12000 },
  MYTHIC: { incomePerTick: 120, unlockCost: 50000 },
}

const RARITY_ORDER: readonly Rarity[] = [
  'COMMON',
  'UNCOMMON',
  'RARE',
  'EPIC',
  'LEGENDARY',
  'MYTHIC',
]

function rarityRank(rarity: Rarity): number {
  return RARITY_ORDER.indexOf(rarity)
}

// `override` is Monster.yieldPerTick (cthulhuquarium/t-047): null/undefined
// means "use the tier default," a set value replaces it outright. Schema
// comment: "these three exist for a later per-species balance pass, not
// required at seed time" -- every existing call site omits the argument and
// gets the exact prior tier-only behavior.
export function incomePerTick(
  rarity: Rarity,
  override?: number | null,
): number {
  return override ?? RARITY_TIERS[rarity].incomePerTick
}

// `override` is Monster.unlockCost -- same null-means-tier-default contract
// as incomePerTick above.
export function unlockCost(rarity: Rarity, override?: number | null): number {
  return override ?? RARITY_TIERS[rarity].unlockCost
}

// `override` is Monster.tickIntervalSeconds: how often, in seconds, THIS
// species produces income, distinct from the tank-wide TICK_SECONDS the
// settlement loop advances by. null/undefined means "use the tank cadence."
export function effectiveTickSeconds(override?: number | null): number {
  return override ?? TICK_SECONDS
}

// UPDATE 2026-08-25 (t-035): the canonical field this comment describes now
// exists -- `Creature.tier` (prisma/schema.prisma) -- but AquariumStock and
// AquariumCodexEntry still reference Character via characterId (t-032),
// unchanged in t-035's migration on purpose (see that migration's own doc
// comment). This function stays the derivation in use until a follow-on
// task repoints AquariumStock at Creature and this call site can read
// `creature.tier` directly instead of deriving it. Do not delete this
// function or its six-stat signature while that repoint is still pending.
//
// Character has no single canonical "species rarity"/tier column -- it has
// six PER-STAT Rarity fields (charm/empathy/grace/luck/might/wits), reused
// from its original chatbot-personality design. t-003's fish bible
// (conductor projects/cthulhuquarium, external to this repo) tracks a
// separate singular `tier`/`rarity` per species, but no matching column
// exists on Character yet, and adding one is a schema change this task is
// explicitly barred from making speculatively (see t-009's task note: STOP
// and report a blocker rather than write a new migration). Until a real
// bestiary-seeding task (t-008, itself currently blocked on an unrelated new
// `Creature` table per a 2026-08-25 roadmap correction -- fish are no longer
// planned to seed into Character at all) lands a canonical field, this
// derives a fish's ECONOMIC tier as the HIGHEST of its six existing Rarity
// stats -- deterministic, needs no migration, and defensible ("a fish with
// any MYTHIC stat behaves as a mythic-tier fish" for income/unlock/feed
// pricing purposes). Flagged prominently in the PR for reviewer sign-off;
// this is the one function to swap when a canonical field exists.
export function deriveFishRarityTier(character: {
  charm: Rarity
  empathy: Rarity
  grace: Rarity
  luck: Rarity
  might: Rarity
  wits: Rarity
}): Rarity {
  const stats: Rarity[] = [
    character.charm,
    character.empathy,
    character.grace,
    character.luck,
    character.might,
    character.wits,
  ]
  return stats.reduce((best, current) =>
    rarityRank(current) > rarityRank(best) ? current : best,
  )
}

// ---------------------------------------------------------------------------
// Hunger -- economy.yaml `hunger`. Rate gate only, never a loss.
// ---------------------------------------------------------------------------

export const HUNGER_RANGE = { min: 0, max: 100 } as const
export const HUNGER_STARTING_VALUE = 100
export const HUNGER_DECAY_PER_TICK = 1

// Matched top-down: first band whose `min` the hunger value meets or
// exceeds wins. Order matters -- keep descending by `min`.
const HUNGER_BANDS: ReadonlyArray<{ min: number; multiplier: number }> = [
  { min: 50, multiplier: 1.0 },
  { min: 20, multiplier: 0.5 },
  { min: 1, multiplier: 0.2 },
  { min: 0, multiplier: 0.0 },
]

export function hungerMultiplier(hunger: number): number {
  for (const band of HUNGER_BANDS) {
    if (hunger >= band.min) return band.multiplier
  }
  return 0
}

export const FEED_RESTORES_HUNGER_TO = 100
export const FEED_COST_FACTOR_OF_UNLOCK_COST = 0.2

// Feed cost scales with the fish's own unlock-cost curve ("the food is
// alive" -- feeding a MYTHIC costs more than feeding a COMMON). Rounded to
// the nearest coin: cost = round(unlockCost * factor). `unlockCostOverride`
// is Monster.unlockCost, threaded through so a per-species unlock override
// also reshapes its feed cost instead of silently ignoring it.
export function feedCost(
  rarity: Rarity,
  unlockCostOverride?: number | null,
): number {
  return Math.round(
    unlockCost(rarity, unlockCostOverride) * FEED_COST_FACTOR_OF_UNLOCK_COST,
  )
}

// ---------------------------------------------------------------------------
// Debris -- economy.yaml `debris`. Throttles the tank's shared production
// rate, never holdings. Tank-wide, not per-fish.
// ---------------------------------------------------------------------------

export const DEBRIS_RANGE = { min: 0, max: 100 } as const
export const DEBRIS_STARTING_VALUE = 0
export const DEBRIS_ACCRUAL_PER_OCCUPANT_PER_TICK = 0.5

const DEBRIS_BANDS: ReadonlyArray<{ min: number; multiplier: number }> = [
  { min: 80, multiplier: 0.25 },
  { min: 50, multiplier: 0.5 },
  { min: 20, multiplier: 0.8 },
  { min: 0, multiplier: 1.0 },
]

export function debrisMultiplier(debrisLevel: number): number {
  for (const band of DEBRIS_BANDS) {
    if (debrisLevel >= band.min) return band.multiplier
  }
  return 1.0
}

// Manual/set-piece/Sexton cleaning (economy.yaml `debris.clean`) has no
// endpoint in this task's scope -- t-009's endpoint list is tank/tick/feed/
// purchase/browse only; a manual "clean" action, if ever added, is a
// natural follow-up but was not requested here and AquariumSet/Sexton-style
// fish placement are both explicitly out of scope per the task note.

// ---------------------------------------------------------------------------
// Offline income -- economy.yaml `offline_income`
// ---------------------------------------------------------------------------

export const OFFLINE_INCOME_RATE_MULTIPLIER = 0.5
export const OFFLINE_INCOME_MAX_ACCRUAL_HOURS = 8

// The largest number of ticks any single settlement will ever credit income
// for, or simulate hunger/debris across. economy.yaml's "beyond this, no
// further income accrues (return and it resumes)" is implemented in
// settleTick as: a settlement forfeits any elapsed real time beyond this
// many ticks rather than banking it for a later call. Safe to reuse as the
// hunger/debris simulation-loop bound too -- hunger fully floors at 0
// within HUNGER_STARTING_VALUE / HUNGER_DECAY_PER_TICK = 100 ticks, well
// inside this cap, so nothing downstream of the cap is ever left
// meaningfully "unsimulated".
export const MAX_ACCRUAL_TICKS = Math.floor(
  (OFFLINE_INCOME_MAX_ACCRUAL_HOURS * 3600) / TICK_SECONDS,
)

// ---------------------------------------------------------------------------
// Tick settlement
// ---------------------------------------------------------------------------

export interface TickFishState {
  id: number
  rarity: Rarity
  hunger: number
  // Per-species overrides (Monster.yieldPerTick/tickIntervalSeconds,
  // cthulhuquarium/t-047) -- null/undefined on either falls back to the
  // tier default / tank-wide TICK_SECONDS, exactly as before this field
  // existed. Every existing caller that omits these keeps identical
  // behavior.
  yieldPerTick?: number | null
  tickIntervalSeconds?: number | null
}

export interface TickSettlementInput {
  lastTickAt: Date | null
  now: Date
  debrisLevel: number
  fish: readonly TickFishState[]
}

export interface TickSettlementResult {
  elapsedTicks: number
  ticksProcessed: number
  coinsEarned: number
  newDebrisLevel: number
  fishHunger: ReadonlyMap<number, number>
  newLastTickAt: Date
}

// Settles coins/hunger/debris for every whole tick elapsed since
// `lastTickAt`, entirely server-side -- the caller never supplies an
// "earned" amount, only the state to settle FROM. Pure function: callers
// (server/utils/aquarium.ts) own reading the current row and persisting the
// result.
//
// This is the ONLY production-crediting path this task builds -- there is
// no separate live/foreground income stream (that would be UI/frontend
// work, explicitly out of scope for t-009). Per economy.yaml's own framing,
// everything settled through a single "how much elapsed since we last
// checked" call IS offline income by construction, so
// OFFLINE_INCOME_RATE_MULTIPLIER is applied uniformly to every tick
// credited here, not just ones judged to be a "real" absence. Flagged for
// reviewer awareness: if a later task adds a live/foreground heartbeat
// distinct from this settle-on-demand endpoint, that path should NOT apply
// this discount, and this comment should move with it.
export function settleTick(input: TickSettlementInput): TickSettlementResult {
  const tickMs = TICK_SECONDS * 1000
  const lastTickMs = input.lastTickAt
    ? input.lastTickAt.getTime()
    : input.now.getTime()
  const elapsedMs = Math.max(0, input.now.getTime() - lastTickMs)
  const elapsedTicks = Math.floor(elapsedMs / tickMs)

  const fishHunger = new Map<number, number>(
    input.fish.map((fish) => [fish.id, fish.hunger]),
  )

  if (elapsedTicks <= 0) {
    return {
      elapsedTicks: 0,
      ticksProcessed: 0,
      coinsEarned: 0,
      newDebrisLevel: input.debrisLevel,
      fishHunger,
      newLastTickAt: input.lastTickAt ?? input.now,
    }
  }

  const ticksProcessed = Math.min(elapsedTicks, MAX_ACCRUAL_TICKS)
  const occupantCount = input.fish.length

  let debrisLevel = input.debrisLevel
  let grossProduction = 0

  for (let tick = 0; tick < ticksProcessed; tick++) {
    const debrisMult = debrisMultiplier(debrisLevel)

    for (const fish of input.fish) {
      const hunger = fishHunger.get(fish.id) ?? 0
      // A per-species tickIntervalSeconds override changes how OFTEN this
      // fish produces, not how often the tank-wide loop advances (hunger
      // decay and debris accrual stay on TICK_SECONDS for every fish, same
      // as always) -- so it is applied as a rate scale on top of the
      // per-tick yield: a fish that produces every 30s instead of 60s
      // effectively produces twice per tank tick.
      const rateScale =
        TICK_SECONDS / effectiveTickSeconds(fish.tickIntervalSeconds)
      grossProduction +=
        incomePerTick(fish.rarity, fish.yieldPerTick) *
        rateScale *
        hungerMultiplier(hunger) *
        debrisMult
      fishHunger.set(
        fish.id,
        Math.max(HUNGER_RANGE.min, hunger - HUNGER_DECAY_PER_TICK),
      )
    }

    debrisLevel = Math.min(
      DEBRIS_RANGE.max,
      debrisLevel + occupantCount * DEBRIS_ACCRUAL_PER_OCCUPANT_PER_TICK,
    )
  }

  // Math.floor, not Math.round, on both of these: rounding UP is
  // exploitable by calling this endpoint in many small increments instead
  // of one large one (e.g. one fish's gross production per tick is 1 coin;
  // credited = round(1 * 0.5) = 1 on EVERY single-tick call, so polling
  // every tick_seconds would double the true 0.5x rate rather than
  // approximate it). Flooring means a fractional remainder is only ever
  // lost, never fabricated, regardless of how a client chunks its calls --
  // the server never pays out more than the elapsed time actually earned.
  const coinsEarned = Math.floor(
    grossProduction * OFFLINE_INCOME_RATE_MULTIPLIER,
  )

  return {
    elapsedTicks,
    ticksProcessed,
    coinsEarned,
    newDebrisLevel: Math.floor(debrisLevel),
    fishHunger,
    // Always advance to `now`, even when ticksProcessed was capped below
    // elapsedTicks -- the excess elapsed time beyond the cap is forfeited
    // per economy.yaml ("beyond this, no further income accrues"), not
    // banked for a later call. Standard idle-game convention.
    newLastTickAt: input.now,
  }
}
