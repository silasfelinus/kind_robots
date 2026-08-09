// /utils/botTypeVocabulary.ts
//
// One place that knows what a BotType LOOKS like.
//
// Silas, 2026-08-09: "The difference between narrator and promptbot is a nice
// display but should be an icon for each. If we don't have a good icon for
// either in our icons folder, we can add them there. Icons are better than
// words unless we have plenty of space."
//
// We already had both glyphs -- `components/dreams/dream-gallery.vue` maps
// PROMPTBOT to kind-icon:robot and NARRATOR to kind-icon:story for Dream types,
// and a Dream of type NARRATOR becomes a Bot of type NARRATOR, so the two
// surfaces are showing the same thing. Reusing those exact names is what makes
// a narrator read as a narrator on both screens rather than as two unrelated
// pictures; adding a third drawing would have been the actual regression.
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
  NARRATOR: { label: 'Narrator', icon: 'kind-icon:story' },
  PROMPTBOT: { label: 'Prompt Bot', icon: 'kind-icon:robot' },
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
    icon: known?.icon || 'kind-icon:bot',
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
