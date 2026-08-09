import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  filterChannelsByRole,
  resolveChannels,
  type ChannelContentItem,
} from '@/stores/helpers/channelContent'
import { evaluateNavigationRouteAccess } from '@/stores/helpers/navigationRouteAccess'

// The Lab channel was dissolved in the "forever nav" restructure. The three
// public WonderLab surfaces moved into public channels (Museum → Plan,
// Memory/Screen FX → Play) but must stay directly reachable by guests, while
// admin-only tools that now share those channels stay restricted.
const publicTabs = [
  {
    path: 'content/channels/plan/museum.md',
    channelKey: 'plan',
    tabKey: 'museum',
    route: '/plan/wonderlab',
  },
  {
    path: 'content/channels/play/experiments.md',
    channelKey: 'play',
    tabKey: 'experiments',
    route: '/play/memory',
  },
  {
    path: 'content/channels/play/screen-fx.md',
    channelKey: 'play',
    tabKey: 'screen-fx',
    route: '/play/screenfx',
  },
]

for (const tab of publicTabs) {
  const source = await readFile(tab.path, 'utf8')
  assert.match(source, /^requiredRole:\s*GUEST$/m, `${tab.route} must be public`)
}

const memoryTabSource = await readFile(
  'content/channels/play/experiments.md',
  'utf8',
)
assert.match(
  memoryTabSource,
  /^label:\s*Memory Dungeon$/m,
  'Memory Dungeon must be named explicitly in Play navigation',
)
assert.match(
  memoryTabSource,
  /^sort:\s*55$/m,
  'Memory Dungeon must stay promoted among the primary Play destinations',
)

const legacyRoutes = [
  { from: '/memory', to: '/play/memory' },
  { from: '/wonderlab', to: '/plan/wonderlab' },
] as const

const nuxtConfig = await readFile('nuxt.config.ts', 'utf8')
for (const { from, to } of legacyRoutes) {
  const rule = `'${from}': { redirect: { to: '${to}', statusCode: 301 } }`
  assert.ok(
    nuxtConfig.includes(rule),
    `${from} must permanently redirect to ${to}`,
  )
}
assert.ok(
  !nuxtConfig.includes("'/wonder': { redirect:"),
  '/wonder must not be retained as a Memory Dungeon compatibility alias',
)

const items: ChannelContentItem[] = [
  {
    contentType: 'channel',
    channelKey: 'play',
    label: 'Play',
    route: '/dreams',
    defaultTab: 'experiments',
  },
  {
    contentType: 'channel',
    channelKey: 'plan',
    label: 'Plan',
    route: '/conductor',
    defaultTab: 'projects',
  },
  ...publicTabs.map((tab) => ({
    contentType: 'tab' as const,
    channelKey: tab.channelKey,
    tabKey: tab.tabKey,
    label: tab.tabKey,
    route: tab.route,
    requiredRole: 'GUEST',
  })),
  {
    contentType: 'tab',
    channelKey: 'play',
    tabKey: 'davinci',
    label: 'Da Vinci',
    route: '/play/davinci',
    requiredRole: 'ADMIN',
  },
]

const channels = resolveChannels(items)
const guestChannels = filterChannelsByRole(channels, 'GUEST')
const adminChannels = filterChannelsByRole(channels, 'ADMIN')

for (const tab of publicTabs) {
  const access = evaluateNavigationRouteAccess(channels, guestChannels, {
    path: tab.route,
  })
  assert.equal(access.matched, true, `${tab.route} must resolve in navigation`)
  assert.equal(access.allowed, true, `${tab.route} must allow direct guest access`)
  assert.equal(access.requiredRole, 'GUEST')
}

const privateAccess = evaluateNavigationRouteAccess(channels, guestChannels, {
  path: '/play/davinci',
})
assert.equal(privateAccess.matched, true)
assert.equal(privateAccess.allowed, false)
assert.equal(privateAccess.requiredRole, 'ADMIN')

for (const route of [...publicTabs.map((tab) => tab.route), '/play/davinci']) {
  assert.equal(
    evaluateNavigationRouteAccess(channels, adminChannels, { path: route }).allowed,
    true,
    `Administrators must retain access to ${route}`,
  )
}

console.log(
  'WonderLab public navigation verified: Museum, Memory Dungeon, and Screen FX remain public; Memory Dungeon stays obvious in Play; /memory and /wonderlab retain only their intended compatibility redirects.',
)
