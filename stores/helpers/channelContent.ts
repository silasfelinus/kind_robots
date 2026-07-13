// /stores/helpers/channelContent.ts
import type { ContentCollectionItem } from '@nuxt/content'

export type NavigationCard = {
  key: string
  label: string
  description?: string
  icon?: string
  image?: string
  route?: string
  action?: string
}

export type ChannelContentItem = ContentCollectionItem & {
  contentType?: 'page' | 'channel' | 'tab'
  channelKey?: string
  tabKey?: string
  label?: string
  title?: string
  subtitle?: string
  description?: string
  summary?: string
  narrative?: string
  icon?: string
  image?: string
  route?: string
  component?: string
  modelType?: string
  defaultTab?: string
  sort?: string | number
  cards?: string | NavigationCard[]
  requiredBeforeNext?: string[]
  requiredRole?: string
  requiredPermission?: string
  visible?: boolean
  dottiTip?: string
  amiTip?: string
  dottitip?: string
  amitip?: string
}

export type ResolvedTab = {
  channelKey: string
  tabKey: string
  label: string
  title: string
  subtitle: string
  description: string
  summary: string
  narrative: string
  icon: string
  image: string
  route: string
  component: string
  modelType: string
  sort: number
  cards: string | NavigationCard[] | null
  requiredBeforeNext: string[]
  requiredRole: string
  requiredPermission: string
  dottiTip: string
  amiTip: string
}

export type ResolvedChannel = {
  channelKey: string
  label: string
  title: string
  subtitle: string
  description: string
  summary: string
  narrative: string
  icon: string
  image: string
  route: string
  defaultTab: string
  sort: number
  requiredRole: string
  requiredPermission: string
  dottiTip: string
  amiTip: string
  tabs: ResolvedTab[]
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function sortValue(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return 0
}

function imageValue(
  image: unknown,
  channelKey: string,
  tabKey?: string,
): string {
  const explicit = stringValue(image)
  if (explicit) {
    if (explicit.startsWith('/') || explicit.startsWith('http')) return explicit
    return `/images/${explicit}`
  }

  return tabKey
    ? `/images/channels/${channelKey}/${tabKey}.webp`
    : `/images/channels/${channelKey}/channel.webp`
}

function tipValue(
  camelCase: unknown,
  legacyLowercase: unknown,
): string {
  return stringValue(camelCase) || stringValue(legacyLowercase)
}

export function resolveChannels(
  items: ChannelContentItem[],
): ResolvedChannel[] {
  const channelItems = items.filter(
    (item) => item.contentType === 'channel' && item.visible !== false,
  )
  const tabItems = items.filter(
    (item) => item.contentType === 'tab' && item.visible !== false,
  )

  return channelItems
    .map((channel): ResolvedChannel | null => {
      const channelKey = stringValue(channel.channelKey)
      if (!channelKey) return null

      const channelLabel =
        stringValue(channel.label) || stringValue(channel.title) || channelKey
      const channelTitle = stringValue(channel.title) || channelLabel
      const channelSubtitle = stringValue(channel.subtitle)
      const channelDescription = stringValue(channel.description)
      const channelSummary = stringValue(channel.summary)
      const channelNarrative = stringValue(channel.narrative)
      const channelIcon = stringValue(channel.icon) || 'kind-icon:folder'
      const channelRoute = stringValue(channel.route) || `/${channelKey}`
      const channelRole = stringValue(channel.requiredRole)
      const channelPermission = stringValue(channel.requiredPermission)
      const channelDottiTip = tipValue(channel.dottiTip, channel.dottitip)
      const channelAmiTip = tipValue(channel.amiTip, channel.amitip)

      const tabs = tabItems
        .filter((tab) => stringValue(tab.channelKey) === channelKey)
        .map((tab): ResolvedTab | null => {
          const tabKey = stringValue(tab.tabKey)
          if (!tabKey) return null

          const label =
            stringValue(tab.label) || stringValue(tab.title) || tabKey

          return {
            channelKey,
            tabKey,
            label,
            title: stringValue(tab.title) || label,
            subtitle: stringValue(tab.subtitle) || channelSubtitle,
            description:
              stringValue(tab.description) || channelDescription,
            summary: stringValue(tab.summary) || channelSummary,
            narrative: stringValue(tab.narrative) || channelNarrative,
            icon: stringValue(tab.icon) || channelIcon,
            image: imageValue(tab.image, channelKey, tabKey),
            route: stringValue(tab.route) || channelRoute,
            component: stringValue(tab.component),
            modelType: stringValue(tab.modelType),
            sort: sortValue(tab.sort),
            cards: tab.cards ?? channel.cards ?? null,
            requiredBeforeNext: Array.isArray(tab.requiredBeforeNext)
              ? tab.requiredBeforeNext
              : [],
            requiredRole:
              stringValue(tab.requiredRole) || channelRole,
            requiredPermission:
              stringValue(tab.requiredPermission) || channelPermission,
            dottiTip:
              tipValue(tab.dottiTip, tab.dottitip) || channelDottiTip,
            amiTip: tipValue(tab.amiTip, tab.amitip) || channelAmiTip,
          }
        })
        .filter((tab): tab is ResolvedTab => tab !== null)
        .sort((a, b) => a.sort - b.sort || a.label.localeCompare(b.label))

      const requestedDefault = stringValue(channel.defaultTab)
      const defaultTab = tabs.some((tab) => tab.tabKey === requestedDefault)
        ? requestedDefault
        : tabs[0]?.tabKey || ''

      return {
        channelKey,
        label: channelLabel,
        title: channelTitle,
        subtitle: channelSubtitle,
        description: channelDescription,
        summary: channelSummary,
        narrative: channelNarrative,
        icon: channelIcon,
        image: imageValue(channel.image, channelKey),
        route: channelRoute,
        defaultTab,
        sort: sortValue(channel.sort),
        requiredRole: channelRole,
        requiredPermission: channelPermission,
        dottiTip: channelDottiTip,
        amiTip: channelAmiTip,
        tabs,
      }
    })
    .filter((channel): channel is ResolvedChannel => channel !== null)
    .sort((a, b) => a.sort - b.sort || a.label.localeCompare(b.label))
}
