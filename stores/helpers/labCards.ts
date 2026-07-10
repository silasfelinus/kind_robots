// /stores/helpers/labCards.ts
//
// Lab cards derive entirely from the canonical dashboardConfigs.wonder.tabs
// registry (the temporary hand-rolled mural bridge was removed in the mural
// engine migration, step 7). The mural tab routes to its own page, so its
// card gets /mural as its path instead of the shared /wonderlab shell.
import { dashboardConfigs } from '@/stores/helpers/dashboardHelper'
import { deriveNavCard } from '@/stores/helpers/tabsToCards'
import type { BuilderCard } from '@/stores/helpers/builderCards'

export type LabCard = BuilderCard

export const LAB_CARDS: LabCard[] = dashboardConfigs.wonder.tabs.map((tab) =>
  deriveNavCard(
    tab,
    tab.key === 'mural'
      ? { path: '/mural', dashboardKey: 'wonder', imageDir: 'lab' }
      : {
          path: '/wonderlab',
          dashboardKey: 'wonder',
          routeByTab: true,
          imageDir: 'lab',
        },
  ),
)
