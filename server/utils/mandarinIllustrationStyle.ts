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
// self-tested without a database. buildMandarinIllustrationPrompt lives here
// rather than beside the manifest assembler for exactly that reason: it is the
// piece that has to be checked against the art prompt contract, and the
// assembler pulls in the catalog and prisma behind it.

import type { MandarinCard } from '~/utils/mandarin'
import { createHash } from 'node:crypto'

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

export function mandarinCardToken(cardKey: string): string {
  return createHash('sha256').update(cardKey, 'utf8').digest('hex').slice(0, 24)
}

function compactConcept(meaning: string): string {
  const clean = meaning.replace(/\s+/g, ' ').trim()
  const firstClause = clean.split(';')[0]?.trim() || clean
  return firstClause.slice(0, 240)
}


/**
 * Where the card is set.
 *
 * Every clause here states one decided outcome. The art prompt contract
 * (server/utils/artPromptContract.ts) rejects "only when", "where appropriate",
 * "as needed" and their relatives for a demonstrated reason: Krea 2 is a
 * distilled diffusion transformer, it cannot evaluate a condition, and it
 * paints the densest noun phrase it is handed. "Use a Chinese setting where it
 * helps" is not a hedge to the model -- it is a Chinese setting, always, plus
 * some noise. The recipe knows the card's categories, so it decides here.
 */
function categoryDirection(card: MandarinCard): string {
  const categories = new Set(card.categories)

  if (categories.has('casino')) {
    return [
      'Set it on the working floor of a contemporary Chinese-speaking casino: believable felt tables, chips, cards, tiles, cash handling, dealer gestures, and players mid-hand.',
      'Favor the look of a real working table game over fantasy luxury. Keep the equipment physically plausible and brand-neutral, with blank chips, blank card faces, and blank signage.',
    ].join(' ')
  }
  if (categories.has('food-drink')) {
    return 'Set it in everyday Chinese food culture: ceramic bowls and cups, chopsticks, bamboo steamers, shared dishes, market ingredients, an ordinary kitchen or table. The food or the action stays the focal point.'
  }
  if (categories.has('family')) {
    return 'Set it in a warm contemporary Chinese home: an ordinary apartment, courtyard, or neighborhood, with everyday clothing and furnishings. The relationship reads through how the people act toward each other.'
  }
  if (categories.has('travel-places')) {
    return 'Set it in a practical contemporary Chinese street, neighborhood, room, transit, or travel scene. The architecture and objects look lived-in and specific, and every sign is blank.'
  }
  if (categories.has('greetings')) {
    return 'Show a simple contemporary Chinese social interaction with natural gesture, distance, and body language. Keep the faces small and lightly painted rather than a close-up portrait.'
  }
  if (categories.has('time-calendar')) {
    return 'Express the hour through daylight and a recognizable Chinese daily routine: breakfast, the commute, school, work, an evening meal, neighborhood activity. Let the light carry the time rather than a clock face.'
  }
  if (categories.has('everyday-actions')) {
    return 'Show one person performing the action in an ordinary contemporary Chinese daily-life setting, with a simple pose, believable hands, and a quiet uncluttered background.'
  }
  if (categories.has('numbers')) {
    return 'Show the quantity as a clean group of countable everyday objects from a Chinese household, kitchen, market, school, or game. The count is carried by the objects themselves.'
  }
  if (categories.has('colors')) {
    return 'Show one familiar central object whose color is unmistakable: Chinese ceramics, textiles, food, plants, or an ordinary household object.'
  }
  if (categories.has('animals')) {
    return 'Center one clearly recognizable animal, with a light Chinese landscape, garden, farm, or neighborhood behind it. The animal stays the memory anchor.'
  }

  return 'Show the simplest ordinary object or everyday scene that makes the meaning obvious at a glance, grounded in contemporary Chinese lived environments and material culture.'
}

