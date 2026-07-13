import assert from 'node:assert/strict'
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
    channelKey: 'build',
    label: 'Build',
    route: '/builder',
    defaultTab: 'character',
    sort: 20,
  },
  {
    contentType: 'tab',
    channelKey: 'build',
    tabKey: 'character',
    label: 'Character',
    route: '/builder',
    sort: 10,
  },
  {
    contentType: 'tab',
    channelKey: 'build',
    tabKey: 'advanced',
    label: 'Advanced',
    route: '/builder',
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

const guestAdvanced = evaluateNavigationRouteAccess(channels, guestChannels, {
  path: '/builder',
  tabKey: 'advanced',
})
assert.equal(guestAdvanced.allowed, false)
assert.equal(guestAdvanced.requiredPermission, 'member')

const userAdvanced = evaluateNavigationRouteAccess(channels, userChannels, {
  path: '/builder',
  tabKey: 'advanced',
})
assert.equal(userAdvanced.allowed, false)

const memberAdvanced = evaluateNavigationRouteAccess(
  channels,
  memberChannels,
  { path: '/builder', tabKey: 'advanced' },
)
assert.equal(memberAdvanced.allowed, true)

const userAdmin = evaluateNavigationRouteAccess(channels, userChannels, {
  path: '/navigation-health',
})
assert.equal(userAdmin.allowed, false)
assert.equal(userAdmin.requiredRole, 'ADMIN')

const adminAdmin = evaluateNavigationRouteAccess(channels, adminChannels, {
  path: '/navigation-health',
})
assert.equal(adminAdmin.allowed, true)

console.log(
  'Navigation route access contract passed: unrelated, public, authenticated, member, shared-route, and admin destinations verified.',
)
