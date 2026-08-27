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

// Manual clicking -- economy.yaml `debris.clean.click_clears` -- is the
// active-play channel cthulhuquarium/t-027 builds: instant, no coin cost, no
// cooldown. Debris only ever throttles the production RATE, never holdings
// (see this section's header comment), so clearing it can never lose
// anything -- only speed production back up. The other two routes named in
// economy.yaml (`debris_set_clears_per_tick` for the t-026 set piece,
// `sexton_clears_per_tick` for the still-unbuilt functional Sexton fish) are
// deliberately NOT implemented here -- both are passive, per-tick income-loop
// mechanics that belong to their own tasks (t-026 is still `waiting`), not
// this one's manual-click scope. SYSTEMS.md's own rule is to keep all three
// routes co-viable rather than let one dominate; building only the manual
// route now does not foreclose the other two.
export const DEBRIS_CLICK_CLEARS = 5

// cthulhuquarium/t-013: the client batches a rapid click spree into one
// debounced request instead of one POST per click (see
// stores/cthulhuquariumTankStore.ts's flushClean()), and reports how many
// clicks landed in that window as `clicks`. This is a defensive request-size
// cap, not a balance constant -- clicking clean has nothing to lose by being
// spammed (see this section's header comment), so a larger value doesn't
// unlock anything a determined clicker couldn't already reach one request at
// a time; it just bounds how much server work one request can demand.
export const MAX_CLEAN_CLICKS_PER_REQUEST = 50

export function cleanDebris(debrisLevel: number, clicks = 1): number {
  const safeClicks = Number.isFinite(clicks)
    ? Math.max(1, Math.floor(clicks))
    : 1
  return Math.max(
    DEBRIS_RANGE.min,
    debrisLevel - DEBRIS_CLICK_CLEARS * safeClicks,
  )
}

// ---------------------------------------------------------------------------
// Set pieces -- economy.yaml `set_pieces` (cthulhuquarium/t-026). Bonuses
// key off fish PROPERTIES or a scarce, counted setSlotsCap slot -- never a
// flat percentage floating free of anything to build around (SYSTEMS.md
// "For synergy to be real, set bonuses must key off fish properties, not
// flat buffs"). AquariumSet.kind is a free-form string, same "a new tag is
// a data commit, not a migration" convention as Monster.behavior /
// AquariumEvent.kind -- this catalog IS that data commit, and its `kind`
// keys match economy.yaml's set_pieces keys exactly so the two stay
// trivially diffable.
//
// Unlock costs are new here -- economy.yaml prices each EFFECT but never
// named a coin cost for equipping one ("full authoring... is t-026's job").
// Priced against RARITY_TIERS as an anchor rather than inventing an
// unrelated number: a slot occupying a set is roughly as valuable as a
// same-tier species unlock, scaled by how strong a lever the effect is.
// Flagged for reviewer/balance-pass revisit, same discipline as
// Aquarium.sizeCap's own "starting-point guess" doc comment.
// ---------------------------------------------------------------------------

export type SetPieceEffect =
  | 'slots_cap_delta'
  | 'feed_coin_rebate'
  | 'cosmetic_only'
  | 'rivalry_multiplier_override'
  | 'auto_click_collectibles'
  | 'debris_clear_per_tick'
  | 'idle_income_bonus_fraction'

// The finite set of AquariumSet.kind values this catalog actually defines.
// Keyed as a literal union (not `Record<string, ...>`) so dot/literal-key
// access into SET_PIECE_CATALOG below is a real required property, not an
// index signature -- noUncheckedIndexedAccess otherwise marks every access
// `| undefined` even though the catalog is exhaustive over this union.
export type SetPieceKind =
  | 'extra_species_slot'
  | 'feeding_bonus'
  | 'swim_speed'
  | 'peace_ward'
  | 'roaming_collector'
  | 'debris_skimmer'
  | 'idle_hoarder'

export interface SetPieceConfig {
  kind: SetPieceKind
  title: string
  description: string
  effect: SetPieceEffect
  value: number | null
  cost: number
}

