// /utils/botTypeVocabulary.ts
//
// One place that knows what a BotType LOOKS like.
//
// Silas, 2026-08-09: "The difference between narrator and promptbot is a nice
// display but should be an icon for each. If we don't have a good icon for
// either in our icons folder, we can add them there. Icons are better than
// words unless we have plenty of space."
//
// THESE HAVE TO BE MONOCHROME, and that is what picked them.
//
// `components/dreams/dream-gallery.vue` already maps PROMPTBOT to
// kind-icon:robot and NARRATOR to kind-icon:story for Dream types, and reusing
// those was the obvious move -- a Dream of type NARRATOR becomes a Bot of type
// NARRATOR, so the two surfaces are showing the same thing. It does not work
// here. Both of those files are full-colour illustrations (`robot.svg` paints
// #fff and #000, `story.svg` #fff and #66e1ff); the Dream gallery renders them
// large, where that is a feature, but these ride inside a `badge-primary` at
// 12-14px, where a two-tone drawing becomes a smudge and a white-and-cyan book
// on a primary fill is nearly invisible. Consistency with an unreadable icon
// is not consistency.
//
// So the rule for anything used as a chip glyph: it must paint with
// `currentColor` only -- no hex fills, no gradients -- so the badge tints it.
// `scroll` and `chat` already qualified. Nothing in assets/icons was a
// monochrome robot, so `robot-outline.svg` was added, which is the "we can add
// them there" half of the instruction above.
//
// `Bot.BotType` is a free `String` column, not an enum (prisma/schema.prisma),
// so this map is deliberately open: `botTypeMeta` answers for ANY string and
// falls back to a generic bot glyph with the raw value title-cased. The three
// canonical values are the ones `utils/seeds/facetLegacyBotTypes.ts` preserves
// as BOT_TYPE Facets, and `utils/scripts/verifyBotFacetCutover.ts` asserts that
// list stays covered -- so those three are the ones worth naming here, and
// anything a user invents still renders rather than disappearing.

export type BotTypeMeta = {
  /** The stored, upper-cased value. */
  value: string
  /** Human label -- tooltip and screen-reader text for the icon-only chip. */
  label: string
  /** `kind-icon:*` name resolved from `assets/icons`. */
  icon: string
}

const BOT_TYPE_META: Record<string, Omit<BotTypeMeta, 'value'>> = {
  NARRATOR: { label: 'Narrator', icon: 'kind-icon:scroll' },
  PROMPTBOT: { label: 'Prompt Bot', icon: 'kind-icon:robot-outline' },
  CHATBOT: { label: 'Chatbot', icon: 'kind-icon:chat' },
}

/*
 * Canonical display order for the type filter. NARRATOR and PROMPTBOT lead
 * because they are the two Silas was looking at when he asked for the toggle;
 * everything unlisted sorts alphabetically after, so a new type appears in a
 * stable place instead of wherever the database happened to return it.
 */
export const BOT_TYPE_ORDER = ['NARRATOR', 'PROMPTBOT', 'CHATBOT'] as const

export function normalizeBotType(value?: string | null): string {
  return String(value || '')
    .trim()
    .toUpperCase()
}

/** Title-cases an unknown stored value so it reads as a label, not a constant. */
function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function botTypeMeta(value?: string | null): BotTypeMeta | null {
  const normalized = normalizeBotType(value)
  if (!normalized) return null

  const known = BOT_TYPE_META[normalized]

  return {
    value: normalized,
    label: known?.label || titleCase(normalized),
    // Falls back to the same monochrome robot rather than to `kind-icon:bot`,
    // which is another full-colour illustration and would smudge at chip size.
    icon: known?.icon || 'kind-icon:robot-outline',
  }
}

/**
 * The distinct types present in a set of Bots, in canonical order.
 *
 * Derived from the LOADED set rather than from a hard-coded list, so the filter
 * offers exactly the choices that would actually change what is on screen --
 * the same rule that keeps the Mature toggle out of the toolbar when no mature
 * Bot exists.
 */
export function botTypeOptions(
  bots: Array<{ BotType?: string | null }>,
): BotTypeMeta[] {
  const seen = new Map<string, BotTypeMeta>()

  for (const bot of bots) {
    const meta = botTypeMeta(bot.BotType)
    if (meta && !seen.has(meta.value)) seen.set(meta.value, meta)
  }

  const rank = (value: string) => {
    const index = BOT_TYPE_ORDER.indexOf(
      value as (typeof BOT_TYPE_ORDER)[number],
    )
    return index === -1 ? BOT_TYPE_ORDER.length : index
  }

  return [...seen.values()].sort((a, b) => {
    const delta = rank(a.value) - rank(b.value)
    return delta !== 0 ? delta : a.label.localeCompare(b.label)
  })
}
