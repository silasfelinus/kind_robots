// /utils/scripts/verifyDaVinciNarrationErrorRoleGuard.ts
//
// Regression guard (davinci/t-021 slice 8) -- the narration-error callout in
// components/conductor/davinci-page.vue (`v-else-if="narrationError"`) had
// no role or aria-live semantics at all: a purely visual warning-tinted
// block with an icon, message, and two action buttons (retry / switch to
// the curated pool), announcing nothing to assistive tech when a narration
// failure occurred. Slice 2 already fixed this exact block's color-tone
// opacity drift (verifyDaVinciNarrationErrorToneGuard.ts) without touching
// its missing semantics -- this closes the gap that fix left behind.
//
// Every other warning/error-toned callout in the app carries role="alert",
// including this same file's own top-of-page errorMessage callout
// (`v-if="errorMessage"`, a few lines above this block) and, as the closest
// structural match, academy-manager.vue's `managerError` block: the same
// tinted-callout-plus-retry-button shape, also role="alert". Also confirmed
// on narrative-ingredient-picker.vue's and
// narrative-ingredient-multi-picker.vue's error blocks, coloring-book-studio
// .vue's alert-error, and challenge-center-page.vue's alert-warning.
//
// Fixed by adding role="alert" to the narrationError div. This asserts the
// textual shape of that fix stays in place -- deliberately scoped to this
// one template block, mirroring this project's other narrow textual guards
// over a general-purpose static analyzer (see
// verifyDaVinciNarrationErrorToneGuard.ts, verifyDaVinciNarratingStatusGuard.ts).
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const COMPONENT_PATH = join(
  repositoryRoot,
  'components/conductor/davinci-page.vue',
)

// Anchored on the `v-else-if="narrationError"` marker rather than any
// surrounding wording, so this guard reports *how* the block regressed
// (missing role vs. missing entirely) instead of just "not found".
const BLOCK_MARKER = 'v-else-if="narrationError"'

export function extractNarrationErrorOpeningTag(
  content: string,
): string | null {
  const markerIndex = content.indexOf(BLOCK_MARKER)
  if (markerIndex === -1) return null

  const tagStart = content.lastIndexOf('<div', markerIndex)
  if (tagStart === -1) return null
  const tagEnd = content.indexOf('>', markerIndex)
  if (tagEnd === -1) return null

  return content.slice(tagStart, tagEnd + 1)
}

export function checkNarrationErrorRoleGuard(content: string): string[] {
  const errors: string[] = []

  const openingTag = extractNarrationErrorOpeningTag(content)
  if (!openingTag) {
    errors.push(
      `Could not find a \`${BLOCK_MARKER}\` block in davinci-page.vue -- ` +
        'has the narration-error callout been renamed, removed, or ' +
        'restructured? If so, this guard needs to move with it.',
    )
    return errors
  }

  if (!openingTag.includes('role="alert"')) {
    errors.push(
      'The narration-error callout no longer carries role="alert" -- ' +
        'assistive tech gets no signal that narration failed, unlike this ' +
        "file's own errorMessage callout and every comparable warning/" +
        "error-toned block elsewhere in the app (academy-manager.vue's " +
        "managerError block, narrative-ingredient-picker.vue's and " +
        "-multi-picker.vue's error blocks, coloring-book-studio.vue's " +
        "alert-error, challenge-center-page.vue's alert-warning).",
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(COMPONENT_PATH, 'utf8')
  const errors = checkNarrationErrorRoleGuard(content)

  if (errors.length) {
    console.error(
      'Da Vinci narration-error role guard contract failed in davinci-page.vue:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Da Vinci narration-error role guard contract passed: the narration-error ' +
      'callout still carries role="alert", matching this file\'s own ' +
      'errorMessage callout and every other warning/error-toned block in ' +
      'the app.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
