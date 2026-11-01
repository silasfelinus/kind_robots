import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'

import {
  navigationDestinations,
  navigationSubtabs,
  navigationTabs,
} from '../channelTabGroups.js'
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
const tabSelect = source('components/navigation/tab-select.vue')
const channelTabList = source('components/navigation/channel-tab-list.vue')

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
  channelSelect
    .replace(/\s+/g, ' ')
    .includes("activeChannel.channelKey === 'home' ? 'Explore'") &&
    channelSelect.includes('activeTab?.label || activeChannel.label'),
  'the unified phone picker must show the active tab label rather than only the channel label',
)
assert.ok(
  channelSelect.includes('v-if="unifiedMobile"') &&
    channelSelect.includes('v-for="channel in visibleChannels"') &&
    channelSelect.includes('@select="selectTab(channel, $event)"'),
  'the unified phone dropdown must render a grouped, directly selectable channel/tab list',
)

assert.ok(
  tabSelect.includes('class="tab-select dropdown dropdown-start min-w-0"') &&
    tabSelect.includes(
      'const availableWidth = window.innerWidth - rect.left',
    ) &&
    tabSelect.includes('Math.min(3, fitColumns, neededColumns)'),
  'the tab menu must open beneath its trigger and size its columns to the width actually available, so a tablet gets fewer columns than a desktop',
)
assert.equal(
  channelTabList.match(
    /class="w-full whitespace-nowrap text-\[0\.7rem\] font-medium tracking-tight opacity-65"/g,
  )?.length,
  2,
  'top-level and nested tab rows must keep full one-line descriptions visible at all widths',
)
assert.doesNotMatch(
  channelTabList,
  /line-clamp/,
  'tab descriptions must never be line-clamped',
)

function channelMarkdownFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = `${dir}/${entry.name}`
    if (entry.isDirectory()) return channelMarkdownFiles(path)
    return entry.isFile() && entry.name.endsWith('.md') ? [path] : []
  })
}

