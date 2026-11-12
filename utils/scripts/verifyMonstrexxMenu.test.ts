import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { newCase, monstrexxKitId } from '../monstressConvention/prologue'
import { MONSTRIQUE_ALBUMS } from '../monstrique/albumHistory'
// The achievement contract rides along with the title menu's contract run.
import './verifyMonstriqueAchievements.test'

function file(name: string): string {
  return readFileSync(new URL('../../' + name, import.meta.url), 'utf8')
}

const page = file('pages/admin/monstrique.vue')
const front = file('components/monstrexx/monstrexx-front.vue')
const store = file('stores/monstressConventionStore.ts')
const scene = file(
  'components/monstress-convention/monstress-convention-scene.vue',
)
const nav = file('content/channels/admin/monstress-convention.md')
const kit = file('utils/playbookKit/games/monstressConvention.ts')

assert.match(page, /v-if="!mayPlay"/)
assert.match(page, /caseStore\.authorized && user\.isAdmin && user\.showMature/)
assert.match(page, /@new="startNew"/)
assert.match(page, /@continue="resume"/)
assert.match(page, /caseStore\.begin\(\)/)
assert.match(page, /caseStore\.hasSavedCase/)
assert.match(page, /view\.value = 'game'/)
assert.match(page, /view\.value = 'home'/)

for (const action of ['new-game', 'continue', 'settings', 'scrapbook'])
  assert.match(front, new RegExp('data-testid="monstrexx-' + action + '"'))
assert.match(front, /:disabled="!story\.hasSavedCase"/)
assert.match(front, /Press again to replace this save/)
assert.match(front, /kit\.setSetting\(key,/)
assert.match(front, /<PlaybookKitCast/)
assert.match(front, /<PlaybookKitScrapbook/)
assert.match(front, /mx-sheet-scroll[^"]*min-h-0[^"]*overflow-y-auto/)
assert.match(front, /role="dialog"/)
assert.match(scene, /props\.entry === 'continue'/)
assert.match(scene, /emit\('menu'\)/)
assert.match(store, /hasSavedCase\.value = true/)
assert.match(store, /kr-monstress-case-v2-/)
assert.match(store, /kit\.open\(monstrexxKitId\(accountId\.value \?\? 0\)\)/)
assert.equal(monstrexxKitId(1), 'monstress-convention-user-1')
assert.notEqual(monstrexxKitId(1), monstrexxKitId(2))
assert.equal(newCase().actor, 'iris')
assert.equal(kit.includes("title: 'Monstrique'"), true)
assert.equal(kit.includes("route: '/admin/monstrique'"), true)
assert.match(front, /<h1 class="mx-wordmark">MONSTRIQUE<\/h1>/)
assert.doesNotMatch(front + scene + nav + kit, /MONSTREXX|Monstrexx/)
assert.match(scene, /data-testid="monstrique-use-held"/)
assert.match(scene, /data-testid="monstrique-graces"/)
assert.match(nav, /requiredRole: ADMIN/)
assert.match(nav, /requiredPermission: mature/)
assert.match(nav, /route: \/admin\/monstrique/)
assert.doesNotMatch(nav, /route: \/play\//)

console.log(
  'Monstrique menu: four controls, gated navigation, account-scoped saves and scrapbook/settings contracts passed',
)

const archive = file('components/monstrique/monstrique-album-archive.vue')
assert.equal(MONSTRIQUE_ALBUMS.length, 7)
assert.deepEqual(
  MONSTRIQUE_ALBUMS.map((album) => album.year),
  [1964, 1974, 1986, 1994, 2006, 2017, 2024],
)
assert.ok(
  MONSTRIQUE_ALBUMS.every(
    (album) => album.removed && album.replacement && album.clueFlag,
  ),
)
assert.match(front, /scrapTab === 'albums'/)
assert.match(front, /<MonstriqueAlbumArchive[\s\S]*v-else/)
assert.match(archive, /data-testid="monstrique-album-archive"/)
