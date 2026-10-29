import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { GAME_LINK_PREVIEWS, gameLinkPreviewMeta } from '../gameLinkPreview'

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
  'butterfly-gallery': 'pages/butterfly-gallery.vue',
  mandarin: 'pages/play/mandarin/index.vue',
  arcade: 'pages/play/arcade/index.vue',
}
for (const slug of Object.keys(GAME_LINK_PREVIEWS)) {
  const file = pageFor[slug] ?? `pages/play/${slug}.vue`
  const src = readFileSync(join(process.cwd(), file), 'utf8')
  assert.ok(
    src.includes(`'${slug}'`) && src.includes('gameLinkPreviewMeta'),
    `${slug}: ${file} does not wire its link preview`,
  )
}
console.log('game link preview checks passed')
