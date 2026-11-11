import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parse as parseYaml } from 'yaml'
import {
  filterChannelsByRole,
  resolveChannels,
  type ChannelContentItem,
} from '../../stores/helpers/channelContent'
import { navigationDestinations } from '../../utils/channelTabGroups'
import { evaluateNavigationRouteAccess } from '../../stores/helpers/navigationRouteAccess'
import { effectiveShowMature } from '../../utils/userRoles'
import {
  filterChannelsByPermission,
  navigationPermissions,
  permissionAllows,
  type NavigationAccessContext,
} from '../../stores/helpers/navigationAccess'

function read(path: string): string {
  return readFileSync(new URL('../../' + path, import.meta.url), 'utf8')
}

function context(
  showMature: boolean,
  isAdmin: boolean,
): NavigationAccessContext {
  return {
    role: isAdmin ? 'ADMIN' : 'USER',
    roles: isAdmin ? ['ADMIN'] : ['USER'],
    isAdmin,
    permissions: navigationPermissions({
      isLoggedIn: true,
      isMember: false,
      isFamily: false,
      showMature,
      isAdmin,
    }),
  }
}

assert.equal(permissionAllows('mature', context(false, true)), false)
assert.equal(permissionAllows('mature', context(true, true)), true)
assert.equal(permissionAllows('mature', context(true, false)), true)
assert.equal(permissionAllows('admin', context(false, true)), true)
assert.equal(permissionAllows('admin', context(true, false)), false)

const api = read('server/api/monstress-convention/access.get.ts')
assert.match(api, /requireAdminApiUser\(event\)/)
assert.match(api, /viewerShowsMature\(auth\.user\)/)
assert.match(api, /Cache-Control', 'private, no-store'/)

const page = read('pages/admin/monstrique.vue')
assert.match(page, /caseStore\.authorized && user\.isAdmin && user\.showMature/)
assert.match(page, /v-if="!mayPlay"/)
assert.match(page, /<PlaybookKitShell[\s\S]*v-else/)
assert.match(page, /<MonstrexxFront/)
assert.match(page, /monstrexxKitId\(user\.user\?\.id \?\? 0\)/)
for (const legacy of [
  'pages/admin/monstress-convention.vue',
  'pages/admin/monstrexx.vue',
])
  assert.match(read(legacy), /navigateTo\('\/admin\/monstrique'/)
const tab = read('content/channels/admin/monstress-convention.md')
const launcher = read('components/navigation/channel-select.vue')
const matureToggle = read('components/navigation/maturity-toggle.vue')
assert.match(tab, /requiredRole: ADMIN/)
assert.match(tab, /requiredPermission: mature/)
assert.doesNotMatch(tab, /route: \/play\//)
assert.match(tab, /route: \/admin\/monstrique/)
assert.equal(
  (launcher.match(/<MaturityToggle\b/g) ?? []).length,
  2,
  'adult consent is reachable in both desktop and phone Admin launcher',
)
assert.match(
  launcher,
  /previewedChannel\.channelKey === 'admin'\s*&&\s*showMatureAdminOptIn/,
)
assert.match(
  launcher,
  /channel\.channelKey === 'admin' && showMatureAdminOptIn/,
)
assert.match(launcher, /!userStore\.isMaturityRestricted/)
assert.match(launcher, /!userStore\.showMature/)
assert.match(launcher, /Mature studios are hidden/)
assert.doesNotMatch(
  launcher,
  /Monstrique|monstress-convention/,
  'a mature-off Admin should see a generic opt-in, not the name of a restricted game',
)
assert.match(
  matureToggle,
  /accountStore\.updateConsent\(\{ showMature: value \}\)/,
)

function frontmatter(markdown: string): ChannelContentItem {
  return parseYaml(markdown.split('---')[1] ?? '') as ChannelContentItem
}

const adminChannel = frontmatter(read('content/channels/admin/index.md'))
const monstriqueTab = frontmatter(tab)
assert.equal(monstriqueTab.navigation, true)
assert.ok(
  Number(monstriqueTab.sort) < 30,
  'Monstrique belongs near the top of the Admin launcher',
)
const actualChannels = resolveChannels([adminChannel, monstriqueTab])

function visibleFor(viewer: NavigationAccessContext) {
  return filterChannelsByPermission(
    filterChannelsByRole(actualChannels, viewer.roles ?? [viewer.role]),
    viewer,
  )
}

const adultAdmin = visibleFor(context(true, true))
const matureOffAdmin = visibleFor(context(false, true))
const adultNonAdmin = visibleFor(context(true, false))
const childAdmin = {
  Role: 'ADMIN',
  roles: ['ADMIN', 'CHILD'],
  showMature: true,
}
assert.equal(effectiveShowMature(childAdmin), false)
const childAdminContext: NavigationAccessContext = {
  ...context(effectiveShowMature(childAdmin), true),
  roles: childAdmin.roles,
}
const childAdminVisible = visibleFor(childAdminContext)

assert.equal(
  navigationDestinations(adultAdmin[0]!).some(
    (entry) =>
      entry.label === 'Monstrique Studio' &&
      entry.route === '/admin/monstrique',
  ),
  true,
  'the Admin launcher must expose a clickable Monstrique destination',
)
for (const filtered of [matureOffAdmin, adultNonAdmin, childAdminVisible]) {
  assert.equal(
    filtered.some((channel) =>
      channel.tabs.some((entry) => entry.route === '/admin/monstrique'),
    ),
    false,
    'Monstrique must not appear to mature-off, non-admin or CHILD viewers',
  )
}
assert.equal(
  evaluateNavigationRouteAccess(actualChannels, adultAdmin, {
    path: '/admin/monstrique',
  }).allowed,
  true,
)
for (const filtered of [matureOffAdmin, adultNonAdmin, childAdminVisible]) {
  const result = evaluateNavigationRouteAccess(actualChannels, filtered, {
    path: '/admin/monstrique',
  })
  assert.equal(result.matched, true)
  assert.equal(result.allowed, false)
}

const project = read('server/utils/conductorMatureProjects.ts')
assert.match(project, /monstress-convention/)
assert.match(project, /viewerShowsMature && \(isPublic \|\| isAdmin\)/)

console.log(
  'Monstress preview access: mature child/admin precedence and route guards passed',
)
