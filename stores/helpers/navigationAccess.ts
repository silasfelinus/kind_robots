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
  /** Primary/display role. For labels, not for deciding what a viewer may see. */
  role: string
  /**
   * The viewer's complete role set -- what channel visibility is filtered on.
   *
   * Optional, and absent means "single-role viewer", not "no roles": a context
   * built by hand (the navigation contract verifiers do exactly this to express
   * a GUEST or a USER) stays valid and falls back to `[role]` via
   * `accessContextRoles` below. Making it required would force every such
   * fixture to restate the same fact twice.
   */
  roles?: readonly string[]
  permissions: ReadonlySet<string>
  isAdmin: boolean
}

/** The role set to filter on, falling back to the primary role. */
export function accessContextRoles(
  context: NavigationAccessContext,
): readonly string[] {
  return context.roles?.length ? context.roles : [context.role]
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
      const defaultTab = tabs.some(
        (tab) => tab.tabKey === channel.defaultTab,
      )
        ? channel.defaultTab
        : tabs[0]?.tabKey || ''

      return {
        ...channel,
        defaultTab,
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
