// /utils/tabNavigation.ts
//
// One way to answer "where does this tab go?".
//
// Several tabs in a channel can share a single route — the page then decides
// what to render from the `?tab=` query. So a tab link is NOT simply its
// `route`: for a shared route the query is load-bearing, and for an exclusive
// route appending it would leave a stale query behind on the next navigation.
//
// This was previously private to channel-select.vue. It is shared now because
// workspace-header's tab strip navigates to exactly the same tabs, and a second
// copy of this rule would drift — the shared-route case is subtle enough that
// a reimplementation would very likely just push `tab.route` and quietly break
// every channel whose tabs share one.

import type {
  ResolvedChannel,
  ResolvedTab,
} from '@/stores/helpers/channelContent'

/** True when more than one of the channel's tabs resolve to the same route. */
export function tabSharesRoute(
  channel: ResolvedChannel,
  tab: ResolvedTab,
): boolean {
  return channel.tabs.filter((item) => item.route === tab.route).length > 1
}

/**
 * The router target for a tab, or `null` when it has no route to go to.
 * Callers push this; deciding whether the push is a no-op is theirs, since
 * that depends on the current route which this stays ignorant of.
 */
export function tabRouteTarget(
  channel: ResolvedChannel,
  tab: ResolvedTab,
): { path: string; query?: Record<string, string> } | null {
  if (!tab.route) return null
  return tabSharesRoute(channel, tab)
    ? { path: tab.route, query: { tab: tab.tabKey } }
    : { path: tab.route }
}
