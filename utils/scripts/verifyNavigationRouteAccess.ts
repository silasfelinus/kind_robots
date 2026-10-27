import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { parse as parseYaml } from 'yaml'
import {
  filterChannelsByRole,
  resolveChannels,
  type ChannelContentItem,
} from '@/stores/helpers/channelContent'
import {
  filterChannelsByPermission,
  navigationPermissions,
} from '@/stores/helpers/navigationAccess'
import { evaluateNavigationRouteAccess } from '@/stores/helpers/navigationRouteAccess'
import { isSuperkateServicesViewer } from '@/stores/helpers/superkateNavigation'
import { PROJECT_PLACEMENTS } from '@/utils/projectPlacements'
import { tutorialPageKey } from '@/stores/tutorialStore'

const items: ChannelContentItem[] = [
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
    contentType: 'tab',
    channelKey: 'home',
    tabKey: 'achievements',
    label: 'Achievements',
    route: '/achievements',
    sort: 20,
    requiredPermission: 'authenticated',
  },
  {
    contentType: 'channel',
    channelKey: 'play',
    label: 'Play',
    route: '/art',
    defaultTab: 'gallery',
    sort: 20,
  },
  {
    contentType: 'tab',
    channelKey: 'play',
    tabKey: 'gallery',
    label: 'Gallery',
    route: '/art',
    sort: 10,
  },
  {
    contentType: 'tab',
    channelKey: 'play',
    tabKey: 'generate',
    label: 'Generate',
    route: '/art',
    sort: 20,
    requiredPermission: 'member',
  },
  {
    contentType: 'channel',
    channelKey: 'admin',
    label: 'Admin',
    route: '/navigation-health',
    defaultTab: 'navigation-health',
    sort: 30,
    requiredRole: 'ADMIN',
  },
  {
    contentType: 'tab',
    channelKey: 'admin',
    tabKey: 'navigation-health',
    label: 'Navigation Health',
    route: '/navigation-health',
    sort: 10,
    requiredRole: 'ADMIN',
  },
]

const channels = resolveChannels(items)
const guestRoleChannels = filterChannelsByRole(channels, 'GUEST')
const guestChannels = filterChannelsByPermission(guestRoleChannels, {
  role: 'GUEST',
  permissions: navigationPermissions({
    isLoggedIn: false,
    isMember: false,
    isFamily: false,
    showMature: false,
    isAdmin: false,
  }),
  isAdmin: false,
})
const userRoleChannels = filterChannelsByRole(channels, 'USER')
const userChannels = filterChannelsByPermission(userRoleChannels, {
  role: 'USER',
  permissions: navigationPermissions({
    isLoggedIn: true,
    isMember: false,
    isFamily: false,
    showMature: false,
    isAdmin: false,
  }),
  isAdmin: false,
})
const memberChannels = filterChannelsByPermission(userRoleChannels, {
  role: 'USER',
  permissions: navigationPermissions({
    isLoggedIn: true,
    isMember: true,
    isFamily: false,
    showMature: false,
    isAdmin: false,
  }),
  isAdmin: false,
})
const adminRoleChannels = filterChannelsByRole(channels, 'ADMIN')
const adminChannels = filterChannelsByPermission(adminRoleChannels, {
  role: 'ADMIN',
  permissions: navigationPermissions({
    isLoggedIn: true,
    isMember: false,
    isFamily: false,
    showMature: false,
    isAdmin: true,
  }),
  isAdmin: true,
})

assert.deepEqual(
  evaluateNavigationRouteAccess(channels, guestChannels, {
    path: '/outside-navigation',
  }),
  {
    matched: false,
    allowed: true,
    requested: null,
    requiredRole: '',
    requiredPermission: '',
  },
  'unrelated routes should pass through untouched',
)

const publicHome = evaluateNavigationRouteAccess(channels, guestChannels, {
  path: '/',
})
assert.equal(publicHome.matched, true)
assert.equal(publicHome.allowed, true)

const guestAchievements = evaluateNavigationRouteAccess(
  channels,
  guestChannels,
  { path: '/achievements' },
)
assert.equal(guestAchievements.matched, true)
assert.equal(guestAchievements.allowed, false)
assert.equal(guestAchievements.requiredPermission, 'authenticated')

const userAchievements = evaluateNavigationRouteAccess(channels, userChannels, {
  path: '/achievements',
})
assert.equal(userAchievements.allowed, true)

