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

export function isAdminOnlyTab(
  channel: ResolvedChannel,
  tab: ResolvedTab,
): boolean {
  return tab.requiredRole === 'ADMIN' && channel.channelKey !== 'admin'
}

export function channelTabGroups(
  channel: ResolvedChannel,
): ChannelTabGroup[] {
  if (channel.channelKey === 'admin') {
    return [
      {
        key: 'all',
        label: '',
        tabs: channel.tabs,
        admin: false,
      },
    ]
  }

  const routes = channel.tabs.filter(
    (tab) => !isAdminOnlyTab(channel, tab),
  )
  const admin = channel.tabs.filter((tab) => isAdminOnlyTab(channel, tab))

  if (!routes.length || !admin.length) {
    return [
      {
        key: 'all',
        label: '',
        tabs: channel.tabs,
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
