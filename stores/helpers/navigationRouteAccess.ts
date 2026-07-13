import {
  resolveChannelLocation,
  type ChannelLocationInput,
  type ResolvedChannel,
  type ResolvedChannelLocation,
} from '@/stores/helpers/channelContent'

export type NavigationRouteAccess = {
  matched: boolean
  allowed: boolean
  requested: ResolvedChannelLocation | null
  requiredRole: string
  requiredPermission: string
}

export function evaluateNavigationRouteAccess(
  channels: ResolvedChannel[],
  visibleChannels: ResolvedChannel[],
  input: ChannelLocationInput,
): NavigationRouteAccess {
  const requested = resolveChannelLocation(channels, input)

  if (!requested) {
    return {
      matched: false,
      allowed: true,
      requested: null,
      requiredRole: '',
      requiredPermission: '',
    }
  }

  const visibleChannel = visibleChannels.find(
    (channel) => channel.channelKey === requested.channel.channelKey,
  )
  const visibleTab = requested.tab
    ? visibleChannel?.tabs.find(
        (tab) => tab.tabKey === requested.tab?.tabKey,
      )
    : null

  return {
    matched: true,
    allowed: Boolean(visibleChannel && (!requested.tab || visibleTab)),
    requested,
    requiredRole:
      requested.tab?.requiredRole || requested.channel.requiredRole,
    requiredPermission:
      requested.tab?.requiredPermission ||
      requested.channel.requiredPermission,
  }
}
