import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  DEFAULT_SHARE_IMAGE,
  SHARE_PREVIEWS,
  SITEMAP_PATHS,
  SITE_ORIGIN,
  STANDALONE_GAME_PATHS,
  absoluteSiteUrl,
  buildRobotsTxt,
  buildSitemapXml,
  buildWebsiteJsonLd,
  findSharePreview,
  normalizeSharePath,
  sharePreviewImageUrl,
  siteTabTitle,
} from '../sharePreview'

const repoPath = (path: string) =>
  fileURLToPath(new URL(`../../${path}`, import.meta.url))
const read = (path: string) => readFileSync(repoPath(path), 'utf8')

assert.equal(SITE_ORIGIN, 'https://kindrobots.org')

const publicRoutes = [
  '/play/arcade',
  '/play/comet-city-academy',
  '/play/game-of-captains',
  '/play/crystal-street',
  '/play/emperor-of-dust',
  '/play/save-the-plumber',
  '/play/rainbow-bullet-hell-space-princess',
  '/play/zuzu-pinball',
  '/play/zuzu-shifting-lands',
  '/play/zuzu-gamebook',
  '/play/zuzu-showdown',
  '/play/ecotone',
  '/play/shifting-desks',
  '/play/aquarium',
  '/play/memory',
  '/play/mandarin',
  '/play/chessweeper',
  '/play/ruler-hooked',
  '/storybook',
  '/art',
]
assert.deepEqual(
  SHARE_PREVIEWS.map((preview) => preview.route),
  publicRoutes,
)
assert.equal(
  new Set(SHARE_PREVIEWS.map((preview) => preview.route)).size,
  SHARE_PREVIEWS.length,
)