const guestGenerate = evaluateNavigationRouteAccess(channels, guestChannels, {
  path: '/art',
  tabKey: 'generate',
})
assert.equal(guestGenerate.allowed, false)
assert.equal(guestGenerate.requiredPermission, 'member')

const userGenerate = evaluateNavigationRouteAccess(channels, userChannels, {
  path: '/art',
  tabKey: 'generate',
})
assert.equal(userGenerate.allowed, false)

const memberGenerate = evaluateNavigationRouteAccess(channels, memberChannels, {
  path: '/art',
  tabKey: 'generate',
})
assert.equal(memberGenerate.allowed, true)

const userAdmin = evaluateNavigationRouteAccess(channels, userChannels, {
  path: '/navigation-health',
})
assert.equal(userAdmin.allowed, false)
assert.equal(userAdmin.requiredRole, 'ADMIN')

const adminAdmin = evaluateNavigationRouteAccess(channels, adminChannels, {
  path: '/navigation-health',
})
assert.equal(adminAdmin.allowed, true)

// The services URL is always reachable even when the Projects shortcut is
// intentionally hidden for unrelated accounts.
const serviceChannels = resolveChannels([
  {
    contentType: 'channel',
    channelKey: 'projects',
    label: 'Projects',
    route: '/storybook',
  },
  {
    contentType: 'tab',
    channelKey: 'projects',
    tabKey: 'stylist',
    label: 'Superkate Services',
    route: '/stylist',
    allowDirectAccess: true,
  },
  {
    contentType: 'tab',
    channelKey: 'projects',
    tabKey: 'restricted',
    label: 'Restricted',
    route: '/restricted',
  },
])
const unrelatedViewerChannels = serviceChannels.map((channel) => ({
  ...channel,
  tabs: channel.tabs.filter(
    (tab) => tab.tabKey !== 'stylist' && tab.tabKey !== 'restricted',
  ),
}))
assert.equal(
  evaluateNavigationRouteAccess(serviceChannels, unrelatedViewerChannels, {
    path: '/stylist',
  }).allowed,
  true,
  'An unlisted services tab must still allow a direct link.',
)
assert.equal(
  evaluateNavigationRouteAccess(serviceChannels, unrelatedViewerChannels, {
    path: '/restricted',
  }).allowed,
  false,
  'An unrelated hidden tab must remain inaccessible.',
)
assert.match(
  readFileSync('content/channels/projects/stylist.md', 'utf8'),
  /\nallowDirectAccess:\s*true\n/,
  'The canonical Superkate Services tab must opt in to direct-link access.',
)
assert.equal(isSuperkateServicesViewer({ id: 1279 }), true)
assert.equal(isSuperkateServicesViewer({ username: ' SuperKate ' }), true)
assert.equal(isSuperkateServicesViewer({ email: 'SUPERKATE@KINDROBOTS.ORG' }), true)
assert.equal(isSuperkateServicesViewer({ username: 'other' }, true), true)
assert.equal(isSuperkateServicesViewer({ username: 'other' }), false)

