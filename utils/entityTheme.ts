// /utils/entityTheme.ts
//
// Which daisyUI theme a record's card wears.
//
// Silas, 2026-08-10: "it looks very pretty to have the bots with their custom
// theme backgrounds and displays. I want that in the others ... So each card
// when viewed should have a theme shift to distinguish it from neighbours, and
// the nice themed background border around each card."
//
// Bot has carried a `theme` column for a while and bot-card puts it on a
// `data-theme` wrapper; this generalises that to Characters, Dreams, Rewards,
// Scenarios and Facets.

/**
 * THE BUILT-INS ONLY. Silas: "from daisyui, don't use the customs in case
 * things break."
 *
 * `daisyuiThemes` in stores/helpers/themeHelper.ts is NOT this list -- it
 * leads with `storybook` and `storybook-dark`, which are the house aesthetic
 * defined by `@plugin "daisyui/theme"` blocks in assets/css/tailwind.css
 * rather than stock daisyUI. Those two are exactly what was excluded, so this
 * is the same array with its first two entries dropped, and it is spelled out
 * rather than sliced so a future addition to that list cannot quietly start
 * assigning itself to cards.
 */
export const DAISY_CARD_THEMES = [
  'light',
  'dark',
  'cupcake',
  'bumblebee',
  'emerald',
  'corporate',
  'synthwave',
  'retro',
  'cyberpunk',
  'valentine',
  'halloween',
  'garden',
  'forest',
  'aqua',
  'lofi',
  'pastel',
  'fantasy',
  'wireframe',
  'black',
  'luxury',
  'dracula',
  'cmyk',
  'autumn',
  'business',
  'acid',
  'lemonade',
  'night',
  'coffee',
  'winter',
  'dim',
  'nord',
  'sunset',
  'caramellatte',
  'abyss',
  'silk',
] as const

export type ThemedRecord = {
  id?: number | string | null
  theme?: string | null
}

/**
 * DERIVED, NOT RANDOM -- and that distinction is the whole reason this is a
 * function rather than a `Math.random()` at the call site.
 *
 * The brief was "populated with random entries ... and a random choice if one
 * doesn't exist". A genuinely random fallback re-rolls on every render, so a
 * card would change colour whenever anything above it re-rendered and a
 * scrolling grid would strobe. Keying off the id gives the same look -- no two
 * neighbours alike, no obvious order -- and holds still.
 *
 * Sequential ids walk the list one step at a time, which is what makes
 * ADJACENT cards reliably differ; the list is long enough (35) that a repeat
 * is never visible in one screenful.
 */
export function resolveEntityTheme(
  record: ThemedRecord | null | undefined,
): string {
  const stored = record?.theme?.trim()
  if (stored) return stored

  const id = Number(record?.id)
  if (!Number.isFinite(id)) return DAISY_CARD_THEMES[0]

  const index = Math.abs(Math.trunc(id)) % DAISY_CARD_THEMES.length
  return DAISY_CARD_THEMES[index] ?? DAISY_CARD_THEMES[0]
}
