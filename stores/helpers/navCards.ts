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
import { CONDUCTOR_DASHBOARD_KEY, CONDUCTOR_DEFAULT_TAB } from '@/stores/helpers/conductorTabs'

export type NavCard = BuilderCard

export {
  getNavHeroImagePath,
  getNavThumbImagePath,
  NAV_IMAGE_BASE,
  NAV_IMAGE_EXTENSION,
}

export const CONDUCTOR_NAV_CARD: NavCard = {
  key: 'conductor',
  label: 'Conductor',
  title: 'Conductor',
  icon: 'kind-icon:gearhammer',
  flourish: '⚙',
  deckImage: getNavThumbImagePath('conductor'),
  heroImage: getNavHeroImagePath('conductor'),
  tagline: 'Steer agents, review work, and configure Portos.',
  narrative:
    'Open the Conductor cockpit: project progress, pitches awaiting your vote, task gates, roadmap state, Portos setup, and the pieces that need a human with a clipboard.',
  required: false,
  restoresFields: [],
  unlockCondition: 'always',
  payload: {
    path: '/conductor',
    dashboardKey: CONDUCTOR_DASHBOARD_KEY,
    tab: CONDUCTOR_DEFAULT_TAB,
  },
  steps: [
    {
      key: 'conductor',
      title: 'Conductor',
      narrative:
        'Steer the agent loop, review project state, configure Portos, and decide what deserves human approval next.',
      inputType: 'custom',
      payload: {
        path: '/conductor',
        dashboardKey: CONDUCTOR_DASHBOARD_KEY,
        tab: CONDUCTOR_DEFAULT_TAB,
      },
    },
  ],
}

export const NAV_CARDS: NavCard[] = [
  ...dashboardConfigs.footer.tabs.map((tab) => {
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
  }),
  CONDUCTOR_NAV_CARD,
]
