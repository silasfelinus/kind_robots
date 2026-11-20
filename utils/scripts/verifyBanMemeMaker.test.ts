import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parse as parseYaml } from 'yaml'
import {
  filterChannelsByRole,
  resolveChannels,
} from '../../stores/helpers/channelContent'
import { evaluateNavigationRouteAccess } from '../../stores/helpers/navigationRouteAccess'
import { FRONT_DOOR_ALIASES } from '../routing/frontDoorAliases'

const page = readFileSync('pages/ban-meme.vue', 'utf8')
const tab = readFileSync('content/channels/admin/retired/ban-meme.md', 'utf8')
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
assert.match(page, /walking past the dog twenty times without petting him/)
assert.match(page, /spending the last 36 hours in-game scrolling on your phone/)
assert.match(page, /not tipping the barista/)
assert.doesNotMatch(page, /robots: 'noindex'/)
assert.match(page, /gameLinkPreviewMeta\('ban-meme'/)
assert.match(page, /shareableUrl\('\/ban-meme'\)/)
assert.match(page, /This ban is permanent and is not eligible for appeal\./)
assert.match(page, /context\.drawImage\(baseImage/)
assert.match(page, /canvas\.toBlob\(resolve, 'image\/png'\)/)
assert.match(page, /image\.src = '\/ban-meme\/base\.avif'/)
assert.match(tab, /route: \/ban-meme\n/)
assert.match(tab, /channelKey: admin/)
assert.match(tab, /tabKey: ban-meme/)
assert.match(tab, /parentTabKey: retired/)
assert.match(tab, /allowDirectAccess: true/)
assert.doesNotMatch(tab, /requiredRole: ADMIN/)
assert.match(tab, /tutorial:/)
assert.match(tab, /This ban is permanent and is not eligible for appeal\./)
assert.doesNotMatch(featured, /title: 'Account Banned Meme Lab'/)
assert.match(preview, /'ban-meme': \{/)
assert.equal(FRONT_DOOR_ALIASES['/play/ban-meme']?.redirect.to, '/ban-meme')

const frontmatter = tab.match(/^---\n([\s\S]*?)\n---/)?.[1]
assert.ok(frontmatter, 'retired tab must contain valid frontmatter')
const metadata = parseYaml(frontmatter) as {
  route: string
  allowDirectAccess: boolean
  requiredRole?: string
  requiredPermission?: string
}
const channels = resolveChannels([
  {
    contentType: 'channel',
    channelKey: 'admin',
    label: 'Admin',
    route: '/artjob',
    requiredRole: 'ADMIN',
  },
  {
    contentType: 'tab',
    channelKey: 'admin',
    tabKey: 'ban-meme',
    label: 'Banned!',
    route: metadata.route,
    allowDirectAccess: metadata.allowDirectAccess,
    requiredRole: metadata.requiredRole,
    requiredPermission: metadata.requiredPermission,
  },
  {
    contentType: 'tab',
    channelKey: 'admin',
    tabKey: 'restricted',
    label: 'Restricted',
    route: '/admin/restricted',
    allowDirectAccess: true,
    requiredRole: 'ADMIN',
  },
])
const guestChannels = filterChannelsByRole(channels, 'GUEST')
assert.equal(guestChannels.length, 0, 'Admin navigation must remain private')

const publicPage = evaluateNavigationRouteAccess(channels, guestChannels, {
  path: '/ban-meme',
})
assert.equal(publicPage.matched, true)
assert.equal(publicPage.allowed, true, 'Retired link must remain public')

const privatePage = evaluateNavigationRouteAccess(channels, guestChannels, {
  path: '/admin/restricted',
})
assert.equal(privatePage.matched, true)
assert.equal(
  privatePage.allowed,
  false,
  'Explicit ADMIN restrictions must never be bypassed by direct-link access',
)

console.log(
  'Account Banned meme maker: retired navigation, public direct link, old-route redirect, and export verified',
)
