// /utils/scripts/verifyMandarinArtRecipe.test.ts
//
// Contract test for the Mandarin Tutor v2 illustration recipe's per-card style
// variation (server/utils/mandarinIllustrationStyle.ts). Pure functions only --
// no prisma, no database, no Nuxt/H3 runtime -- same discipline as
// utils/scripts/verifyMandarinSrs.test.ts.
//
// What this is defending: the first v2 recipe emitted identical style language
// for all 577 illustrated cards, which is how a deck ends up looking like one
// image rendered 577 times. The properties below are the ones that actually
// keep that from coming back -- determinism (so a retry reproduces the render
// that was submitted), independence across axes, and real spread over a corpus.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  MANDARIN_FRAMINGS,
  MANDARIN_GROUNDS,
  MANDARIN_HANDLINGS,
  MANDARIN_LIGHTS,
  MANDARIN_PALETTES,
  MANDARIN_STYLE_VARIANT_COMBINATIONS,
  mandarinStyleVariant,
} from '../../server/utils/mandarinIllustrationStyle.js'

function token(cardKey: string): string {
  return createHash('sha256').update(cardKey, 'utf8').digest('hex').slice(0, 24)
}

// --- determinism -----------------------------------------------------------

{
  // Same card key, same variant -- every time, in any process. Conductor submits
  // the batch and the tutor's retry button rebuilds the prompt independently;
  // if these ever disagree, a re-render silently restyles the card.
  const a = mandarinStyleVariant(token('hsk:1:的'))
  const b = mandarinStyleVariant(token('hsk:1:的'))
  assert.deepEqual(a, b)

  // Case and surrounding whitespace in the token must not change the draw.
  const raw = token('hsk:1:写')
  assert.deepEqual(
    mandarinStyleVariant(raw),
    mandarinStyleVariant(` ${raw.toUpperCase()} `),
  )
}

// --- the id names the actual draw ------------------------------------------

{
  const variant = mandarinStyleVariant(token('hsk:1:写'))
  const match = /^f(\d+)-l(\d+)-p(\d+)-h(\d+)-g(\d+)$/.exec(variant.id)
  assert.ok(match, `variant id should be axis-indexed, got ${variant.id}`)
  const [, f, l, p, h, g] = match as RegExpExecArray
  assert.equal(variant.framing, MANDARIN_FRAMINGS[Number(f)])
  assert.equal(variant.light, MANDARIN_LIGHTS[Number(l)])
  assert.equal(variant.palette, MANDARIN_PALETTES[Number(p)])
  assert.equal(variant.handling, MANDARIN_HANDLINGS[Number(h)])
  assert.equal(variant.ground, MANDARIN_GROUNDS[Number(g)])
}

// --- every axis option is reachable, and the corpus actually spreads --------

{
  // 621 synthetic keys stands in for the real starter-500 + casino selection.
  const keys = Array.from({ length: 621 }, (_, index) => `hsk:${(index % 6) + 1}:card-${index}`)
  const variants = keys.map((key) => mandarinStyleVariant(token(key)))

  const seen = {
    framing: new Set(variants.map((variant) => variant.framing)),
    light: new Set(variants.map((variant) => variant.light)),
    palette: new Set(variants.map((variant) => variant.palette)),
    handling: new Set(variants.map((variant) => variant.handling)),
    ground: new Set(variants.map((variant) => variant.ground)),
  }
  assert.equal(seen.framing.size, MANDARIN_FRAMINGS.length)
  assert.equal(seen.light.size, MANDARIN_LIGHTS.length)
  assert.equal(seen.palette.size, MANDARIN_PALETTES.length)
  assert.equal(seen.handling.size, MANDARIN_HANDLINGS.length)
  assert.equal(seen.ground.size, MANDARIN_GROUNDS.length)

  // No single option may swallow the deck. With 6 framings the expected share is
  // ~17%; 40% is a generous ceiling that still catches a broken index.
  for (const options of Object.values(seen)) {
    for (const option of options) {
      const share =
        variants.filter((variant) =>
          Object.values(variant).includes(option),
        ).length / variants.length
      assert.ok(share < 0.4, `one style option covers ${Math.round(share * 100)}% of the deck`)
    }
  }

  // The whole point: most cards should carry a combination nothing else has.
  const distinct = new Set(variants.map((variant) => variant.id))
  assert.ok(
    distinct.size > variants.length * 0.6,
    `only ${distinct.size} distinct style draws across ${variants.length} cards`,
  )
}

// --- the combination space is big enough to be worth having ----------------

{
  assert.equal(
    MANDARIN_STYLE_VARIANT_COMBINATIONS,
    MANDARIN_FRAMINGS.length *
      MANDARIN_LIGHTS.length *
      MANDARIN_PALETTES.length *
      MANDARIN_HANDLINGS.length *
      MANDARIN_GROUNDS.length,
  )
  assert.ok(
    MANDARIN_STYLE_VARIANT_COMBINATIONS >= 1000,
    'the style space should comfortably exceed the size of the core corpus',
  )
}

// --- no style clause may smuggle text back into the art --------------------

{
  const clauses = [
    ...MANDARIN_FRAMINGS,
    ...MANDARIN_LIGHTS,
    ...MANDARIN_PALETTES,
    ...MANDARIN_HANDLINGS,
    ...MANDARIN_GROUNDS,
  ]
  for (const clause of clauses) {
    assert.ok(
      !/\b(text|caption|label|sign|signage|letter|numeral|character stroke)\b/i.test(clause),
      `style clause asks for written language: ${clause}`,
    )
    // The art direction bans tourist shorthand as decoration; a style axis is
    // exactly where it would sneak in as an always-on background.
    assert.ok(
      !/\b(pagoda|lantern|dragon|great wall)\b/i.test(clause),
      `style clause hard-codes China shorthand: ${clause}`,
    )
  }
}

console.log('mandarin art recipe contract: OK')
