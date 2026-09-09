import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { navigationTabs } from '../channelTabGroups.js'
import { channelTabsToCards } from '../../stores/helpers/channelCards.js'
import type {
  ResolvedChannel,
  ResolvedTab,
} from '../../stores/helpers/channelContent.js'

function source(path: string): string {
  return readFileSync(path, 'utf8')
}

// Mirrors the six nested destinations' `navigation: false` frontmatter --
// resolveTabItem() carries that field onto ResolvedTab.navigation, and these
// hand-built fixtures stand in for that resolution step for tabs that
// aren't reachable directly from the tab menus/navigation directory.
const NESTED_TABS = new Set([
  'home:newsfeed',
  'home:friends',
  'home:giving',
  'home:giftshop',
  'admin:project-placement',
  'admin:forum-moderation',
])

function tab(channelKey: string, tabKey: string): ResolvedTab {
  return {
    channelKey,
    tabKey,
    key: tabKey,
    label: tabKey,
    title: tabKey,
    requiredRole: '',
    navigation: !NESTED_TABS.has(`${channelKey}:${tabKey}`),
  } as ResolvedTab
}

function channel(channelKey: string, tabKeys: string[]): ResolvedChannel {
  return {
    channelKey,
    tabs: tabKeys.map((tabKey) => tab(channelKey, tabKey)),
  } as ResolvedChannel
}

const home = channel('home', [
  'account',
  'newsfeed',
  'friends',
  'about',
  'giving',
  'giftshop',
])
assert.deepEqual(
  navigationTabs(home).map((entry) => entry.tabKey),
  ['account', 'about'],
  'Home navigation must expose the two consolidated hubs instead of their nested destinations',
)
assert.deepEqual(
  channelTabsToCards(home).map((entry) => entry.key),
  ['account', 'about'],
  'fallback navigation card decks must obey the same consolidation as the tab menus',
)

const admin = channel('admin', [
  'artjob',
  'project-placement',
  'user-admin',
  'forum-moderation',
])
assert.deepEqual(
  navigationTabs(admin).map((entry) => entry.tabKey),
  ['artjob', 'user-admin'],
  'Admin navigation must hide project placement and the standalone moderation destination',
)

for (const path of [
  'content/channels/home/newsfeed.md',
  'content/channels/home/friends.md',
  'content/channels/home/giving.md',
  'content/channels/home/giftshop.md',
  'content/channels/admin/project-placement.md',
  'content/channels/admin/forum-moderation.md',
]) {
  const content = source(path)
  assert.match(content, /\nnavigation: false\n/, `${path} must declare that it is nested, not deleted`)
  assert.doesNotMatch(
    content,
    /\nvisible: false\n/,
    `${path} must remain in the resolved route/access graph`,
  )
}

const connectTab = source('content/channels/home/account.md')
assert.match(connectTab, /\nlabel: Connect\n/)
assert.match(connectTab, /\nroute: \/connect\n/)
assert.match(connectTab, /\nrequiredPermission: authenticated\n/)

const connectPage = source('content/connect.md')
assert.match(connectPage, /\n:home-account-links\n/)
const connectLinks = source('components/home/home-account-links.vue')
for (const route of ['/account', '/plan/newsfeed', '/friends']) {
  assert.ok(connectLinks.includes(`to="${route}"`), `Connect hub must link to ${route}`)
}
assert.match(
  source('content/friends.md'),
  /\nrequiredPermission: authenticated\n/,
  'Friends must keep its direct-route authentication requirement',
)

const aboutTab = source('content/channels/home/about.md')
assert.match(aboutTab, /\nlabel: About & Support\n/)
assert.match(aboutTab, /\nroute: \/about\n/)
assert.match(source('content/about.md'), /\n:about-page\n/)
const aboutPage = source('components/pages/about-page.vue')
for (const route of ['/about', '/giving', '/sanctuary']) {
  assert.ok(aboutPage.includes(`to="${route}"`), `About & Support must link to ${route}`)
}

const userAdminTab = source('content/channels/admin/user-admin.md')
assert.match(userAdminTab, /\nlabel: Users & Moderation\n/)
assert.match(userAdminTab, /\nrequiredRole: ADMIN\n/)
assert.match(source('content/user-admin.md'), /\n:user-admin-center\n/)
const userAdminCenter = source('components/user/user-admin-center.vue')
assert.ok(userAdminCenter.includes('<user-manager-directory />'))
assert.ok(userAdminCenter.includes('<forum-moderation-panel />'))
assert.ok(
  source('pages/admin/forum-moderation.vue').includes('<forum-moderation-panel />'),
  'the legacy moderation route must reuse the shared moderation panel',
)

const placement = source('content/channels/admin/project-placement.md')
assert.match(placement, /\nroute: \/project-placement\n/)
assert.match(placement, /\nrequiredRole: ADMIN\n/)

for (const path of ['content/channels/admin/artjob.md', 'content/artjob.md']) {
  assert.match(
    source(path),
    /\nicon: kind-icon:palette-color\n/,
    `${path} must use the art-oriented queue icon`,
  )
}

assert.ok(
  source('components/navigation/navigation-trimmed.vue').includes('navigationTabs(channel)'),
  'the full navigation directory must honor nested destinations too',
)

console.log('Navigation consolidation verified: hubs, nested routes, admin composition, access metadata, and ArtJob icon all hold.')
