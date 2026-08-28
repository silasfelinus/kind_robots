// /utils/mandarinPalette.ts
//
// Shared pigment assignment for Mandarin Tutor surfaces.
//
// The illustrated corpus renders in the background over days, so most of the
// deck has no picture at any given moment. Rather than show that as grey
// placeholder boxes, unrendered cards sit on a pigment from the tutor's own
// gouache palette. The pigment is derived from the card key so a word keeps the
// same ground everywhere it appears -- banner, study card, gallery -- and two
// adjacent cards do not come up the same colour by accident.

/** Number of pigment grounds defined by the Mandarin components' CSS. */
export const MANDARIN_PIGMENT_COUNT = 5

export function mandarinPigmentIndex(cardKey: string): number {
  let hash = 0
  for (const char of cardKey) {
    hash = (hash * 31 + (char.codePointAt(0) ?? 0)) % 100_000
  }
  return hash % MANDARIN_PIGMENT_COUNT
}
