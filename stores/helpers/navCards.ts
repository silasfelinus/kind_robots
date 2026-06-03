// /stores/helpers/navCards.ts
//
// Navigation deck for builder-hand, DERIVED from the canonical footer dashboard
// (dashboardConfigs.footer). footerRouteMap / footerDashboardMap map each footer
// key to a path + dashboard; the footer tabs now carry the card copy (flourish /
// tagline / narrative). One place to edit a nav label, icon, or blurb.
//
// 'home' is the only destination with no footer tab, so it stays explicit.

import {
  dashboardConfigs,
  footerRouteMap,
  footerDashboardMap,
  type FooterKey,
} from '@/stores/helpers/dashboardHelper'
import { deriveNavCard } from '@/stores/helpers/tabsToCards'
import type {
  BuilderCard,
  DashboardTabConfig,
} from '@/stores/helpers/builderCards'

export type NavCard = BuilderCard

const homeTab: DashboardTabConfig = {
  key: 'home',
  label: 'Home',
  icon: 'kind-icon:home',
  title: 'Home',
  flourish: '⌂',
  tagline: 'Back to the beginning.',
  narrative: 'Return to the front door of Kind Robots.',
}

const homeCard: NavCard = deriveNavCard(homeTab, {
  path: '/',
  imageDir: 'nav',
})

const footerNavCards: NavCard[] = dashboardConfigs.footer.tabs.map((tab) => {
  const key = tab.key as FooterKey
  return deriveNavCard(tab, {
    path: footerRouteMap[key],
    dashboardKey: footerDashboardMap[key],
    imageDir: 'nav',
  })
})

export const NAV_CARDS: NavCard[] = [homeCard, ...footerNavCards]
