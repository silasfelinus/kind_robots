// /utils/slimeCity/guestStoryImport.ts
//
// Bringing a journey saved on this device into an account (conductor
// slime-city/t-063).
//
// A journey played in local play, or before account saves were switched on
// for that player, lives only in this browser. The first time the same
// player's account story loads, and only while that account story is still
// fresh, the game offers to copy the device journey in. Nothing an account
// has already earned is overwritten, and the device copy is left alone.
//
// The Tower's legacy (cinders, best floor, runs, kept cards) is never copied:
// it is the long-run reward track, and an account earns it by playing as that
// account. A Tower run in progress on the device is not carried either.

import { TEAMS, type TeamId } from './prototypes'
import { freshTower } from './allianceTower'
import type { LibraryDeck } from './alliance'
import type { SlimeCityStory } from './storySave'

/** How far a story has gone. All zero is a story nobody has played. */
export interface SlimeStoryProgress {
  chapters: number
  districts: number
  endings: number
  pages: number
}

export function slimeStoryProgress(story: SlimeCityStory): SlimeStoryProgress {
  return {
    chapters: TEAMS.reduce(
      (sum, team) => sum + (story.campaigns[team.id]?.wins ?? 0),
      0,
    ),
    districts: story.city.cleared.length,
    endings: story.endings?.length ?? 0,
    pages: story.scrapbook?.length ?? 0,
  }
}

/** Nothing won, cleared, ended or pasted in: importing into it loses nothing. */
export function slimeStoryIsFresh(story: SlimeCityStory): boolean {
  const progress = slimeStoryProgress(story)
  return (
    progress.chapters === 0 &&
    progress.districts === 0 &&
    progress.endings === 0 &&
    progress.pages === 0
  )
}

export interface GuestImportOffer extends SlimeStoryProgress {
  /** The crew the device journey was last played as. */
  team: TeamId | null
}

/**
 * The offer to show, or null. It needs a device journey with real progress
 * and an account story with none.
 */
export function guestImportOffer(
  account: SlimeCityStory,
  device: SlimeCityStory | null,
): GuestImportOffer | null {
  if (!device || !slimeStoryIsFresh(account) || slimeStoryIsFresh(device))
    return null
  return { team: device.journeyTeam ?? null, ...slimeStoryProgress(device) }
}

/** Device decks first, then any account deck the device does not also name. */
function mergeLibraries(
  device: LibraryDeck[] | undefined,
  account: LibraryDeck[] | undefined,
): LibraryDeck[] {
  const merged = [...(device ?? [])]
  const taken = new Set(merged.map((deck) => deck.id))
  for (const deck of account ?? []) if (!taken.has(deck.id)) merged.push(deck)
  return merged
}

/**
 * The account story after the import: the device's city, campaigns, journey
 * seat, decks, endings, scrapbook and cosmetics; the account's own revision
 * and Tower. Pure, so the caller decides when to save it.
 */
export function importGuestStory(
  account: SlimeCityStory,
  device: SlimeCityStory,
): SlimeCityStory {
  const { tower: _deviceTower, revision: _deviceRevision, ...journey } = device
  return {
    ...journey,
    version: 1,
    revision: account.revision,
    tower: account.tower ?? freshTower(),
    library: mergeLibraries(device.library, account.library),
  }
}
