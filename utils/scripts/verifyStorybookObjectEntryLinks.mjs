// /utils/scripts/verifyStorybookObjectEntryLinks.mjs
//
// Reviewer kaizen from kind_robots PR #1706 (conductor storybook/t-017): CI
// caught layout and router-shape regressions during that review, but nothing
// directly asserted the user-facing handoff itself -- that a Facet or Reward
// detail surface can actually start a Storybook story seeded with that
// object. This contract closes that gap.
//
// Deliberately narrow: it checks that the CTA's click handler exists and
// performs the navigation with the object's slug threaded through the right
// query key, and that Storybook's own seedFromQuery() still consumes that
// key into the matching setup-draft list. It does NOT assert button classes,
// icon names, or layout -- a restyle of the CTA must not fail this check.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function source(path) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

function includesAll(path, values) {
  const contents = source(path)
  for (const value of values) {
    assert.ok(contents.includes(value), `${path} must include ${value}`)
  }
}

const facetProfilePath = 'components/facets/facet-profile.vue'
const rewardEncounterPath = 'components/rewards/reward-encounter.vue'
const storybookPagePath = 'components/conductor/storybook-page.vue'

// Facet detail surface: some element must wire a click to a handler that
// navigates to Storybook carrying the selected Facet's slug through ?facet=.
// The handler name and navigateTo call are asserted; the button/icon markup
// around it is not.
includesAll(facetProfilePath, [
  'startStoryWithFacet',
  '@click="startStoryWithFacet"',
  "path: '/storybook'",
  'query: { facet: selectedFacet.value.slug }',
])

// Reward encounter surface: same shape, through ?reward=.
includesAll(rewardEncounterPath, [
  'startStoryWithReward',
  '@click="startStoryWithReward"',
  "path: '/storybook'",
  'query: { reward: slug }',
])

// Storybook itself must still consume both seed keys into the matching
// setup-draft ingredient lists, on top of (not instead of) a restored draft.
includesAll(storybookPagePath, [
  'function seedFromQuery',
  'seedFromQuery()',
  'route.query.facet',
  'route.query.reward',
  'draft.facetSlugs',
  'draft.rewardSlugs',
])

console.log(
  'Storybook object-entry links contract passed: Facet and Reward detail ' +
    'surfaces carry their object slug into Storybook via ?facet=/?reward=, ' +
    'and Storybook still seeds its setup draft from both -- independent of ' +
    'either surface’s current button markup.',
)
