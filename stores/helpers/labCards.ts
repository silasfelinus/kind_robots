// /stores/helpers/labCards.ts
//
// WonderLab deck — now DERIVED from the canonical 'wonder' dashboard config
// (dashboardConfigs.wonder.tabs in dashboardHelper.ts) instead of being a
// hand-maintained parallel list. The tab configs carry the flourish /
// narrative / image fields; deriveNavCards turns them into navigational
// BuilderCards routed to /wonderlab with the tab stowed in payload.

import { dashboardConfigs } from '@/stores/helpers/dashboardHelper'
import { deriveNavCards } from '@/stores/helpers/tabsToCards'
import type { BuilderCard } from '@/stores/helpers/builderCards'

export type LabCard = BuilderCard

export const LAB_CARDS: LabCard[] = deriveNavCards(
  dashboardConfigs.wonder.tabs,
  {
    path: '/wonderlab',
    dashboardKey: 'wonder',
    routeByTab: true,
    imageDir: 'lab',
  },
)
