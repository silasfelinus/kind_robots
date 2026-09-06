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
//
// And since 2026-09-05 the primary WINS over a stored variant, which is the
// change that actually retires three renders per object. The variant branch
// stays as a fallback purely so an object with variant art but no primary does
// not go blank mid-migration.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve as resolvePath } from 'node:path'
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
  // The collapse itself: one good primary beats three purpose-built variants.
  assert.deepEqual(
    resolveArtVariantSource(
      {
        imagePath: '/primary.webp',
        cardPath: '/card.webp',
        heroPath: '/hero.webp',
        iconPath: '/icon.webp',
      },
      variant,
    ),
    { src: '/primary.webp', origin: 'primary' },
    `${variant}: the primary render must win over a stored variant`,
  )

  // A Bot's avatar is a primary too, so it also outranks stored variants.
  assert.deepEqual(
    resolveArtVariantSource(
      { avatarImage: '/avatar.webp', cardPath: '/card.webp' },
      variant,
    ),
    { src: '/avatar.webp', origin: 'primary' },
    `${variant}: a Bot's avatar counts as the primary and outranks variants`,
  )

  const composed = resolveArtVariantSource(
    { cardPath: '/card.webp', heroPath: '/hero.webp', iconPath: '/icon.webp' },
    variant,
  )
  assert.equal(
    composed.origin,
    'variant',
    `${variant}: with no primary, the stored variant is the fallback and is shown as composed`,
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
  'Entity art primary/crop contract verified: the primary wins, Bot primaries resolve, ' +
    'and only a stand-in primary is re-cropped.',
)

// ── Retired slots must not accept new work ──────────────────────────────────
//
// The collapse only holds if nothing keeps queueing the slots it retires. Two
// independent producers had to be stopped, and each is easy to regress:
// prepareEntityArtEnqueue (the API path) and generate_facet_art_v4 (which
// writes ArtJobs straight to the table and so inherits no API gate).
const entityArtSource = readFileSync(
  resolvePath(process.cwd(), 'server/utils/entityArt.ts'),
  'utf8',
)
const facetProducerSource = readFileSync(
  resolvePath(process.cwd(), 'scripts/generate_facet_art_v4.ts'),
  'utf8',
)

assert.ok(
  /if \(target\.config\.retired\) \{/.test(entityArtSource),
  'prepareEntityArtEnqueue must refuse a retired slot, or the collapse keeps queueing card/hero/icon',
)
assert.equal(
  (entityArtSource.match(/^\s+retired: true,$/gm) || []).length,
  17,
  'every card/hero/icon slot across bot/character/scenario/reward/facet/project must be marked retired',
)
assert.ok(
  !/^\s+primary: true,\n\s+retired: true,$/m.test(entityArtSource),
  'a primary slot must never be marked retired -- that would block the one render we keep',
)
assert.ok(
  /RETIRED_VARIANT_FIELDS\.has\(variant\.field\)/.test(facetProducerSource),
  'generate_facet_art_v4 writes ArtJobs directly, so it must skip retired variants itself',
)

console.log(
  'Retired-slot producers verified: no new card/hero/icon work is queued.',
)
