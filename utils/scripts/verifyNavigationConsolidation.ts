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

const workspaceHeader = source('components/navigation/workspace-header.vue')
const channelSelect = source('components/navigation/channel-select.vue')

assert.ok(
  workspaceHeader.includes('unified-mobile') &&
    workspaceHeader.includes('class="min-w-0 flex-1 sm:hidden"'),
  'phone workspace navigation must use one unified picker',
)
assert.ok(
  workspaceHeader.includes(
    'class="hidden min-w-0 shrink max-w-[45%] sm:block"',
  ) &&
    workspaceHeader.includes(
      'class="hidden min-w-0 flex-1 items-stretch border-l border-base-300 sm:flex"',
    ),
  'channel + tab pickers must remain the tablet/desktop navigation',
)
assert.ok(
  channelSelect.includes(
    "{{ unifiedMobile ? activeTab?.label || activeChannel.label : activeChannel.label }}",
  ),
  'the unified phone picker must show the active tab label rather than only the channel label',
)
assert.ok(
  channelSelect.includes('v-if="unifiedMobile"') &&
    channelSelect.includes('v-for="channel in visibleChannels"') &&
    channelSelect.includes('@select="selectTab(channel, $event)"'),
  'the unified phone dropdown must render a grouped, directly selectable channel/tab list',
)

const contentConfig = source('content.config.ts')
assert.match(
  contentConfig,
  /const channelSchema = sharedNavigationSchema\.extend\(\{[\s\S]*?navigation: contentNavigationSchema\.default\(true\),[\s\S]*?\}\)/,
  'channel content must default navigation to true so ordinary tabs remain in channel submenus unless they explicitly opt out',
)
assert.match(
  contentConfig,
  /const pageSchema = sharedNavigationSchema\.extend\(\{[\s\S]*?navigation: contentNavigationSchema\.default\(false\),[\s\S]*?\}\)/,
  'ordinary page content must keep its existing navigation:false default',
)

const NESTED_TABS = new Set([
  'home:newsfeed',
  'home:friends',
  'home:giving',
  'home:giftshop',
  'admin:project-placement',
  'admin:forum-moderation',
  'admin:navigation-health',
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
  'navigation-health',
  'serendipity',
  'user-admin',
  'forum-moderation',
])
assert.deepEqual(
  navigationTabs(admin).map((entry) => entry.tabKey),
  ['artjob', 'serendipity', 'user-admin'],
  'Admin navigation must expose Serendipity while hiding diagnostic and nested destinations',
)

for (const path of [
  'content/channels/home/newsfeed.md',
  'content/channels/home/friends.md',
  'content/channels/home/giving.md',
  'content/channels/home/giftshop.md',
  'content/channels/admin/project-placement.md',
  'content/channels/admin/forum-moderation.md',
  'content/channels/admin/navigation-health.md',
]) {
  const content = source(path)
  assert.match(content, /\nnavigation: false\n/, `${path} must declare that it is nested, not deleted`)
  assert.doesNotMatch(
    content,
    /\nvisible: false\n/,
    `${path} must remain in the resolved route/access graph`,
  )
}

const accountTab = source('content/channels/home/account.md')
assert.match(accountTab, /\nlabel: Account\n/)
assert.match(accountTab, /\nroute: \/account\n/)
assert.match(accountTab, /\nrequiredPermission: authenticated\n/)

const accountPage = source('content/account.md')
assert.match(accountPage, /\n:account-center\n/)
const accountCenter = source('components/user/account-center.vue')
const accountLinksIndex = accountCenter.indexOf('<home-account-links />')
const accountSettingsIndex = accountCenter.indexOf('<account-settings />')
assert.ok(
  accountLinksIndex >= 0 && accountSettingsIndex >= 0 && accountLinksIndex < accountSettingsIndex,
  'Account center must show Newsfeed and Friends links before the existing account controls',
)
const accountLinks = source('components/home/home-account-links.vue')
for (const route of ['/plan/newsfeed', '/friends']) {
  assert.ok(accountLinks.includes(`to="${route}"`), `Account hub must link to ${route}`)
}
assert.equal(
  accountLinks.includes('to="/account"'),
  false,
  'Account hub must not link back to itself',
)
assert.match(
  source('content/friends.md'),
  /\nrequiredPermission: authenticated\n/,
  'Friends must keep its direct-route authentication requirement',
)

const aboutTab = source('content/channels/home/about.md')
assert.match(aboutTab, /\nlabel: Support\n/)
assert.match(aboutTab, /\ntitle: Support\n/)
assert.match(aboutTab, /\nroute: \/about\n/)
assert.match(source('content/about.md'), /\ntitle: 'Support'\n/)
assert.match(source('content/about.md'), /\n:about-page\n/)
const aboutPage = source('components/pages/about-page.vue')
for (const route of ['/about', '/giving', '/sanctuary']) {
  assert.ok(aboutPage.includes(`to="${route}"`), `Support must link to ${route}`)
}

const serendipityTab = source('content/channels/admin/serendipity.md')
assert.match(serendipityTab, /\nchannelKey: admin\n/)
assert.match(serendipityTab, /\nroute: \/serendipity\n/)
assert.match(serendipityTab, /\nrequiredRole: ADMIN\n/)
const serendipityPage = source('content/serendipity.md')
assert.match(serendipityPage, /\nchannelKey: admin\n/)
assert.match(serendipityPage, /\nrequiredRole: ADMIN\n/)

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

console.log('Navigation consolidation verified: Account, Support, admin Serendipity, hidden diagnostics, nested routes, access metadata, and ArtJob icon all hold.')
