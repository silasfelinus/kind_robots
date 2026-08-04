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
    channelKey: 'play',
    dashboardKey: 'art',
    label: 'Play',
    title: 'Creative Worlds',
    description: 'Create, browse, remix, and interact.',
    icon: 'kind-icon:dice',
    route: '/art',
    defaultTab: 'gallery',
    sort: 20,
    dottitip: 'Legacy Dotti line.',
    amiTip: 'Parent Ami line.',
  },
  {
    contentType: 'tab',
    channelKey: 'play',
    tabKey: 'gallery',
    dashboardKey: 'art',
    dashboardTab: 'gallery',
    label: 'Gallery',
    route: '/art',
    sort: 10,
  },
  {
    contentType: 'tab',
    channelKey: 'play',
    tabKey: 'generate',
    dashboardKey: 'art',
    dashboardTab: 'generate',
    label: 'Generate',
    route: '/art',
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
  ['home', 'play', 'admin'],
  'channels should sort by numeric sort order',
)

const play = channels.find((channel) => channel.channelKey === 'play')
assert.ok(play, 'play channel should resolve')
assert.equal(play.defaultTab, 'gallery')
assert.equal(play.tabs.length, 2)

const gallery = play.tabs.find((tab) => tab.tabKey === 'gallery')
const generate = play.tabs.find((tab) => tab.tabKey === 'generate')
assert.ok(gallery, 'gallery tab should resolve')
assert.ok(generate, 'generate tab should resolve')

assert.equal(
  gallery.description,
  play.description,
  'tab should inherit channel description',
)
assert.equal(gallery.icon, play.icon, 'tab should inherit channel icon')
assert.equal(
  gallery.dottiTip,
  'Legacy Dotti line.',
  'legacy lowercase dottitip should remain supported',
)
assert.equal(
  gallery.amiTip,
  'Parent Ami line.',
  'tab should inherit parent Ami dialogue',
)
assert.equal(generate.amiTip, 'Tab Ami line.', 'tab Ami dialogue should override parent')
assert.equal(
  gallery.image,
  '/images/dashboard-tabs/art/gallery.webp',
  'legacy dashboard metadata should provide the transitional image fallback',
)

const explicitGenerate = resolveChannelLocation(channels, {
  channelKey: 'play',
  tabKey: 'generate',
  path: '/art',
})
assert.equal(explicitGenerate?.channel.channelKey, 'play')
assert.equal(explicitGenerate?.tab?.tabKey, 'generate')

const legacyGallery = resolveChannelLocation(channels, {
  dashboardKey: 'art',
  dashboardTab: 'gallery',
  path: '/art',
})
assert.equal(legacyGallery?.channel.channelKey, 'play')
assert.equal(legacyGallery?.tab?.tabKey, 'gallery')

const sharedRouteDefault = resolveChannelLocation(channels, {
  channelKey: 'play',
  path: '/art',
})
assert.equal(
  sharedRouteDefault?.tab?.tabKey,
  'gallery',
  'shared route without an explicit tab should use the channel default',
)

const userChannels = filterChannelsByRole(channels, 'USER')
assert.deepEqual(
  userChannels.map((channel) => channel.channelKey),
  ['home', 'play'],
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
    .find((channel) => channel.channelKey === 'play')
    ?.tabs.map((tab) => tab.tabKey),
  ['gallery'],
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
    .find((channel) => channel.channelKey === 'play')
    ?.tabs.map((tab) => tab.tabKey),
  ['gallery', 'generate'],
  'members should receive member-gated tabs',
)

const adminChannels = filterChannelsByRole(channels, 'ADMIN')
assert.deepEqual(
  adminChannels.map((channel) => channel.channelKey),
  ['home', 'play', 'admin'],
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
    .find((channel) => channel.channelKey === 'play')
    ?.tabs.map((tab) => tab.tabKey),
  ['gallery', 'generate'],
  'administrators should bypass capability gates',
)

console.log(
  `Channel resolver contract passed: ${channels.length} channels, ${play.tabs.length} shared-route Play tabs, dialogue inheritance, role filtering, and capability gates verified.`,
)
