// /utils/scripts/verifyDaVinciNarratingStatusGuard.ts
//
// Regression guard (davinci/t-021 slice 4) -- the "narrator is writing this
// chapter" busy block in components/conductor/davinci-page.vue announced
// nothing to assistive tech: no role="status"/aria-live="polite" on the
// wrapping element, and no aria-hidden="true" on its loading-dots spinner.
// Every comparable busy/loading indicator elsewhere in the app follows the
// same role="status" + aria-live="polite" wrapper + aria-hidden="true"
// spinner shape (see academy-manager.vue, model-builder-manager.vue,
// model-builder-run-history.vue, narrative-response-composer.vue,
// kr-chat-window.vue, watchlist-browse.vue,
// narrative-ingredient-picker.vue) -- davinci-page.vue's own errorMessage
// alert (role="alert") already follows an analogous pattern for its own
// state, so the narrating block was the one outlier left with a purely
// visual spinner and no textual/AT announcement of the busy state.
//
// This asserts the textual shape of the fix stays in place: the div wrapping
// `v-if="narrating"` carries role="status" and aria-live="polite", and its
// loading-dots spinner carries aria-hidden="true", deliberately scoped to
// this one template block, mirroring this project's other narrow textual
// guards over a general-purpose static analyzer (see
// verifyDaVinciDimensionToneGuard.ts).
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const COMPONENT_PATH = join(
  repositoryRoot,
  'components/conductor/davinci-page.vue',
)

// Anchored on the `v-if="narrating"` marker rather than any surrounding
// wording, so this guard reports *which* attribute regressed instead of
// just "not found" if the block is edited.
const BLOCK_MARKER = 'v-if="narrating"'
const NEXT_BLOCK_MARKER = '<!-- Narration failed'

export function extractNarratingBlock(content: string): string | null {
  const markerIndex = content.indexOf(BLOCK_MARKER)
  if (markerIndex === -1) return null

  const tagStart = content.lastIndexOf('<div', markerIndex)
  if (tagStart === -1) return null
  const tagEnd = content.indexOf('>', markerIndex)
  if (tagEnd === -1) return null

  const nextBlockIndex = content.indexOf(NEXT_BLOCK_MARKER, tagEnd)
  const blockEnd = nextBlockIndex === -1 ? content.length : nextBlockIndex

  return content.slice(tagStart, blockEnd)
}

export function checkNarratingStatusGuard(content: string): string[] {
  const errors: string[] = []

  const block = extractNarratingBlock(content)
  if (!block) {
    errors.push(
      'Could not find a <div v-if="narrating"> block in ' +
        'davinci-page.vue -- has the narrating/busy state been ' +
        'restructured or removed? If so, this guard needs to move with it.',
    )
    return errors
  }

  const openingTagEnd = block.indexOf('>')
  const openingTag = block.slice(0, openingTagEnd + 1)

  if (!openingTag.includes('role="status"')) {
    errors.push(
      "The narrating block's wrapping <div> no longer carries " +
        'role="status" -- assistive tech gets no signal that the ' +
        'narrator is composing a chapter, unlike every comparable busy ' +
        'indicator elsewhere in the app (academy-manager.vue, ' +
        'model-builder-manager.vue, etc).',
    )
  }

  if (!openingTag.includes('aria-live="polite"')) {
    errors.push(
      "The narrating block's wrapping <div> no longer carries " +
        'aria-live="polite" -- a screen reader would not be told when ' +
        'the "is writing chapter N…" message appears.',
    )
  }

  const spinnerIndex = block.indexOf('loading loading-dots')
  if (spinnerIndex === -1) {
    errors.push(
      'Could not find the loading loading-dots spinner inside the ' +
        'narrating block -- has the spinner markup changed?',
    )
  } else {
    const spinnerTagStart = block.lastIndexOf('<span', spinnerIndex)
    const spinnerTagEnd = block.indexOf('/>', spinnerIndex)
    const spinnerTag =
      spinnerTagStart === -1 || spinnerTagEnd === -1
        ? ''
        : block.slice(spinnerTagStart, spinnerTagEnd + 2)
    if (!spinnerTag.includes('aria-hidden="true"')) {
      errors.push(
        "The narrating block's loading-dots spinner no longer carries " +
          'aria-hidden="true" -- the decorative spinner would be ' +
          'announced redundantly alongside the role="status" text.',
      )
    }
  }

  return errors
}

function main(): void {
  const content = readFileSync(COMPONENT_PATH, 'utf8')
  const errors = checkNarratingStatusGuard(content)

  if (errors.length) {
    console.error(
      'Da Vinci narrating-status guard contract failed in davinci-page.vue:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Da Vinci narrating-status guard contract passed: the "narrator is ' +
      'writing this chapter" busy state announces itself to assistive ' +
      'tech via role="status"/aria-live="polite", matching every other ' +
      'busy/loading indicator convention in the app.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
