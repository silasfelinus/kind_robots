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
  dashboardKey?: string
  dashboardTab?: string
  label?: string
  title?: string
  room?: string
  subtitle?: string
  description?: string
  summary?: string
  narrative?: string
  tooltip?: string
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
  loadingMessage?: string
  refreshLabel?: string
  dottiTip?: string
  amiTip?: string
  dottitip?: string
  amitip?: string
}

export type ResolvedTab = {
  key: string
  channelKey: string
  tabKey: string
  dashboardKey: string
  dashboardTab: string
  label: string
  title: string
  room: string
  subtitle: string
  description: string
  summary: string
  narrative: string
  tooltip: string
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
  loadingMessage: string
  refreshLabel: string
  dottiTip: string
  amiTip: string
}

export type ResolvedChannel = {
  key: string
  channelKey: string
  dashboardKey: string
  label: string
  title: string
  room: string
  subtitle: string
  description: string
  summary: string
  narrative: string
  tooltip: string
  icon: string
  image: string
  route: string
  defaultTab: string
  sort: number
  requiredRole: string
  requiredPermission: string
  loadingMessage: string
  refreshLabel: string
  dottiTip: string
  amiTip: string
  tabs: ResolvedTab[]
}

export type ChannelLocationInput = {
  channelKey?: string | null
  tabKey?: string | null
  dashboardKey?: string | null
  dashboardTab?: string | null
  path?: string | null
}