const middlewareSource = readFileSync(
  'middleware/navigation-access.global.ts',
  'utf8',
)
assert.match(
  middlewareSource,
  /if \(nuxtApp\.isHydrating && nuxtApp\.payload\.serverRendered\) \{[\s\S]*?nuxtApp\.hook\('app:mounted',[\s\S]*?enforceNavigationAccess/,
  'Initial SSR client navigation must defer localStorage-backed access enforcement until app:mounted.',
)

// Play includes Arcade and Zuzu games; Home remains for route/tutorial resolution.
const artPageSource = readFileSync('content/art.md', 'utf8')
assert.match(
  artPageSource,
  /channelKey:\s*projects/,
  'The canonical Art page belongs to Projects.',
)

const artChannelSource = readFileSync(
  'content/channels/projects/art.md',
  'utf8',
)
assert.match(
  artChannelSource,
  /channelKey:\s*projects/,
  'The Art navigation entry must stay in the Projects channel.',
)
assert.match(
  artChannelSource,
  /route:\s*\/art/,
  'The Projects-channel Art entry must route to /art.',
)

const workspaceHeaderSource = readFileSync(
  'components/navigation/workspace-header.vue',
  'utf8',
)
const appSource = readFileSync('app.vue', 'utf8')
assert.match(
  appSource,
  /v-if="workspaceSheetOpen"[\s\S]*?class="[^"]*\bright-0\b[^"]*"/,
  'The tutorial/workspace sheet must stay anchored to the right edge beside the header utility icons.',
)
assert.match(
  appSource,
  /\.kr-sheet-slide-enter-from,[\s\S]*?transform:\s*translateX\(1rem\);/,
  'The tutorial/workspace sheet must enter from the right edge.',
)
assert.match(
  appSource,
  /@media \(min-width:\s*768px\)[\s\S]*?\.kr-main\s*\{[\s\S]*?padding-right:\s*var\(--sheet-w\);/,
  'Desktop content must reserve workspace sheet width on the right edge.',
)
assert.doesNotMatch(
  appSource,
  /@media \(min-width:\s*768px\)[\s\S]*?\.kr-main\s*\{[\s\S]*?padding-left:\s*var\(--sheet-w\);/,
  'Desktop content must not keep reserving workspace sheet width on the left edge.',
)
assert.match(
  appSource,
  /const footerVars = computed<CSSProperties>\(\(\) => \{[\s\S]*?left:\s*'0px',[\s\S]*?right:\s*'var\(--sheet-w\)'/,
  'The workspace hand/footer must reserve the right-side sheet width instead of the left.',
)
assert.match(
  workspaceHeaderSource,
  /<NuxtLink\s+to="\/"[\s\S]*?aria-label="Home"[\s\S]*?<Icon name="kind-icon:home"/,
  'A persistent branded Home icon in the shared header must link to the homepage.',
)
assert.ok(
  workspaceHeaderSource.includes('to="/art"'),
  'The fixed workspace header must keep a direct Art Studio shortcut.',
)
assert.ok(
  workspaceHeaderSource.includes(
    "const artActive = computed(() => route.path === '/art')",
  ),
  'The Art shortcut must expose its active state on /art.',
)

const arcadeChannelSource = readFileSync(
  'content/channels/arcade/arcade.md',
  'utf8',
)
assert.match(arcadeChannelSource, /\nroute:\s*\/play\/arcade\n/)
assert.match(arcadeChannelSource, /\nicon:\s*kind-icon:arcade\n/)
assert.match(
  arcadeChannelSource,
  /\ntutorial:\s*\n[\s\S]*?title:\s*Arcade\n[\s\S]*?body:\s*Choose a cabinet and start playing\./,
  'Arcade must keep explicit page-specific tutorial copy.',
)
assert.match(
  arcadeChannelSource,
  /\ntutorial:\s*\n[\s\S]*?image:\s*\/images\/arcade\/arcade-attract-splash\.webp/,
  'Arcade tutorial help must keep its relevant attract-screen artwork.',
)

const projectsChannelSource = readFileSync(
  'content/channels/projects/index.md',
  'utf8',
)
for (const key of ['storybook', 'make', 'learn', 'games', 'toys']) {
  assert.match(
    projectsChannelSource,
    new RegExp(`\\n\\s{4}- key:\\s*${key}\\n`),
    `Play conceptual tutorial must keep the "${key}" section.`,
  )
}
assert.doesNotMatch(
  projectsChannelSource,
  /\ntutorial:\s*\n[\s\S]*?sections:\s*\n[\s\S]*?\n\s{4}- key:\s*arcade\n/,
  'Projects tutorial must explain the channel instead of enumerating individual project tabs.',
)

const workspaceSheetSource = readFileSync(
  'components/navigation/workspace-sheet.vue',
  'utf8',
)
assert.match(
  workspaceSheetSource,
  /const tutorialChannelKey = computed\(\(\) => \{[\s\S]*?tutorialLocation\.value\?\.channel \?\? routeLocation\.value\?\.channel[\s\S]*?modernChannel\?\.tutorial[\s\S]*?if \(modernChannel\) return ''[\s\S]*?resolveLegacyTutorialChannel\(route\.path\)/,
  'Workspace tutorial resolution must resolve the content channel from the page or the route first; the legacy map is reached only when no visible channel claims the route.',
)
assert.doesNotMatch(
  workspaceSheetSource,
  /resolveTutorialChannelFromRoute/,
  'The footer-era route resolver is retired; current destinations resolve through content channels.',
)
assert.match(
  workspaceSheetSource,
  /const tutorialLocation = computed\(\(\) =>\s*routeTabOutrunsPage\.value\s*\?\s*routeLocation\.value/,
  'Dedicated pages never call setPage, so the workspace tutorial must follow the route when pageStore still describes another channel.',
)

for (const source of [
  workspaceSheetSource,
  readFileSync('components/navigation/channel-select.vue', 'utf8'),
]) {
  assert.ok(
    source.includes(
      'channelContentStore.resolveActiveLocation({ path: route.path })',
    ),
    'Channel picker and workspace sheet must resolve the active channel from the route, as workspace-header does.',
  )
}

for (const [file, source] of [
  ['workspace-sheet', workspaceSheetSource],
  [
    'workspace-header',
    readFileSync('components/navigation/workspace-header.vue', 'utf8'),
  ],
  [
    'channel-select',
    readFileSync('components/navigation/channel-select.vue', 'utf8'),
  ],
] as const) {
  assert.ok(
    source.includes('pageStore.describesPath(route.path)'),
    `${file} must treat pageStore as stale when it describes another path, not only another channel: moving between two tabs of one channel kept the first tab's tutorial (Silas, 2026-10-10).`,
  )
}
assert.match(
  readFileSync('stores/pageStore.ts', 'utf8'),
  /function describesPath\(path: string\): boolean/,
  'pageStore must expose describesPath for route-staleness checks.',
)

const adminChannelSource = readFileSync(
  'content/channels/admin/index.md',
  'utf8',
)
for (const key of ['art', 'projects', 'studios', 'people', 'shelf']) {
  assert.match(
    adminChannelSource,
    new RegExp(`\\n\\s{4}- key:\\s*${key}\\n`),
    `Admin conceptual tutorial must keep the "${key}" section.`,
  )
}

const navigationMoves = [
  {
    slug: 'zuzu-lair',
    from: 'arcade',
    to: 'admin',
    route: '/admin/zuzu-lair',
    admin: true,
  },
  {
    slug: 'tzaddik-gallery',
    from: 'projects',
    to: 'admin',
    route: '/tzaddik-gallery',
    admin: true,
  },
  {
    slug: 'ruler-hooked',
    from: 'admin',
    to: 'arcade',
    route: '/play/ruler-hooked',
    admin: false,
  },
  {
    slug: 'brainstorm',
    from: 'projects',
    to: 'admin',
    route: '/brainstorm',
    admin: true,
  },
  {
    slug: 'zuzu-shifting-lands',
    from: 'projects',
    to: 'arcade',
    route: '/play/zuzu-shifting-lands',
    admin: false,
  },
  {
    slug: 'zuzu-pinball',
    from: 'projects',
    to: 'arcade',
    route: '/play/zuzu-pinball',
    admin: false,
  },
  {
    slug: 'zuzu-showdown',
    from: 'projects',
    to: 'arcade',
    route: '/play/zuzu-showdown',
    admin: false,
  },
  {
    slug: 'zuzu-gamebook',
    from: 'projects',
    to: 'arcade',
    route: '/play/zuzu-gamebook',
    admin: false,
  },
  {
    slug: 'arcade',
    from: 'projects',
    to: 'arcade',
    route: '/play/arcade',
    admin: false,
  },
] as const

const newline = String.fromCharCode(10)
for (const { slug, from, to, route, admin } of navigationMoves) {
  const relocated = `content/channels/${to}/${slug}.md`
  const tab = readFileSync(relocated, 'utf8')
  assert.ok(tab.includes(`${newline}channelKey: ${to}${newline}`))
  assert.ok(tab.includes(`${newline}route: ${route}${newline}`))
  assert.equal(tab.includes(`${newline}requiredRole: ADMIN${newline}`), admin)
  assert.equal(existsSync(`content/channels/${from}/${slug}.md`), false)
  if (slug !== 'arcade') {
    assert.deepEqual(PROJECT_PLACEMENTS[slug], {
      channelKey: to,
      tabKey: slug,
      route,
    })
  }
}

for (const key of ['arcade', 'projects', 'admin', 'home']) {
  const index = readFileSync(`content/channels/${key}/index.md`, 'utf8')
  assert.match(index, /\ntutorial:\s*\n[\s\S]*?overview:/)
}
const channelSort = (key: string) =>
  Number(
    readFileSync(`content/channels/${key}/index.md`, 'utf8').match(
      /^sort: (\d+)$/m,
    )?.[1],
  )
assert.ok(
  ['arcade', 'projects', 'admin'].every(
    (key) => channelSort(key) < channelSort('home'),
  ),
)
for (const name of [
  'storybook',
  'bots',
  'characters',
  'facets',
  'gallery',
  'model-builder',
  'rewards',
  'scenarios',
]) {
  const tab = readFileSync(`content/channels/projects/story-${name}.md`, 'utf8')
  assert.match(tab, /^channelKey: projects$/m)
  if (name !== 'storybook') assert.match(tab, /^parentTabKey: storybook$/m)
}
const storybookNav = readFileSync(
  'content/channels/projects/story-storybook.md',
  'utf8',
)
const storybookPage = readFileSync('content/storybook.md', 'utf8')
const storybookIcon = readFileSync('assets/icons/storybook.svg', 'utf8')
for (const metadata of [storybookNav, storybookPage]) {
  assert.match(
    metadata,
    /^icon: kind-icon:storybook$/m,
    'Storybook must use the same dedicated emblem in navigation and page metadata.',
  )
}
assert.match(storybookNav, /^route: \/storybook$/m)
assert.match(storybookIcon, /<svg[^>]*viewBox="0 0 48 48"/)
assert.match(storybookIcon, /fill="#51ddf3"/)
assert.match(storybookIcon, /fill="#ff77be"/)
assert.match(storybookIcon, /fill="#ffe46b"/)
assert.equal(existsSync('content/channels/storybook/index.md'), false)
assert.ok(
  readFileSync('content/brainstorm.md', 'utf8').includes(
    `${newline}channelKey: admin${newline}`,
  ),
)

const rulerPlayPage = readFileSync('content/play/ruler-hooked.md', 'utf8')
assert.match(rulerPlayPage, /^channelKey: arcade$/m)
assert.match(rulerPlayPage, /^tabKey: ruler-hooked$/m)
assert.match(rulerPlayPage, /^:ruler-hooked-page$/m)
assert.equal(existsSync('content/admin/ruler-hooked.md'), false)

const nuxtConfig = readFileSync('nuxt.config.ts', 'utf8')
assert.match(
  nuxtConfig,
  /'\/admin\/ruler-hooked': \{\s*redirect: \{ to: '\/play\/ruler-hooked', statusCode: 301 \}/,
  'Old ruler admin bookmarks must redirect to Play.',
)
assert.match(
  nuxtConfig,
  /'\/plan\/projects\/ruler-hooked': \{\s*redirect: \{ to: '\/play\/ruler-hooked', statusCode: 301 \}/,
)
assert.match(
  nuxtConfig,
  /urlPattern:.*play.*ruler-hooked/,
  'The offline game document cache must target the new Play route.',
)
const dashboardSource = readFileSync('stores/helpers/dashboardHelper.ts', 'utf8')
assert.match(
  dashboardSource,
  /key: 'ruler-hooked',[\s\S]*?route: '\/play\/ruler-hooked'/,
)

/*
 * THE TUTORIAL-COMPLETENESS CONTRACT, for every current channel (kind_robots
 * #3379). It started as an Admin-only rule; Zuzu, Arcade, Projects/Storybook
 * and the account hub's Home channel are held to it too. Every channel needs an
 * authored overview with sections, and every routed tab needs its own authored
 * page help -- title and body written for that page, not inherited catalogue
 * text -- plus artwork. A tab may switch its help off only when it is not a
 * page of its own: a route-less submenu parent, or a subtab that selects a mode
 * of its parent's page by query string while the parent carries the help.
 */
function channelMarkdownFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`
    if (entry.isDirectory()) return channelMarkdownFiles(path)
    return entry.name.endsWith('.md') ? [path] : []
  })
}

const contentItems: ChannelContentItem[] = [
  ...channelMarkdownFiles('content/channels').map((file) => ({
    ...(parseYaml(
      readFileSync(file, 'utf8').match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '',
    ) as ChannelContentItem),
    path: file,
  })),
]
const contentItemByLocation = new Map(
  contentItems
    .filter((item) => item.contentType === 'tab')
    .map((item) => [`${item.channelKey}/${item.tabKey}`, item]),
)
const contentChannels = resolveChannels(contentItems)
const hasText = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0
const routePath = (route: string) => route.split('?')[0] ?? ''

assert.deepEqual(
  contentChannels.map((channel) => channel.channelKey).sort(),
  ['admin', 'arcade', 'home', 'projects'],
  'The tutorial contract must cover every current channel.',
)

let tabsWithAuthoredHelp = 0
for (const channel of contentChannels) {
  assert.equal(
    channel.tutorial?.sectionsSource,
    'authored',
    `${channel.channelKey} needs an authored channel tutorial with sections, not one generated from its tab list.`,
  )
  assert.ok(
    hasText(channel.tutorial?.overview) && channel.tutorial?.sections.length,
    `${channel.channelKey} needs an authored tutorial overview and at least one section.`,
  )

  for (const tab of channel.tabs) {
    const location = `${channel.channelKey}/${tab.tabKey}`
    const raw = contentItemByLocation.get(location)
    assert.ok(raw, `${location} was resolved without a content item.`)

    if (!tab.route) {
      assert.ok(
        channel.tabs.some((child) => child.parentTabKey === tab.tabKey),
        `${location} has no route, so it must be a submenu parent.`,
      )
      continue
    }

    if (!tab.tutorial) {
      const parent = channel.tabs.find(
        (candidate) => candidate.tabKey === tab.parentTabKey,
      )
      assert.ok(
        parent?.tutorial?.explicit &&
          routePath(parent.route) === routePath(tab.route) &&
          tab.route.includes('?'),
        `${location} switched its page help off, which is allowed only for a query-selected mode of a parent page that carries the help.`,
      )
      continue
    }

    assert.ok(
      tab.tutorial.explicit &&
        hasText(raw.tutorial?.title) &&
        hasText(raw.tutorial?.body),
      `${location} (${raw.path ?? 'generated'}) must carry authored page help: tutorial.title and tutorial.body written for ${tab.route}.`,
    )
    assert.ok(
      hasText(tab.tutorial.image),
      `${location} page help needs artwork (tutorial.image, the tab image, or the channel artwork convention).`,
    )
    tabsWithAuthoredHelp += 1
  }
}
assert.ok(tabsWithAuthoredHelp > 60, 'Channel tab files were not read.')

/*
 * TUTORIALS NEVER REVEAL INACCESSIBLE DESTINATIONS. Role filtering already
 * drops a hidden tab's page help and, for tab-generated tutorials, its section.
 * Authored channel copy is written by hand, so check it here: the copy of
 * every channel a viewer can see must not name a destination their role
 * hides. Sign-in gates (requiredPermission) are exempt -- help may say "once
 * you are signed in" -- but a role-gated tab is invisible, not locked.
 * Superkate Services is filtered per account in channelContentStore rather
 * than by role, so it counts as hidden for every viewer here.
 */
const accountScopedTabs = new Set(['projects/stylist'])
for (const role of ['USER', 'CHILD', 'FAMILY'] as const) {
  const visible = filterChannelsByRole(contentChannels, role)

  for (const channel of visible) {
    const full = contentChannels.find(
      (candidate) => candidate.channelKey === channel.channelKey,
    )!
    const isOpenable = (tabKey: string) =>
      !accountScopedTabs.has(`${channel.channelKey}/${tabKey}`) &&
      channel.tabs.some((open) => open.tabKey === tabKey)
    const openableLabels = new Set(
      full.tabs.filter((tab) => isOpenable(tab.tabKey)).map((tab) => tab.label),
    )
    const hidden = full.tabs.filter(
      (tab) => !isOpenable(tab.tabKey) && !openableLabels.has(tab.label),
    )
    const copy = [
      channel.description,
      channel.summary,
      channel.tutorial?.overview,
      ...(channel.tutorial?.sections ?? []).flatMap((section) => [
        section.title,
        section.body,
      ]),
    ].join('\n')

    for (const tab of hidden) {
      assert.ok(
        !copy.includes(tab.label),
        `${channel.channelKey} channel copy names "${tab.label}", which a ${role} viewer cannot open.`,
      )
    }
  }

  assert.ok(
    visible.every(
      (channel) =>
        channel.requiredRole !== 'ADMIN' &&
        channel.tabs.every((tab) => tab.requiredRole !== 'ADMIN'),
    ),
    `Role filtering must remove every ADMIN channel and tab, and with them their help, for a ${role} viewer.`,
  )
}

const channelContentStoreSource = readFileSync(
  'stores/channelContentStore.ts',
  'utf8',
)
assert.match(
  channelContentStoreSource,
  /function getChannel\(channelKey: string\) \{[\s\S]*?visibleChannels\.value\.find/,
  'Tutorial lookups (getChannel/getTab) must read the role- and permission-filtered channels, so page help for an inaccessible tab cannot be fetched.',
)
assert.ok(
  workspaceSheetSource.includes(
    ':tab="pageTutorial ? undefined : tutorialTabKey || undefined"',
  ),
  'Workspace tutorials must pass the active modern tab into the tutorial flyer unless the sheet already leads with that page tutorial.',
)
assert.match(
  workspaceSheetSource,
  /<section v-if="pageTutorial"[\s\S]*?pageTutorial\.image[\s\S]*?pageTutorial\.body/,
  'An ordinary page must open the workspace sheet on its own tutorial image and copy, not on an intro card behind a toggle.',
)

const tutorialFlyerSource = readFileSync(
  'components/navigation/tutorial-flyer.vue',
  'utf8',
)
assert.ok(
  tutorialFlyerSource.includes('v-if="activeTabTutorial"'),
  'Tutorial flyer must surface explicitly authored active-page help alongside conceptual channel guidance.',
)
assert.equal(
  workspaceHeaderSource.includes('to="/play/arcade"'),
  false,
  'Arcade belongs in Play tabs, not as a duplicate fixed header button.',
)
assert.ok(
  workspaceHeaderSource.includes('resolvedTabs.length'),
  'Play must retain the shared desktop tab picker.',
)

assert.equal(tutorialPageKey('play', 'arcade'), 'play/arcade')
assert.equal(tutorialPageKey('play', ' '), '')
assert.match(
  workspaceHeaderSource,
  /tutorialUnseen[\s\S]*?'tutorial-unseen /,
  'The tutorial toggle must highlight a page whose tutorial this browser has not opened yet.',
)
assert.match(
  workspaceHeaderSource,
  /if \(!tab\.tutorial\?\.explicit\) return ''/,
  'Only pages with authored help may light the unseen-tutorial highlight.',
)
assert.match(
  workspaceHeaderSource,
  /if \(open && pageKey\) tutorialStore\.markPageSeen\(pageKey\)/,
  'Opening the workspace sheet on a page must mark its tutorial seen.',
)
assert.match(
  workspaceHeaderSource,
  /onMounted\(\(\) => tutorialStore\.hydrate\(\)\)/,
  'Seen-page state must hydrate after mount so the server and client render the same toggle.',
)

const projectFrontSource = readFileSync(
  'components/conductor/project-front-page.vue',
  'utf8',
)
assert.equal(
  /view\.sections|\{\{\s*view\.description\s*\}\}/.test(projectFrontSource),
  false,
  'Project front pages must leave description and explainer copy to the tab tutorial rather than stacking intro panels on the page.',
)

const legacySessionSource = readFileSync(
  'plugins/legacy-guest-session.client.ts',
  'utf8',
)
const sessionMountedIndex = legacySessionSource.indexOf("hook('app:mounted'")
const sessionInitializeIndex = legacySessionSource.indexOf(
  'userStore.initialize()',
)
assert.ok(
  sessionMountedIndex >= 0 &&
    sessionInitializeIndex >= 0 &&
    sessionMountedIndex < sessionInitializeIndex,
  'Saved-session restoration must not initialize the user store before app:mounted.',
)

const loaderSource = readFileSync('components/admin/kind-loader.vue', 'utf8')
assert.equal(
  loaderSource.includes('onBeforeMount('),
  false,
  'The startup loader must not mutate app/store state from onBeforeMount during hydration.',
)
assert.match(
  loaderSource,
  /onMounted\(\(\) => \{\s+void ensureStoresInitialized\(\)[\s\S]*?if \(startupMode\.value !== 'none'\) return[\s\S]*?emitReadyOnce\(\)/,
  'Store initialization and the reload-mode pageReady handoff must begin from onMounted.',
)

console.log(
  `Navigation route access contract passed: unrelated, public, authenticated, member, shared-route, admin, and hydration-safe startup behavior verified; ${contentChannels.length} channels carry authored overviews and ${tabsWithAuthoredHelp} routed tabs carry authored page help, with no role-hidden destination named in channel copy.`,
)
