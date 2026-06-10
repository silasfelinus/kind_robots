// /stores/helpers/tabsToCards.ts
import type {
  BuilderCard,
  DashboardTabConfig,
} from '@/stores/helpers/builderCards'

type DeriveOptions = {
  path: string
  dashboardKey?: string
  routeByTab?: boolean
  imageDir?: string
}

export function deriveNavCard(
  tab: DashboardTabConfig,
  options: DeriveOptions,
): BuilderCard {
  const { path, dashboardKey, routeByTab = false, imageDir } = options

  const payload = {
    path,
    ...(dashboardKey ? { dashboardKey } : {}),
    ...(routeByTab ? { tab: tab.key } : {}),
  }

  const image =
    tab.image || (imageDir ? `/images/${imageDir}/${tab.key}.webp` : undefined)

  const title = tab.title || tab.label
  const narrative = tab.narrative || tab.summary || title
  const tagline = tab.tagline || tab.summary || ''

  return {
    key: tab.key,
    label: tab.label,
    title,
    icon: tab.icon || 'kind-icon:sparkles',
    flourish: tab.flourish,
    deckImage: image,
    heroImage: image,
    tagline,
    narrative,
    required: false,
    restoresFields: [],
    unlockCondition: 'always',
    payload,
    steps: [
      {
        key: tab.key,
        title,
        narrative,
        inputType: 'custom',
        payload,
      },
    ],
  }
}

export function deriveNavCards(
  tabs: DashboardTabConfig[],
  options: DeriveOptions,
): BuilderCard[] {
  return tabs.map((tab) => deriveNavCard(tab, options))
}