for (const preview of [...SHARE_PREVIEWS, { image: DEFAULT_SHARE_IMAGE }]) {
  assert.match(preview.image, /^\/[^?#]+\.(webp|png|jpe?g)$/i, preview.image)
  if (!preview.image.startsWith('/images/')) {
    assert.ok(
      existsSync(repoPath(`public${preview.image}`)),
      `${preview.image} must exist in public/`,
    )
  }
}

for (const preview of SHARE_PREVIEWS) {
  assert.ok(preview.title, `${preview.route} needs a share title`)
  assert.ok(preview.description, `${preview.route} needs a share description`)
}

assert.equal(normalizeSharePath(''), '/')
assert.equal(normalizeSharePath('/'), '/')
assert.equal(normalizeSharePath('/play/memory/'), '/play/memory')
assert.equal(normalizeSharePath('/play//memory?level=2#top'), '/play/memory')
assert.equal(normalizeSharePath('play/memory'), '/play/memory')

assert.equal(absoluteSiteUrl('/'), 'https://kindrobots.org/')
assert.equal(
  absoluteSiteUrl('/play/crystal-street?utm_source=chat'),
  'https://kindrobots.org/play/crystal-street',
)
assert.equal(
  absoluteSiteUrl('https://example.com/a.webp'),
  'https://example.com/a.webp',
)

assert.equal(
  findSharePreview('/play/crystal-street')?.image,
  '/crystal-street/cover.webp',
)
assert.equal(
  findSharePreview('/play/arcade/bumper-bubbles?mode=boss')?.route,
  '/play/arcade',
)
assert.equal(findSharePreview('/play/aquarium/browse')?.route, '/play/aquarium')
assert.equal(findSharePreview('/art/gallery')?.route, '/art')
assert.equal(findSharePreview('/art-archive'), null)
assert.equal(findSharePreview('/play/memory-dungeon'), null)
// 2026-11-20 PT: both public games shared as "Kind Robots" / "Welcome to Kind
// Robots" or "Ruler Hooked" with the generic arcade splash.
assert.equal(findSharePreview('/play/chessweeper')?.title, 'Chessweeper')
assert.equal(
  findSharePreview('/play/ruler-hooked')?.title,
  'The Ruler Is Hooked',
)
assert.equal(findSharePreview('/'), null)

assert.equal(
  sharePreviewImageUrl('/play/emperor-of-dust'),
  'https://kindrobots.org/emperor-of-dust/intro/fortress.webp',
)
assert.equal(
  sharePreviewImageUrl('/about'),
  `https://kindrobots.org${DEFAULT_SHARE_IMAGE}`,
)
assert.equal(
  sharePreviewImageUrl('/play/comet-city-academy'),
  'https://kindrobots.org/comet-city-academy/front/dashboard-highlight.webp',
)

const robots = buildRobotsTxt()
assert.match(robots, /^User-agent: \*$/m)
assert.match(robots, /^Allow: \/$/m)
assert.match(robots, /^Disallow: \/admin$/m)
assert.match(robots, /^Disallow: \/api\/$/m)
assert.match(robots, /^Sitemap: https:\/\/kindrobots\.org\/sitemap\.xml$/m)

assert.deepEqual(SITEMAP_PATHS.slice(0, 4), [
  '/',
  '/about',
  '/giving',
  '/navigation',
])
const sitemap = buildSitemapXml()
assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>/)
assert.match(
  sitemap,
  /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/,
)
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  (match) => match[1],
)
assert.deepEqual(
  locs,
  SITEMAP_PATHS.map((path) => absoluteSiteUrl(path)),
)
for (const loc of locs) {
  assert.match(loc ?? '', /^https:\/\/kindrobots\.org\/[^?&#]*$/)
}
for (const route of publicRoutes) {
  assert.ok(locs.includes(`https://kindrobots.org${route}`), route)
}
// Standalone public games are listed and each has a real page and an arcade tab.
for (const route of STANDALONE_GAME_PATHS) {
  assert.ok(locs.includes(`https://kindrobots.org${route}`), route)
  const slug = route.replace('/play/', '')
  assert.ok(existsSync(repoPath(`pages/play/${slug}.vue`)), `${route} page`)
  assert.ok(
    existsSync(repoPath(`content/channels/arcade/${slug}.md`)),
    `${route} arcade tab`,
  )
}
assert.equal(new Set(locs).size, locs.length, 'sitemap has no duplicates')

const robotsRoute = read('server/routes/robots.txt.ts')
assert.match(robotsRoute, /buildRobotsTxt/)
assert.match(robotsRoute, /'text\/plain; charset=utf-8'/)
const sitemapRoute = read('server/routes/sitemap.xml.ts')
assert.match(sitemapRoute, /buildSitemapXml/)
assert.match(sitemapRoute, /'application\/xml; charset=utf-8'/)
assert.doesNotMatch(sitemapRoute, /prisma/)
assert.equal(existsSync(repoPath('public/robots.txt')), false)
assert.equal(existsSync(repoPath('public/sitemap.xml')), false)

const app = read('app.vue')
assert.match(app, /from '@\/utils\/sharePreview'/)
for (const key of [
  'ogType',
  'ogSiteName',
  'ogTitle',
  'ogDescription',
  'ogUrl',
  'ogImage',
  'twitterCard',
  'twitterTitle',
  'twitterDescription',
  'twitterImage',
]) {
  assert.match(app, new RegExp(`\\b${key}:`), `app.vue useSeoMeta ${key}`)
}
assert.match(app, /twitterCard: 'summary_large_image'/)
// Share descriptions never fall back to a stale store subtitle ("Welcome to
// Kind Robots") on dedicated pages that don't describe this route.
assert.doesNotMatch(app, /^\s*pageStore\.subtitle \|\|/m)
assert.match(
  app,
  /pageStore\.describesPath\(route\.path\) \? pageStore\.subtitle : ''/,
)
// Every page declares one canonical URL built from the query-free share URL.
assert.match(app, /rel: 'canonical', href: \(\) => shareUrl\.value/)

// Home page names the site for search results (schema.org WebSite).
const website = JSON.parse(buildWebsiteJsonLd())
assert.equal(website['@type'], 'WebSite')
assert.equal(website.name, 'Kind Robots')
assert.equal(website.url, 'https://kindrobots.org/')
assert.match(app, /type: 'application\/ld\+json'/)
assert.match(app, /route\.path === '\/'/)
assert.equal(
  absoluteSiteUrl('/play/arcade/?game=zuzu-ghost-trail'),
  'https://kindrobots.org/play/arcade',
)

// Tabs, bookmarks and search results name the site exactly once.
assert.equal(siteTabTitle('Storybook'), 'Storybook | Kind Robots')
assert.equal(siteTabTitle('  Support '), 'Support | Kind Robots')
assert.equal(siteTabTitle(''), 'Kind Robots')
assert.equal(siteTabTitle(undefined), 'Kind Robots')
assert.equal(siteTabTitle('Kind Robots'), 'Kind Robots')
assert.equal(
  siteTabTitle('Mandarin Tutor | Kind Robots'),
  'Mandarin Tutor | Kind Robots',
)
assert.equal(
  siteTabTitle('Battery Maze · Kind Robots Arcade'),
  'Battery Maze · Kind Robots Arcade',
)
assert.match(app, /titleTemplate: \(title\) => siteTabTitle\(title\)/)

// The installed-app / home-screen description matches the front door.
const nuxtConfig = read('nuxt.config.ts')
assert.doesNotMatch(nuxtConfig, /friendly AI playground/)
assert.match(nuxtConfig, /description:\s*'Free handmade browser games/)

// kr-arcade/t-169 + t-171: the daily live check fails on unfurl problems and
// cold-opens every showcase cabinet link.
const shareCheckWorkflow = read('.github/workflows/arcade-share-live-check.yml')
assert.match(
  shareCheckWorkflow,
  /github\.event_name == 'schedule' \|\| inputs\.strict_unfurl/,
)
assert.match(shareCheckWorkflow, /checkArcadeColdOpenLive\.mjs/)

console.log('share preview contract OK')
