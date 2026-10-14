import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  resolveChannelLocation,
  resolveChannels,
  type ChannelContentItem,
} from '../../stores/helpers/channelContent'
import { navigationSubtabs, navigationTabs } from '../channelTabGroups'
import { tabRouteTarget } from '../tabNavigation'

const items: ChannelContentItem[] = [
  {
    contentType: 'channel',
    channelKey: 'arcade',
    label: 'Arcade',
    route: '/play/arcade',
    defaultTab: 'arcade',
  },
  {
    contentType: 'tab',
    channelKey: 'arcade',
    tabKey: 'arcade',
    label: 'Arcade',
    route: '/play/arcade',
  },
  {
    contentType: 'tab',
    channelKey: 'arcade',
    tabKey: 'aquarium',
    label: 'Cthulhuquarium',
    route: '/play/aquarium',
  },
  {
    contentType: 'channel',
    channelKey: 'zuzu',
    label: 'Zuzu',
    route: '/play/zuzu-gamebook',
  },
  {
    contentType: 'tab',
    channelKey: 'zuzu',
    tabKey: 'zuzu-showdown',
    label: 'Zuzu Showdown',
    route: '/play/zuzu-showdown',
  },
]

const channels = resolveChannels(items)
const arcade = channels.find((channel) => channel.channelKey === 'arcade')
assert.ok(arcade, 'the arcade channel resolves')

assert.deepEqual(
  navigationTabs(arcade).map((tab) => tab.tabKey),
  ['arcade', 'aquarium'],
  'existing standalone pages stay registered without auto-generated game tabs',
)
assert.equal(
  navigationSubtabs(arcade, 'arcade').length,
  0,
  'individual cabinets are chosen inside the arcade rather than in a nav submenu',
)
assert.deepEqual(
  tabRouteTarget(
    arcade,
    arcade.tabs.find((tab) => tab.tabKey === 'arcade')!,
  ),
  { path: '/play/arcade' },
  'the Arcade destination opens the cabinet hall without a game query',
)
assert.equal(
  resolveChannelLocation(channels, { path: '/play/arcade' })?.tab?.tabKey,
  'arcade',
)
assert.equal(
  resolveChannelLocation(channels, { path: '/play/zuzu-showdown' })?.channel
    .channelKey,
  'zuzu',
)

const store = readFileSync('stores/channelContentStore.ts', 'utf8')
assert.doesNotMatch(
  store,
  /arcadeGameTabItems/,
  'the channel store must not recreate game subtabs',
)

const picker = readFileSync('components/navigation/channel-select.vue', 'utf8')
assert.match(
  picker,
  /v-if="channel.channelKey === 'arcade'"[\s\S]*?@click="selectChannel\(channel\)"/,
  'the unified mobile picker shows one Arcade destination instead of a game list',
)
assert.match(
  picker,
  /v-if="channel.channelKey !== 'arcade' && channel.tabs.length > 1"/,
  'the desktop picker hides the Arcade flyout toggle',
)
assert.match(
  picker,
  /function destinationTab\(channel: ResolvedChannel\)[\s\S]*?if \(channel.channelKey === 'arcade'\) \{[\s\S]*?tab.tabKey === 'arcade'/,
  'the Arcade channel always opens its hall, even if an older tab was remembered',
)
assert.match(
  picker,
  /if \(channel.channelKey === 'arcade' \|\| channel.tabs.length <= 1\)/,
  'hover must not open an Arcade flyout',
)

const header = readFileSync(
  'components/navigation/workspace-header.vue',
  'utf8',
)
assert.match(
  header,
  /resolvedChannel.channelKey !== 'arcade'/,
  'Arcade must not display the secondary tab picker',
)

const page = readFileSync('pages/play/arcade/index.vue', 'utf8')
assert.match(
  page,
  /<ArcadeCabinet :key="meta\.slug"/,
  'cabinet switching still remounts the game inside the arcade hall',
)

console.log(
  'Arcade direct navigation verified; cabinet pages and standalone routes remain available.',
)
