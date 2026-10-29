import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
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
console.log('game link preview checks passed')
