// /utils/scripts/verifyEntityArtPrimaryCrop.ts
//
// Entity art is collapsing from four stored slots per object (imagePath +
// cardPath + heroPath + iconPath) to one primary render plus an inspiration
// gallery (Silas, 2026-09-05: "we really don't need three different images just
// so we can show a hero view, card view, icon view").
//
// Two behaviours have to hold for that to look right, and both are easy to
// regress silently because the fallback chain hides them:
//
//   1. A Bot's primary is found. Bot stores its render in `avatarImage` while
//      every other entity uses `imagePath`, so a resolver that only knows
//      `imagePath` renders bots as blank placeholders.
//   2. A primary standing in for a missing variant is re-cropped, and a
//      purpose-built variant is NOT. Variants are composed for their aspect;
//      re-cropping one fights the composition, while failing to crop a
//      stand-in square into 2:3 cuts the subject's head off.
import assert from 'node:assert/strict'
import {
  ART_VARIANT_FOCUS,
  resolveArtImageSrc,
  resolveArtVariantSource,
  resolveArtVariantSrc,
  type ArtVariant,
} from '../artImageSrc'

const VARIANTS: ArtVariant[] = ['card', 'hero', 'icon']

// ── Bot primary normalization ───────────────────────────────────────────────

assert.equal(
  resolveArtImageSrc({ avatarImage: '/images/bots/ami-bot.webp' }),
  '/images/bots/ami-bot.webp',
  "a Bot's avatarImage must resolve as its primary render",
)

assert.equal(
  resolveArtImageSrc({
    imagePath: '/api/art/images/42/file',
    avatarImage: '/images/bots/ami-bot.webp',
  }),
  '/api/art/images/42/file',
  'imagePath wins when both are set, so backfilling Bot.imagePath needs no code change',
)

assert.equal(
  resolveArtVariantSource({ avatarImage: '/images/bots/ami-bot.webp' }, 'card')
    .origin,
  'primary',
  'a Bot with only an avatar is a stand-in primary, not a composed variant',
)

// ── Origin reporting drives the crop ────────────────────────────────────────

for (const variant of VARIANTS) {
  const composed = resolveArtVariantSource(
    { cardPath: '/card.webp', heroPath: '/hero.webp', iconPath: '/icon.webp' },
    variant,
  )
  assert.equal(
    composed.origin,
    'variant',
    `${variant}: a purpose-built variant must report origin 'variant' so it is shown as composed`,
  )

  const standIn = resolveArtVariantSource(
    { imagePath: '/primary.webp' },
    variant,
  )
  assert.deepEqual(
    standIn,
    { src: '/primary.webp', origin: 'primary' },
    `${variant}: a missing variant must fall back to the primary and say so`,
  )

  assert.equal(
    resolveArtVariantSource(null, variant, '/fallback.webp').origin,
    'fallback',
    `${variant}: an empty source with a fallback must report origin 'fallback'`,
  )

  assert.deepEqual(
    resolveArtVariantSource(null, variant),
    { src: '', origin: 'none' },
    `${variant}: nothing at all must report origin 'none', not an empty variant`,
  )

  assert.ok(
    /^\d+% \d+%$/.test(ART_VARIANT_FOCUS[variant]),
    `${variant}: needs a usable object-position focus for stand-in crops`,
  )

  // Vertical bias is the whole point: a centred crop of a square portrait into
  // 2:3 or 16:9 cuts heads off, so every focus sits above centre.
  const vertical = ART_VARIANT_FOCUS[variant].split(' ')[1] ?? ''
  assert.ok(
    Number.parseInt(vertical, 10) < 50,
    `${variant}: focus must sit above centre so stand-in crops keep the subject`,
  )
}

// ── The string wrapper stays byte-compatible for existing callers ───────────

const cases = [
  { cardPath: '/card.webp' },
  { imagePath: '/primary.webp' },
  { avatarImage: '/avatar.webp' },
  null,
]
for (const source of cases) {
  for (const variant of VARIANTS) {
    assert.equal(
      resolveArtVariantSrc(source, variant, '/fallback.webp'),
      resolveArtVariantSource(source, variant, '/fallback.webp').src,
      'resolveArtVariantSrc must stay a thin wrapper over resolveArtVariantSource',
    )
  }
}

console.log(
  'Entity art primary/crop contract verified: Bot primaries resolve, and only a stand-in primary is re-cropped.',
)
