// /utils/scripts/verifyUiTierVocabulary.ts
//
// `workspace` belongs to the navigation layer. Nothing else may claim it.
//
// WHY THIS IS A CONTRACT
// ----------------------
// The repo has four UI tiers -- manager (the set), gallery (many), interact
// (one decision), and the activity surface (what you do with one) -- plus
// studio for composing several object types. See the "four UI tiers" table in
// docs/model-and-channel-patterns.md.
//
// When the interact tier was split so its routers could stay routers, the
// extracted halves were named `<model>-workspace.vue`. Silas, 2026-08-07:
//
//   "do not use workspace as one of the core object pieces, as 1) it's already
//    used as a navigation system name to describe our entire page system (and
//    narrator-workspace is from when we always had a narrator front and
//    center). I would say things are either an 'interact' (just one thing) or
//    a studio (a group of models interacting for a purpose)."
//
// He was right, and the collision was already load-bearing:
//
//   components/navigation/workspace-{header,hand,sheet}.vue   mounted by app.vue
//   stores/workspaceStore.ts  ->  DreamWorkspacePanel, ScenarioWorkspacePanel
//
// That is the page system. A `bot-workspace.vue` sitting beside it means two
// unrelated things share one word, which is how `workspace-narrator.vue` ended
// up filed under navigation/ while actually belonging to the Dream surface.
//
// Vocabulary written only in a doc drifts -- everything that held during this
// UI pass held because it was checked. So: outside components/navigation/ and
// the workspace store, no component may be named for a workspace.
//
//   npx tsx utils/scripts/verifyUiTierVocabulary.ts

import { resolve } from 'node:path'
import { walkVue } from './componentGraph'

const root = process.cwd()

/**
 * The one directory that owns the word. These are the app's persistent page
 * furniture, mounted directly from app.vue -- the original and correct sense.
 */
const NAVIGATION_DIR = 'components/navigation/'

export type Offence = { file: string; reason: string }

export function findOffences(files: string[]): Offence[] {
  const offences: Offence[] = []
  for (const file of files) {
    const relative = file.startsWith(root) ? file.slice(root.length + 1) : file
    if (relative.startsWith(NAVIGATION_DIR)) continue

    const name = relative.split('/').pop()?.replace('.vue', '') ?? ''
    if (/(^|-)workspace(-|$)/.test(name)) {
      offences.push({
        file: relative,
        reason:
          'component names a workspace, but that word belongs to the navigation page system',
      })
    }
  }
  return offences.sort((a, b) => a.file.localeCompare(b.file))
}

/* -------------------------------------------------------------------------- */

function selfTest(): void {
  const fail = (message: string): never => {
    throw new Error(message)
  }

  // The reserved sense is allowed, and only there.
  if (
    findOffences([
      'components/navigation/workspace-header.vue',
      'components/navigation/workspace-narrator.vue',
    ]).length
  ) {
    fail('components/navigation/ owns the word and must never be flagged')
  }

  // The shape this exists to prevent, in every position.
  const banned = [
    'components/bots/bot-workspace.vue',
    'components/dreams/workspace-panel.vue',
    'components/rewards/reward-workspace-detail.vue',
    'components/scenarios/workspace.vue',
  ]
  if (findOffences(banned).length !== banned.length) {
    fail('a workspace-named component outside navigation/ must be reported')
  }

  // Substrings are not the word. `workspaces-list` would be a different noun,
  // but `myworkspace` inside a longer token must not trip a boundary rule.
  if (
    findOffences([
      'components/bots/bot-chat.vue',
      'components/dreams/dream-narration.vue',
      'components/art/workspacey-thing.vue',
    ]).length
  ) {
    fail('only the whole word, delimited by dashes, is reserved')
  }

  console.log('✅ verifyUiTierVocabulary self-test passed.')
}

/* -------------------------------------------------------------------------- */

selfTest()

const files = walkVue(resolve(root, 'components'))
const offences = findOffences(files)

if (offences.length) {
  console.error(
    `\nFAIL - ${offences.length} component(s) claim the word "workspace" outside` +
      ` the navigation layer:\n`,
  )
  for (const { file, reason } of offences) {
    console.error(`  ${file}\n    ${reason}`)
  }
  console.error(
    `\n"workspace" is the navigation page system: components/navigation/workspace-*\n` +
      `is mounted from app.vue and stores/workspaceStore.ts owns its panel state.\n\n` +
      `A per-object surface is named for what it DOES -- bot-chat, dream-narration,\n` +
      `reward-encounter, scenario-story. A surface composing several object types is\n` +
      `a studio. See "The four UI tiers" in docs/model-and-channel-patterns.md.`,
  )
  process.exitCode = 1
} else {
  console.log(
    `\nUI tier vocabulary holds: "workspace" stays with the navigation page system` +
      ` (checked ${files.length} components).`,
  )
}
