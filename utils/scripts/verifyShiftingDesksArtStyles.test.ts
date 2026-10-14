import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  ART_STYLES,
  ART_STYLE_STORAGE_KEY,
  DEFAULT_ART_STYLE,
  artStyleImageSrc,
  normalizeArtStyle,
} from '../shiftingDesks/artStyles'

const file = (path: string) => fileURLToPath(new URL(path, import.meta.url))
const asset = (path: string) => readFileSync(file(path), 'utf8')

const styleIds = ART_STYLES.map((style) => style.id)
assert.equal(styleIds.join(','), 'western-cartoon,corporate-noir,classic')
// Silas, 2026-10-14: Illustrious is the default.
assert.equal(DEFAULT_ART_STYLE, 'western-cartoon')
assert.match(
  ART_STYLES.find((s) => s.id === DEFAULT_ART_STYLE)!.checkpoint,
  /^Illustrious\//,
)
assert.ok(ART_STYLES.every((s) => s.phase === 'available' && s.blurb))
assert.equal(normalizeArtStyle(null), 'western-cartoon')
assert.equal(normalizeArtStyle('unknown'), 'western-cartoon')
assert.equal(normalizeArtStyle('classic'), 'classic')
assert.equal(normalizeArtStyle('western-cartoon'), 'western-cartoon')

const classic = '/images/shifting-desks/cards/orientation/gus-shop-steward.webp'
assert.equal(artStyleImageSrc(classic, 'classic'), classic)
assert.equal(
  artStyleImageSrc(classic, 'invalid'),
  artStyleImageSrc(classic, DEFAULT_ART_STYLE),
  'an unknown style falls back to the Illustrious default',
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
assert.match(page, /v-model="artStyle"/)
assert.match(page, /loadArtStylePreference/)
assert.match(page, /saveArtStylePreference/)
assert.match(page, /provide\('shifting-desks-art-style', artStyle\)/)
assert.doesNotMatch(page, /localStorage|\$fetch/)

assert.equal(ART_STYLE_STORAGE_KEY, 'shifting-desks-art-style-v2')
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
