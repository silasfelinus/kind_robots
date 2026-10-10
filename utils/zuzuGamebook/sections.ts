import type { Scene } from './types'

/** Section builder shared by book.ts and the act modules. */
export const s = (
  id: string,
  chapter: string,
  title: string,
  art: string,
  text: string,
  rest: Partial<Scene> = {},
): Scene => ({ id, chapter, title, art, text, ...rest })

/** The nine acts of Book One (conductor projects/zuzu-gamebook/BOOK-ONE-OUTLINE.md §5). */
export const CH = {
  I: 'I · WATERS',
  II: 'II · ASHES',
  III: 'III · THE FOLLOWERS',
  IV: 'IV · THE WASTE',
  V: 'V · THE MISSION',
  VI: 'VI · DUSTWATER',
  VII: 'VII · THE NIGHT ROAD',
  VIII: 'VIII · THE DARK',
  IX: 'IX · THE BELL',
  END: 'AN ENDING',
} as const
