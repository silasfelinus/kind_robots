// /utils/scripts/verifyModelBuilderErrorCalloutRoleGuard.ts
//
// Regression guard (model-builder/t-029, cycle 11) -- two persistent
// error-toned callouts in the Model Builder front end had no role/aria
// semantics at all, unlike every other warning/error-toned block in this
// same feature and the app at large:
//
// 1. model-builder-item-panel.vue's `item.error` banner (`v-if="item.error"`)
//    -- the per-item failure message surfaced by cycle 7's error-persistence
//    fix (verifyModelBuilderErrorPersistenceGuard.ts). A real, unresolved
//    failure rendered as a purely visual red-tinted <p>, announcing nothing
//    to assistive tech.
// 2. model-builder-source-picker.vue's `store.sourcesError` callout
//    (`v-else-if="store.sourcesError"`) -- a tinted-callout-plus-retry-button
//    block, structurally identical to academy-manager.vue's `managerError`
//    block and this same feature's own model-builder-manager.vue
//    `statusMessage` banner, both of which already carry role="alert"/
//    role="status" correctly.
//
// This exact gap (an error callout with no role) was just closed the same
// day for davinci-page.vue's narration-error callout (PR #1944,
// verifyDaVinciNarrationErrorRoleGuard.ts) -- this guard follows that one's
// narrow-textual-checker shape, extended to cover both Model Builder blocks
// in one guard since they're the same fix applied to two sibling components.
//
// Fixed by adding role="alert" to both blocks. This asserts the textual
// shape of that fix stays in place -- deliberately scoped to these two
// template blocks, mirroring this project's other narrow textual guards
// over a general-purpose static analyzer.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const ITEM_PANEL_PATH = join(
  repositoryRoot,
  'components/model-builder/model-builder-item-panel.vue',
)
const SOURCE_PICKER_PATH = join(
  repositoryRoot,
  'components/model-builder/model-builder-source-picker.vue',
)

const ITEM_ERROR_MARKER = 'v-if="item.error"'
const SOURCES_ERROR_MARKER = 'v-else-if="store.sourcesError"'

// Anchored on each block's distinguishing v-if/v-else-if marker rather than
// any surrounding wording, so this guard reports *how* a block regressed
// (missing role vs. missing entirely) instead of just "not found".
function extractOpeningTag(content: string, marker: string): string | null {
  const markerIndex = content.indexOf(marker)
  if (markerIndex === -1) return null

  const tagStart = content.lastIndexOf('<', markerIndex)
  if (tagStart === -1) return null
  const tagEnd = content.indexOf('>', markerIndex)
  if (tagEnd === -1) return null

  return content.slice(tagStart, tagEnd + 1)
}

export function checkItemPanelErrorRoleGuard(content: string): string[] {
  const errors: string[] = []

  const openingTag = extractOpeningTag(content, ITEM_ERROR_MARKER)
  if (!openingTag) {
    errors.push(
      `Could not find a \`${ITEM_ERROR_MARKER}\` block in ` +
        'model-builder-item-panel.vue -- has the item.error banner been ' +
        'renamed, removed, or restructured? If so, this guard needs to ' +
        'move with it.',
    )
    return errors
  }

  if (!openingTag.includes('role="alert"')) {
    errors.push(
      'The model-builder-item-panel.vue item.error banner no longer ' +
        'carries role="alert" -- assistive tech gets no signal that this ' +
        "item's build failed, unlike every comparable warning/error-toned " +
        "block elsewhere in the app (this feature's own " +
        'model-builder-manager.vue statusMessage banner, ' +
        "davinci-page.vue's narration-error callout, " +
        "academy-manager.vue's managerError block).",
    )
  }

  return errors
}

export function checkSourcePickerErrorRoleGuard(content: string): string[] {
  const errors: string[] = []

  const openingTag = extractOpeningTag(content, SOURCES_ERROR_MARKER)
  if (!openingTag) {
    errors.push(
      `Could not find a \`${SOURCES_ERROR_MARKER}\` block in ` +
        'model-builder-source-picker.vue -- has the sourcesError callout ' +
        'been renamed, removed, or restructured? If so, this guard needs ' +
        'to move with it.',
    )
    return errors
  }

  if (!openingTag.includes('role="alert"')) {
    errors.push(
      'The model-builder-source-picker.vue sourcesError callout no ' +
        'longer carries role="alert" -- assistive tech gets no signal ' +
        'that loading sources failed, unlike the structurally identical ' +
        'tinted-callout-plus-retry-button academy-manager.vue ' +
        "managerError block and this feature's own " +
        'model-builder-manager.vue statusMessage banner.',
    )
  }

  return errors
}

function main(): void {
  const itemPanelContent = readFileSync(ITEM_PANEL_PATH, 'utf8')
  const sourcePickerContent = readFileSync(SOURCE_PICKER_PATH, 'utf8')

  const errors = [
    ...checkItemPanelErrorRoleGuard(itemPanelContent),
    ...checkSourcePickerErrorRoleGuard(sourcePickerContent),
  ]

  if (errors.length) {
    console.error('Model Builder error callout role guard contract failed:')
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder error callout role guard contract passed: both the ' +
      'item-panel item.error banner and the source-picker sourcesError ' +
      'callout still carry role="alert".',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
