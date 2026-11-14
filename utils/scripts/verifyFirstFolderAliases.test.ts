import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  buildFirstFolderAliases,
  firstFolderOf,
  loadFirstFolderAliases,
  readChannelTabRoutes,
  readRootPageFolders,
} from '../routing/firstFolderAliases'

const rootDir = fileURLToPath(new URL('../../', import.meta.url))
const routes = readChannelTabRoutes(`${rootDir}content/channels`)
const rootPages = new Set(readRootPageFolders(`${rootDir}pages`))
const aliases = loadFirstFolderAliases(rootDir)

assert.equal(firstFolderOf('/play/arcade'), '/arcade')
assert.equal(firstFolderOf('/play/comics/studio'), '/comics')
assert.equal(firstFolderOf('/storybook'), null)
assert.equal(firstFolderOf('/play/'), null)

assert.deepEqual(
  buildFirstFolderAliases(
    ['/play/arcade', '/play/brainstorm', '/brainstorm', '/play/memory'],
    ['/memory'],
  ),
  { '/arcade': { redirect: { to: '/play/arcade', statusCode: 302 } } },
  'an alias never shadows a live route, a root page or an explicit rule',
)

assert.deepEqual(aliases['/arcade'], {
  redirect: { to: '/play/arcade', statusCode: 302 },
})

const playRoutes = routes.filter((route) => route.startsWith('/play/'))
assert.ok(playRoutes.length >= 20, 'channel tabs still declare Play routes')

for (const route of playRoutes) {
  const folder = firstFolderOf(route)
  assert.ok(folder, `${route} has a first folder`)
  const reachable =
    aliases[folder]?.redirect.to === route ||
    routes.includes(folder) ||
    rootPages.has(folder) ||
    Boolean(aliases[folder])
  assert.ok(reachable, `${folder} reaches a page (wanted ${route})`)
}

for (const alias of Object.keys(aliases)) {
  assert.ok(!rootPages.has(alias), `${alias} does not shadow a root page`)
  assert.ok(!routes.includes(alias), `${alias} does not shadow a channel tab`)
}

assert.match(
  readFileSync(`${rootDir}nuxt.config.ts`, 'utf8'),
  /routeRules: \{\n\s+\.\.\.loadFirstFolderAliases\(/,
  'nuxt.config spreads the first-folder aliases into routeRules',
)

console.log(
  `first-folder aliases: ${Object.keys(aliases).length} (${Object.keys(aliases)
    .sort()
    .join(', ')})`,
)
