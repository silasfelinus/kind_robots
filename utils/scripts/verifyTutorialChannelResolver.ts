// /utils/scripts/verifyTutorialChannelResolver.ts
//
// Regression test for resolveLegacyTutorialChannel() in tutorialCards.ts.
//
// Since kind_robots#3379 (2026-10-14) the legacy map is a fallback for public
// standalone pages only. Every current channel destination resolves its help
// from content/channels metadata, so this script also proves that no legacy
// route shadows a content tab route: a legacy entry there would bring back the
// stale footer-era copy the modern tutorials replaced.
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  legacyTutorialRouteMap,
  resolveLegacyTutorialChannel,
  tutorialChannelKeys,
  tutorialChannels,
} from '@/stores/helpers/tutorialCards'

// (1) Exact match always wins even when a shorter route from a different
// key would also match as a prefix -- and even when that shorter route is
// reached first during iteration.
{
  const routeMap = {
    games: '/shop',
    art: '/shop/gallery',
  }
  const keys = ['games', 'art'] as const

  assert.equal(
    resolveLegacyTutorialChannel('/shop/gallery', routeMap, keys),
    'art',
    'an exact match on a longer route must win over an earlier-seen prefix match on a shorter route from a different key',
  )
}

// (2) Prefix match picks the most specific (longest) route across
// different keys, via the cross-key bestLen tie-break.
{
  const routeMap = {
    games: '/shop',
    art: '/shop/gallery',
  }
  const keys = ['games', 'art'] as const

  assert.equal(
    resolveLegacyTutorialChannel('/shop/gallery/extra', routeMap, keys),
    'art',
    'prefix matching must prefer the longer, more specific route across different keys, not the first one seen',
  )
  assert.equal(
    resolveLegacyTutorialChannel('/shop/other', routeMap, keys),
    'games',
    'a path matching only the shorter route must still resolve to its key',
  )
}

// (3) query/hash stripping still works with the injectable parameters.
{
  const routeMap = { games: '/shop' }
  const keys = ['games'] as const
  assert.equal(
    resolveLegacyTutorialChannel('/shop?ref=footer#top', routeMap, keys),
    'games',
    'query strings and hash fragments must be stripped before matching',
  )
}

// (4) The real standalone exceptions still resolve, and nothing else does.
for (const [key, routes] of Object.entries(legacyTutorialRouteMap)) {
  for (const route of Array.isArray(routes) ? routes : [routes]) {
    assert.equal(resolveLegacyTutorialChannel(route), key)
    assert.equal(resolveLegacyTutorialChannel(`${route}/sub-page`), key)
  }
}
assert.deepEqual(
  [...tutorialChannelKeys].sort(),
  Object.keys(legacyTutorialRouteMap).sort(),
  'every legacy tutorial needs exactly one standalone route, and every standalone route a tutorial',
)
for (const key of tutorialChannelKeys) {
  const channel = tutorialChannels[key]
  assert.ok(channel.overview.trim(), `${key} needs an overview`)
  assert.ok(channel.sections.length, `${key} needs at least one section`)
  for (const section of channel.sections) {
    assert.ok(section.title.trim() && section.body.trim() && section.image)
  }
}

// (5) Current channel destinations are never answered by the legacy map.
function markdownFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) return markdownFiles(path)
    return entry.name.endsWith('.md') ? [path] : []
  })
}

const contentRoutes = markdownFiles('content/channels')
  .map(
    (file) =>
      readFileSync(file, 'utf8').match(/^route:\s*(\S+)\s*$/m)?.[1] ?? '',
  )
  .filter((route) => route.startsWith('/'))

assert.ok(contentRoutes.length > 50, 'content channel routes were not read')

for (const route of new Set(contentRoutes)) {
  assert.equal(
    resolveLegacyTutorialChannel(route),
    null,
    `${route} is a content channel destination; its help belongs in content/channels metadata, not the legacy tutorial map`,
  )
}

for (const retired of [
  '/storybook',
  '/stories',
  '/dreams',
  '/characters',
  '/rewards',
  '/bots',
  '/art',
  '/conductor',
  '/mermaids',
  '/play/challenges',
  '/plan/newsfeed',
  '/plan/watchlist',
  '/plan/voice-lab',
  '/admin/ruler-hooked',
  '/play/davinci',
  '/',
]) {
  assert.equal(
    resolveLegacyTutorialChannel(retired),
    null,
    `${retired} must not fall back to retired footer-era tutorial copy`,
  )
}

assert.equal(
  resolveLegacyTutorialChannel('/nowhere-real'),
  null,
  'a path matching no legacy route must resolve to null',
)

console.log(
  `Legacy tutorial resolver contract passed: precedence and query stripping hold, ${tutorialChannelKeys.length} standalone exceptions resolve, and none of ${new Set(contentRoutes).size} content channel routes falls back to legacy copy.`,
)
