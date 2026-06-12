// /stores/helpers/navCards.ts

import {
  dashboardConfigs,
  footerRouteMap,
  footerDashboardMap,
  getNavHeroImagePath,
  getNavThumbImagePath,
  NAV_IMAGE_BASE,
  NAV_IMAGE_EXTENSION,
  type FooterKey,
} from '@/stores/helpers/dashboardHelper'
import { deriveNavCard } from '@/stores/helpers/tabsToCards'
import type { BuilderCard } from '@/stores/helpers/builderCards'

export type NavCard = BuilderCard

export {
  getNavHeroImagePath,
  getNavThumbImagePath,
  NAV_IMAGE_BASE,
  NAV_IMAGE_EXTENSION,
}

export const NAV_CARDS: NavCard[] = dashboardConfigs.footer.tabs.map((tab) => {
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
