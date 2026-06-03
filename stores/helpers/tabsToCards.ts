// /stores/helpers/tabsToCards.ts
//
// Single deriver that turns DashboardTabConfig entries (the canonical source
// in dashboardHelper.ts) into navigational BuilderCards for builder-hand.
// Replaces the hand-maintained navCards.ts / labCards.ts duplication: those
// files now just call deriveNavCards(...) over a slice of dashboard tabs.
//
// A derived card is navigational, not data-collecting: one 'custom' step,
// empty restoresFields, routing stowed in payload ({ path, dashboardKey?, tab? }).
// deckImage and heroImage both point at the tab's `image` (or a flat
// /images/<imageDir>/<key>.webp fallback).

import type {
  BuilderCard,
  DashboardTabConfig,
} from '@/stores/helpers/builderCards'

type DeriveOptions = {
  // Where the card routes when clicked.
  path: string
  // Dashboard the tab belongs to (stowed in payload for the click handler).
  dashboardKey?: string
  // If set, the tab.key is sent as payload.tab (sub-tab switch on arrival).
  routeByTab?: boolean
  // Flat image folder for fallback art: /images/<imageDir>/<key>.webp
  imageDir?: string
}

export function deriveNavCard(
  tab: DashboardTabConfig,
  options: DeriveOptions,
): BuilderCard {
  const { path, dashboardKey, routeByTab = false, imageDir } = options

  const payload = {
    path,
    ...(dashboardKey ? { dashboardKey } : {}),
    ...(routeByTab ? { tab: tab.key } : {}),
  }

  const image =
    tab.image ?? (imageDir ? `/images/${imageDir}/${tab.key}.webp` : undefined)

  const narrative = tab.narrative ?? tab.summary ?? tab.title ?? tab.label
  const tagline = tab.tagline ?? tab.summary ?? ''

  return {
    key: tab.key,
    label: tab.label,
    title: tab.title ?? tab.label,
    icon: tab.icon,
    flourish: tab.flourish,
    deckImage: image,
    heroImage: image,
    tagline,
    narrative,
    required: false,
    restoresFields: [],
    unlockCondition: 'always',
    payload,
    steps: [
      {
        key: tab.key,
        title: tab.title ?? tab.label,
        narrative,
        inputType: 'custom',
        payload,
      },
    ],
  }
}

export function deriveNavCards(
  tabs: DashboardTabConfig[],
  options: DeriveOptions,
): BuilderCard[] {
  return tabs.map((tab) => deriveNavCard(tab, options))
}
