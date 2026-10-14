import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { ZUZU_PROJECTS, isZuzuProjectSlug } from '../zuzuWorld'

const read = (relative: string): string =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')

assert.equal(ZUZU_PROJECTS.length, 8)
assert.equal(new Set(ZUZU_PROJECTS.map((entry) => entry.slug)).size, 8)
for (const slug of [
  'comic-creator',
  'music-video',
  'comic-film',
  'zuzu-lair',
  'zuzu-gamebook',
  'zuzu-shifting-lands',
  'zuzu-showdown',
  'kr-arcade',
]) {
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

assert.match(listing, /usages/)
assert.match(listing, /repoExportsByArtImage/)

const assign = read('../../server/api/worlds/zuzu/assign.post.ts')
assert.match(assign, /requireAdminApiUser\(event\)/)
assert.match(assign, /buildArtImageWhere\(access\)/)
assert.match(assign, /runZuzuAssignment\(/)
assert.match(assign, /\(\) => readBody\(event\)/)
assert.doesNotMatch(assign, /artImage\.delete/)
assert.doesNotMatch(assign, /artImage\.create/)

const usage = read('../../server/utils/zuzuProjectUsage.ts')
assert.match(usage, /isZuzuProjectSlug/)
assert.match(usage, /parseZuzuUsage/)
assert.match(usage, /projectArtImage\.createMany\(/)
assert.match(usage, /skipDuplicates:\s*true/)
assert.match(usage, /projectArtImage\.updateMany\(/)
assert.match(usage, /projectArtImage\.deleteMany\(/)
assert.doesNotMatch(usage, /artImage\.delete/)
assert.doesNotMatch(usage, /artImage\.create/)

const repoMedia = read('../../server/api/worlds/zuzu/repo-media.get.ts')
assert.match(repoMedia, /requireAdminApiUser\(event\)/)
assert.match(repoMedia, /getArtImageAccessContext\(event\)/)
assert.match(repoMedia, /buildArtImageWhere\(access\)/)
assert.match(repoMedia, /zuzuRepoMediaIndex\(\)/)
assert.doesNotMatch(repoMedia, /\.create\(|\.createMany\(|\.update\(|\.delete/)

const migration = read(
  '../../prisma/migrations/20261014090000_project_art_image_production_role/migration.sql',
)
assert.match(migration, /ALTER TABLE `ProjectArtImage` ADD COLUMN/)
assert.doesNotMatch(migration, /DROP|RENAME|NOT NULL/)

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
assert.match(page, /ZUZU_USAGE_ROLES/)
assert.match(page, /usageDraft\.role/)
assert.match(page, /usageDraft\.slot/)
assert.match(page, /usageDraft\.pinnedVersion/)
assert.match(page, /studio\.unlinkUsage/)
assert.match(page, /Repository media \(git\)/)
assert.match(page, /studio\.openArtImage/)
assert.match(page, /studio\.openRepoMedia/)

const store = read('../../stores/zuzuWorldStore.ts')
assert.match(store, /\/api\/worlds\/zuzu\/assign/)
assert.match(store, /\/api\/worlds\/zuzu\/request/)
assert.match(store, /\/api\/worlds\/zuzu\/repo-media/)
assert.doesNotMatch(store, /zuzuRepoMedia'/)
const request = read('../../server/api/worlds/zuzu/request.post.ts')
assert.match(request, /requireAdminApiUser\(event\)/)
assert.match(request, /category: 'AGENT'/)
assert.match(request, /buildArtImageWhere\(access\)/)
assert.doesNotMatch(request, /conductorPut|github/)
console.log('Zuzu World Studio contract passed')
