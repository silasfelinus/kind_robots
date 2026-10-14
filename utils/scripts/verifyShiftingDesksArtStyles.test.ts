import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  ART_STYLES,
  ART_STYLE_STORAGE_KEY,
  artStyleImageSrc,
  normalizeArtStyle,
} from '../shiftingDesks/artStyles'

const file = (path: string) => fileURLToPath(new URL(path, import.meta.url))
const asset = (path: string) => readFileSync(file(path), 'utf8')

assert.deepEqual(
  ART_STYLES.map((style) => style.id),
  ['classic', 'corporate-noir', 'western-cartoon'],
)
assert.equal(normalizeArtStyle(null), 'classic')
assert.equal(normalizeArtStyle('unknown'), 'classic')
assert.equal(normalizeArtStyle('western-cartoon'), 'western-cartoon')

const classic = '/images/shifting-desks/cards/orientation/gus-shop-steward.webp'
assert.equal(artStyleImageSrc(classic, 'classic'), classic)
assert.equal(artStyleImageSrc(classic, 'invalid'), classic)
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

const component = asset('../../components/shifting-desks/shifting-desks-art.vue')
assert.match(component, /displaySrc\.value !== props\.src/)
assert.match(component, /onImageError/)
const page = asset('../../pages/play/shifting-desks.vue')
assert.match(page, /v-model="artStyle"/)
assert.match(page, /loadArtStylePreference/)
assert.match(page, /saveArtStylePreference/)
assert.match(page, /provide\('shifting-desks-art-style', artStyle\)/)
assert.doesNotMatch(page, /localStorage|\$fetch/)

assert.equal(ART_STYLE_STORAGE_KEY, 'shifting-desks-art-style-v1')
