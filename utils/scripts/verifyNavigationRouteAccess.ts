import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  filterChannelsByRole,
  resolveChannels,
  type ChannelContentItem,
} from '@/stores/helpers/channelContent'
import {
  filterChannelsByPermission,
  navigationPermissions,
} from '@/stores/helpers/navigationAccess'
import { evaluateNavigationRouteAccess } from '@/stores/helpers/navigationRouteAccess'

const items: ChannelContentItem[] = [
  {
    contentType: 'channel',
    channelKey: 'home',
    label: 'Home',
    route: '/',
    defaultTab: 'dashboard',
    sort: 10,
  },
  {
    contentType: 'tab',
    channelKey: 'home',
    tabKey: 'dashboard',
    label: 'Dashboard',
    route: '/',
    sort: 10,
  },
  {
    contentType: 'tab',
    channelKey: 'home',
    tabKey: 'achievements',
    label: 'Achievements',
    route: '/achievements',
    sort: 20,
    requiredPermission: 'authenticated',
  },
  {
    contentType: 'channel',
    channelKey: 'play',
    label: 'Play',
    route: '/art',
    defaultTab: 'gallery',
    sort: 20,
  },
  {
    contentType: 'tab',
    channelKey: 'play',
    tabKey: 'gallery',
    label: 'Gallery',
    route: '/art',
    sort: 10,
  },
  {
    contentType: 'tab',
    channelKey: 'play',
    tabKey: 'generate',
    label: 'Generate',
    route: '/art',
    sort: 20,
    requiredPermission: 'member',
  },
  {
    contentType: 'channel',
    channelKey: 'admin',
    label: 'Admin',
    route: '/navigation-health',
    defaultTab: 'navigation-health',
    sort: 30,
    requiredRole: 'ADMIN',
  },
  {
    contentType: 'tab',
    channelKey: 'admin',
    tabKey: 'navigation-health',
    label: 'Navigation Health',
    route: '/navigation-health',
    sort: 10,
    requiredRole: 'ADMIN',
  },
]

const channels = resolveChannels(items)
const guestRoleChannels = filterChannelsByRole(channels, 'GUEST')
const guestChannels = filterChannelsByPermission(guestRoleChannels, {
  role: 'GUEST',
  permissions: navigationPermissions({
    isLoggedIn: false,
    isMember: false,
    isFamily: false,
    showMature: false,
    isAdmin: false,
  }),
  isAdmin: false,
})
const userRoleChannels = filterChannelsByRole(channels, 'USER')
const userChannels = filterChannelsByPermission(userRoleChannels, {
  role: 'USER',
  permissions: navigationPermissions({
    isLoggedIn: true,
    isMember: false,
    isFamily: false,
    showMature: false,
    isAdmin: false,
  }),
  isAdmin: false,
})
const memberChannels = filterChannelsByPermission(userRoleChannels, {
  role: 'USER',
  permissions: navigationPermissions({
    isLoggedIn: true,
    isMember: true,
    isFamily: false,
    showMature: false,
    isAdmin: false,
  }),
  isAdmin: false,
})
const adminRoleChannels = filterChannelsByRole(channels, 'ADMIN')
const adminChannels = filterChannelsByPermission(adminRoleChannels, {
  role: 'ADMIN',
  permissions: navigationPermissions({
    isLoggedIn: true,
    isMember: false,
    isFamily: false,
    showMature: false,
    isAdmin: true,
  }),
  isAdmin: true,
})

assert.deepEqual(
  evaluateNavigationRouteAccess(channels, guestChannels, {
    path: '/outside-navigation',
  }),
  {
    matched: false,
    allowed: true,
    requested: null,
    requiredRole: '',
    requiredPermission: '',
  },
  'unrelated routes should pass through untouched',
)

const publicHome = evaluateNavigationRouteAccess(channels, guestChannels, {
  path: '/',
})
assert.equal(publicHome.matched, true)
assert.equal(publicHome.allowed, true)

const guestAchievements = evaluateNavigationRouteAccess(
  channels,
  guestChannels,
  { path: '/achievements' },
)
assert.equal(guestAchievements.matched, true)
assert.equal(guestAchievements.allowed, false)
assert.equal(guestAchievements.requiredPermission, 'authenticated')

const userAchievements = evaluateNavigationRouteAccess(
  channels,
  userChannels,
  { path: '/achievements' },
)
assert.equal(userAchievements.allowed, true)

const guestGenerate = evaluateNavigationRouteAccess(channels, guestChannels, {
  path: '/art',
  tabKey: 'generate',
})
assert.equal(guestGenerate.allowed, false)
assert.equal(guestGenerate.requiredPermission, 'member')

const userGenerate = evaluateNavigationRouteAccess(channels, userChannels, {
  path: '/art',
  tabKey: 'generate',
})
assert.equal(userGenerate.allowed, false)

const memberGenerate = evaluateNavigationRouteAccess(
  channels,
  memberChannels,
  { path: '/art', tabKey: 'generate' },
)
assert.equal(memberGenerate.allowed, true)

const userAdmin = evaluateNavigationRouteAccess(channels, userChannels, {
  path: '/navigation-health',
})
assert.equal(userAdmin.allowed, false)
assert.equal(userAdmin.requiredRole, 'ADMIN')

const adminAdmin = evaluateNavigationRouteAccess(channels, adminChannels, {
  path: '/navigation-health',
})
assert.equal(adminAdmin.allowed, true)

const middlewareSource = readFileSync(
  'middleware/navigation-access.global.ts',
  'utf8',
)
assert.match(
  middlewareSource,
  /if \(nuxtApp\.isHydrating && nuxtApp\.payload\.serverRendered\) \{[\s\S]*?nuxtApp\.hook\('app:mounted',[\s\S]*?enforceNavigationAccess/,
  'Initial SSR client navigation must defer localStorage-backed access enforcement until app:mounted.',
)

const legacySessionSource = readFileSync(
  'plugins/legacy-guest-session.client.ts',
  'utf8',
)
const sessionMountedIndex = legacySessionSource.indexOf("hook('app:mounted'")
const sessionInitializeIndex = legacySessionSource.indexOf('userStore.initialize()')
assert.ok(
  sessionMountedIndex >= 0 &&
    sessionInitializeIndex >= 0 &&
    sessionMountedIndex < sessionInitializeIndex,
  'Saved-session restoration must not initialize the user store before app:mounted.',
)

const loaderSource = readFileSync('components/admin/kind-loader.vue', 'utf8')
assert.equal(
  loaderSource.includes('onBeforeMount('),
  false,
  'The startup loader must not mutate app/store state from onBeforeMount during hydration.',
)
assert.match(
  loaderSource,
  /onMounted\(\(\) => \{\s+void ensureStoresInitialized\(\)[\s\S]*?if \(startupMode\.value !== 'none'\) return[\s\S]*?emitReadyOnce\(\)/,
  'Store initialization and the reload-mode pageReady handoff must begin from onMounted.',
)

console.log(
  'Navigation route access contract passed: unrelated, public, authenticated, member, shared-route, admin, and hydration-safe startup behavior verified.',
)
