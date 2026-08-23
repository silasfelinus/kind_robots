// /utils/scripts/verifyBrainstormObjectEntryLinks.mjs
//
// conductor brainstorm/t-013: Character-aware brainstorming and a reusable
// deep-link/query-state contract. Mirrors
// verifyStorybookObjectEntryLinks.mjs's shape and rationale: nothing
// directly asserted that a Character surface can actually launch a
// Brainstorm session grounded in that Character, only that the pieces
// existed separately. This contract closes that gap for Brainstorm the same
// way PR #1706's kaizen closed it for Storybook.
//
// Deliberately narrow: it checks that the CTA's click handler exists and
// performs the navigation with the object's id/intent threaded through the
// right query keys, and that Brainstorm's own seedFromQuery() still consumes
// those keys. It does NOT assert button classes, icon names, or layout -- a
// restyle of the CTA must not fail this check.
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

const characterManagerPath = 'components/characters/character-manager.vue'
const scenarioManagerPath = 'components/scenarios/scenario-manager.vue'
const rewardManagerPath = 'components/rewards/reward-manager.vue'
const botManagerPath = 'components/bots/bot-manager.vue'
const brainstormManagerPath = 'components/brainstorm/brainstorm-manager.vue'

includesAll(characterManagerPath, [
  'startBrainstormWithCharacter',
  '@click="startBrainstormWithCharacter"',
  "path: '/brainstorm'",
  "source: 'character'",
  'sourceId: String(character.id)',
])

// brainstorm/t-027: Scenario is the second surface to wire into the same
// seedFromQuery() contract -- its BRAINSTORM_SOURCE_ADAPTERS entry already
// existed (brainstorm/t-014) with no UI entry point driving traffic to it.
includesAll(scenarioManagerPath, [
  'startBrainstormWithScenario',
  '@click="startBrainstormWithScenario"',
  "path: '/brainstorm'",
  "source: 'scenario'",
  'sourceId: String(scenario.id)',
])

// brainstorm/t-028: Reward is the third surface wired into the same
// seedFromQuery() contract -- its BRAINSTORM_SOURCE_ADAPTERS entry (this
// task) ships alongside its own gated CTA, unlike Scenario's adapter/CTA
// gap in t-027.
includesAll(rewardManagerPath, [
  'startBrainstormWithReward',
  '@click="startBrainstormWithReward"',
  "path: '/brainstorm'",
  "source: 'reward'",
  'sourceId: String(reward.id)',
])

// brainstorm/t-029: Bot is the fourth surface wired into the same
// seedFromQuery() contract, following the same adapter/CTA pair Reward
// shipped in t-028 (BRAINSTORM_SOURCE_ADAPTERS entry + a gated CTA in the
// same PR, not split across two tasks the way Scenario's was in t-027).
includesAll(botManagerPath, [
  'startBrainstormWithBot',
  '@click="startBrainstormWithBot"',
  "path: '/brainstorm'",
  "source: 'bot'",
  'sourceId: String(bot.id)',
])

includesAll(brainstormManagerPath, [
  'function seedFromQuery',
  'seedFromQuery()',
  'route.query.source',
  'route.query.sourceId',
  'route.query.intent',
  'store.setSource(',
  'store.setPremise(intent)',
])

console.log(
  'Brainstorm object-entry links contract passed: Character, Scenario, ' +
    'Reward, and Bot can each launch a Brainstorm session grounded in ' +
    'themselves, and Brainstorm still seeds its source and premise from ' +
    'the source/sourceId/intent query keys.',
)
