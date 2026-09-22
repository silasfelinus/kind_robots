// utils/rulerHooked/cardArt.ts
//
// Image ladder for one event/decision card (ruler-hooked/t-030, Silas 2026-09-11:
// "I see ... no ability to see text based prompts with an image that asks me to
// decide important things"). decks.md §2 already defines a per-card `art:
// card-<id>` key and every card can list `characters:` slugs, but
// ruler-hooked-card.vue rendered neither — cards were text-and-buttons only.
//
// Mirrors the graceful-degrade ladders already used for regions (compositor.ts)
// and the standing advisor (characterArt.ts): most-specific asset first, falling
// back through less-specific ones, ending in no image at all rather than a
// broken one. Nothing here requires new art to exist — every rung already has a
// defined asset-path contract, just not one this card renderer consulted.

import {
  characterPortraitPath,
  characterFallbackPortraitPath,
} from '~/utils/rulerHooked/characterArt'

/** Public asset path for one card's own dedicated illustration (decks.md §2). */
export function cardArtPath(key: string): string {
  return `/images/ruler-hooked/${key}.webp`
}

/**
 * Ordered image candidates for a card, most-preferred first:
 *   1. the card's own dedicated art (`card.art`), if authored
 *   2. the featured character's neutral-expression portrait
 *   3. that same character's plain fallback portrait
 * `characterSlug` should be the card's first featured `Character` slug, or the
 * relaying advisor's slug when the card names no character of its own — the
 * same "relayed by the advisor" rule ruler-hooked-card.vue already applies to
 * the text byline. Returns `[]` when neither is available (nothing to show).
 */
export function cardImageCandidates(
  art: string | undefined,
  characterSlug: string | undefined,
): string[] {
  const candidates: string[] = []
  if (art) candidates.push(cardArtPath(art))
  if (characterSlug) {
    candidates.push(characterPortraitPath(characterSlug, 'neutral'))
    candidates.push(characterFallbackPortraitPath(characterSlug))
  }
  return candidates
}