export const SET_PIECE_CATALOG: Readonly<Record<SetPieceKind, SetPieceConfig>> =
  {
    extra_species_slot: {
      kind: 'extra_species_slot',
      title: 'Pressure Valve',
      description:
        "Widens the tank by one size unit while equipped -- buys a little capacity with coins instead of waiting on a milestone (SYSTEMS.md's own framing).",
      effect: 'slots_cap_delta',
      value: 1,
      cost: RARITY_TIERS.UNCOMMON.unlockCost,
    },
    feeding_bonus: {
      kind: 'feeding_bonus',
      title: "Larder's Favor",
      description: 'Feeding any occupant refunds half its coin cost.',
      effect: 'feed_coin_rebate',
      value: 0.5,
      cost: RARITY_TIERS.UNCOMMON.unlockCost,
    },
    swim_speed: {
      kind: 'swim_speed',
      title: 'Swift Current',
      description:
        'Every occupant swims noticeably faster. Purely cosmetic -- economy.yaml explicitly carries no number for this one.',
      effect: 'cosmetic_only',
      value: null,
      cost: RARITY_TIERS.COMMON.unlockCost,
    },
    peace_ward: {
      kind: 'peace_ward',
      title: 'Peace Ward',
      description:
        "Rivalry never applies anywhere in the tank while equipped. (Rivalry itself hasn't been built yet -- t-030/a successor owns that; this equips and holds ready for when it lands, same 'schema-ready, unread yet' discipline as Monster.depth.)",
      effect: 'rivalry_multiplier_override',
      value: 1.0,
      cost: RARITY_TIERS.RARE.unlockCost,
    },
    roaming_collector: {
      kind: 'roaming_collector',
      title: 'Roaming Collector',
      description:
        'A little automaton drifts the tank collecting coins on its own -- capped well short of full automation, and never stacks with Idle Hoarder.',
      effect: 'auto_click_collectibles',
      value: 0.5,
      cost: RARITY_TIERS.RARE.unlockCost,
    },
    debris_skimmer: {
      kind: 'debris_skimmer',
      title: 'Debris Skimmer',
      description:
        'Passively clears a little debris every tick -- one of three deliberately co-viable routes to a clean tank, never the only one.',
      effect: 'debris_clear_per_tick',
      value: 2,
      cost: RARITY_TIERS.UNCOMMON.unlockCost,
    },
    idle_hoarder: {
      kind: 'idle_hoarder',
      title: 'Idle Hoarder',
      description:
        'Extra income while you are away, on top of the baseline offline rate -- never total; idling still stays strictly worse than playing.',
      effect: 'idle_income_bonus_fraction',
      value: 0.4,
      cost: RARITY_TIERS.RARE.unlockCost,
    },
  } as const

export const SET_PIECE_KINDS: readonly SetPieceKind[] = Object.keys(
  SET_PIECE_CATALOG,
) as SetPieceKind[]

// Type guard, not just a boolean check: narrows `kind` to SetPieceKind for
// every caller that checks this before indexing SET_PIECE_CATALOG (e.g.
// aquarium.ts's equipSetForUser) -- AquariumSet.kind itself stays a plain
// DB string (same "a new tag is a data commit, not a migration" convention
// as Monster.behavior), this only narrows the in-memory value after
// validation.
export function isKnownSetPieceKind(kind: string): kind is SetPieceKind {
  return Object.prototype.hasOwnProperty.call(SET_PIECE_CATALOG, kind)
}

// economy.yaml's own `no_stack_idle_effects`: roaming_collector and
// idle_hoarder are two fictions over the same underlying "bonus income
// while away" lever, not two independently-stacking bonuses -- equipping
// both would double it. Equip-time validation (aquarium.ts) is the primary
// guard; idleIncomeBonusFraction below (Math.max, never sum) is the
// belt-and-suspenders backstop in the actual math.
export const NO_STACK_IDLE_SET_KINDS: readonly SetPieceKind[] = [
  'roaming_collector',
  'idle_hoarder',
]