export type ResolvedChannelLocation = {
  channel: ResolvedChannel
  tab: ResolvedTab | null
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

function tipValue(camelCase: unknown, legacyLowercase: unknown): string {
  return stringValue(camelCase) || stringValue(legacyLowercase)
}

function routeValue(value: unknown): string {
  const route = stringValue(value)
  if (!route) return ''
  if (route === '/') return route
  return route.startsWith('/') ? route.replace(/\/+$/, '') : `/${route}`
}

function pathValue(value: unknown): string {
  const path = routeValue(stringValue(value).split(/[?#]/)[0])
  return path || '/'
}

function matchesRole(requiredRole: string, role: string): boolean {
  if (!requiredRole) return true
  if (role === 'ADMIN') return true
  return requiredRole === role
}

function findTab(
  channel: ResolvedChannel,
  input: ChannelLocationInput,
): ResolvedTab | null {
  const tabKey = stringValue(input.tabKey)
  const dashboardKey = stringValue(input.dashboardKey)
  const dashboardTab = stringValue(input.dashboardTab)
  const path = pathValue(input.path)

  if (tabKey) {
    const matched = channel.tabs.find(
      (tab) => tab.tabKey === tabKey || tab.dashboardTab === tabKey,
    )
    if (matched) return matched
  }

  if (dashboardTab) {
    const matched = channel.tabs.find(
      (tab) =>
        tab.dashboardTab === dashboardTab &&
        (!dashboardKey || !tab.dashboardKey || tab.dashboardKey === dashboardKey),
    )
    if (matched) return matched
  }

  const routeMatches = channel.tabs.filter((tab) => tab.route === path)
  if (routeMatches.length === 1) return routeMatches[0] ?? null

  if (routeMatches.length > 1 && dashboardKey) {
    const matched = routeMatches.find(
      (tab) => !tab.dashboardKey || tab.dashboardKey === dashboardKey,
    )
    if (matched) return matched
  }

  return (
    channel.tabs.find((tab) => tab.tabKey === channel.defaultTab) ??
    channel.tabs[0] ??
    null
  )
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
      const channelRoom = stringValue(channel.room) || channelTitle
      const channelSubtitle = stringValue(channel.subtitle)
      const channelDescription = stringValue(channel.description)
      const channelSummary = stringValue(channel.summary)
      const channelNarrative = stringValue(channel.narrative)
      const channelTooltip = stringValue(channel.tooltip)
      const channelIcon = stringValue(channel.icon) || 'kind-icon:folder'
      const channelRoute = routeValue(channel.route) || `/${channelKey}`
      const channelDashboardKey = stringValue(channel.dashboardKey)
      const channelRole = stringValue(channel.requiredRole)
      const channelPermission = stringValue(channel.requiredPermission)
      const channelLoadingMessage =
        stringValue(channel.loadingMessage) || `Loading ${channelLabel}…`
      const channelRefreshLabel =
        stringValue(channel.refreshLabel) || `Refresh ${channelLabel}`
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
            key: tabKey,
            channelKey,
            tabKey,
            dashboardKey:
              stringValue(tab.dashboardKey) || channelDashboardKey,
            dashboardTab: stringValue(tab.dashboardTab) || tabKey,
            label,
            title: stringValue(tab.title) || label,
            room: stringValue(tab.room) || channelRoom,
            subtitle: stringValue(tab.subtitle) || channelSubtitle,
            description: stringValue(tab.description) || channelDescription,
            summary: stringValue(tab.summary) || channelSummary,
            narrative: stringValue(tab.narrative) || channelNarrative,
            tooltip: stringValue(tab.tooltip) || channelTooltip,
            icon: stringValue(tab.icon) || channelIcon,
            image: imageValue(tab.image, channelKey, tabKey),
            route: routeValue(tab.route) || channelRoute,
            component: stringValue(tab.component),
            modelType: stringValue(tab.modelType),
            sort: sortValue(tab.sort),
            cards: tab.cards ?? channel.cards ?? null,
            requiredBeforeNext: Array.isArray(tab.requiredBeforeNext)
              ? tab.requiredBeforeNext
              : [],
            requiredRole: stringValue(tab.requiredRole) || channelRole,
            requiredPermission:
              stringValue(tab.requiredPermission) || channelPermission,
            loadingMessage:
              stringValue(tab.loadingMessage) || channelLoadingMessage,
            refreshLabel:
              stringValue(tab.refreshLabel) || channelRefreshLabel,
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
        key: channelKey,
        channelKey,
        dashboardKey: channelDashboardKey,
        label: channelLabel,
        title: channelTitle,
        room: channelRoom,
        subtitle: channelSubtitle,
        description: channelDescription,
        summary: channelSummary,
        narrative: channelNarrative,
        tooltip: channelTooltip,
        icon: channelIcon,
        image: imageValue(channel.image, channelKey),
        route: channelRoute,
        defaultTab,
        sort: sortValue(channel.sort),
        requiredRole: channelRole,
        requiredPermission: channelPermission,
        loadingMessage: channelLoadingMessage,
        refreshLabel: channelRefreshLabel,
        dottiTip: channelDottiTip,
        amiTip: channelAmiTip,
        tabs,
      }
    })
    .filter((channel): channel is ResolvedChannel => channel !== null)
    .sort((a, b) => a.sort - b.sort || a.label.localeCompare(b.label))
}

export function filterChannelsByRole(
  channels: ResolvedChannel[],
  role: string,
): ResolvedChannel[] {
  return channels
    .filter((channel) => matchesRole(channel.requiredRole, role))
    .map((channel) => ({
      ...channel,
      tabs: channel.tabs.filter((tab) => matchesRole(tab.requiredRole, role)),
    }))
}

export function resolveChannelLocation(
  channels: ResolvedChannel[],
  input: ChannelLocationInput,
): ResolvedChannelLocation | null {
  const channelKey = stringValue(input.channelKey)
  const dashboardKey = stringValue(input.dashboardKey)
  const path = pathValue(input.path)

  let channel = channelKey
    ? channels.find(
        (item) =>
          item.channelKey === channelKey || item.dashboardKey === channelKey,
      )
    : undefined

  if (!channel && dashboardKey) {
    channel = channels.find((item) => item.dashboardKey === dashboardKey)
  }

  if (!channel) {
    const tabMatches = channels.flatMap((item) =>
      item.tabs
        .filter((tab) => tab.route === path)
        .map((tab) => ({ channel: item, tab })),
    )

    if (tabMatches.length === 1) return tabMatches[0] ?? null

    if (tabMatches.length > 1 && dashboardKey) {
      const matched = tabMatches.find(
        ({ tab }) => !tab.dashboardKey || tab.dashboardKey === dashboardKey,
      )
      if (matched) return matched
    }
  }

  if (!channel) {
    channel = channels.find(
      (item) =>
        item.route === path ||
        (item.route !== '/' && path.startsWith(`${item.route}/`)),
    )
  }

  if (!channel) return null

  return {
    channel,
    tab: findTab(channel, input),
  }
}
