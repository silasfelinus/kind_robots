// types/ruler-hooked.ts
//
// Type contracts for "The Ruler is Hooked" — the offline-first slideshow
// fishing/kingdom PoC (conductor ruler-hooked/t-007). These mirror the merged
// design specs in the conductor repo:
//   projects/ruler-hooked/docs/{data-model.md, compositing.md, decks.md}
//
// Everything here is framework-free (no Vue/Nuxt/Prisma imports) so the pure
// engine in utils/rulerHooked/* can be type-checked and reasoned about in
// isolation, and ports cleanly to a future Unreal build (unreal-migration.md).
// The vocabulary intentionally matches the kind_robots models it can sync to:
// LifeRun (status/seed), Reward (rewardType/rarity), Rarity.

// --- shared enums (mirror kind_robots prisma enums) -------------------------

export type LifeRunStatus = 'ACTIVE' | 'COMPLETE' | 'ABANDONED'
export type RewardType = 'SKILL' | 'ITEM' | 'POWER' | 'PET' | 'MAGIC' | 'FAVOR'
export type Rarity =
  | 'COMMON'
  | 'UNCOMMON'
  | 'RARE'
  | 'EPIC'
  | 'LEGENDARY'
  | 'MYTHIC'

// --- regions / compositing (compositing.md) ---------------------------------

/** Canonical region keys, back-to-front z-order (compositing.md §1). */
export const REGION_KEYS = [
  'sky',
  'far_shore',
  'treeline',
  'village_edge',
  'castle_grounds',
  'lake',
  'near_bank',
  'ruler',
  'fx',
] as const
export type RegionKey = (typeof REGION_KEYS)[number]

/** Cosmetic time-of-day cycle positions (compositing.md §4). Settle: day/night;
 *  transient "treats": dawn/golden/dusk. Never gates content. */
export const TIME_KEYS = ['day', 'night', 'dawn', 'golden', 'dusk'] as const
export type TimeKey = (typeof TIME_KEYS)[number]

/** A region's visual state is authored content — a plain string key. */
export type RegionState = string

/** One region's definition in the regions manifest (compositing.md §2). */
export interface RegionDef {
  z: number
  /** If ramp-driven: which slider axis selects the state, over an ordered ramp. */
  driver?: { slider: AxisKey; ramp: RegionState[] }
  states: RegionState[]
  /** Times this region actually authors (for the asset fallback ladder). */
  times?: TimeKey[]
}

export interface RegionsManifest {
  regions: Record<RegionKey, RegionDef>
}

// --- kingdom health (data-model.md §4) --------------------------------------

/** Canonical continuous axes, each 0..100. */
export const AXIS_KEYS = [
  'nature',
  'prosperity',
  'treasury',
  'joy',
  'order',
] as const
export type AxisKey = (typeof AXIS_KEYS)[number]

export type KingdomHealth = Record<AxisKey, number>

// --- decks / cards / effects (decks.md) -------------------------------------

export type CardKind = 'interrupt' | 'arc-step' | 'ambient' | 'finale'

/** Numeric comparators used by triggers (decks.md §3). */
export interface NumericPredicate {
  gte?: number
  gt?: number
  lte?: number
  lt?: number
  eq?: number
  neq?: number
}

/** A trigger clause: numeric predicates over sliders/counters, plus set
 *  membership over flags/rewards/cardsSeen. */
export interface TriggerClause {
  sliders?: Partial<Record<AxisKey, NumericPredicate>>
  counters?: Record<string, NumericPredicate>
  flags?: string[]
  rewards?: string[]
  cardsSeen?: string[]
}

export interface Trigger {
  minTurn?: number
  maxTurn?: number
  requires?: TriggerClause
  forbids?: TriggerClause
  /** Min turns since this card last fired (turns, never wall-clock). */
  cooldown?: number
  weightBonus?: { when: TriggerClause; add: number }
  /** Probability [0..1] gate for arc starts / occasional cards. */
  chance?: number
}

