// /stores/helpers/labCards.ts
//
// Lab cards derive entirely from the canonical dashboardConfigs.wonder.tabs
// registry. After the "forever nav" restructure (Lab dissolved into
// Play/Build/Plan), each wonder tool lives on its own nested route rather than
// the shared /wonderlab shell — so every card links directly to that tab's own
// `route` instead of routing back through a single page with a `?tab=` query.
import { dashboardConfigs } from '@/stores/helpers/dashboardHelper'
import { deriveNavCard } from '@/stores/helpers/tabsToCards'
import type { BuilderCard } from '@/stores/helpers/builderCards'

export type LabCard = BuilderCard

export const LAB_CARDS: LabCard[] = dashboardConfigs.wonder.tabs.map((tab) =>
  deriveNavCard(tab, {
    path: tab.route,
    dashboardKey: 'wonder',
    imageDir: 'lab',
  }),
)
