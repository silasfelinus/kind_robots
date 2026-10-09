import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { ZUZU_PROJECTS, isZuzuProjectSlug } from '../zuzuWorld'

const read = (relative: string): string =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')

assert.equal(ZUZU_PROJECTS.length, 7)
assert.equal(new Set(ZUZU_PROJECTS.map((entry) => entry.slug)).size, 7)
for (const slug of ['comic-creator', 'music-video', 'comic-film',
  'zuzu-lair', 'zuzu-gamebook', 'zuzu-showdown', 'kr-arcade']) {
  assert.equal(isZuzuProjectSlug(slug), true)
}
assert.equal(isZuzuProjectSlug('private-unrelated-project'), false)

const channel = read('../../content/channels/admin/zuzu-world.md')
assert.match(channel, /requiredRole: ADMIN/)
assert.match(channel, /route: \/admin\/worlds\/zuzu/)

const listing = read('../../server/api/worlds/zuzu/index.get.ts')
assert.match(listing, /requireAdminApiUser\(event\)/)
assert.match(listing, /buildArtImageWhere\(access\)/)
assert.match(listing, /galleryThumbnailUrl\(image\.id\)/)
assert.match(listing, /getArtImageAccessContext\(event\)/)
assert.match(listing, /sourceProject/)

const assign = read('../../server/api/worlds/zuzu/assign.post.ts')
assert.match(assign, /requireAdminApiUser\(event\)/)
assert.match(assign, /isZuzuProjectSlug/)
assert.match(assign, /buildArtImageWhere\(access\)/)
assert.match(assign, /projectArtImage\.createMany\(\{ data, skipDuplicates: true \}\)/)
assert.match(assign, /projectArtImage\.deleteMany/)
assert.doesNotMatch(assign, /artImage\.delete/)
assert.doesNotMatch(assign, /artImage\.create/)

const loader = read('../../server/utils/zuzuWorldLedger.ts')
assert.match(loader, /asset_inventory\?\.ledger_parts/)
assert.match(loader, /assets\/video-builds\.json/)
assert.match(loader, /Map<number, ZuzuLedgerAsset>/)

const page = read('../../pages/admin/worlds/zuzu.vue')
assert.match(page, /Use in another production/)
assert.match(page, /selectedItems/)
assert.match(page, /Request a visual change/)
assert.match(page, /studio\.assign/)
assert.match(page, /studio\.requestArtChange/)
assert.match(page, /No accessible artwork matches these filters/)

const store = read('../../stores/zuzuWorldStore.ts')
assert.match(store, /\/api\/worlds\/zuzu\/assign/)
assert.match(store, /\/api\/conductor\/pitch/)
const request = read('../../server/api/worlds/zuzu/request.post.ts')
assert.match(request, /requireAdminApiUser\\(event\\)/)
assert.match(request, /category: 'AGENT'/)
assert.match(request, /buildArtImageWhere\\(access\\)/)
assert.doesNotMatch(request, /conductorPut|github/)
console.log('Zuzu World Studio contract passed')