for (const path of channelMarkdownFiles('content/channels')) {
  if (path.endsWith('/index.md')) continue
  const content = source(path)
  if (/\nnavigation: false\n/.test(content)) continue
  const summary = content.match(/^summary:\s*['"]?(.+?)['"]?\s*$/m)?.[1]?.trim()
  assert.ok(summary, `${path} must provide a nav summary`)
  assert.ok(
    summary.length <= 40,
    `${path} nav summary must stay at 40 characters or fewer (got ${summary.length})`,
  )
}
assert.ok(
  channelTabList.includes('v-if="tab.route"') &&
    channelTabList.includes("emit('select', tab)") &&
    channelTabList.includes('Open {{ tab.label }}'),
  'A routed submenu parent such as Storybook must retain an Open Storybook destination.',
)
assert.ok(
  channelTabList.includes('navigationSubtabs') &&
    channelTabList.includes("tab.label + ' subtabs'"),
  'the shared tab list must render expandable nested subtabs',
)
assert.ok(
  channelSelect.includes(':reset-subtabs-token="mobileSubtabsResetToken"') &&
    channelSelect.includes('mobileSubtabsResetToken.value += 1') &&
    channelTabList.includes('() => props.resetSubtabsToken') &&
    channelTabList.includes("expandedParentKey.value = ''"),
  'the unified phone picker must reopen with nested subtab groups collapsed',
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
  'admin:user-admin',
])

function tab(
  channelKey: string,
  tabKey: string,
  parentTabKey = '',
): ResolvedTab {
  return {
    channelKey,
    tabKey,
    parentTabKey,
    key: tabKey,
    label: tabKey,
    title: tabKey,
    route: parentTabKey || tabKey !== 'retired' ? `/${tabKey}` : '',
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

const retiredTabKeys = [
  'serendipity',
  'shared-with-me',
  'forum',
  'academy',
  'hair-studio',
  'voice-lab',
  'challenges',
  'watchlist',
  'ui-gallery',
  'missing-image-test',
  'achievement-art',
  'social-drafts',
  'appmaker',
  'conductor-app',
  'mermaids',
  'scene-animator',
]

const admin = {
  channelKey: 'admin',
  tabs: [
    tab('admin', 'artjob'),
    tab('admin', 'project-placement'),
    tab('admin', 'navigation-health'),
    tab('admin', 'user-admin'),
    tab('admin', 'forum-moderation'),
    tab('admin', 'retired'),
    ...retiredTabKeys.map((tabKey) => tab('admin', tabKey, 'retired')),
  ],
} as ResolvedChannel

assert.deepEqual(
  navigationTabs(admin).map((entry) => entry.tabKey),
  ['artjob', 'retired'],
  'Admin navigation must expose Retired while Users & Moderation moves to Account',
)
assert.deepEqual(
  navigationSubtabs(admin, 'retired').map((entry) => entry.tabKey),
  retiredTabKeys,
  'Retired must expose all sixteen archived surfaces as Admin subtabs',
)
assert.equal(
  navigationDestinations(admin).some((entry) => entry.tabKey === 'retired'),
  false,
  'route-less subtab parents must not become destination links',
)
assert.deepEqual(
  channelTabsToCards(admin).map((entry) => entry.key),
  ['artjob'],
  'hidden tabs, subtab parents, and subtab children must stay out of top-level fallback card decks',
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
  assert.match(
    content,
    /\nnavigation: false\n/,
    `${path} must declare that it is nested, not deleted`,
  )
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
  accountLinksIndex >= 0 &&
    accountSettingsIndex >= 0 &&
    accountLinksIndex < accountSettingsIndex,
  'Account center must show Newsfeed and Friends links before the existing account controls',
)
const accountLinks = source('components/home/home-account-links.vue')
for (const route of [
  '/plan/newsfeed',
  '/friends',
  '/build/animation-manager',
]) {
  assert.ok(
    accountLinks.includes(`to="${route}"`),
    `Account hub must link to ${route}`,
  )
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
  assert.ok(
    aboutPage.includes(`to="${route}"`),
    `Support must link to ${route}`,
  )
}

assert.equal(
  existsSync('content/channels/retired/index.md'),
  false,
  'Retired must not return as a top-level channel',
)
const retiredParent = source('content/channels/admin/retired.md')
assert.match(retiredParent, /\nchannelKey: admin\n/)
assert.match(retiredParent, /\ntabKey: retired\n/)
assert.doesNotMatch(retiredParent, /\nroute: /)

const serendipityTab = source('content/channels/admin/retired/serendipity.md')
assert.match(serendipityTab, /\nchannelKey: admin\n/)
assert.match(serendipityTab, /\nparentTabKey: retired\n/)
assert.match(serendipityTab, /\nroute: \/serendipity\n/)
assert.match(serendipityTab, /\nrequiredRole: ADMIN\n/)
const serendipityPage = source('content/serendipity.md')
assert.match(serendipityPage, /\nchannelKey: admin\n/)
assert.match(serendipityPage, /\nrequiredRole: ADMIN\n/)

const userAdminTab = source('content/channels/admin/user-admin.md')
assert.match(userAdminTab, /\nlabel: Users & Moderation\n/)
assert.match(userAdminTab, /\nnavigation: false\n/)
assert.match(userAdminTab, /\nrequiredRole: ADMIN\n/)
const userAdminPage = source('content/user-admin.md')
assert.match(userAdminPage, /\nchannelKey: home\n/)
assert.match(userAdminPage, /\ntabKey: account\n/)
assert.match(userAdminPage, /\n:user-admin-center\n/)
assert.ok(accountLinks.includes('to="/user-admin"'))
assert.ok(accountLinks.includes('v-if="userStore.isAdmin"'))
const userAdminCenter = source('components/user/user-admin-center.vue')
assert.ok(userAdminCenter.includes('<user-manager-directory />'))
assert.ok(userAdminCenter.includes('<forum-moderation-panel />'))
assert.ok(
  source('pages/admin/forum-moderation.vue').includes(
    '<forum-moderation-panel />',
  ),
  'the legacy moderation route must reuse the shared moderation panel',
)

const animationManagerTab = source(
  'content/channels/admin/animation-manager.md',
)
assert.match(animationManagerTab, /\nnavigation: false\n/)
assert.doesNotMatch(animationManagerTab, /\nrequiredRole: ADMIN\n/)
const animationManagerPage = source('content/build/animation-manager.md')
assert.match(animationManagerPage, /\nchannelKey: home\n/)
assert.match(animationManagerPage, /\ntabKey: account\n/)

const loraTriageTab = source('content/channels/admin/lora-triage.md')
assert.match(loraTriageTab, /\nnavigation: false\n/)
assert.match(loraTriageTab, /\nrequiredRole: ADMIN\n/)
const resourceManager = source('components/resources/resource-manager.vue')
assert.equal(
  resourceManager.match(/to="\/admin\/lora-triage"/g)?.length,
  2,
  'Resources must expose LoRA Triage from both toolbar states',
)

const loraTriage = source('pages/admin/lora-triage.vue')
assert.match(
  loraTriage,
  /<main class="kr-surface flex h-full min-h-0 flex-col overflow-hidden">/,
  'LoRA Triage must bound its gallery scroll owner inside a flex column',
)
assert.match(
  loraTriage,
  /<div class="kr-scroll kr-container-wide w-full space-y-4 p-4 md:p-6">/,
  'LoRA Triage must retain the gallery scroll owner',
)
assert.match(
  loraTriage,
  /<header class="kr-panel flex flex-wrap items-center justify-between gap-3 p-3">/,
  'LoRA Triage toolbar actions must sit on a readable opaque panel',
)
assert.ok(
  loraTriage.includes('to="/resources"'),
  'LoRA Triage must link to the installed model library',
)
assert.ok(
  loraTriage.includes('to="/resources?tab=discover"'),
  'LoRA Triage must link to model discovery and downloads',
)
assert.match(
  loraTriage,
  /class="grid grid-cols-3 gap-2 lg:grid-cols-6"/,
  'LoRA Triage mobile counts must use two rows instead of three',
)

for (const path of [
  'content/channels/admin/appmaker.md',
  'content/channels/admin/conductor-app.md',
  'content/channels/admin/mermaids.md',
  'content/channels/admin/scene-animator.md',
]) {
  assert.match(
    source(path),
    /\nparentTabKey: retired\n/,
    `${path} must live under Admin > Retired`,
  )
}

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
  source('components/navigation/navigation-trimmed.vue').includes(
    'navigationDestinations(channel)',
  ),
  'the full navigation directory must link leaf destinations rather than subtab parents',
)

assert.match(
  source('components/navigation/navigation-trimmed.vue'),
  /class="directory-home kr-unbound flex w-full flex-col gap-3"/,
  'the destination directory must use the content page scroll owner',
)
assert.doesNotMatch(
  source('components/navigation/navigation-trimmed.vue'),
  /class="kr-scroll|overflow-y-auto/,
  'do not create nested scrolling inside the content page scroll owner',
)
assert.match(
  source('pages/[...slug].vue'),
  /content-host flex h-full min-h-0 w-full flex-col overflow-y-auto/,
  'the existing content host must remain responsible for reaching the final directory card',
)
assert.match(
  source('components/navigation/navigation-trimmed.vue'),
  /class="directory-grid grid gap-3"/,
  'destinations should render as grouped responsive cards, not compact strips',
)
assert.match(
  source('components/navigation/navigation-trimmed.vue'),
  /min-h-32 min-w-0 items-stretch/,
  'directory cards need legible rectangular artwork and readable copy',
)
assert.match(
  source('components/navigation/navigation-trimmed.vue'),
  /grid-template-columns: repeat\(auto-fit, minmax\(min\(100%, 21rem\), 1fr\)\)/,
  'the directory grid must follow the available container width',
)
assert.match(
  source('components/navigation/navigation-trimmed.vue'),
  /@container \(min-width: 80rem\)[\s\S]*?repeat\(4, minmax\(0, 1fr\)\)/,
  'the wide desktop directory must not compress into tiny tiles',
)
assert.doesNotMatch(
  source('components/navigation/navigation-trimmed.vue'),
  /kr-panel-compact-xs|sm:grid-cols-2 lg:grid-cols-3/,
  'the directory must not regress to tiny horizontal strips or viewport-based columns',
)
assert.match(
  source('components/navigation/navigation-trimmed.vue'),
  /navigationDestinations\(channel\)/,
  'all routed navigation destinations must remain available',
)
assert.match(
  source('components/navigation/navigation-trimmed.vue'),
  /v-model="query"/,
  'the destination search field must remain functional',
)
assert.match(
  source('components/navigation/navigation-trimmed.vue'),
  /isAdminOnlyTab\(channel, tab\)/,
  'mixed-channel admin badges must be preserved',
)
assert.match(
  source('components/navigation/navigation-trimmed.vue'),
  /:to="tabTo\(channel, tab\)"/,
  'duplicate tab routes must still be disambiguated',
)

const channelStoreSource = source('stores/channelContentStore.ts')
const pickerSource = source('components/navigation/channel-select.vue')
const siteDirectorySource = source(
  'components/navigation/navigation-trimmed.vue',
)
const accountHubSource = source('components/navigation/account-hub.vue')
assert.ok(
  accountHubSource.includes(
    'class="account-hub static flex min-w-0 justify-center sm:relative"',
  ) &&
    accountHubSource.includes('<div class="relative">') &&
    accountHubSource.includes('class="absolute left-2 right-2 top-full') &&
    accountHubSource.includes('sm:left-auto sm:right-0 sm:w-80'),
  'phone account menu must be anchored to the full header while its avatar badge and desktop dropdown keep their own positioning',
)
const homePageSource = source('components/home/home-page.vue').replace(
  /\s+/g,
  ' ',
)
const visitorDirectorySource = source(
  'components/home/home-visitor-directory.vue',
)
assert.ok(
  channelStoreSource.includes('const navigationChannels = computed(() =>'),
)
assert.ok(channelStoreSource.includes("channel.channelKey !== 'home'"))
assert.ok(pickerSource.includes('channelContentStore.navigationChannels'))
assert.ok(
  siteDirectorySource.includes('channelContentStore.navigationChannels'),
)
assert.ok(
  pickerSource
    .replace(/\s+/g, ' ')
    .includes("activeChannel.channelKey === 'home' ? 'Explore'"),
)
assert.ok(
  homePageSource.includes("route.query.view !== 'dashboard'"),
  'Daily Dream visitors must be able to access the original dashboard by direct link',
)
assert.ok(
  homePageSource.includes('@open-dashboard="homeMode = \'dashboard\'"'),
  'admins must retain a way to open their dashboard from the compact homepage',
)
assert.ok(
  visitorDirectorySource.includes('Admin dashboard →'),
  'the admin dashboard shortcut must appear beside the gallery header',
)
assert.doesNotMatch(
  visitorDirectorySource,
  /aria-label="Welcome to Kind Robots"/,
  'the duplicate welcome banner must not consume the mobile viewport',
)
assert.doesNotMatch(
  visitorDirectorySource,
  /Enter the Arcade/,
  'Arcade already leads the featured gallery and needs no hero button',
)
assert.doesNotMatch(
  visitorDirectorySource,
  /feature\.related/,
  'featured cards must link directly to destinations without nested related-link lists',
)
assert.ok(
  visitorDirectorySource.includes("route: '/?view=dashboard'"),
  'Daily Dreams must link to the original dashboard, not the dreams object gallery',
)
assert.ok(homePageSource.includes('<home-visitor-directory v-else'))
assert.ok(visitorDirectorySource.includes('showcaseHref(card)'))
assert.ok(visitorDirectorySource.includes('props.showcase.rails.art'))
assert.ok(visitorDirectorySource.includes('props.showcase.rails.dreams'))
assert.ok(homePageSource.includes('v-if="isAdmin"'))
assert.ok(
  homePageSource.includes('flex h-full min-h-0 flex-col gap-2 overflow-hidden'),
)
for (const route of [
  '/play/arcade',
  '/play/shifting-desks',
  '/storybook',
  '/art',
  '/play/aquarium',
  '/play/memory',
  '/?view=dashboard',
  '/play/video-generator?studio=music',
  '/play/mandarin',
  '/play/emperor-of-dust',
  '/play/crystal-street',
  '/play/zuzu-pinball',
  '/play/save-the-plumber',
  '/play/rainbow-bullet-hell-space-princess',
  '/play/zuzu-shifting-lands',
  '/play/zuzu-gamebook',
  '/play/ecotone',
  '/play/arcade?game=kind-pinball',
]) {
  assert.ok(
    visitorDirectorySource.includes("route: '" + route + "'"),
    'public showcase must preserve the visitor destination ' + route,
  )
}
for (const image of [
  '/save-the-plumber/maps/world-1.webp',
  '/rainbow-princess-art/hero-pearl-palace.webp',
  '/zuzu-pinball/last-bell-cover.webp',
  '/crystal-street/cover.webp',
  '/storybook-art/dashboard-highlight.webp',
]) {
  assert.ok(
    visitorDirectorySource.includes("image: '" + image + "'"),
    'featured card must use a shipped illustration: ' + image,
  )
  assert.ok(
    existsSync('public' + image),
    'featured artwork must exist in the public assets: ' + image,
  )
}
assert.ok(
  !visitorDirectorySource.includes("image: '/zuzu-pinball/river-croc.webp'"),
  'Zuzu pinball sprite atlas must not be used as a featured cover',
)
for (const internal of [
  '/admin/emperor-of-dust',
  '/admin/crystal-street',
  '/admin/zuzu-lair',
  '/butterfly-gallery',
  '/tzaddik-gallery',
  '/admin/save-the-plumber',
]) {
  assert.equal(
    visitorDirectorySource.includes("route: '" + internal + "'"),
    false,
    'private project must not appear as a playable public feature: ' + internal,
  )
}
assert.ok(visitorDirectorySource.includes("title: 'Kind Robots Pinball'"))
assert.doesNotMatch(visitorDirectorySource, /title: 'The World of Zuzu'/)
assert.doesNotMatch(visitorDirectorySource, /route: '\/play\/zuzu'/)
for (const title of [
  'Emperor of Dust',
  'Zuzu Pinball',
  'Zuzu: Shifting Lands',
  'Zuzu Gamebook',
  'Ecotone: Weird Humboldt',
]) {
  assert.ok(visitorDirectorySource.includes("title: '" + title + "'"))
}
assert.equal(
  visitorDirectorySource.includes("title: 'Rebel Button'"),
  false,
  'Rebel Button may stay in Projects but must not occupy homepage highlights',
)
const storybookTableSource = source('components/storybook/storybook-table.vue')
const serverSelectorSource = source('components/navigation/server-selector.vue')
assert.ok(
  storybookTableSource.includes('button-label="Add OpenAI / Claude key"'),
)
assert.ok(storybookTableSource.includes('<server-selector'))
assert.ok(
  storybookTableSource.includes('Story narration currently requires your own'),
)
assert.ok(serverSelectorSource.includes("buttonLabel || 'Server settings'"))
assert.ok(serverSelectorSource.includes('saveOpenAi'))
assert.ok(serverSelectorSource.includes('saveAnthropic'))
assert.ok(visitorDirectorySource.includes('const updates = ['))
assert.ok(visitorDirectorySource.includes('Development notes #'))
assert.ok(visitorDirectorySource.includes('kr-panes'))
assert.equal(
  visitorDirectorySource.match(/kr-pane-scroll/g)?.length,
  3,
  'the three co-resident visitor gallery panels must use the multi-pane scroll primitive',
)
assert.doesNotMatch(visitorDirectorySource, /\bkr-scroll\b/)
assert.ok(visitorDirectorySource.includes('container-type: inline-size'))
assert.ok(
  visitorDirectorySource.includes('visitor-featured-grid grid grid-cols-1 gap-2'),
  'phone featured experience cards must use a legible single column',
)
assert.match(
  visitorDirectorySource,
  /@container \(min-width: 36rem\)[\s\S]*?\.visitor-featured-grid \{[\s\S]*?repeat\(2, minmax\(0, 1fr\)\)/,
  'wider tablet containers must restore two featured experience columns',
)
const featuredPanel =
  visitorDirectorySource.split('id="visitor-featured"')[1]
    ?.split('id="visitor-updates"')[0] ?? ''
assert.match(
  featuredPanel,
  /class="kr-pane-scroll min-h-0 pr-1"[\s\S]*?id="visitor-hero-title"[\s\S]*?Featured experiences[\s\S]*?Filter experiences[\s\S]*?visitor-featured-grid/,
  'the Crystal Street promo, heading, filters, and gallery must share the one bounded scroll owner',
)
assert.match(
  visitorDirectorySource,
  /@container \(min-width: 56rem\)[\s\S]*?\.visitor-featured-grid \{[\s\S]*?repeat\(3, minmax\(0, 1fr\)\)/,
  'standard desktop widths must show three readable artwork columns rather than ten tiny tiles',
)
assert.match(
  visitorDirectorySource,
  /@container \(min-width: 84rem\)[\s\S]*?\.visitor-featured-grid \{[\s\S]*?repeat\(4, minmax\(0, 1fr\)\)/,
  'extra-wide desktop widths and browser zoom-out must cap the featured gallery at four columns',
)
assert.match(
  visitorDirectorySource,
  /\.visitor-featured-grid \{[\s\S]*?align-content: start;/,
  'desktop gallery rows must start at the top and scroll inside the bounded feature pane',
)

assert.doesNotMatch(
  visitorDirectorySource,
  /\b(?:sm|md|lg|xl|2xl):grid-cols-/,
  'shared homepage tiles must size their grids to the actual container',
)
assert.ok(visitorDirectorySource.includes('activeSection'))
assert.ok(visitorDirectorySource.includes('selectedCategory'))
assert.ok(
  visitorDirectorySource.includes("image: '/shifting-desks/front-poster.svg'"),
)
assert.ok(
  visitorDirectorySource.indexOf("title: 'Shifting Desks'") <
    visitorDirectorySource.indexOf("title: 'Storybook'"),
  'Shifting Desks must remain a flagship visitor attraction',
)

for (const route of [
  '/',
  '/account',
  '/achievements',
  '/messages',
  '/friends',
  '/themes',
  '/servers',
  '/plan/newsfeed',
  '/about',
  '/navigation',
]) {
  assert.ok(
    accountHubSource.includes(`route: '${route}'`),
    `Account hub must retain ${route} without a Home channel`,
  )
}
assert.match(accountHubSource, /userStore.isLoggedIn/)
assert.ok(
  source('content/channels/home/index.md').includes('contentType: channel'),
)
assert.ok(
  source('content/channels/home/account.md').includes('route: /account'),
)

console.log(
  'Navigation consolidation verified: Account tools, Resources triage access, Admin > Retired subtabs, hidden diagnostics, nested routes, access metadata, and ArtJob icon all hold.',
)
