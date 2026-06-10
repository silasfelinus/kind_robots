// /stores/helpers/navCards.ts

import {
  dashboardConfigs,
  footerRouteMap,
  footerDashboardMap,
  getNavHeroImagePath,
  getNavThumbImagePath,
  NAV_IMAGE_BASE,
  NAV_IMAGE_EXTENSION,
  type DashboardTabConfig,
  type FooterKey,
} from '@/stores/helpers/dashboardHelper'
import { deriveNavCard } from '@/stores/helpers/tabsToCards'
import type { BuilderCard } from '@/stores/helpers/builderCards'

export type NavCard = BuilderCard

// Re-exported for existing imports; dashboardHelper is the canonical home.
export {
  getNavHeroImagePath,
  getNavThumbImagePath,
  NAV_IMAGE_BASE,
  NAV_IMAGE_EXTENSION,
}

const homeTab: DashboardTabConfig = {
  key: 'home',
  label: 'Home',
  icon: 'kind-icon:home',
  title: 'Home',
  image: getNavHeroImagePath('home'),
  flourish: '⌂',
  tagline: 'Back to the beginning.',
  summary: 'Return to the front door of Kind Robots.',
  narrative: 'Return to the front door of Kind Robots.',
  route: '/',
}

const homeCard: NavCard = {
  ...deriveNavCard(homeTab, {
    path: '/',
    imageDir: 'nav/heroes',
  }),
  deckImage: getNavThumbImagePath('home'),
  heroImage: getNavHeroImagePath('home'),
}

const footerNavCards: NavCard[] = dashboardConfigs.footer.tabs.map((tab) => {
  const key = tab.key as FooterKey

  return {
    ...deriveNavCard(tab, {
      path: footerRouteMap[key],
      dashboardKey: footerDashboardMap[key],
      imageDir: 'nav/heroes',
    }),
    deckImage: getNavThumbImagePath(key),
    heroImage: getNavHeroImagePath(key),
  }
})

export const NAV_CARDS: NavCard[] = [homeCard, ...footerNavCards]
