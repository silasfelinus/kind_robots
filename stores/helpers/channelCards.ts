// /stores/helpers/channelCards.ts
import type { BuilderCard } from '@/stores/helpers/builderCards'
import type {
  NavigationCard,
  ResolvedChannel,
  ResolvedTab,
} from '@/stores/helpers/channelContent'

function tabPayload(tab: ResolvedTab): Record<string, unknown> {
  return {
    path: tab.route,
    channelKey: tab.channelKey,
    tabKey: tab.tabKey,
    dashboardKey: tab.dashboardKey,
    tab: tab.dashboardTab,
    component: tab.component,
    modelType: tab.modelType,
  }
}

export function channelTabToCard(tab: ResolvedTab): BuilderCard {
  const narrative =
    tab.narrative || tab.description || tab.summary || tab.subtitle || tab.title
  const tagline = tab.subtitle || tab.summary || tab.description || tab.label
  const payload = tabPayload(tab)

  return {
    key: tab.tabKey,
    label: tab.label,
    title: tab.title,
    icon: tab.icon,
    deckImage: tab.image,
    heroImage: tab.tutorial?.image || tab.image,
    tagline,
    narrative,
    required: false,
    restoresFields: [],
    unlockCondition: 'always',
    payload,
    steps: [
      {
        key: tab.tabKey,
        title: tab.title,
        narrative,
        inputType: 'custom',
        heroImage: tab.tutorial?.image || tab.image,
        payload,
      },
    ],
  }
}

export function channelTabsToCards(channel: ResolvedChannel): BuilderCard[] {
  return channel.tabs.map(channelTabToCard)
}

export function navigationCardToBuilderCard(
  card: NavigationCard,
): BuilderCard {
  const narrative = card.description || card.label
  const payload: Record<string, unknown> = {
    path: card.route || '',
    action: card.action || '',
  }

  return {
    key: card.key,
    label: card.label,
    title: card.label,
    icon: card.icon || 'kind-icon:cards',
    deckImage: card.image,
    heroImage: card.image,
    tagline: narrative,
    narrative,
    required: false,
    restoresFields: [],
    unlockCondition: 'always',
    payload,
    steps: [
      {
        key: card.key,
        title: card.label,
        narrative,
        inputType: 'custom',
        heroImage: card.image,
        payload,
      },
    ],
  }
}

export function navigationCardsToBuilderCards(
  cards: NavigationCard[],
): BuilderCard[] {
  return cards.map(navigationCardToBuilderCard)
}