/** The closed effects grammar (decks.md §6) — the ONLY way content mutates save. */
export interface Effect {
  /** Additive deltas to kingdomHealth (clamped 0..100). */
  sliders?: Partial<Record<AxisKey, number>>
  /** Additive deltas to discrete counters. */
  counters?: Record<string, number>
  /** Pin a region's visual state (compositing.md §3). */
  regionOverride?: Partial<Record<RegionKey, RegionState>>
  flags?: { set?: string[]; clear?: string[] }
  /** Grant Rewards by slug. */
  grant?: { reward: string }[]
  /** Remove Rewards by slug. */
  revoke?: string[]
  /** Arc control. */
  arc?: { start?: string; advance?: string; complete?: string }
  /** finale choices only: set save.endingKey + status COMPLETE. */
  ending?: string
  /** Return this card to the draw bag (the mandatory defer path). */
  requeue?: boolean
}

export interface Choice {
  id: string
  text: string
  effects?: Effect
  result?: string
  requeue?: boolean
}

export interface Card {
  id: string
  deck?: string
  kind: CardKind
  weight?: number
  once?: boolean
  narratorId?: string | number
  characters?: string[] // Character slugs
  title: string
  body?: string
  art?: string
  trigger?: Trigger
  choices: Choice[]
}

export interface Deck {
  id: string
  title?: string
  description?: string
  cards: Card[]
}

export interface ArcStepRef {
  id: string
}

export interface Arc {
  id: string
  title?: string
  characters?: string[]
  start?: { trigger?: Trigger }
  steps: Card[]
}

/** Ending catalog entry (mirrors LifeEnding: outcomeKey/victoryType). */
export type VictoryType = 'VICTORY' | 'FAILURE' | 'MIXED' | 'SECRET'
export interface Ending {
  outcomeKey: string
  victoryType: VictoryType
  title: string
  body?: string
  trigger?: Trigger
}

// --- content bundle (data-model.md §6) --------------------------------------

export interface CharacterRef {
  slug: string
  name: string
  honorific?: string
  alignment?: string
  role?: string
  drive?: string
  quirks?: string
}

export interface RewardRef {
  slug: string
  name: string
  rewardType: RewardType
  rarity: Rarity
  effect?: string
  description?: string
}

export interface ContentBundle {
  contentVersion: string
  regions: RegionsManifest
  decks: Deck[]
  arcs: Arc[]
  characters: CharacterRef[]
  rewards: RewardRef[]
  endings: Ending[]
}

// --- the save document (data-model.md §3) -----------------------------------

export interface InventoryReward {
  slug: string
  rarity: Rarity
  effect?: string
}

export interface ChoiceLogEntry {
  turn: number
  cardId: string
  prompt: string
  choiceText: string
  effects: Effect
  resultText?: string
}

export interface ArcState {
  step: string
  flags: Record<string, boolean>
}

export interface DeckState {
  seenCardIds: string[]
  activeArcs: Record<string, ArcState>
  cooldowns: Record<string, number> // turns remaining
  drawBag: string[]
}

export interface RunSave {
  schemaVersion: number
  saveId: string
  name: string
  dreamSlug: string
  contentVersion: string
  seed: string
  status: LifeRunStatus
  ruler: {
    name: string
    honorific?: string
    characterSlug?: string
    cosmetics?: Record<string, unknown>
  }
  turnCount: number
  cyclePosition: number
  kingdomHealth: KingdomHealth
  counters: Record<string, number>
  regionStates: Partial<Record<RegionKey, RegionState>>
  regionOverrides: Partial<Record<RegionKey, RegionState>>
  deckState: DeckState
  inventory: { skills: InventoryReward[]; items: InventoryReward[] }
  choiceLog: ChoiceLogEntry[]
  flags: Record<string, boolean>
  endingKey: string | null
  createdAt: string // display metadata only — never read by game logic
  updatedAt: string
}

// --- save index / slots (data-model.md §2.2) --------------------------------

export interface SaveSlotMeta {
  saveId: string
  name: string
  rulerName: string
  createdAt: string
  updatedAt: string
  turnCount: number
  status: LifeRunStatus
  kingdomHealth: KingdomHealth
}

export interface SaveIndex {
  schemaVersion: number
  activeSaveId: string | null
  slots: SaveSlotMeta[]
}

// --- compositor output (compositing.md §3) ----------------------------------

export interface SceneState {
  regionStates: Partial<Record<RegionKey, RegionState>>
  time: TimeKey
  fx: string[]
}
