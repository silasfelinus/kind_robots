// /utils/scripts/verifyBrainstormObjectEntryLinks.mjs
//
// Character, Scenario, Reward, Bot and Project surfaces each carry a Brainstorm
// button. Silas, 2026-11-14: the retired admin idea workbench is gone and those
// buttons open the current Brainstorm riff-board at /brainstorm instead, with
// a new round pre-titled after the object (brainstormRiffHandoff).
//
// Deliberately narrow: it checks that each CTA's click handler exists and
// hands off through brainstormRiffHandoff with the right round kind, and that
// the riff-board still reads the ?new= and ?title= keys it is handed. It does
// NOT assert button classes, icon names, or layout -- a restyle of the CTA
// must not fail this check.
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
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

function excludesAll(path, values) {
  const contents = source(path)
  for (const value of values) {
    assert.ok(!contents.includes(value), `${path} must not include ${value}`)
  }
}

const surfaces = [
  ['components/characters/character-manager.vue', 'Character', "'persona'"],
  ['components/scenarios/scenario-manager.vue', 'Scenario', "'list'"],
  ['components/rewards/reward-manager.vue', 'Reward', "'list'"],
  ['components/bots/bot-manager.vue', 'Bot', "'persona'"],
  ['components/conductor/project-detail.vue', 'Project', "'list'"],
]

for (const [path, label, flavor] of surfaces) {
  includesAll(path, [
    `startBrainstormWith${label}`,
    `@click="startBrainstormWith${label}"`,
    "import { brainstormRiffHandoff } from '@/utils/brainstormRiffs'",
    'brainstormRiffHandoff(',
    flavor,
  ])
  excludesAll(path, ["source: '", 'sourceId: String(', 'intent: `'])
}

includesAll('utils/brainstormRiffs.ts', [
  "export const BRAINSTORM_ROUTE = '/brainstorm'",
  'export function brainstormRiffHandoff(',
  'query: prefill ? { new: flavor, title: prefill } : { new: flavor }',
])

includesAll('components/brainstorm/play/brainstorm-play-console.vue', [
  'single(route.query.new)',
  'single(route.query.title)',
  ':prefill-title="newTitle"',
])

includesAll('components/brainstorm/play/brainstorm-riff-new.vue', [
  'prefillTitle?: string',
  "title: props.prefillTitle ?? ''",
])

assert.equal(
  existsSync(
    resolve(process.cwd(), 'components/brainstorm/brainstorm-manager.vue'),
  ),
  false,
  'the retired idea workbench stays retired',
)
assert.equal(
  existsSync(resolve(process.cwd(), 'content/brainstorm.md')),
  false,
  '/brainstorm is the riff-board page, not the retired workbench content page',
)
assert.ok(existsSync(resolve(process.cwd(), 'pages/brainstorm.vue')))

console.log(
  'Brainstorm object-entry links contract passed: Character, Scenario, ' +
    'Reward, Bot, and Project each open a pre-titled Brainstorm round at ' +
    '/brainstorm, and the riff-board reads the ?new= and ?title= keys.',
)
