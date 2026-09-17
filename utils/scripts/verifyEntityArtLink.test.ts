// /utils/scripts/verifyEntityArtLink.test.ts
//
// Every entity type an ArtJob can be rendered for must lead somewhere.
//
// The routes were read off each manager component rather than assumed:
// character-manager reads `characterId ?? character`, scenario-manager lives on
// /stories rather than /scenarios, facet is keyed by slug, project puts its id
// in the path, and achievement has no manager at all. A wrong parameter is
// worse than no link -- the page loads and silently selects nothing.
import assert from 'node:assert/strict'

import {
  ENTITY_ART_ROUTES,
  entityArtHref,
  entityArtRefKey,
  entityArtTypeLabel,
} from '../entityArtLink'

// --- id-keyed types ---------------------------------------------------------
assert.equal(entityArtHref('character', 12), '/characters?characterId=12')
assert.equal(entityArtHref('scenario', 7), '/stories?scenarioId=7')
assert.equal(entityArtHref('reward', 3), '/rewards?rewardId=3')
assert.equal(entityArtHref('bot', 44), '/bots?botId=44')
assert.equal(entityArtHref('dream', 9), '/dreams?dreamId=9')
assert.equal(entityArtHref('resource', 2726), '/resources?resourceId=2726')

// --- a project id belongs in the path, where its route expects it -----------
assert.equal(entityArtHref('project', 5), '/projects/5')

// --- a facet is slug-keyed, and a dead `?facet=` would select nothing -------
assert.equal(entityArtHref('facet', 2, 'moonlit'), '/facets?facet=moonlit')
assert.equal(entityArtHref('facet', 2), '/facets')
assert.equal(entityArtHref('facet', 2, '   '), '/facets')
assert.equal(entityArtHref('facet', 2, 'a b&c'), '/facets?facet=a%20b%26c')

// --- a type with no manager lands on the list and stops ---------------------
assert.equal(entityArtHref('achievement', 4), '/achievements')

// --- null rather than a broken link -----------------------------------------
assert.equal(entityArtHref('nonsense', 1), null)
assert.equal(entityArtHref('character', 0), null)
assert.equal(entityArtHref('character', -3), null)
assert.equal(entityArtHref('character', null), null)
assert.equal(entityArtHref(null, 12), null)

// --- every type the entity-art pipeline can emit has a route ----------------
// If EntityArtType gains a member, this fails until it gains a route.
for (const type of [
  'bot', 'dream', 'character', 'scenario', 'reward',
  'facet', 'project', 'achievement', 'resource',
] as const) {
  assert.ok(ENTITY_ART_ROUTES[type], `${type} needs a route`)
  assert.ok(entityArtHref(type, 1, 'slug'), `${type} must produce an href`)
}

// --- labels and batching keys -----------------------------------------------
assert.equal(entityArtTypeLabel('resource'), 'Resource')
assert.equal(entityArtTypeLabel('scenario'), 'Scenario')
assert.equal(entityArtTypeLabel('mystery'), 'mystery')
assert.equal(entityArtRefKey('resource', 12), 'resource:12')
assert.equal(entityArtRefKey(null, null), ':0')

console.log('verifyEntityArtLink: all assertions passed')
