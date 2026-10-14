// /utils/arcade/navigation.ts
//
// The Arcade tab's game submenu. Silas, 2026-10-14: "The arcade tab in Play
// should have a subtab menu where people can select a game."
//
// The subtabs are built from the cabinet registry rather than written as one
// content file per game, so a cabinet that ships appears in the menu with no
// second edit. Games with a page of their own (LINKED_GAMES, e.g. Zuzu
// Showdown) are left out: that page already belongs to another channel's tab,
// and a second tab on the same route would make the route ambiguous.

import type { ChannelContentItem } from '@/stores/helpers/channelContent'
import { ARCADE_GAMES } from '@/utils/arcade/games'
import type { ArcadeGameMeta } from '@/utils/arcade/types'

export const ARCADE_CHANNEL_KEY = 'arcade'
export const ARCADE_PARENT_TAB_KEY = 'arcade'

export function arcadeGameTabKey(slug: string): string {
  return `arcade-game-${slug}`
}

export function arcadeGameTabItems(
  games: readonly ArcadeGameMeta[] = ARCADE_GAMES,
): ChannelContentItem[] {
  return [...games]
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((game, index) => ({
      contentType: 'tab',
      channelKey: ARCADE_CHANNEL_KEY,
      parentTabKey: ARCADE_PARENT_TAB_KEY,
      tabKey: arcadeGameTabKey(game.slug),
      label: game.title,
      title: game.title,
      summary: `Riffs on ${game.riffsOn}.`,
      image: game.titleArt,
      route: `/play/arcade?game=${game.slug}`,
      sort: index,
      tutorial: { enabled: false },
    }))
}
