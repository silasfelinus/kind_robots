import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
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

const middlewareSource = readFileSync(
  'middleware/navigation-access.global.ts',
  'utf8',
)
assert.match(
  middlewareSource,
  /if \(nuxtApp\.isHydrating && nuxtApp\.payload\.serverRendered\) \{[\s\S]*?nuxtApp\.hook\('app:mounted',[\s\S]*?enforceNavigationAccess/,
  'Initial SSR client navigation must defer localStorage-backed access enforcement until app:mounted.',
)

// Silas, 2026-10-06: Play became Storybook, Plan folded away, and Art joined
// the public Projects channel (everything not Storybook and not admin-gated).
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
  'content/channels/projects/arcade.md',
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
for (const key of ['make', 'learn', 'games', 'toys']) {
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
  /const tutorialChannelKey = computed\(\(\) => \{[\s\S]*?tutorialLocation\.value\?\.channel[\s\S]*?modernChannel\?\.tutorial[\s\S]*?resolveTutorialChannelFromRoute\(route\.path\)/,
  'Workspace tutorial resolution must prefer modern content channels before legacy route fallback.',
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

const adminTabFiles = readdirSync('content/channels/admin').filter(
  (file) => file.endsWith('.md') && file !== 'index.md',
)
for (const file of adminTabFiles) {
  const source = readFileSync(`content/channels/admin/${file}`, 'utf8')
  const frontMatter = source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? ''
  assert.match(
    frontMatter,
    /\ntutorial:\s*\n\s+(?:enabled:\s*false|title:[^\n]+\n\s+body:)/,
    `Admin tab ${file} must carry explicit page help (or deliberately disable it).`,
  )
}
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
assert.ok(
  workspaceHeaderSource.includes('to="/play/arcade"'),
  'The fixed workspace header must keep a direct Arcade shortcut.',
)
assert.ok(
  workspaceHeaderSource.includes('name="kind-icon:arcade"'),
  'The Arcade shortcut must use the Arcade surface icon.',
)
assert.ok(
  workspaceHeaderSource.includes(
    "const arcadeActive = computed(() => route.path.startsWith('/play/arcade'))",
  ),
  'The Arcade shortcut must stay active throughout the Arcade route tree.',
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
  'Navigation route access contract passed: unrelated, public, authenticated, member, shared-route, admin, and hydration-safe startup behavior verified.',
)
