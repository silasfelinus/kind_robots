import assert from 'node:assert/strict'
import {
  filterChannelsByRole,
  resolveChannelLocation,
  resolveChannels,
  type ChannelContentItem,
} from '@/stores/helpers/channelContent'
import {
  filterChannelsByPermission,
  navigationPermissions,
} from '@/stores/helpers/navigationAccess'

const items: ChannelContentItem[] = [
  {
    contentType: 'channel',
    channelKey: 'build',
    dashboardKey: 'builder',
    label: 'Build',
    title: 'Build Workshop',
    description: 'Create reusable things.',
    icon: 'kind-icon:blueprint',
    route: '/builder',
    defaultTab: 'character',
    sort: 20,
    dottitip: 'Legacy Dotti line.',
    amiTip: 'Parent Ami line.',
  },
  {
    contentType: 'tab',
    channelKey: 'build',
    tabKey: 'character',
    dashboardKey: 'builder',
    dashboardTab: 'character',
    label: 'Characters',
    route: '/builder',
    sort: 10,
  },
  {
    contentType: 'tab',
    channelKey: 'build',
    tabKey: 'art',
    dashboardKey: 'builder',
    dashboardTab: 'art',
    label: 'Art',
    route: '/builder',
    sort: 20,
    amiTip: 'Tab Ami line.',
    requiredPermission: 'member',
  },
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
    contentType: 'channel',
    channelKey: 'admin',
    label: 'Admin',
    route: '/admin',
    defaultTab: 'queue',
    sort: 30,
    requiredRole: 'ADMIN',
  },
  {
    contentType: 'tab',
    channelKey: 'admin',
    tabKey: 'queue',
    label: 'Queue',
    route: '/admin',
    sort: 10,
    requiredRole: 'ADMIN',
  },
]

const channels = resolveChannels(items)

assert.deepEqual(
  channels.map((channel) => channel.channelKey),
  ['home', 'build', 'admin'],
  'channels should sort by numeric sort order',
)

const build = channels.find((channel) => channel.channelKey === 'build')
assert.ok(build, 'build channel should resolve')
assert.equal(build.defaultTab, 'character')
assert.equal(build.tabs.length, 2)

const character = build.tabs.find((tab) => tab.tabKey === 'character')
const art = build.tabs.find((tab) => tab.tabKey === 'art')
assert.ok(character, 'character tab should resolve')
assert.ok(art, 'art tab should resolve')

assert.equal(
  character.description,
  build.description,
  'tab should inherit channel description',
)
assert.equal(character.icon, build.icon, 'tab should inherit channel icon')
assert.equal(
  character.dottiTip,
  'Legacy Dotti line.',
  'legacy lowercase dottitip should remain supported',
)
assert.equal(
  character.amiTip,
  'Parent Ami line.',
  'tab should inherit parent Ami dialogue',
)
assert.equal(art.amiTip, 'Tab Ami line.', 'tab Ami dialogue should override parent')
assert.equal(
  character.image,
  '/images/dashboard-tabs/builder/character.webp',
  'legacy dashboard metadata should provide the transitional image fallback',
)

const explicitArt = resolveChannelLocation(channels, {
  channelKey: 'build',
  tabKey: 'art',
  path: '/builder',
})
assert.equal(explicitArt?.channel.channelKey, 'build')
assert.equal(explicitArt?.tab?.tabKey, 'art')

const legacyCharacter = resolveChannelLocation(channels, {
  dashboardKey: 'builder',
  dashboardTab: 'character',
  path: '/builder',
})
assert.equal(legacyCharacter?.channel.channelKey, 'build')
assert.equal(legacyCharacter?.tab?.tabKey, 'character')

const sharedRouteDefault = resolveChannelLocation(channels, {
  channelKey: 'build',
  path: '/builder',
})
assert.equal(
  sharedRouteDefault?.tab?.tabKey,
  'character',
  'shared route without an explicit tab should use the channel default',
)

const userChannels = filterChannelsByRole(channels, 'USER')
assert.deepEqual(
  userChannels.map((channel) => channel.channelKey),
  ['home', 'build'],
  'non-admin users should not receive the Admin channel',
)

const guestAccess = {
  role: 'USER',
  permissions: navigationPermissions({
    isLoggedIn: false,
    isMember: false,
    isFamily: false,
    showMature: false,
    isAdmin: false,
  }),
  isAdmin: false,
}
const guestChannels = filterChannelsByPermission(userChannels, guestAccess)
assert.deepEqual(
  guestChannels
    .find((channel) => channel.channelKey === 'build')
    ?.tabs.map((tab) => tab.tabKey),
  ['character'],
  'guests should not receive member-gated tabs',
)

const memberAccess = {
  role: 'USER',
  permissions: navigationPermissions({
    isLoggedIn: true,
    isMember: true,
    isFamily: false,
    showMature: false,
    isAdmin: false,
  }),
  isAdmin: false,
}
const memberChannels = filterChannelsByPermission(userChannels, memberAccess)
assert.deepEqual(
  memberChannels
    .find((channel) => channel.channelKey === 'build')
    ?.tabs.map((tab) => tab.tabKey),
  ['character', 'art'],
  'members should receive member-gated tabs',
)

const adminChannels = filterChannelsByRole(channels, 'ADMIN')
assert.deepEqual(
  adminChannels.map((channel) => channel.channelKey),
  ['home', 'build', 'admin'],
  'administrators should receive all role-gated channels',
)
const adminAccess = {
  role: 'ADMIN',
  permissions: navigationPermissions({
    isLoggedIn: true,
    isMember: false,
    isFamily: false,
    showMature: false,
    isAdmin: true,
  }),
  isAdmin: true,
}
assert.deepEqual(
  filterChannelsByPermission(adminChannels, adminAccess)
    .find((channel) => channel.channelKey === 'build')
    ?.tabs.map((tab) => tab.tabKey),
  ['character', 'art'],
  'administrators should bypass capability gates',
)

console.log(
  `Channel resolver contract passed: ${channels.length} channels, ${build.tabs.length} shared-route Build tabs, dialogue inheritance, role filtering, and capability gates verified.`,
)
