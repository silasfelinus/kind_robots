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
