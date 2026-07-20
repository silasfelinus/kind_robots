// /utils/scripts/verifyTutorialChannelResolver.ts
//
// Regression test for resolveTutorialChannelFromRoute() in tutorialCards.ts
// (newsfeed/t-020, kaizen from t-019). Exercises the real function against
// real production route data (the wonder key's 7 real routes) and against
// controlled routeMap/keys overrides for the exact-vs-prefix precedence
// rules that no real route pair currently exercises (per t-019's note: "no
// route in the current set is a prefix of another channel's route").
import assert from 'node:assert/strict'
import { resolveTutorialChannelFromRoute } from '@/stores/helpers/tutorialCards'

// (1) Exact match always wins even when a shorter route from a different
// key would also match as a prefix -- and even when that shorter route is
// reached first during iteration.
{
  const routeMap = {
    games: '/shop',
    art: '/shop/gallery',
  }
  const keys = ['games', 'art'] as const

  const result = resolveTutorialChannelFromRoute(
    '/shop/gallery',
    routeMap,
    keys,
  )
  assert.equal(
    result,
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

  const result = resolveTutorialChannelFromRoute(
    '/shop/gallery/extra',
    routeMap,
    keys,
  )
  assert.equal(
    result,
    'art',
    'prefix matching must prefer the longer, more specific route across different keys, not the first one seen',
  )

  // Sanity check: a path that only matches the shorter route resolves to it.
  const shorterOnly = resolveTutorialChannelFromRoute(
    '/shop/other',
    routeMap,
    keys,
  )
  assert.equal(
    shorterOnly,
    'games',
    'a path matching only the shorter route must still resolve to its key',
  )
}

// (3) The wonder key's multi-route array resolves correctly for each of
// its 7 real routes (using the real, unmodified production route map).
{
  const wonderRoutes = [
    '/newsfeed',
    '/wonderlab',
    '/screenfx',
    '/davinci',
    '/watchlist',
    '/ruler-hooked',
    '/voice-lab',
  ]

  for (const route of wonderRoutes) {
    assert.equal(
      resolveTutorialChannelFromRoute(route),
      'wonder',
      `expected ${route} to resolve to the wonder channel`,
    )
    assert.equal(
      resolveTutorialChannelFromRoute(`${route}/sub-page`),
      'wonder',
      `expected a sub-path of ${route} to prefix-resolve to the wonder channel`,
    )
  }

  // No other real channel route is a prefix of a wonder route or vice
  // versa, so an unrelated real route must not resolve to wonder.
  assert.equal(
    resolveTutorialChannelFromRoute('/dreams'),
    'dream',
    'an unrelated real route must still resolve to its own channel, not wonder',
  )
}

// query/hash stripping still works with the injectable parameters in play.
{
  const routeMap = { games: '/shop' }
  const keys = ['games'] as const
  assert.equal(
    resolveTutorialChannelFromRoute('/shop?ref=footer#top', routeMap, keys),
    'games',
    'query strings and hash fragments must be stripped before matching',
  )
}

assert.equal(
  resolveTutorialChannelFromRoute('/nowhere-real'),
  null,
  'a path matching no channel route must resolve to null',
)

console.log(
  'Tutorial channel resolver contract passed: exact match beats an ' +
    'earlier-seen shorter prefix from a different key, prefix matching ' +
    'picks the longest route across different keys, all 7 real wonder ' +
    'routes resolve correctly, and query/hash stripping still works.',
)
