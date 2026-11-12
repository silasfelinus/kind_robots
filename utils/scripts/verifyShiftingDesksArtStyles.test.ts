import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  ART_STYLES,
  SELECTABLE_ART_STYLES,
  ART_STYLE_STORAGE_KEY,
  WITHDRAWN_RENDERS,
  DEFAULT_ART_STYLE,
  artStyleImageSrc,
  normalizeArtStyle,
} from '../shiftingDesks/artStyles'
import { ENDINGS } from '../shiftingDesks/rules'

const file = (path: string) => fileURLToPath(new URL(path, import.meta.url))
const asset = (path: string) => readFileSync(file(path), 'utf8')

const styleIds = ART_STYLES.map((style) => style.id)
assert.equal(styleIds.join(','), 'classic,western-cartoon,corporate-noir')
// Silas, 2026-10-14: Classic is the default again.
assert.equal(DEFAULT_ART_STYLE, 'classic')
// Silas, 2026-10-15: Noir was too close to Western Cartoon on Illustrious.
assert.equal(
  ART_STYLES.find((s) => s.id === 'corporate-noir')!.checkpoint,
  'Krea 2',
)
assert.equal(normalizeArtStyle(null), 'classic')
assert.equal(normalizeArtStyle('unknown'), 'classic')
assert.equal(normalizeArtStyle('classic'), 'classic')
assert.equal(
  ART_STYLES.find((style) => style.id === 'western-cartoon')?.phase,
  'suspended',
)
assert.equal(
  SELECTABLE_ART_STYLES.map((style) => style.id).join(','),
  'classic,corporate-noir',
)
assert.equal(
  normalizeArtStyle('western-cartoon'),
  'classic',
  'saved invalidated Western Cartoon preferences must show accepted Classic art',
)

const classic =
  '/images/shifting-desks/cards/orientation/the-guard-who-is-also-you.webp'
assert.equal(artStyleImageSrc(classic, 'classic'), classic)
assert.equal(
  artStyleImageSrc(classic, 'invalid'),
  artStyleImageSrc(classic, DEFAULT_ART_STYLE),
  'an unknown style falls back to the default',
)
assert.equal(
  artStyleImageSrc(classic, 'corporate-noir'),
  '/images/shifting-desks/styles/corporate-noir/cards/orientation/the-guard-who-is-also-you.webp',
)
assert.equal(
  artStyleImageSrc(classic, 'western-cartoon'),
  classic,
  'suspended art styles cannot show rejected imagery even when passed directly',
)
// Silas, 2026-11-02: "that is not a cockroach". A render that drew Beverly
// as a human falls back to the Classic roach in every style that lost her.
const beverly =
  '/images/shifting-desks/cards/toy-division/the-union-walkthrough.webp'
assert.equal(artStyleImageSrc(beverly, 'western-cartoon'), beverly)
assert.equal(artStyleImageSrc(beverly, 'corporate-noir'), beverly)
assert.equal(
  artStyleImageSrc('/unrelated/image.webp', 'western-cartoon'),
  '/unrelated/image.webp',
)

const component = asset(
  '../../components/shifting-desks/shifting-desks-art.vue',
)
assert.match(component, /displaySrc\.value !== props\.src/)
assert.match(component, /onImageError/)
const page = asset('../../pages/play/shifting-desks.vue')
// In game, an Art button opens the same picture picker as the front desk.
assert.match(page, /@click="openArtPicker"/)
assert.match(
  page,
  /ref="artPicker"[\s\S]*?<shifting-desks-style-picker/,
  'the in-game art dialog holds the picture picker',
)
assert.match(page, /loadArtStylePreference/)
assert.match(page, /saveArtStylePreference/)
assert.match(page, /provide\('shifting-desks-art-style', artStyle\)/)
assert.doesNotMatch(page, /localStorage|\$fetch/)

assert.equal(ART_STYLE_STORAGE_KEY, 'shifting-desks-art-style-v3')
assert.match(page, /ref<ShiftingDesksArtStyle>\(DEFAULT_ART_STYLE\)/)
assert.match(
  page,
  /<shifting-desks-style-picker/,
  'the front desk presents every art style',
)
const picker = asset(
  '../../components/shifting-desks/shifting-desks-style-picker.vue',
)
assert.match(
  picker,
  /role="radiogroup"[\s\S]*v-for="option in SELECTABLE_ART_STYLES"/,
)
assert.match(picker, /artStyleImageSrc\(ART_STYLE_SAMPLE, option\.id\)/)

// The complete eleven-ending Western Cartoon batch was inspected, not just
// probed for HTTP 200. Their key finale compositions were absent, so no
// player should see them in place of the authored Classic ending plates.
assert.equal(ENDINGS.length, 11)
for (const ending of ENDINGS) {
  const src = `/images/shifting-desks/endings/${ending.id}.webp`
  assert.equal(
    artStyleImageSrc(src, 'western-cartoon'),
    src,
    `rejected Western Cartoon finale ${ending.id} must use Classic art`,
  )
  assert.equal(artStyleImageSrc(src, 'classic'), src)
  assert.equal(
    artStyleImageSrc(src, 'corporate-noir'),
    `/images/shifting-desks/styles/corporate-noir/endings/${ending.id}.webp`,
    'only the rejected Western edition is withdrawn',
  )
}

// A render withdrawn after review always shows Classic, in that style only.
const jam = '/images/shifting-desks/cards/records/the-jam-in-tube-14.webp'
assert.ok(WITHDRAWN_RENDERS['western-cartoon']?.length)
assert.equal(artStyleImageSrc(jam, 'western-cartoon'), jam)
assert.equal(
  artStyleImageSrc(jam, 'corporate-noir'),
  '/images/shifting-desks/styles/corporate-noir/cards/records/the-jam-in-tube-14.webp',
)
