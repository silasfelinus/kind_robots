// utils/rulerHooked/rulerPresets.ts
//
// Data for the ruler cosmetic axis (ruler-hooked/t-021). Silas, 2026-08-26:
// "preset figures, custom name and honorific, your presets are fine ... custom
// should be an option" -- so the figure itself is chosen from a fixed roster
// (no composable body/skin/species parts; a diffusion model can't produce
// separable parts that register against each other, per t-021's own reasoning),
// while name and honorific are free text.
//
// One preset = one compositor-ready layer at
// public/images/ruler-hooked/ruler/<id>.webp (art pipeline: conductor's
// scripts/build_ruler_hooked_art_queue.py RULER_PRESETS -- keep this list in
// sync with that one). Read as data everywhere: adding a preset is one entry
// here plus one asset, never a code change.

export interface RulerPreset {
  id: string
  title: string
}

export const RULER_PRESETS: RulerPreset[] = [
  { id: 'king-osric', title: 'King' },
  { id: 'queen-mabel', title: 'Queen' },
  { id: 'sovereign-wren', title: 'Sovereign' },
  { id: 'regent-halvard', title: 'Regent' },
  { id: 'matriarch-oshun', title: 'Matriarch' },
  { id: 'chieftain-brakka', title: 'Chieftain' },
  { id: 'heron-queen-sedge', title: 'Queen' },
  { id: 'little-monarch-pip', title: 'Monarch' },
  { id: 'boy-king-tobin', title: 'King' },
  { id: 'girl-queen-marisol', title: 'Queen' },
  { id: 'cub-prince-bramble', title: 'Prince' },
  { id: 'elder-tortoise-yew', title: 'Sovereign' },
]

/** The hero preset -- used whenever a save has no `ruler.cosmetics.presetId`
 *  yet (pre-t-021 saves, or a fresh reign that hasn't picked one). */
export const DEFAULT_RULER_PRESET_ID = 'king-osric'

/** Unique honorific titles drawn from the preset roster, offered as suggestions
 *  only -- `honorific` itself is free text (Silas, 2026-08-26 decision). */
export const HONORIFIC_SUGGESTIONS: string[] = Array.from(
  new Set(RULER_PRESETS.map((p) => p.title)),
)

export function rulerPresetById(
  id: string | undefined,
): RulerPreset | undefined {
  return RULER_PRESETS.find((p) => p.id === id)
}
