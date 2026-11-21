// utils/cthulhuquariumArtStyles.ts
//
// Cthulhuquarium's swappable art styles (conductor cthulhuquarium/t-107).
// Silas, 2026-11-21: "we should add a different art style. Something from
// illustrious probably. The user should be able to swap between them, like we
// do with shifting desks." The same pattern as utils/shiftingDesks/artStyles.ts:
//
//   - presentation only, kept per browser with the other game settings
//     (utils/cthulhuquariumSettings.ts), never part of the tank or its saves;
//   - a style's art sits in a mirrored tree,
//     assets/images/cthulhuquarium/styles/<id>/{sprites,portraits,heroes,
//     backgrounds,plates,ui}/<stem>.webp, synced from the canon;
//   - any file a style has not rendered (or had withdrawn in review) falls back
//     to Classic, one file at a time, so a style can arrive round by round;
//   - a style is offered to players only once it is `available`.
//
// Pure apart from one reactive ref: the resolvers read `activeArtStyle` so every
// computed art URL re-runs when the player swaps. Names are namespaced because
// Nuxt auto-imports utils/.

import { ref } from 'vue'

export type CthulhuquariumArtStyleId = 'classic' | 'illustrious'

export interface CthulhuquariumArtStyle {
  id: CthulhuquariumArtStyleId
  label: string
  /** One line for the picker. */
  blurb: string
  /** How the art is rendered, for the record. */
  engine: string
  /** Offered to players. False while the style's art is still being made. */
  available: boolean
  /**
   * Renders rejected in review (`portraits/wilbur-stint-wince-f3`): they keep
   * the Classic file even though a styled one exists.
   */
  withdrawn: readonly string[]
}

export const CTHULHUQUARIUM_ART_STYLES: readonly CthulhuquariumArtStyle[] = [
  {
    id: 'classic',
    label: 'Classic',
    blurb: 'Hand-tinted photographs and painted plates.',
    engine: 'Krea 2',
    available: true,
    withdrawn: [],
  },
  {
    // The checkpoint is chosen from the style check (conductor t-108,
    // art/ILLUSTRIOUS-STYLE-CHECK-1.yaml); the label follows the pick.
    id: 'illustrious',
    label: 'Illustrated',
    blurb: 'Drawn and inked, the same shop in another hand.',
    engine: 'Illustrious',
    available: false,
    withdrawn: [],
  },
]

export const CTHULHUQUARIUM_DEFAULT_ART_STYLE: CthulhuquariumArtStyleId =
  'classic'

/** The styles a player can choose today (Classic first). */
export function selectableCthulhuquariumArtStyles(): CthulhuquariumArtStyle[] {
  return CTHULHUQUARIUM_ART_STYLES.filter((style) => style.available)
}

export function cthulhuquariumArtStyleInfo(
  id: CthulhuquariumArtStyleId,
): CthulhuquariumArtStyle {
  return (
    CTHULHUQUARIUM_ART_STYLES.find((style) => style.id === id) ??
    CTHULHUQUARIUM_ART_STYLES[0]!
  )
}

/** Anything unknown, or a style not yet available, is Classic. */
export function normalizeCthulhuquariumArtStyle(
  value: unknown,
): CthulhuquariumArtStyleId {
  const style = CTHULHUQUARIUM_ART_STYLES.find(
    (entry) => entry.id === value && entry.available,
  )
  return style ? style.id : CTHULHUQUARIUM_DEFAULT_ART_STYLE
}

/** The style the game is drawing in now; set from the player's settings. */
export const activeCthulhuquariumArtStyle = ref<CthulhuquariumArtStyleId>(
  CTHULHUQUARIUM_DEFAULT_ART_STYLE,
)

export function setCthulhuquariumArtStyle(value: unknown): void {
  activeCthulhuquariumArtStyle.value = normalizeCthulhuquariumArtStyle(value)
}

/**
 * The styled file to use for `folder/stem` in `style`, or null to keep
 * Classic: Classic itself, a file the style has not rendered, or one withdrawn
 * in review. `styled` is the style's file map (`<style>/<folder>/<stem>`).
 */
export function pickCthulhuquariumStyledArt(
  styled: Readonly<Record<string, string>>,
  style: CthulhuquariumArtStyleId,
  folder: string,
  stem: string,
): string | null {
  if (style === 'classic') return null
  const key = `${folder}/${stem}`
  if (cthulhuquariumArtStyleInfo(style).withdrawn.includes(key)) return null
  return styled[`${style}/${key}`] ?? null
}
