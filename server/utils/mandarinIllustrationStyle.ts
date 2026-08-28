// /server/utils/mandarinIllustrationStyle.ts
//
// Per-card style variation for the Mandarin Tutor v2 illustration recipe.
//
// The v2 house style is deliberately fixed: modern Chinese educational
// picture-book gouache. What was NOT fixed -- and should not be -- is the
// framing, light, palette, paint handling, and ground treatment of every single
// card. The first v2 recipe emitted the same style sentences for all 577
// illustrated cards, so any two prompts were ~82% identical and 38 pairs were
// byte-for-byte identical. A corpus built from that converges on one camera
// distance, one lighting setup, and one palette, which is exactly the
// interchangeable "AI art" read the art direction is trying to avoid.
//
// So: keep the house style constant, vary the illustrator's decisions. Each
// card draws one option per axis, deterministically, from its own stable card
// token -- the same token that already names its media file. Determinism
// matters because the batch producer (Conductor) and the tutor's per-card retry
// button must ask for the same picture, and because a re-render of one card
// should not silently restyle it.
//
// 6 x 5 x 6 x 5 x 4 = 3600 combinations across 577 cards.
//
// Pure functions only -- no prisma, no Nuxt runtime -- so the recipe can be
// self-tested without a database.

export type MandarinStyleVariant = {
  /** Stable axis-index id, e.g. `f2-l0-p4-h1-g3`. Recorded for audit/QA. */
  id: string
  framing: string
  light: string
  palette: string
  handling: string
  ground: string
}

/** How the square is composed and how close the subject sits. */
export const MANDARIN_FRAMINGS = [
  'Frame it as a close still life: the subject large in the square and lightly cropped by it, seen from a little above the surface it rests on.',
  'Frame it wide and quiet: the subject small and set low in the square, with a large calm field of paper above and around it.',
  'Frame it as a mid-distance vignette: the subject off-centre, with the scene painted only where it matters and dissolving into bare paper toward the edges.',
  'Frame it as a flat overhead view, looking straight down on a small arrangement laid out on a plain surface.',
  'Frame it at eye level, the subject reading clearly in profile or three-quarter view against a nearly empty ground.',
  'Frame it through an ordinary near edge such as a doorway, window frame, table edge, or shelf, keeping that near edge a simple dark shape and the subject just beyond it.',
] as const

/** Quality and direction of light. Restrained on purpose -- no cinematic tricks. */
export const MANDARIN_LIGHTS = [
  'Light it with flat, even overcast daylight: soft shadows, no strong direction, gentle contrast.',
  'Light it with low late-afternoon sun from one side: long soft shadows and a warm cast on the lit planes.',
  'Light it with bright open shade around midday: cool clean light and crisp but shallow shadows.',
  'Light it with warm indoor lamplight after dark: one small pool of light, the rest of the square settling into quiet muted tone.',
  'Light it with cool early-morning window light: pale, slightly blue shadows and a calm low-contrast feel.',
] as const

/**
 * Limited harmonies with one accent each. Every option stays inside the matte
 * gouache family, so the deck still reads as one hand even as the colour moves.
 */
export const MANDARIN_PALETTES = [
  'Keep the palette to muted indigo, slate blue, and warm off-white, with a single soft persimmon accent.',
  'Keep the palette to dusty jade and bamboo green over cream, with a single clay-red accent.',
  'Keep the palette to warm ochre, tea brown, and unbleached paper, with a single deep teal accent.',
  'Keep the palette to soft brick red and terracotta against pale grey-green, with a single ink-black accent.',
  'Keep the palette to pale wheat, straw yellow, and warm grey, with a single dusty plum accent.',
  'Keep the palette to cool porcelain white and celadon with charcoal drawing, and a single mustard accent.',
] as const

/** How the paint itself behaves -- the strongest anti-sameness lever. */
export const MANDARIN_HANDLINGS = [
  'Handle the paint as flat opaque gouache shapes with very little blending and honest visible brush edges.',
  'Handle the paint as wet watercolour washes bleeding softly into one another, with a few edges left deliberately hard.',
  'Handle the paint with a dry brush dragged over rough paper so the tooth of the sheet breaks the colour.',
  'Handle the paint as thin washes under an uneven hand-drawn ink line that changes weight and sometimes misses its own shape.',
  'Handle the paint in broad simple strokes, letting pigment pool and darken at the edge of each shape.',
] as const

/** What the subject sits on, and how the negative space is treated. */
export const MANDARIN_GROUNDS = [
  'Leave the ground as bare untouched paper so the negative space is genuinely empty.',
  'Set the subject on a single flat wash of ground colour that stops short of the square edges.',
  'Set the subject against a soft irregular halo of wash that fades out before it reaches the corners.',
  'Set the subject on a simple band of ground colour across the lower part of the square, leaving the rest as paper.',
] as const

/**
 * Read a 4-hex-digit slice of the card token as an index into `length`.
 *
 * Separate slices per axis keeps the axes independent: two cards that happen to
 * share a framing are no more likely to share a palette than any other pair.
 */
function axisIndex(token: string, slot: number, length: number): number {
  const slice = token.slice(slot * 4, slot * 4 + 4)
  const value = Number.parseInt(slice, 16)
  if (!Number.isFinite(value)) return 0
  return value % length
}

/**
 * The deterministic style variant for a card token.
 *
 * `token` is the 24-hex-character card token (`stableToken(card.key)`) that also
 * names the card's media file, so a card's look is tied to its identity rather
 * than to its position in the catalog.
 */
export function mandarinStyleVariant(token: string): MandarinStyleVariant {
  const normalized = token.trim().toLowerCase()
  const f = axisIndex(normalized, 0, MANDARIN_FRAMINGS.length)
  const l = axisIndex(normalized, 1, MANDARIN_LIGHTS.length)
  const p = axisIndex(normalized, 2, MANDARIN_PALETTES.length)
  const h = axisIndex(normalized, 3, MANDARIN_HANDLINGS.length)
  const g = axisIndex(normalized, 4, MANDARIN_GROUNDS.length)
  return {
    id: `f${f}-l${l}-p${p}-h${h}-g${g}`,
    framing: MANDARIN_FRAMINGS[f] as string,
    light: MANDARIN_LIGHTS[l] as string,
    palette: MANDARIN_PALETTES[p] as string,
    handling: MANDARIN_HANDLINGS[h] as string,
    ground: MANDARIN_GROUNDS[g] as string,
  }
}

/** Total distinct combinations the axes can produce. */
export const MANDARIN_STYLE_VARIANT_COMBINATIONS =
  MANDARIN_FRAMINGS.length *
  MANDARIN_LIGHTS.length *
  MANDARIN_PALETTES.length *
  MANDARIN_HANDLINGS.length *
  MANDARIN_GROUNDS.length
