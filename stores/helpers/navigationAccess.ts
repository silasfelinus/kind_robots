import type {
  ResolvedChannel,
  ResolvedTutorialSection,
} from '@/stores/helpers/channelContent'

export type NavigationPermission =
  | 'authenticated'
  | 'member'
  | 'family'
  | 'mature'
  | 'admin'
  | string

export type NavigationAccessContext = {
  role: string
  permissions: ReadonlySet<string>
  isAdmin: boolean
}

export function permissionAllows(
  requiredPermission: string,
  context: NavigationAccessContext,
): boolean {
  const required = requiredPermission.trim().toLowerCase()
  if (!required || context.isAdmin) return true

  return context.permissions.has(required)
}

export function filterChannelsByPermission(
  channels: ResolvedChannel[],
  context: NavigationAccessContext,
): ResolvedChannel[] {
  return channels
    .filter((channel) =>
      permissionAllows(channel.requiredPermission, context),
    )
    .map((channel) => {
      const tabs = channel.tabs.filter((tab) =>
        permissionAllows(tab.requiredPermission, context),
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
    .filter((channel) => channel.tabs.length > 0)
}

export function navigationPermissions(input: {
  isLoggedIn: boolean
  isMember: boolean
  isFamily: boolean
  showMature: boolean
  isAdmin: boolean
}): ReadonlySet<string> {
  const permissions = new Set<string>()

  if (input.isLoggedIn) permissions.add('authenticated')
  if (input.isMember) permissions.add('member')
  if (input.isFamily) permissions.add('family')
  if (input.showMature) permissions.add('mature')
  if (input.isAdmin) permissions.add('admin')

  return permissions
}
