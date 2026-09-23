// /utils/scripts/verifyStorybookObjectEntryLinks.mjs
//
// Reviewer kaizen from kind_robots PR #1706 (conductor storybook/t-017): CI
// caught layout and router-shape regressions during that review, but nothing
// directly asserted the user-facing handoff itself -- that an object detail
// surface can actually start a Storybook story seeded with that object. This
// contract closes that gap.
//
// Deliberately narrow: it checks that the CTA's click handler exists and
// performs the navigation with the object's slug threaded through the right
// query key. It does NOT assert button classes, icon names, or layout -- a
// restyle of the CTA must not fail this check.
//
// Migrated for storybook/t-037 (cycle 31): the receiving half of this
// contract used to be asserted here too, against the LEGACY
// storybook-page.vue's seedFromQuery(). That page is no longer the default
// Storybook screen -- storybook-table.vue is (storybook-storymaker.vue
// mounts it whenever no run is open, per storybook-library-page.vue's
// `v-if="!legacy"`) -- and its own seedFromQuery() already has full
// dedicated receiving-side coverage in verifyStorybookTableDeepLinkGuard.mjs
// (all five query keys, cardForSlug()/playCardIfAbsent() resolution, genre/
// character gating, query clearing, and mount ordering). Re-asserting the
// legacy page's now-unreachable-by-default draft.* shape here would just
// pin a dead end without adding coverage, so that half moved out rather than
// being duplicated. This guard keeps its still-live, still-uncovered half:
// that each object surface's CTA actually fires and still navigates to
// '/storybook' with the right query key -- storybook-table.vue's guard has
// no visibility into these source call sites.
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
const characterManagerPath = 'components/characters/character-manager.vue'
const scenarioManagerPath = 'components/scenarios/scenario-manager.vue'

includesAll(facetProfilePath, [
  'startStoryWithFacet',
  '@click="startStoryWithFacet"',
  "path: '/storybook'",
  'query: { facet: selectedFacet.value.slug }',
])

includesAll(rewardEncounterPath, [
  'startStoryWithReward',
  '@click="startStoryWithReward"',
  "path: '/storybook'",
  'query: { reward: slug }',
])

includesAll(characterManagerPath, [
  'startStoryWithCharacter',
  '@click="startStoryWithCharacter"',
  "path: '/storybook'",
  'query: { character: slug }',
])

includesAll(scenarioManagerPath, [
  'startStoryWithScenario',
  '@click="startStoryWithScenario"',
  "path: '/storybook'",
  'query: { scenario: slug }',
])

console.log(
  'Storybook object-entry links contract passed: Facet, Reward, Character, ' +
    'and Scenario working surfaces still carry their object slug into ' +
    "Storybook via '/storybook'. The receiving half of this contract (that " +
    'storybook-table.vue actually seeds a card from each key) lives in ' +
    'verifyStorybookTableDeepLinkGuard.mjs.',
)
