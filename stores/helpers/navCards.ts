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

const CONDUCTOR_IMAGE_BASE =
  'https://raw.githubusercontent.com/silasfelinus/conductor/main/projects/images'

export const CONDUCTOR_NAV_CARD: NavCard = {
  key: 'conductor',
  label: 'Conductor',
  title: 'Conductor',
  icon: 'kind-icon:gearhammer',
  flourish: '⚙',
  deckImage: `${CONDUCTOR_IMAGE_BASE}/approval-portal-card.webp`,
  heroImage: `${CONDUCTOR_IMAGE_BASE}/approval-portal-hero.webp`,
  tagline: 'Steer agents, review work, and keep the human in the loop.',
  narrative:
    'Open the Conductor cockpit: project progress, pitches awaiting your vote, task gates, roadmap state, and the parts of the agent loop that need a human with a clipboard.',
  required: false,
  restoresFields: [],
  unlockCondition: 'always',
  payload: {
    path: '/conductor',
    dashboardKey: 'wonder',
    tab: 'workspace',
  },
  steps: [
    {
      key: 'conductor',
      title: 'Conductor',
      narrative:
        'Steer the agent loop, review project state, and decide what deserves human approval next.',
      inputType: 'custom',
      payload: {
        path: '/conductor',
        dashboardKey: 'wonder',
        tab: 'workspace',
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
