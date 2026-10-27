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
    contentType: 'tab',
    channelKey: 'arcade',
    tabKey: 'zuzu-showdown',
    navigation: false,
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
  'Play must expose the featured experiences but leave Zuzu Showdown discoverable inside the Arcade hall',
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
  'arcade',
)
assert.equal(
  channels.some((channel) => channel.channelKey === 'zuzu'),
  false,
  'the separate Zuzu channel must no longer resolve',
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
for (const game of [
  'emperor-of-dust',
  'zuzu-gamebook',
  'zuzu-shifting-lands',
  'zuzu-showdown',
  'zuzu-ghost-trail',
  'zuzu-pinball',
]) {
  const tab = readFileSync(`content/channels/arcade/${game}.md`, 'utf8')
  assert.match(tab, /\nchannelKey: arcade\n/)
}

const privateLairTab = readFileSync(
  'content/channels/admin/zuzu-lair.md',
  'utf8',
)
assert.match(privateLairTab, /\nchannelKey: admin\n/)
assert.match(privateLairTab, /\nrequiredRole: ADMIN\n/)

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
assert.match(
  page,
  /\{ key: 'instructions', label: 'How to play' \}/,
  'Instructions should be first in the small-screen details tabs.',
)
assert.ok(
  page.indexOf("detailTab !== 'instructions'") <
    page.indexOf("detailTab !== 'scores'"),
  'Instructions must be first in the desktop sidebar as well.',
)
assert.match(
  page,
  /<GameAchievementStrip :game="meta\.slug" layout="icons" \/>/,
  'Arcade sidebars show image badges instead of text-heavy achievement cards.',
)

assert.match(page, /detailTab\.value = 'instructions'/)
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

const achievementStrip = readFileSync(
  'components/achievements/game-achievement-strip.vue',
  'utf8',
)
assert.match(achievementStrip, /layout === 'icons'/)
assert.match(achievementStrip, /class="game-achievement-icons"/)
assert.match(
  achievementStrip,
  /class="game-achievement-tooltip" role="tooltip"/,
)
assert.match(achievementStrip, /game-achievement-icon button:focus-visible/)
assert.match(achievementStrip, /game-achievement-icon--open/)
assert.match(achievementStrip, /@click="openBadge = openBadge === entry.code/)
assert.match(achievementStrip, /v-if="layout !== 'icons'"/)

const reviewForm = readFileSync('components/arcade/arcade-reviews.vue', 'utf8')
assert.match(reviewForm, /v-model\.number="rating"/)
assert.match(reviewForm, /type="radio"/)
assert.match(reviewForm, /v-for="stars in \[1, 2, 3, 4, 5\]"/)
assert.doesNotMatch(reviewForm, /<select/)

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
