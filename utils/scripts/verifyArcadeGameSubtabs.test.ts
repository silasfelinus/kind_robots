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
    label: 'Play',
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
    contentType: 'tab',
    channelKey: 'arcade',
    tabKey: 'experiments',
    label: 'Memory Dungeon',
    route: '/play/memory',
  },
  {
    contentType: 'tab',
    channelKey: 'arcade',
    tabKey: 'shifting-desks',
    label: 'Shifting Desks',
    route: '/play/shifting-desks',
  },
  {
    contentType: 'channel',
    channelKey: 'zuzu',
    label: 'Zuzu',
    route: '/play/zuzu',
    defaultTab: 'overview',
  },
  {
    contentType: 'tab',
    channelKey: 'zuzu',
    tabKey: 'overview',
    label: 'World Hub',
    route: '/play/zuzu',
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
  ['arcade', 'aquarium', 'experiments', 'shifting-desks'],
  'Play must expose the Arcade hall, Cthulhuquarium, Memory Dungeon and Shifting Desks tabs',
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

assert.equal(
  resolveChannelLocation(channels, { path: '/play/zuzu' })?.tab?.tabKey,
  'overview',
  'the Zuzu channel must resolve to its dedicated world hub',
)

const store = readFileSync('stores/channelContentStore.ts', 'utf8')
assert.doesNotMatch(
  store,
  /arcadeGameTabItems/,
  'the channel store must not recreate game subtabs',
)

const picker = readFileSync('components/navigation/channel-select.vue', 'utf8')
assert.doesNotMatch(
  picker,
  /v-if="channel.channelKey === 'arcade'"/,
  'the phone picker must not replace all Play tabs with one Arcade link',
)
assert.match(
  picker,
  /v-if="channel.tabs.length > 1"/,
  'the Play channel must expose its desktop flyout toggle',
)
assert.doesNotMatch(
  picker,
  /channel.channelKey === 'arcade' \|\| channel.tabs.length <= 1/,
  'hover must allow the Play flyout to open',
)
assert.match(
  picker,
  /<ChannelTabList[\s\S]*?:channel="channel"/,
  'mobile navigation must render all Play tabs',
)
const header = readFileSync(
  'components/navigation/workspace-header.vue',
  'utf8',
)
assert.doesNotMatch(
  header,
  /resolvedChannel.channelKey !== 'arcade'/,
  'Play must display the secondary tab picker',
)
assert.doesNotMatch(
  header,
  /to="\/play\/arcade"/,
  'the redundant standalone Arcade shortcut must be a Play tab instead',
)

const playChannel = readFileSync('content/channels/arcade/index.md', 'utf8')
assert.match(playChannel, /\nlabel: Play\n/)
for (const path of [
  'content/channels/arcade/arcade.md',
  'content/channels/arcade/aquarium.md',
  'content/channels/arcade/experiments.md',
  'content/channels/arcade/shifting-desks.md',
]) {
  assert.match(readFileSync(path, 'utf8'), /\nchannelKey: arcade\n/)
}
const hub = readFileSync('pages/play/zuzu.vue', 'utf8')
const hubTab = readFileSync('content/channels/zuzu/overview.md', 'utf8')
assert.match(hubTab, /\nroute: \/play\/zuzu\n/)
assert.match(hubTab, /\ntabKey: overview\n/)
for (const route of [
  '/play/zuzu-gamebook',
  '/play/zuzu-shifting-lands',
  '/play/zuzu-showdown',
  '/play/zuzu-ghost-trail',
  '/play/zuzu-pinball',
]) {
  assert.ok(hub.includes(`route: '${route}'`), 'Zuzu hub must link ' + route)
}
assert.doesNotMatch(hub, /\/admin\//, 'public hub must not reveal admin routes')

const page = readFileSync('pages/play/arcade/index.vue', 'utf8')
assert.match(
  page,
  /<ArcadeCabinet :key="meta\.slug"/,
  'cabinet switching still remounts the game inside the arcade hall',
)

assert.match(page, /class="kr-panes arcade-layout min-h-0 grid-cols-1 gap-2"/)
assert.match(page, /v-if="!slug" class="kr-panes min-h-0 grid-cols-1"/)
assert.doesNotMatch(page, /\bkr-scroll\b/, 'no mixed single/multi scroll owner')
assert.match(page, /class="kr-pane arcade-playfield min-w-0"/)
assert.match(
  page,
  /<ArcadeCabinet :key="meta\.slug" :slug="meta\.slug" contained \/>/,
)
assert.match(page, /id="arcade-cabinet-details"/)
assert.match(page, /aria-controls="arcade-cabinet-details"/)
assert.match(page, /:aria-expanded="showDetails"/)
assert.match(page, /watch\(slug, \(\) =>/)
assert.match(page, /'arcade-playfield--hidden': showDetails/)
assert.match(page, /'arcade-details--hidden': !showDetails/)
assert.match(page, /arcade-detail-section--inactive/)
assert.match(page, /detailTabs/)
assert.match(page, /detailTab\.value = 'scores'/)
assert.match(page, /<ArcadeReviews :game="meta\.slug" compact \/>/)
assert.match(page, /grid-template-rows: minmax\(0, 1fr\)/)
assert.match(
  page,
  /grid-template-columns: minmax\(0, 1fr\) minmax\(15rem, 19rem\)/,
)
assert.match(page, /\.arcade-playfield :deep\(\.arcade-cabinet--contained\)/)
assert.match(page, /@media \(max-width: 1023px\)/)
assert.match(page, /@media \(min-width: 1024px\)/)
assert.doesNotMatch(page, /class="flex flex-col gap-4 xl:flex-row"/)

const cabinet = readFileSync('components/arcade/arcade-cabinet.vue', 'utf8')
assert.match(cabinet, /contained\?: boolean/)
assert.match(cabinet, /fittedWidth\.value/)
assert.match(cabinet, /height - insets/)
assert.match(cabinet, /arcade-cabinet--contained/)
assert.match(cabinet, /\.cabinet-screen-wrap \{/)
const responsiveAudit = readFileSync(
  'utils/scripts/auditResponsiveLayout.mjs',
  'utf8',
)
assert.match(responsiveAudit, /\/play\/arcade\?game=battery-maze/)
assert.match(responsiveAudit, /ARCADE-FIT/)
assert.match(responsiveAudit, /startBounds\.bottom <= panelBounds\.bottom/)
console.log(
  'Play tab navigation and illustrated Zuzu hub verified; cabinets remain inside the Arcade hall.',
)
