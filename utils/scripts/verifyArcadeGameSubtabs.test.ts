import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  resolveChannelLocation,
  resolveChannels,
  type ChannelContentItem,
} from '../../stores/helpers/channelContent'
import { ARCADE_GAMES, LINKED_GAMES } from '../arcade/games'
import { arcadeGameTabItems, arcadeGameTabKey } from '../arcade/navigation'
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

const generated = arcadeGameTabItems()
const channels = resolveChannels([...items, ...generated])
const arcade = channels.find((channel) => channel.channelKey === 'arcade')
assert.ok(arcade, 'the arcade channel resolves')

const subtabs = navigationSubtabs(arcade, 'arcade')
assert.equal(
  subtabs.length,
  ARCADE_GAMES.length,
  'every cabinet is a subtab of the Arcade tab',
)
assert.deepEqual(
  subtabs.map((tab) => tab.label),
  [...ARCADE_GAMES]
    .map((game) => game.title)
    .sort((a, b) => a.localeCompare(b)),
  'the game menu is alphabetical',
)
assert.equal(
  new Set(subtabs.map((tab) => tab.tabKey)).size,
  subtabs.length,
  'tab keys are unique',
)

assert.deepEqual(
  navigationTabs(arcade).map((tab) => tab.tabKey),
  ['arcade', 'aquarium'],
  'the games nest under Arcade instead of joining the top-level tab list',
)

for (const game of LINKED_GAMES) {
  assert.ok(
    !generated.some((item) => item.tabKey === arcadeGameTabKey(game.slug)),
    `${game.slug} keeps its own channel's tab, not a second one on the same route`,
  )
}

const ghostTrail = subtabs.find(
  (tab) => tab.tabKey === arcadeGameTabKey('zuzu-ghost-trail'),
)
assert.ok(ghostTrail)
assert.equal(ghostTrail.route, '/play/arcade?game=zuzu-ghost-trail')
assert.equal(
  ghostTrail.image,
  ARCADE_GAMES.find((game) => game.slug === 'zuzu-ghost-trail')?.titleArt,
  'each game shows its own title art in the menu',
)
assert.deepEqual(
  tabRouteTarget(arcade, ghostTrail),
  { path: '/play/arcade', query: { game: 'zuzu-ghost-trail' } },
  'the header tab picker keeps the ?game= query a location path would drop',
)
assert.deepEqual(tabRouteTarget(arcade, navigationTabs(arcade)[0]!), {
  path: '/play/arcade',
})

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
assert.match(store, /\.\.\.arcadeGameTabItems\(\)/)

const page = readFileSync('pages/play/arcade/index.vue', 'utf8')
assert.match(
  page,
  /<ArcadeCabinet :key="meta\.slug"/,
  'switching games from the menu remounts the cabinet',
)

assert.match(page, /class="kr-panes min-h-0 grid-cols-1/)
assert.match(page, /v-if="!slug" class="kr-panes min-h-0 grid-cols-1"/)
assert.doesNotMatch(
  page,
  /\bkr-scroll\b/,
  'no mixed single/multi scroll owner',
)
assert.match(page, /class="kr-pane-scroll min-w-0"/)
assert.match(page, /id="arcade-cabinet-details"/)
assert.match(page, /aria-controls="arcade-cabinet-details"/)
assert.match(page, /:aria-expanded="showDetails"/)
assert.match(page, /watch\(slug, \(\) =>/)
assert.match(page, /\? 'hidden xl:block' : 'block'/)
assert.match(page, /\? 'block' : 'hidden xl:block'/)
assert.doesNotMatch(page, /class="flex flex-col gap-4 xl:flex-row"/)

console.log(
  `Arcade game subtabs contract passed: ${subtabs.length} cabinets under Arcade.`,
)
