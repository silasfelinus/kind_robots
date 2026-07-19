import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  filterChannelsByRole,
  resolveChannels,
  type ChannelContentItem,
} from '@/stores/helpers/channelContent'
import { evaluateNavigationRouteAccess } from '@/stores/helpers/navigationRouteAccess'

const publicTabs = [
  {
    path: 'content/channels/lab/museum.md',
    tabKey: 'museum',
    route: '/wonderlab',
  },
  {
    path: 'content/channels/lab/experiments.md',
    tabKey: 'experiments',
    route: '/memory',
  },
  {
    path: 'content/channels/lab/screen-fx.md',
    tabKey: 'screen-fx',
    route: '/screenfx',
  },
]

for (const tab of publicTabs) {
  const source = await readFile(tab.path, 'utf8')
  assert.match(source, /^requiredRole:\s*GUEST$/m, `${tab.route} must be public`)
}

const items: ChannelContentItem[] = [
  {
    contentType: 'channel',
    channelKey: 'lab',
    label: 'Lab',
    route: '/memory',
    defaultTab: 'experiments',
    requiredRole: 'ADMIN',
  },
  ...publicTabs.map((tab) => ({
    contentType: 'tab' as const,
    channelKey: 'lab',
    tabKey: tab.tabKey,
    label: tab.tabKey,
    route: tab.route,
    requiredRole: 'GUEST',
  })),
  {
    contentType: 'tab',
    channelKey: 'lab',
    tabKey: 'private-tools',
    label: 'Private tools',
    route: '/private-tools',
    requiredRole: 'ADMIN',
  },
]

const channels = resolveChannels(items)
const guestChannels = filterChannelsByRole(channels, 'GUEST')
const adminChannels = filterChannelsByRole(channels, 'ADMIN')

assert.equal(
  guestChannels.some((channel) => channel.channelKey === 'lab'),
  false,
  'The restricted Lab channel should remain absent from guest navigation.',
)

for (const tab of publicTabs) {
  const access = evaluateNavigationRouteAccess(channels, guestChannels, {
    path: tab.route,
  })
  assert.equal(access.matched, true, `${tab.route} must resolve in navigation`)
  assert.equal(access.allowed, true, `${tab.route} must allow direct guest access`)
  assert.equal(access.requiredRole, 'GUEST')
}

const privateAccess = evaluateNavigationRouteAccess(channels, guestChannels, {
  path: '/private-tools',
})
assert.equal(privateAccess.matched, true)
assert.equal(privateAccess.allowed, false)
assert.equal(privateAccess.requiredRole, 'ADMIN')

for (const route of [...publicTabs.map((tab) => tab.route), '/private-tools']) {
  assert.equal(
    evaluateNavigationRouteAccess(channels, adminChannels, { path: route }).allowed,
    true,
    `Administrators must retain access to ${route}`,
  )
}

console.log(
  'WonderLab public navigation verified: public Lab tabs allow direct guests while private Lab tools remain restricted.',
)
