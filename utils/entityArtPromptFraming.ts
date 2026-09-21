// /utils/entityArtPromptFraming.ts
//
// Shared framing/exclusion language for entity-art prompts, used by both the
// server builder (server/utils/entityArt.ts) and the daily-dream archive store
// (stores/dailyDreamArchiveStore.ts) so the two cannot drift.
//
// Both used to name the art slot directly:
//
//   `Create this as the ${slot.label.toLowerCase()} artwork for the following ...`
//
// which for a card slot produced "Create this as the card artwork". Krea 2 is a
// distilled diffusion transformer on the Qwen-Image lineage — the strongest open
// text renderer available — and it has no instruction-following layer. It read
// "card" as the thing to draw and returned literal trading cards: title bar,
// type line, and a rules box full of invented text (2026-08-08; the same defect
// independently hit conductor's daily-dream builder, which said "treasure card
// illustration").
//
// The slot's real intent is a shape, not an object. Describing the geometry gives
// the model useful camera language and removes the format noun entirely.
//
// Both also ended with a pile of text nouns plus a conditional:
//
//   "Do not add captions, labels, UI chrome, watermarks, signatures, or readable
//    text unless the primary art direction explicitly requests them."
//
// Two problems in one sentence. Krea 2 runs at cfg 1, which makes the ComfyUI
// negative prompt inert, so every one of those six nouns lands in POSITIVE
// conditioning on a text specialist. And "unless ... explicitly requests them"
// is a condition the model cannot evaluate. Stated positively, once.

export type ArtSlotShape = {
  label: string
  width: number
  height: number
}

/**
 * A geometric description of the slot, with no format nouns ("card", "icon",
 * "hero", "banner", "emblem") that a diffusion model can mistake for the subject.
 */
export function artSlotFraming(slot: ArtSlotShape): string {
  const { width, height } = slot
  if (!width || !height) return 'a single balanced composition'
  if (width === height) {
    return width <= 320
      ? 'a square composition with one bold shape that stays readable when small'
      : 'a square composition centred on one clear subject'
  }
  return height > width
    ? 'a vertical portrait composition with a clear foreground subject and layered depth'
    : 'a wide landscape composition with depth and atmosphere'
}

/**
 * The trailing guidance shared by every entity-art prompt. Keep it short: at
 * cfg 1 these words are positive conditioning, not constraints.
 */
export function artContextRules(subjectNoun: string): string[] {
  return [
    `Treat the first paragraph as the primary art direction. Use the ${subjectNoun} context for identity and continuity, not as a checklist and not as text to render.`,
    'Every surface in frame is blank and unmarked.',
  ]
}

/*
 * The house style tail (2026-09-21).
 *
 * Until now this path named no medium, no palette and no light at all. Of 250
 * live Facet prompts sampled, 210 carried none of the three, because the only
 * style tail in the codebase lived in scripts/generate_facet_art_v4.ts and the
 * server builder never called it. With nothing specified, Krea falls back to
 * its own prior -- a desaturated studio photograph on seamless cream -- which
 * is exactly what ArtJobs 29108/29109/29111 are, and exactly the complaint
 * ("solid, vibrant choices", Silas, 2026-09-21).
 *
 * Naming the medium is also the strongest available defence against rendered
 * text on a text-specialist model, and the only one that works at cfg 1: an
 * image the model has been told is a flat graphic illustration is a worse
 * host for a paragraph of caption than an unspecified one. It is stated as
 * something to draw, never as a prohibition -- ART-PROMPTS.md rule 3, and the
 * reason the exclusion piles were stripped in the first place.
 *
 * Rules for editing this string are taxonomyVisualLanguage()'s rules: no
 * format nouns ("card", "poster", "emblem"), no art-direction jargon ("focal
 * subject", "silhouette", "thumbnail"), no negation, and nothing the model
 * would have to obey rather than paint.
 */
export const HOUSE_STYLE_TAIL =
  'Bold graphic illustration, flat areas of vivid colour, high contrast.'

/*
 * PROMPT_ENHANCEMENT swatches are the one group this tail is wrong for. Half
 * of them are photographic techniques -- film grain, studio photography,
 * photoreal lighting -- and telling Krea "bold graphic illustration" fights
 * the very technique the swatch exists to demonstrate. The same carve-out
 * styleTail() makes in scripts/generate_facet_art_v4.ts, for the same reason.
 */
const UNSTYLED_TAXONOMIES = new Set(['PROMPT_ENHANCEMENT'])

export function artStyleTail(taxonomy?: string | null): string {
  const key = String(taxonomy || '').toUpperCase()
  return UNSTYLED_TAXONOMIES.has(key) ? '' : HOUSE_STYLE_TAIL
}