// AquariumSet.kind values are plain DB strings (see the type guard above),
// so these checks compare against NO_STACK_IDLE_SET_KINDS by value rather
// than relying on Array<SetPieceKind>.includes's narrower parameter type.
const noStackIdleKindSet: ReadonlySet<string> = new Set(NO_STACK_IDLE_SET_KINDS)

export function conflictsWithEquippedIdleSet(
  candidateKind: string,
  equippedKinds: readonly string[],
): boolean {
  if (!noStackIdleKindSet.has(candidateKind)) return false
  return equippedKinds.some(
    (kind) => kind !== candidateKind && noStackIdleKindSet.has(kind),
  )
}

function idleIncomeBonusFraction(equippedKinds: readonly string[]): number {
  const fractions: number[] = []
  if (equippedKinds.includes('roaming_collector')) {
    fractions.push(SET_PIECE_CATALOG.roaming_collector.value ?? 0)
  }
  if (equippedKinds.includes('idle_hoarder')) {
    fractions.push(SET_PIECE_CATALOG.idle_hoarder.value ?? 0)
  }
  return fractions.length > 0 ? Math.max(...fractions) : 0
}

// Matches set_pieces.debris_skimmer.value in economy.yaml, which itself
// notes it must stay in sync with debris.clean.debris_set_clears_per_tick
// -- kept as one named constant here rather than two so the two can't drift
// apart inside this file the way the YAML warns about across files.
const DEBRIS_SKIMMER_CLEARS_PER_TICK =
  SET_PIECE_CATALOG.debris_skimmer.value ?? 0

// extra_species_slot (economy.yaml set_pieces.extra_species_slot): a
// counted number of equipped slots that grant a flat sizeCap bonus each.
// Duplicates of the same kind aren't offered by the equip flow today (each
// kind equips at most once, aquarium.ts), so this is always 0 or
// SET_PIECE_CATALOG.extra_species_slot.value in practice -- written as a
// count rather than a boolean so it stays correct if that rule ever
// relaxes.
export function effectiveSizeCap(
  baseSizeCap: number,
  equippedKinds: readonly string[],
): number {
  const count = equippedKinds.filter(
    (kind) => kind === 'extra_species_slot',
  ).length
  return baseSizeCap + count * (SET_PIECE_CATALOG.extra_species_slot.value ?? 0)
}

// feeding_bonus (economy.yaml set_pieces.feeding_bonus): feeding refunds a
// fraction of that feed's own coin cost as a bonus payout. Floored, same
// no-fabricated-coins discipline as settleTick's own rounding.
export function feedCoinRebate(
  cost: number,
  equippedKinds: readonly string[],
): number {
  if (!equippedKinds.includes('feeding_bonus')) return 0
  return Math.floor(cost * (SET_PIECE_CATALOG.feeding_bonus.value ?? 0))
}

