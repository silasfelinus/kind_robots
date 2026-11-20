import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { FRONT_DOOR_ALIASES } from '../routing/frontDoorAliases'
import {
  readChannelTabRoutes,
  readRootPageFolders,
} from '../routing/firstFolderAliases'

// 2026-11-17 PT live audit: /play, /projects, /donate, /shop and every
// mistyped link answered HTTP 200 with a bare "No Nuxt Content page was found"
// panel and the generic site title. These checks keep the front door honest.

const root = process.cwd()
const read = (file: string) => readFileSync(join(root, file), 'utf8')

const channelRoutes = new Set(
  readChannelTabRoutes(join(root, 'content/channels')),
)
const rootPages = new Set(readRootPageFolders(join(root, 'pages')))

function contentPathExists(route: string): boolean {
  const slug = route === '/' ? 'index' : route.slice(1)
  return (
    existsSync(join(root, 'content', `${slug}.md`)) ||
    existsSync(join(root, 'content', slug, 'index.md'))
  )
}

function pageFileExists(route: string): boolean {
  const slug = route.slice(1)
  return (
    existsSync(join(root, 'pages', `${slug}.vue`)) ||
    existsSync(join(root, 'pages', slug, 'index.vue'))
  )
}

// 1. Every alias lands on a real page, never on another alias or a 404.
for (const [from, rule] of Object.entries(FRONT_DOOR_ALIASES)) {
  const to = rule.redirect.to
  assert.equal(rule.redirect.statusCode, 302, `${from} stays a 302 shortcut`)
  assert.notEqual(from, to, `${from} does not redirect to itself`)
  assert.ok(!(to in FRONT_DOOR_ALIASES), `${from} -> ${to} is not a chain`)
  assert.ok(
    channelRoutes.has(to) || contentPathExists(to) || pageFileExists(to),
    `${from} -> ${to} reaches a channel tab, content page or Vue page`,
  )
  // An alias must not hide a real page at the same URL.
  assert.ok(!contentPathExists(from), `${from} does not shadow content`)
  assert.ok(!pageFileExists(from), `${from} does not shadow a Vue page`)
  assert.ok(!channelRoutes.has(from), `${from} does not shadow a channel tab`)
}

// The hubs a visitor most often types are covered.
for (const hub of [
  '/play',
  '/projects',
  '/donate',
  '/shop',
  '/contact',
  '/help',
  '/gallery',
]) {
  assert.ok(hub in FRONT_DOOR_ALIASES, `${hub} has a front-door alias`)
}
assert.ok(rootPages.has('/play'), '/play is a folder with no index page')

// 2. nuxt.config spreads the aliases into routeRules.
assert.match(
  read('nuxt.config.ts'),
  /\.\.\.FRONT_DOOR_ALIASES,/,
  'nuxt.config spreads FRONT_DOOR_ALIASES into routeRules',
)

// 3. The catch-all answers unknown URLs with a real 404, kept out of search,
//    and offers a way back instead of developer jargon.
const slugPage = read('pages/[...slug].vue')
assert.match(
  slugPage,
  /setResponseStatus\(event, 404/,
  'unknown content paths return HTTP 404 during SSR',
)
assert.match(slugPage, /robots: \(\) => \(isNotFound\.value \? 'noindex'/)
assert.match(slugPage, /'Page not found \| Kind Robots'/)
assert.doesNotMatch(
  slugPage,
  /No Nuxt Content page was found/,
  'visitors never see framework jargon on the not-found panel',
)
for (const link of ['/play/arcade', '/', '/giving']) {
  assert.ok(
    slugPage.includes(`<NuxtLink to="${link}"`),
    `not-found panel links back to ${link}`,
  )
}

// 4. The live probe exists and is wired so the check can be re-run after deploy.
assert.ok(
  readdirSync(join(root, 'utils/scripts')).includes(
    'checkFrontDoorRoutesLive.mjs',
  ),
  'live front-door probe exists',
)

console.log(
  `front door: ${Object.keys(FRONT_DOOR_ALIASES).length} hub aliases resolve; unknown URLs return 404 with a way back`,
)
