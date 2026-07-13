// /stores/helpers/channelContent.ts

export type NavigationCard = {
  key: string
  label: string
  description?: string
  icon?: string
  image?: string
  route?: string
  action?: string
}

export type TutorialContent = {
  enabled?: boolean
  title?: string
  overview?: string
  tagline?: string
  hero?: string
  earnings?: string
  body?: string
  image?: string
  underConstruction?: boolean
}

export type ChannelContentItem = {
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
  tutorial?: TutorialContent
  requiredBeforeNext?: string[]
  requiredRole?: string
  requiredPermission?: string
  visible?: boolean
  status?: string
  loadingMessage?: string
  refreshLabel?: string
  dottiTip?: string
  amiTip?: string
  dottitip?: string
  amitip?: string
  path?: string
  stem?: string
  id?: string
}

export type ResolvedTutorialSection = {
  key: string
  title: string
  body: string
  image: string
  underConstruction?: boolean
}

export type ResolvedTutorialChannel = {
  key: string
  title: string
  hero: string
  overview: string
  tagline: string
  earnings: string
  underConstruction?: boolean
  sections: ResolvedTutorialSection[]
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
  tutorial: ResolvedTutorialSection | null
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
  tutorial: ResolvedTutorialChannel | null
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

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function order(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const parsed = Number(text(value))
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizedRoute(value: unknown): string {
  const route = text(value)
  if (!route) return ''
  if (route === '/') return route
  const prefixed = route.startsWith('/') ? route : `/${route}`
  return prefixed.replace(/\/+$/, '')
}

function normalizedPath(value: unknown): string {
  return normalizedRoute(text(value).split(/[?#]/)[0]) || '/'
}

function imagePath(
  value: unknown,
  channelKey: string,
  tabKey?: string,
  dashboardKey?: string,
  dashboardTab?: string,
): string {
  const explicit = text(value)
  if (explicit) {
    return explicit.startsWith('/') || explicit.startsWith('http')
      ? explicit
      : `/images/${explicit}`
  }

  if (tabKey && dashboardKey && dashboardTab) {
    return `/images/dashboard-tabs/${dashboardKey}/${dashboardTab}.webp`
  }

  return tabKey
    ? `/images/channels/${channelKey}/${tabKey}.webp`
    : `/images/channels/${channelKey}/channel.webp`
}

function tutorialImage(value: unknown, fallback: string): string {
  const explicit = text(value)
  if (!explicit) return fallback
  return explicit.startsWith('/') || explicit.startsWith('http')
    ? explicit
    : `/images/${explicit}`
}

function dialogue(camelCase: unknown, legacy: unknown): string {
  return text(camelCase) || text(legacy)
}

function roleAllows(requiredRole: string, role: string): boolean {
  return !requiredRole || role === 'ADMIN' || requiredRole === role
}

function resolveTab(
  channel: ResolvedChannel,
  input: ChannelLocationInput,
): ResolvedTab | null {
  const tabKey = text(input.tabKey)
  const dashboardKey = text(input.dashboardKey)
  const dashboardTab = text(input.dashboardTab)
  const path = normalizedPath(input.path)

  if (tabKey) {
    const direct = channel.tabs.find(
      (tab) => tab.tabKey === tabKey || tab.dashboardTab === tabKey,
    )
    if (direct) return direct
  }

  if (dashboardTab) {
    const legacy = channel.tabs.find(
      (tab) =>
        tab.dashboardTab === dashboardTab &&
        (!dashboardKey || !tab.dashboardKey || tab.dashboardKey === dashboardKey),
    )
    if (legacy) return legacy
  }

  const routeMatches = channel.tabs.filter((tab) => tab.route === path)
  if (routeMatches.length === 1) return routeMatches[0] ?? null

  if (routeMatches.length > 1 && dashboardKey) {
    const legacy = routeMatches.find(
      (tab) => !tab.dashboardKey || tab.dashboardKey === dashboardKey,
    )
    if (legacy) return legacy
  }

  return (
    channel.tabs.find((tab) => tab.tabKey === channel.defaultTab) ??
    channel.tabs[0] ??
    null
  )
}

function resolveTabItem(
  item: ChannelContentItem,
  channel: Omit<ResolvedChannel, 'defaultTab' | 'tutorial' | 'tabs'>,
): ResolvedTab | null {
  const tabKey = text(item.tabKey)
  if (!tabKey) return null

  const label = text(item.label) || text(item.title) || tabKey
  const title = text(item.title) || label
  const description = text(item.description) || channel.description
  const summary = text(item.summary) || channel.summary
  const narrative = text(item.narrative) || channel.narrative
  const dashboardKey = text(item.dashboardKey) || channel.dashboardKey
  const dashboardTab = text(item.dashboardTab) || tabKey
  const image = imagePath(
    item.image,
    channel.channelKey,
    tabKey,
    dashboardKey,
    dashboardTab,
  )
  const tutorial =
    item.tutorial?.enabled === false
      ? null
      : {
          key: tabKey,
          title: text(item.tutorial?.title) || title,
          body:
            text(item.tutorial?.body) ||
            description ||
            summary ||
            narrative ||
            title,
          image: tutorialImage(item.tutorial?.image, image),
          underConstruction:
            item.tutorial?.underConstruction === true ||
            text(item.status) === 'under-construction' ||
            undefined,
        }

  return {
    key: tabKey,
    channelKey: channel.channelKey,
    tabKey,
    dashboardKey,
    dashboardTab,
    label,
    title,
    room: text(item.room) || channel.room,
    subtitle: text(item.subtitle) || channel.subtitle,
    description,
    summary,
    narrative,
    tooltip: text(item.tooltip) || channel.tooltip,
    icon: text(item.icon) || channel.icon,
    image,
    route: normalizedRoute(item.route) || channel.route,
    component: text(item.component),
    modelType: text(item.modelType),
    sort: order(item.sort),
    cards: item.cards ?? null,
    tutorial,
    requiredBeforeNext: Array.isArray(item.requiredBeforeNext)
      ? item.requiredBeforeNext
      : [],
    requiredRole: text(item.requiredRole) || channel.requiredRole,
    requiredPermission:
      text(item.requiredPermission) || channel.requiredPermission,
    loadingMessage: text(item.loadingMessage) || channel.loadingMessage,
    refreshLabel: text(item.refreshLabel) || channel.refreshLabel,
    dottiTip: dialogue(item.dottiTip, item.dottitip) || channel.dottiTip,
    amiTip: dialogue(item.amiTip, item.amitip) || channel.amiTip,
  }
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
    .map((item): ResolvedChannel | null => {
      const channelKey = text(item.channelKey)
      if (!channelKey) return null

      const label = text(item.label) || text(item.title) || channelKey
      const base = {
        key: channelKey,
        channelKey,
        dashboardKey: text(item.dashboardKey),
        label,
        title: text(item.title) || label,
        room: text(item.room) || text(item.title) || label,
        subtitle: text(item.subtitle),
        description: text(item.description),
        summary: text(item.summary),
        narrative: text(item.narrative),
        tooltip: text(item.tooltip),
        icon: text(item.icon) || 'kind-icon:folder',
        image: imagePath(item.image, channelKey),
        route: normalizedRoute(item.route) || `/${channelKey}`,
        sort: order(item.sort),
        requiredRole: text(item.requiredRole),
        requiredPermission: text(item.requiredPermission),
        loadingMessage: text(item.loadingMessage) || `Loading ${label}…`,
        refreshLabel: text(item.refreshLabel) || `Refresh ${label}`,
        dottiTip: dialogue(item.dottiTip, item.dottitip),
        amiTip: dialogue(item.amiTip, item.amitip),
      }

      const tabs = tabItems
        .filter((tab) => text(tab.channelKey) === channelKey)
        .map((tab) => resolveTabItem(tab, base))
        .filter((tab): tab is ResolvedTab => tab !== null)
        .sort((a, b) => a.sort - b.sort || a.label.localeCompare(b.label))

      const requestedDefault = text(item.defaultTab)
      const defaultTab = tabs.some((tab) => tab.tabKey === requestedDefault)
        ? requestedDefault
        : tabs[0]?.tabKey || ''
      const tutorialSections = tabs
        .map((tab) => tab.tutorial)
        .filter(
          (section): section is ResolvedTutorialSection => section !== null,
        )
      const tutorial =
        item.tutorial?.enabled === false
          ? null
          : {
              key: channelKey,
              title: text(item.tutorial?.title) || base.title,
              hero: tutorialImage(
                item.tutorial?.hero,
                tutorialSections[0]?.image || base.image,
              ),
              overview:
                text(item.tutorial?.overview) ||
                base.description ||
                base.summary ||
                base.narrative ||
                base.title,
              tagline: text(item.tutorial?.tagline) || base.subtitle,
              earnings: text(item.tutorial?.earnings),
              underConstruction:
                item.tutorial?.underConstruction === true ||
                text(item.status) === 'under-construction' ||
                undefined,
              sections: tutorialSections,
            }

      return {
        ...base,
        defaultTab,
        tutorial,
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
    .filter((channel) => roleAllows(channel.requiredRole, role))
    .map((channel) => {
      const tabs = channel.tabs.filter((tab) =>
        roleAllows(tab.requiredRole, role),
      )

      return {
        ...channel,
        tabs,
        tutorial: channel.tutorial
          ? {
              ...channel.tutorial,
              sections: tabs
                .map((tab) => tab.tutorial)
                .filter(
                  (section): section is ResolvedTutorialSection =>
                    section !== null,
                ),
            }
          : null,
      }
    })
}

export function resolveChannelLocation(
  channels: ResolvedChannel[],
  input: ChannelLocationInput,
): ResolvedChannelLocation | null {
  const channelKey = text(input.channelKey)
  const dashboardKey = text(input.dashboardKey)
  const path = normalizedPath(input.path)

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
    const matches = channels.flatMap((item) =>
      item.tabs
        .filter((tab) => tab.route === path)
        .map((tab) => ({ channel: item, tab })),
    )

    if (matches.length === 1) return matches[0] ?? null

    if (matches.length > 1 && dashboardKey) {
      const legacy = matches.find(
        ({ tab }) => !tab.dashboardKey || tab.dashboardKey === dashboardKey,
      )
      if (legacy) return legacy
    }
  }

  if (!channel) {
    channel = channels.find(
      (item) =>
        item.route === path ||
        (item.route !== '/' && path.startsWith(`${item.route}/`)),
    )
  }

  return channel
    ? {
        channel,
        tab: resolveTab(channel, input),
      }
    : null
}
