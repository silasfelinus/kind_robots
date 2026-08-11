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
// query key, and that Storybook's own seedFromQuery() still consumes that
// key into the matching setup draft. It does NOT assert button classes, icon
// names, or layout -- a restyle of the CTA must not fail this check.
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
const storybookPagePath = 'components/conductor/storybook-page.vue'

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

includesAll(storybookPagePath, [
  'function seedFromQuery',
  'seedFromQuery()',
  'route.query.facet',
  'route.query.reward',
  'route.query.character',
  'route.query.scenario',
  'draft.facetSlugs',
  'draft.rewardSlugs',
  'draft.castSlugs',
  'draft.scenarioSlug',
])

console.log(
  'Storybook object-entry links contract passed: Facet, Reward, Character, ' +
    'and Scenario working surfaces carry their object slug into Storybook, ' +
    'and Storybook still seeds its setup draft from every supported key.',
)
