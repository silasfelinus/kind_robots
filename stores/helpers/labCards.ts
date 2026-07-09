// /stores/helpers/labCards.ts
import { dashboardConfigs } from '@/stores/helpers/dashboardHelper'
import { deriveNavCards } from '@/stores/helpers/tabsToCards'
import type { BuilderCard } from '@/stores/helpers/builderCards'

export type LabCard = BuilderCard

export const LAB_CARDS: LabCard[] = deriveNavCards(dashboardConfigs.wonder.tabs, {
  path: '/wonderlab',
  dashboardKey: 'wonder',
  routeByTab: true,
  imageDir: 'lab',
})
