// /utils/navManifest.ts
//
// Cross-reference layer for the site's navigation vocabulary. Navigation is
// currently spread across four systems that duplicate route strings and can
// silently drift out of sync with each other:
//   1. content/channels/** frontmatter — channelKey/tabKey, the authored
//      source of truth for what pages exist.
//   2. stores/helpers/dashboardHelper.ts's dashboardConfigs — a separate
//      dashboardKey/dashboardTab vocabulary for the dashboard-shell UI.
//   3. cards: frontmatter + stores/helpers/modelCards.ts's BuilderCardsKey
//      registry — a third vocabulary naming which card deck a tab shows.
//   4. stores/linkStore.ts — deleted (interface-vision/t-012); it duplicated
//      a static subset of #1 and had drifted to reference a route
//      (/story) that no longer exists.
//
// This module is the shared, isomorphic (client- and server-safe) guard
// layer that checks #1's channelKey/dashboardKey/cardsKey references
// against #2 and #3's real vocabularies -- the fail-fast checks the task
// note asked for. It intentionally does NOT read content/channels itself
// (that requires node:fs, which is not client-safe); callers supply the
// entries, either from utils/scripts/verifyNavManifest.ts (CI, via fs) or
// from useChannelContentStore() (client, via Nuxt Content).
//
// Mirrors the intent of PortOS's server/lib/navManifest.js, and follows the
// same "manifest can only ever record a gap, never hide one" contract as
// utils/dataSurfaceManifest.ts.
//
// This is manifest v1: the shared validation vocabulary. content/channels
// remains the authored source for channel/tab data -- inverting systems 2-4
// so they are *generated from* this manifest, rather than merely validated
// against it, is the larger remaining work (interface-vision/t-034, t-035).

import {
  dashboardConfigs,
  type DashboardKey,
} from '@/stores/helpers/dashboardHelper'
import { isBuilderCardsKey } from '@/stores/helpers/modelCards'

export type NavManifestEntry = {
  /** content/channels file path, relative to repo root, for error messages. */
  file: string
  channelKey: string
  tabKey: string
  dashboardKey: string
  dashboardTab: string
  cardsKey: string
  route: string
}

/** The literal sentinel workspace-hand.vue/workspace-sheet.vue special-case
 * to defer card resolution to the runtime Builder deck (keyed by
 * modelType), rather than a static BuilderCardsKey. */
const BUILDER_CARDS_SENTINEL = 'builderCards'

function isKnownDashboardKey(value: string): value is DashboardKey {
  return value in dashboardConfigs
}

function isKnownDashboardTab(dashboardKey: string, tabKey: string): boolean {
  if (!isKnownDashboardKey(dashboardKey)) return false
  return dashboardConfigs[dashboardKey].tabs.some((tab) => tab.key === tabKey)
}

export type NavManifestIssue = {
  file: string
  channelKey: string
  tabKey: string
  message: string
  /**
   * 'error' -- always wrong, fails CI: the value cannot possibly resolve
   * (e.g. dashboardKey: 'admin', which is a channelKey, not a
   * dashboardConfigs key -- there is no dashboard it could mean).
   * 'warning' -- reported but does not fail CI: navStore.ts's own
   * setDashboardShellFromContent() intentionally treats an unmatched
   * dashboardTab as "no tab hint" and falls back to the dashboard's
   * remembered/default tab for channel-landing-page tabs, so this is a
   * real but lower-stakes drift -- worth reconciling deliberately
   * (interface-vision/t-034) rather than failing every PR until then.
   */
  severity: 'error' | 'warning'
}

/**
 * Validates one entry's cross-system references. Returns an empty array
 * when everything resolves. A blank dashboardKey/cardsKey is not an issue
 * -- most tabs don't participate in the dashboard-shell or card-deck
 * systems at all -- only a *non-blank value that doesn't resolve* is.
 */
export function validateNavManifestEntry(
  entry: NavManifestEntry,
): NavManifestIssue[] {
  const issues: NavManifestIssue[] = []
  const context = {
    file: entry.file,
    channelKey: entry.channelKey,
    tabKey: entry.tabKey,
  }

  if (entry.dashboardKey && !isKnownDashboardKey(entry.dashboardKey)) {
    issues.push({
      ...context,
      severity: 'error',
      message: `dashboardKey '${entry.dashboardKey}' is not a real dashboardConfigs key (did you mean a channelKey instead? channelKey and dashboardKey are separate vocabularies)`,
    })
  } else if (
    entry.dashboardKey &&
    entry.dashboardTab &&
    !isKnownDashboardTab(entry.dashboardKey, entry.dashboardTab)
  ) {
    issues.push({
      ...context,
      severity: 'warning',
      message: `dashboardTab '${entry.dashboardTab}' is not a real tab of dashboard '${entry.dashboardKey}' (silently falls back to that dashboard's defaultTab today)`,
    })
  }

  if (
    entry.cardsKey &&
    entry.cardsKey !== BUILDER_CARDS_SENTINEL &&
    !isBuilderCardsKey(entry.cardsKey)
  ) {
    issues.push({
      ...context,
      severity: 'error',
      message: `cards '${entry.cardsKey}' matches no BuilderCardsKey in modelCards.ts and is not the '${BUILDER_CARDS_SENTINEL}' sentinel`,
    })
  }

  return issues
}

export function validateNavManifest(
  entries: NavManifestEntry[],
): NavManifestIssue[] {
  return entries.flatMap((entry) => validateNavManifestEntry(entry))
}
