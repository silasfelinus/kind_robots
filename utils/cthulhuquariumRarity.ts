// /utils/cthulhuquariumRarity.ts
//
// The console's rarity language (cthulhuquarium/t-098): every card, seal and
// ribbon names a Monster tier the same way. Colours live in the game's CSS
// under [data-rarity]; this only normalises the tier and orders it.

export const RARITY_ORDER = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'mythic',
] as const

export type RarityKey = (typeof RARITY_ORDER)[number]

export function rarityKey(tier: string | null | undefined): RarityKey {
  const key = (tier ?? '').trim().toLowerCase()
  return (RARITY_ORDER as readonly string[]).includes(key)
    ? (key as RarityKey)
    : 'common'
}

export function rarityLabel(tier: string | null | undefined): string {
  const key = rarityKey(tier)
  return key.charAt(0).toUpperCase() + key.slice(1)
}

export function rarityRank(tier: string | null | undefined): number {
  return RARITY_ORDER.indexOf(rarityKey(tier))
}