/**
 * Cultural shorthand — pagodas, dragons, festival red-and-gold — is banned as
 * decoration but obviously allowed when it IS the word. The recipe decides per
 * card instead of shipping the model an "unless" it cannot read.
 */
const CULTURAL_SHORTHAND = /\b(?:pagoda|dragon|lantern|great wall|calligraph|festival|new year|temple|opera|costume|traditional dress)/i


/**
 * The canonical v2 prompt for a card.
 *
 * Structure: what to draw (concept + category direction), the fixed house
 * style, then this card's own style draw -- framing, light, palette, paint
 * handling, ground -- then the fixed guard rails. The house style is what makes
 * 577 cards look like one deck; the style draw is what stops them from looking
 * like one image rendered 577 times.
 *
 * The variant is derived from the card key, so this function stays pure and the
 * tutor's per-card retry reproduces the same prompt the batch was submitted
 * with.
 *
 * The style clauses are INSERTED into the original v2 sentence order rather
 * than replacing any of it, and the only text removed is "warm harmonious
 * color, " from the house style. That is deliberate: Conductor stages the
 * corpus from whatever manifest production is currently serving, so it can
 * apply the same edit to an older deployment's prompt and land on a
 * byte-identical string. Rewording the surrounding sentences would silently
 * break that (see scripts/mandarin_prompt_variation.py in Conductor).
 */
export function buildMandarinIllustrationPrompt(card: MandarinCard): string {
  const concept = compactConcept(card.meaning)
  const variant = mandarinStyleVariant(mandarinCardToken(card.key))
  const conceptIsCultural = CULTURAL_SHORTHAND.test(`${card.meaning} ${card.categories.join(' ')}`)

  return [
    // Not "flashcard illustration". Naming a physical format gets you the
    // object: the contract's second rule was learned from "treasure card
    // illustration", which rendered literal trading cards with title bars and
    // invented rules text. The tutor owns the card; the model paints a picture.
    `A square illustration of this idea: ${concept}.`,
    categoryDirection(card),
    // "warm harmonious color" is gone from the house style on purpose: the
    // palette axis below now names the colour, and leaving both in had every
    // card asking for the same warm harmony no matter which palette it drew.
    'House style: modern Chinese educational picture-book art, hand-painted gouache with gentle watercolor and restrained ink-wash influence, matte pigments, subtle paper grain, clean shapes, clear silhouettes, limited deliberate detail, and generous negative space.',
    variant.framing,
    variant.light,
    variant.palette,
    variant.handling,
    variant.ground,
    'The composition is decided by an illustrator: one strong memory anchor, natural asymmetry, modest depth, and believable object relationships.',
    'Chinese cultural flavor comes from truthful everyday detail that belongs to the idea itself: ceramics, bamboo, wood, textiles, foodways, interiors, markets, streets, transit, games, furnishings, landscape.',
    // Naming what to leave out is only safe when the word is not the concept --
    // and on a cfg-1 distilled engine every one of those nouns lands in
    // positive conditioning anyway, so a card about a dragon would get the
    // dragon twice over.
    ...(conceptIsCultural
      ? []
      : [
          'Keep the tourist shorthand out of it: no pagodas, lantern walls, dragons, Great Wall, red-and-gold festival dressing, or historical costume.',
        ]),
    // The old recipe listed twelve synthetic-image tells to avoid -- including
    // "lens flare", "bokeh", and "neon glow". At cfg 1 the ComfyUI negative
    // prompt is inert, so that list was a request for exactly those things.
    // Same art direction, stated as the wanted result.
    'Everything is hand-painted: matte pigment on paper, simplified deliberate shapes, plain even light, simple anatomy, relaxed hands, and calm uncluttered surroundings.',
    // Likewise: the old recipe named text fourteen ways. Once, positively.
    'Every surface in the picture is blank and unmarked, carrying no writing of any kind.',
  ].join(' ')
}
