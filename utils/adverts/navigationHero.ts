// Publicly curated Advert Studio posters also supply the Play launcher art.
// Keep this explicit: display names and stable internal tab keys diverge
// (e.g. Downward Mobility still has the 'shifting-desks' tab key).
const HERO_SLOT_BY_PLAY_TAB: Readonly<Record<string, string>> = {
  arcade: 'adverts/arcade/hero',
  'emperor-of-dust': 'adverts/emperor-of-dust/hero',
  'zuzu-shifting-lands': 'adverts/shifting-lands/hero',
  ecotone: 'adverts/ecotone/hero',
  'comet-city-academy': 'adverts/prom-of-doom/hero',
  'ruler-hooked': 'adverts/ruler-hooked/hero',
  'shifting-desks': 'adverts/the-elevator-only-goes-down/hero',
}

export function navigationHeroSlotKey(
  channelKey: string,
  tabKey: string,
): string | null {
  return channelKey === 'arcade'
    ? (HERO_SLOT_BY_PLAY_TAB[tabKey] ?? null)
    : null
}

export function curatedNavigationImage(
  tab: { channelKey: string; tabKey: string; image: string },
  publicSelections: Readonly<Record<string, number>>,
): string {
  const slotKey = navigationHeroSlotKey(tab.channelKey, tab.tabKey)
  const imageId = slotKey ? publicSelections[slotKey] : undefined
  return imageId && Number.isSafeInteger(imageId) && imageId > 0
    ? `/api/art/images/${imageId}/file`
    : tab.image
}
