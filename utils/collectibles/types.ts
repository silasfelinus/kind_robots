// /utils/collectibles/types.ts
//
// Shared collectible-set contract (tarot-studio is the first set). A set is a
// typed code catalog: cards with rarities, unlockable backs and an earn-only
// economy. Player state lives in CollectibleWallet / CollectibleOwnership.
// There is deliberately no purchase path: currency is only ever earned.

export type CollectibleRarity =
  'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export const COLLECTIBLE_RARITIES: CollectibleRarity[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
]

export type CollectibleCard = {
  key: string
  title: string
  subtitle: string
  rarity: CollectibleRarity
  group: string
  /** Positive scene description for the Conductor art ledger (no style words). */
  artPrompt: string
}

export type CollectibleBackUnlock =
  | { kind: 'default' }
  | { kind: 'streak'; days: number }
  | { kind: 'group'; group: string }
  | { kind: 'unique'; count: number }

export type CollectibleBack = {
  key: string
  title: string
  hint: string
  unlock: CollectibleBackUnlock
  artPrompt: string
}

export type CollectibleTask = {
  key: string
  label: string
  reward: number
}

export type CollectibleEconomy = {
  currencyName: string
  currencyGlyph: string
  dailyBase: number
  dailyStreakStep: number
  /** Streak days beyond which the daily bonus stops growing. */
  dailyStreakCap: number
  /** Every Nth consecutive day also grants a free pack ticket. */
  ticketEvery: number
  packCost: number
  packSize: number
  /** Relative weights per pack slot. */
  rarityWeights: Record<CollectibleRarity, number>
  /** The last slot of every pack is at least this rarity. */
  packFloor: CollectibleRarity
  /** A top-rarity card is guaranteed once this many pulls pass without one. */
  pityAt: number
  /** Currency refunded for a duplicate, by rarity. */
  duplicateRefund: Record<CollectibleRarity, number>
  /** Once-a-day bonus tasks the page reports (server-enforced once per day). */
  tasks: CollectibleTask[]
  /** Welcome gift on a player's very first claim. */
  welcomeTickets: number
}

export type CollectibleSet = {
  slug: string
  projectSlug: string
  title: string
  /** Pacific by default: the day boundary for daily rewards. */
  timeZone: string
  /** Conductor ledger whose cells render this set's art. */
  ledgerPath: string
  ledgerLane: string
  /** House style appended to every art prompt (the ledger lane suffix). */
  artStyle: string
  cards: CollectibleCard[]
  backs: CollectibleBack[]
  economy: CollectibleEconomy
}
