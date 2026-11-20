import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const page = readFileSync('pages/play/index.vue', 'utf8')
const tab = readFileSync('content/channels/arcade/ban-meme.md', 'utf8')
const featured = readFileSync(
  'components/home/home-visitor-directory.vue',
  'utf8',
)
const preview = readFileSync('utils/gameLinkPreview.ts', 'utf8')
const image = readFileSync('public/ban-meme/base.avif')
const fallback = readFileSync('public/ban-meme/base.webp')

assert.equal(image.subarray(4, 12).toString('ascii'), 'ftypavif')
assert.ok(image.length > 8_000)
assert.equal(fallback.subarray(0, 4).toString('ascii'), 'RIFF')
assert.ok(fallback.length > 20_000)
assert.match(page, /data-testid="ban-meme-preview"/)
assert.match(page, /data-testid="ban-meme-reason"/)
assert.match(page, /Grand Theft Auto VI due to you/)
assert.match(
  page,
  /walking past the dog twenty times without petting him/,
)
assert.match(
  page,
  /spending the last 36 hours in-game scrolling on your phone/,
)
assert.match(page, /not tipping the barista/)
assert.match(page, /gameLinkPreviewMeta\('ban-meme'/)
assert.match(page, /This ban is permanent and is not eligible for appeal\./)
assert.match(page, /context\.drawImage\(baseImage/)
assert.match(page, /canvas\.toBlob\(resolve, 'image\/png'\)/)
assert.match(page, /image\.src = '\/ban-meme\/base\.avif'/)
assert.match(tab, /route: \/play\n/)
assert.match(tab, /tabKey: ban-meme/)
assert.match(tab, /tutorial:/)
assert.match(tab, /This ban is permanent and is not eligible for appeal\./)
assert.match(featured, /title: 'Account Banned Meme Lab'/)
assert.match(featured, /route: '\/play'/)
assert.match(preview, /'ban-meme': \{/)

console.log(
  'Account Banned meme maker: route, image, export, tab, guide and highlights OK',
)
