import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  ART_STYLES,
  ART_STYLE_STORAGE_KEY,
  WITHDRAWN_RENDERS,
  DEFAULT_ART_STYLE,
  artStyleImageSrc,
  normalizeArtStyle,
} from '../shiftingDesks/artStyles'

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
assert.equal(normalizeArtStyle('western-cartoon'), 'western-cartoon')

const classic = '/images/shifting-desks/cards/orientation/gus-shop-steward.webp'
assert.equal(artStyleImageSrc(classic, 'classic'), classic)
assert.equal(
  artStyleImageSrc(classic, 'invalid'),
  artStyleImageSrc(classic, DEFAULT_ART_STYLE),
  'an unknown style falls back to the default',
)
assert.equal(
  artStyleImageSrc(classic, 'corporate-noir'),
  '/images/shifting-desks/styles/corporate-noir/cards/orientation/gus-shop-steward.webp',
)
assert.equal(
  artStyleImageSrc(classic, 'western-cartoon'),
  '/images/shifting-desks/styles/western-cartoon/cards/orientation/gus-shop-steward.webp',
)
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
assert.match(picker, /role="radiogroup"[\s\S]*v-for="option in ART_STYLES"/)
assert.match(picker, /artStyleImageSrc\(ART_STYLE_SAMPLE, option\.id\)/)

// A render withdrawn after review always shows Classic, in that style only.
const jam = '/images/shifting-desks/cards/records/the-jam-in-tube-14.webp'
assert.ok(WITHDRAWN_RENDERS['western-cartoon']?.length)
assert.equal(artStyleImageSrc(jam, 'western-cartoon'), jam)
assert.equal(
  artStyleImageSrc(jam, 'corporate-noir'),
  '/images/shifting-desks/styles/corporate-noir/cards/records/the-jam-in-tube-14.webp',
)
