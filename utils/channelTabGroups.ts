import type {
  ResolvedChannel,
  ResolvedTab,
} from '@/stores/helpers/channelContent'

export type ChannelTabGroup = {
  key: 'all' | 'routes' | 'admin'
  label: string
  tabs: ResolvedTab[]
  admin: boolean
}

export function isNavigationTab(
  _channel: ResolvedChannel,
  tab: ResolvedTab,
): boolean {
  return tab.navigation !== false
}

export function navigationTabs(channel: ResolvedChannel): ResolvedTab[] {
  return channel.tabs.filter((tab) => isNavigationTab(channel, tab))
}

export function isAdminOnlyTab(
  channel: ResolvedChannel,
  tab: ResolvedTab,
): boolean {
  return tab.requiredRole === 'ADMIN' && channel.channelKey !== 'admin'
}

export function channelTabGroups(
  channel: ResolvedChannel,
): ChannelTabGroup[] {
  const tabs = navigationTabs(channel)

  // The Admin channel is already an access boundary; only mixed channels need
  // a second visual group for their admin-only destinations.
  if (channel.channelKey === 'admin') {
    return [
      {
        key: 'all',
        label: '',
        tabs,
        admin: false,
      },
    ]
  }

  const routes = tabs.filter((tab) => !isAdminOnlyTab(channel, tab))
  const admin = tabs.filter((tab) => isAdminOnlyTab(channel, tab))

  if (!routes.length || !admin.length) {
    return [
      {
        key: 'all',
        label: '',
        tabs,
        admin: false,
      },
    ]
  }

  return [
    {
      key: 'routes',
      label: 'Routes',
      tabs: routes,
      admin: false,
    },
    {
      key: 'admin',
      label: 'Admin',
      tabs: admin,
      admin: true,
    },
  ]
}

export function hasSeparatedAdminTabs(channel: ResolvedChannel): boolean {
  return channelTabGroups(channel).length > 1
}
