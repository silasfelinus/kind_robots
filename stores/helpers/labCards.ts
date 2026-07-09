// /stores/helpers/labCards.ts
import { dashboardConfigs, getDashboardTabImagePath } from '@/stores/helpers/dashboardHelper'
import { deriveNavCard, deriveNavCards } from '@/stores/helpers/tabsToCards'
import type {
  BuilderCard,
  DashboardTabConfig,
} from '@/stores/helpers/builderCards'

export type LabCard = BuilderCard

const muralTab = {
  key: 'mural',
  label: 'Mural',
  icon: 'kind-icon:paintbrush',
  title: 'Mural Color Studio',
  summary:
    'Color a paintable mural plan by section, shared color group, and saved paint swatch.',
  image: getDashboardTabImagePath('wonder', 'mural'),
  flourish: '✺',
  tagline: 'Paint inside the lines, then bend the lines politely.',
  narrative:
    'Color a simplified mural page, assign one paint ID across multiple sections, override individual shapes, and save the palette before the paint goblin eats the swatches.',
  route: '/mural',
} as const satisfies DashboardTabConfig

export const LAB_CARDS: LabCard[] = [
  ...deriveNavCards(dashboardConfigs.wonder.tabs, {
    path: '/wonderlab',
    dashboardKey: 'wonder',
    routeByTab: true,
    imageDir: 'lab',
  }),
  deriveNavCard(muralTab, {
    path: '/mural',
    dashboardKey: 'wonder',
    imageDir: 'lab',
  }),
]
