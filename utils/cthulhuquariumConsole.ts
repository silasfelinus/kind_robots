// /utils/cthulhuquariumConsole.ts
//
// The aquarium console's navigation (cthulhuquarium/t-098): five deck tabs
// over the game's six rooms, the cycle the shoulder buttons walk, and the
// painted UI art each slot expects. Pure, so the mapping is tested without a
// browser (utils/scripts/verifyCthulhuquariumConsoleNav.test.ts).

export type AquariumPanel =
  'shop' | 'roster' | 'bestiary' | 'sets' | 'decor' | 'scenery'

export type ConsoleTab = 'tank' | 'feed' | 'creatures' | 'relics' | 'market'

export type PadButton = 'A' | 'B' | 'X' | 'Y'

/** Painted UI renders, assets/images/cthulhuquarium/ui/<name>.webp. */
export type CthulhuquariumUiArtName =
  | 'tab-tank'
  | 'tab-feed'
  | 'tab-creatures'
  | 'tab-relics'
  | 'tab-market'
  | 'coin'
  | 'plinth'
  | 'corner-ornament'
  | 'meter-hunger'
  | 'meter-clean'
  | 'meter-mood'
  | 'capacity'
  | 'day-moon'

export const CONSOLE_TABS: ReadonlyArray<{
  id: ConsoleTab
  title: string
  art: CthulhuquariumUiArtName
}> = [
  { id: 'tank', title: 'Tank', art: 'tab-tank' },
  { id: 'feed', title: 'Feed', art: 'tab-feed' },
  { id: 'creatures', title: 'Creatures', art: 'tab-creatures' },
  { id: 'relics', title: 'Relics', art: 'tab-relics' },
  { id: 'market', title: 'Market', art: 'tab-market' },
]

export const PANEL_TITLES: Record<AquariumPanel, string> = {
  shop: 'Market',
  roster: 'Creatures',
  bestiary: 'The Ichthyonomicon',
  sets: 'Relics',
  decor: 'Relics',
  scenery: 'World & story',
}

/** The deck tab that lights for an open room (or none, with feeding on or off). */
export function tabForPanel(
  panel: AquariumPanel | null,
  feeding: boolean,
): ConsoleTab {
  switch (panel) {
    case 'shop':
      return 'market'
    case 'roster':
    case 'bestiary':
      return 'creatures'
    case 'sets':
    case 'decor':
      return 'relics'
    default:
      return feeding ? 'feed' : 'tank'
  }
}

/** The tab a shoulder press lands on, wrapping at both ends. */
export function cycleConsoleTab(current: ConsoleTab, step: number): ConsoleTab {
  const ids = CONSOLE_TABS.map((tab) => tab.id)
  const index = ids.indexOf(current)
  const next = (((index + step) % ids.length) + ids.length) % ids.length
  return ids[next] ?? 'tank'
}

/** A story beat's focus target, as the deck tab it points at. */
export function tabForStoryFocus(focus: string | null): ConsoleTab | null {
  switch (focus) {
    case 'shop':
      return 'market'
    case 'bestiary':
      return 'creatures'
    case 'sets':
    case 'decor':
      return 'relics'
    case 'feed':
      return 'feed'
    default:
      return null
  }
}

/** The keyboard key that stands in for each pad button. */
export const KEY_FOR_PAD: Record<PadButton, string> = {
  A: 'Space',
  B: 'Esc',
  X: 'X',
  Y: 'Y',
}

/** Average fullness of the tank's fish, 0-100, or null for an empty tank. */
export function averageFed(hungers: readonly number[]): number | null {
  if (!hungers.length) return null
  const total = hungers.reduce((sum, value) => sum + value, 0)
  return Math.round(total / hungers.length)
}

/** Which day of its life a tank is on, counting its first day as Day 1. */
export function tankDayNumber(
  createdAt: string | null | undefined,
  now: number,
): number | null {
  if (!createdAt) return null
  const created = Date.parse(createdAt)
  if (Number.isNaN(created)) return null
  return Math.max(1, Math.floor((now - created) / 86_400_000) + 1)
}
