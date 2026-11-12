import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  GAME_LINK_PREVIEWS,
  gameLinkPreviewMeta,
  publicTankLinkPreviewMeta,
} from '../gameLinkPreview'

const pub = join(process.cwd(), 'public')
for (const [slug, p] of Object.entries(GAME_LINK_PREVIEWS)) {
  assert.ok(p.title.length > 0 && p.title.length <= 70, `${slug}: title length`)
  assert.ok(
    p.description.length >= 40 && p.description.length <= 200,
    `${slug}: description length`,
  )
  assert.ok(/\.(webp|png|jpe?g)$/.test(p.image), `${slug}: raster image only`)
  assert.ok(existsSync(join(pub, p.image)), `${slug}: image missing ${p.image}`)
}

// These front doors have their own designed cards, never the site icon.
for (const slug of [
  'sliding-tile-gallery',
  'brainstorm',
  'mandarin',
  'music-mentor',
  'coloring-page',
  'video-generator',
  'daily-pitches',
  'hybridizer',
  'comic-studio',
  'art-archive',
]) {
  assert.equal(
    GAME_LINK_PREVIEWS[slug]?.image,
    `/${slug}/link-preview.webp`,
    `${slug}: designed preview card`,
  )
}

const meta = gameLinkPreviewMeta('ecotone', 'https://kindrobots.org/')
assert.equal(meta?.ogUrl, 'https://kindrobots.org/play/ecotone')
assert.equal(
  meta?.ogImage,
  'https://kindrobots.org/ecotone/scenes/prologue-meadow.webp',
)
assert.equal(meta?.twitterCard, 'summary_large_image')
assert.equal(gameLinkPreviewMeta('nope', 'https://x.test'), null)
assert.equal(
  gameLinkPreviewMeta('aquarium', 'https://kindrobots.org')?.ogUrl,
  'https://kindrobots.org/play/aquarium/browse',
)

// Every previewed page must actually call gameLinkPreviewMeta with its slug.
const pageFor: Record<string, string> = {
  aquarium: 'pages/play/aquarium/browse/index.vue',
  'aquarium-leaderboard': 'pages/play/aquarium/leaderboard/index.vue',
  'butterfly-gallery': 'pages/butterfly-gallery.vue',
  mandarin: 'pages/play/mandarin/index.vue',
  arcade: 'pages/play/arcade/index.vue',
  'music-mentor': 'pages/music-mentor.vue',
  'coloring-page': 'pages/coloring-page.vue',
  'daily-pitches': 'pages/play/daily-pitches/index.vue',
  'comic-studio': 'pages/play/comics/studio.vue',
  'challenge-leaderboard': 'pages/play/challenges/leaderboard.vue',
  'tzaddik-gallery': 'pages/tzaddik-gallery.vue',
  'art-archive': 'pages/art-archive.vue',
}
for (const slug of Object.keys(GAME_LINK_PREVIEWS)) {
  const file = pageFor[slug] ?? `pages/play/${slug}.vue`
  const src = readFileSync(join(process.cwd(), file), 'utf8')
  assert.ok(
    src.includes(`'${slug}'`) && src.includes('gameLinkPreviewMeta'),
    `${slug}: ${file} does not wire its link preview`,
  )
}
// Shared public tanks unfurl with the owner's name, never raw markup.
const tank = publicTankLinkPreviewMeta(
  'deep_one',
  'my tank',
  'https://kindrobots.org/',
)
assert.equal(tank.ogTitle, "@deep_one's tank | Cthulhuquarium")
assert.equal(
  tank.ogUrl,
  'https://kindrobots.org/play/aquarium/browse/deep_one/my%20tank',
)
assert.ok(existsSync(join(pub, '/cthulhuquarium-front/hero.webp')))
assert.ok(!('title' in tank), 'tank preview must not override the live title')
const odd = publicTankLinkPreviewMeta('<b>x</b>"', 's', 'https://x.test')
assert.equal(odd.ogTitle, "@bxb's tank | Cthulhuquarium")
assert.equal(
  publicTankLinkPreviewMeta('', 's', 'https://x.test').ogTitle,
  'A public tank | Cthulhuquarium',
)
const tankPage = readFileSync(
  join(process.cwd(), 'pages/play/aquarium/browse/[username]/[slug].vue'),
  'utf8',
)
assert.ok(tankPage.includes('publicTankLinkPreviewMeta('), 'tank page wired')
console.log('game link preview checks passed')
