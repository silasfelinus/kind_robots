// /utils/channelLauncher.ts
//
// The desktop channel launcher (components/navigation/channel-select.vue):
// every channel's destinations in one continuous scroll, with nested groups
// such as Retired and Storybook folded into a collapsed folder row
// (Silas, 2026-11-14: "those should be collapsed. We should also be able to
// scroll to the different channels from each other").

import type {
  ResolvedChannel,
  ResolvedTab,
} from '@/stores/helpers/channelContent'
import { channelTabGroups, navigationSubtabs } from './channelTabGroups'

export type LauncherSection = {
  key: string
  label: string
  admin: boolean
  parent: ResolvedTab | null
  tabs: ResolvedTab[]
}

export type LauncherChannelOffset = {
  channelKey: string
  top: number
}

export const LAUNCHER_SCROLL_SPY_OFFSET = 48

export function launcherSections(channel: ResolvedChannel): LauncherSection[] {
  const sections: LauncherSection[] = []
  for (const group of channelTabGroups(channel)) {
    const leaves = group.tabs.filter(
      (tab) => navigationSubtabs(channel, tab).length === 0,
    )
    if (leaves.length) {
      sections.push({
        key: group.key,
        label: group.label,
        admin: group.admin,
        parent: null,
        tabs: leaves,
      })
    }

    for (const parent of group.tabs) {
      const subtabs = navigationSubtabs(channel, parent)
      if (!subtabs.length) continue

      sections.push({
        key: `${group.key}:${parent.tabKey}`,
        label: parent.label,
        admin: group.admin,
        parent,
        tabs: parent.route ? [parent, ...subtabs] : subtabs,
      })
    }
  }
  return sections
}

export function launcherSectionId(
  channelKey: string,
  sectionKey: string,
): string {
  return `${channelKey}::${sectionKey}`
}

export function isCollapsibleSection(section: LauncherSection): boolean {
  return section.parent !== null
}

export function initiallyExpandedSections(
  channel: ResolvedChannel | null,
  activeTab: ResolvedTab | null,
): Set<string> {
  const parentKey = activeTab?.parentTabKey
  if (!channel || !parentKey) return new Set()
  const section = launcherSections(channel).find(
    (entry) => entry.parent?.tabKey === parentKey,
  )
  return section
    ? new Set([launcherSectionId(channel.channelKey, section.key)])
    : new Set()
}

export function channelAtScroll(
  offsets: LauncherChannelOffset[],
  scrollTop: number,
  atEnd = false,
  spyOffset = LAUNCHER_SCROLL_SPY_OFFSET,
): string | null {
  if (atEnd && offsets.length) return offsets[offsets.length - 1]!.channelKey
  let current: string | null = offsets[0]?.channelKey ?? null
  for (const offset of offsets) {
    if (offset.top - spyOffset <= scrollTop) current = offset.channelKey
  }
  return current
}