export function isSwimSpeedActive(equippedKinds: readonly string[]): boolean {
  return equippedKinds.includes('swim_speed')
}

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
  // cthulhuquarium/t-026: AquariumSet.kind values currently equipped in the
  // tank. Optional/defaults to none so every pre-t-026 caller (and any test
  // that doesn't care about sets) keeps identical behavior.
  equippedSetKinds?: readonly string[]
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
  const equippedSetKinds = input.equippedSetKinds ?? []
  const debrisSkimmerActive = equippedSetKinds.includes('debris_skimmer')

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
    // debris_skimmer (cthulhuquarium/t-026, economy.yaml
    // set_pieces.debris_skimmer): one of the three deliberately co-viable
    // debris routes (SYSTEMS.md), passive and weaker than a manual click
    // spree -- it only ever partially offsets accrual, never zeroes it out
    // on its own for an occupied tank producing debris faster than 2/tick.
    if (debrisSkimmerActive) {
      debrisLevel = Math.max(
        DEBRIS_RANGE.min,
        debrisLevel - DEBRIS_SKIMMER_CLEARS_PER_TICK,
      )
    }
  }

  // Math.floor, not Math.round, on both of these: rounding UP is
  // exploitable by calling this endpoint in many small increments instead
  // of one large one (e.g. one fish's gross production per tick is 1 coin;
  // credited = round(1 * 0.5) = 1 on EVERY single-tick call, so polling
  // every tick_seconds would double the true 0.5x rate rather than
  // approximate it). Flooring means a fractional remainder is only ever
  // lost, never fabricated, regardless of how a client chunks its calls --
  // the server never pays out more than the elapsed time actually earned.
  //
  // idle_hoarder / roaming_collector (cthulhuquarium/t-026): both are
  // "extra income while away" set pieces that economy.yaml explicitly
  // marks non-stacking (no_stack_idle_effects) -- idleIncomeBonusFraction
  // takes the MAX of whichever is equipped, never the sum, as a
  // belt-and-suspenders backstop alongside the equip-time rejection in
  // aquarium.ts. Multiplies the already-discounted offline rate rather
  // than adding a second flat rate, so the hard "never 1.0, idling stays
  // worse than playing" ceiling (SYSTEMS.md #3) holds even at both this
  // multiplier's max and OFFLINE_INCOME_RATE_MULTIPLIER's current value.
  const coinsEarned = Math.floor(
    grossProduction *
      OFFLINE_INCOME_RATE_MULTIPLIER *
      (1 + idleIncomeBonusFraction(equippedSetKinds)),
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

// ---------------------------------------------------------------------------
// Rare random events (cthulhuquarium/t-016) -- economy.yaml `rare_events`.
// HARD CONSTRAINT (Silas, 2026-08-24, amending t-016's own note): no event
// may ever take anything away -- every kind here is additive-only or purely
// cosmetic; none may reduce coins, fish, or unlocks. v1 never implements an
// actual income pause (accounting for "paused, but still catches up exactly
// right" is real complexity for very little player-visible difference from
// "no economic effect at all"), so every kind is either a coin bonus or a
// zero-effect cosmetic beat.
//
// Randomness intentionally lives OUTSIDE this file, same discipline as the
// rest of aquariumEconomy.ts: rollRareEvent takes the caller's own
// Math.random() values as explicit arguments rather than calling Math.random
// itself, so it stays a pure, unit-testable function of its inputs. The
// caller (server/utils/aquarium.ts's settleTickForUser) is responsible for
// only rolling once per settle call that actually processed >=1 real tick.
// ---------------------------------------------------------------------------

export type RareEventKind =
  'rare_visitor' | 'windfall_collectible' | 'tank_gone_wrong'

export interface RareEventConfig {
  chance: number
  bonusCoinsMin: number
  bonusCoinsMax: number
  tone: string
}

// economy.yaml `rare_events.events`. Order matters: rollRareEvent walks this
// object in key order, carving out each kind's `chance` as its own slice of
// the [0, 1) roll space -- changing the order changes which slice belongs to
// which kind, never the total probability that some event fires.
export const RARE_EVENT_CATALOG: Readonly<
  Record<RareEventKind, RareEventConfig>
> = Object.freeze({
  rare_visitor: {
    chance: 0.03,
    bonusCoinsMin: 15,
    bonusCoinsMax: 40,
    tone: 'Something paid a short visit, left more than it took, and did not linger.',
  },
  windfall_collectible: {
    chance: 0.008,
    bonusCoinsMin: 60,
    bonusCoinsMax: 150,
    tone: 'One piece of gravel is worth far more than gravel. Nobody asks why.',
  },
  tank_gone_wrong: {
    chance: 0.015,
    bonusCoinsMin: 0,
    bonusCoinsMax: 0,
    tone: 'For a few seconds the water was the wrong color. Then it was not.',
  },
})

export const RARE_EVENT_KINDS: readonly RareEventKind[] = Object.keys(
  RARE_EVENT_CATALOG,
) as RareEventKind[]

export interface RareEventResult {
  kind: RareEventKind
  bonusCoins: number
  tone: string
}

// Pure. `selectRoll` decides WHICH kind (or none) fires; `magnitudeRoll`
// decides the bonus-coin amount within that kind's range. Both are expected
// to be independent values in [0, 1) (i.e. two separate Math.random() calls)
// -- reusing one roll for both would correlate which kind fires with how
// large its bonus is, which is not a real design intent here, just an
// accident of implementation.
//
// At most one kind ever fires per call. `selectRoll` falling past the last
// configured kind's slice (the overwhelmingly common case, since the
// catalog's chances intentionally sum to well under 1) returns null.
export function rollRareEvent(
  selectRoll: number,
  magnitudeRoll: number,
): RareEventResult | null {
  let floor = 0
  for (const kind of RARE_EVENT_KINDS) {
    const config = RARE_EVENT_CATALOG[kind]
    const ceiling = floor + config.chance
    if (selectRoll >= floor && selectRoll < ceiling) {
      const span = config.bonusCoinsMax - config.bonusCoinsMin
      const bonusCoins =
        config.bonusCoinsMin + Math.floor(magnitudeRoll * (span + 1))
      return { kind, bonusCoins, tone: config.tone }
    }
    floor = ceiling
  }
  return null
}

// ---------------------------------------------------------------------------
// Bestiary completion (cthulhuquarium/t-024) -- pure decision logic only.
// Loading/persisting the actual codex rows is server/utils/aquarium.ts's
// job (AquariumCodexEntry, prisma); this stays a plain arithmetic check so
// it can be unit-tested the same way as the rest of this file.
//
// Silas's 2026-08-24 decision this task follows: the game is ENDLESS BUT
// THE BESTIARY COMPLETES, and "nothing here may ever decrease" -- a species
// cannot be un-collected and completion cannot be reset. That invariant is
// enforced by the CALLER's counting rule (collectedCount comes from
// AquariumCodexEntry rows, which are never deleted, and totalCount is the
// union of currently-active bestiary species and every species the user has
// ever collected -- so retiring an already-collected species can never
// shrink the denominator below what was already counted), not by anything
// here. This function only decides whether a count transition crosses the
// completion line for the first time.
export function justCompletedBestiary(
  totalCount: number,
  collectedCountBefore: number,
  collectedCountAfter: number,
): boolean {
  if (totalCount <= 0) return false
  const wasComplete = collectedCountBefore >= totalCount
  const isComplete = collectedCountAfter >= totalCount
  return !wasComplete && isComplete
}

// ---------------------------------------------------------------------------
// The Ichthyonomicon (cthulhuquarium/t-031) -- pure decision logic only.
// AquariumCodexEntry.bestStat* (added by t-032) is the book's "best
// individual seen of this species" record, independent of which fish is
// currently in the tank or whether the species is currently owned at all.
// Loading/persisting the actual rows is server/utils/aquarium.ts's job; this
// stays plain arithmetic so it is unit-testable the same way as the rest of
// this file.
//
// No caller rolls an individual's stats yet -- that is cthulhuquarium/t-029
// (genetics), still `waiting` on this task's own dependency graph. Every
// AquariumStock stat column is null until it lands, which makes every call
// through here a provable no-op today: this wires the record now, correctly,
// rather than leaving it for t-029 to invent from scratch, per t-031's note
// that t-030's sell-back is "only safe because this exists."
// ---------------------------------------------------------------------------

export interface StatBlock {
  charm: number | null
  empathy: number | null
  grace: number | null
  luck: number | null
  might: number | null
  wits: number | null
}

const STAT_BLOCK_KEYS = [
  'charm',
  'empathy',
  'grace',
  'luck',
  'might',
  'wits',
] as const satisfies readonly (keyof StatBlock)[]

// Per-stat max, independently -- never a lower value replacing a higher one
// (SYSTEMS.md's "nothing here may ever decrease" rule applies to the book's
// best-stat record same as it does to the bestiary count). A null on either
// side loses to whichever side has a real number; both null stays null.
export function mergeBestStats(
  existing: StatBlock,
  observed: StatBlock,
): StatBlock {
  const merged = {} as StatBlock
  for (const key of STAT_BLOCK_KEYS) {
    const a = existing[key]
    const b = observed[key]
    merged[key] = a == null ? b : b == null ? a : Math.max(a, b)
  }
  return merged
}
