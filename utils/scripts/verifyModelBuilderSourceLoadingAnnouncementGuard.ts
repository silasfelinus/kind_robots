// /utils/scripts/verifyModelBuilderSourceLoadingAnnouncementGuard.ts
//
// Regression guard (model-builder/t-029, cycle 16) -- the source-picker's own
// `store.loadingSources` block (step 1 of the wizard, the very first screen a
// build run starts on) rendered its "Loading {type}…" state as a purely
// visual spinner-plus-text <div>, with no role/aria-live semantics at all.
// Two sibling loading states in this same feature already establish the
// correct pattern for exactly this shape -- a transient "please wait" block
// swapped in via v-if/v-else-if while data is fetched:
//
// 1. model-builder-run-history.vue's `store.loadingRuns` block --
//    role="status" aria-live="polite" aria-busy="true" on the container,
//    aria-hidden="true" on the decorative spinner span.
// 2. model-builder-manager.vue's `resumingRun` block -- the identical
//    role="status" aria-live="polite" shape (plus aria-busy="true" on the
//    ancestor <section> covering the whole surface while it restores).
//
// The source-picker's own error-toned sibling in the same v-if/v-else-if
// chain (`store.sourcesError`) already carries role="alert" (cycle 11,
// verifyModelBuilderErrorCalloutRoleGuard.ts) -- but the loading state one
// branch above it was never given the equivalent role="status" treatment.
// Without it, a screen-reader user who picks a source type hears nothing at
// all until the records finish loading (or errors), unlike every other
// "fetching, please wait" surface in this same feature.
//
// Fixed by adding role="status" aria-live="polite" aria-busy="true" to the
// loadingSources container and aria-hidden="true" to its spinner span. This
// asserts the textual shape of that fix stays in place -- deliberately
// scoped to this one template block, mirroring this project's other narrow
// textual guards over a general-purpose static analyzer.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const SOURCE_PICKER_PATH = join(
  repositoryRoot,
  'components/model-builder/model-builder-source-picker.vue',
)

const LOADING_MARKER = 'v-else-if="store.loadingSources"'

// Anchored on the block's distinguishing v-else-if marker rather than any
// surrounding wording, so this guard reports *how* the block regressed
// (missing attributes vs. missing entirely) instead of just "not found".
function extractOpeningTag(content: string, marker: string): string | null {
  const markerIndex = content.indexOf(marker)
  if (markerIndex === -1) return null

  const tagStart = content.lastIndexOf('<', markerIndex)
  if (tagStart === -1) return null
  const tagEnd = content.indexOf('>', markerIndex)
  if (tagEnd === -1) return null

  return content.slice(tagStart, tagEnd + 1)
}

// The spinner span is the first `<span ...>` after the container's opening
// tag, up to the container's own closing `</div>`.
function extractSpinnerSpan(content: string, marker: string): string | null {
  const markerIndex = content.indexOf(marker)
  if (markerIndex === -1) return null

  const containerEnd = content.indexOf('</div>', markerIndex)
  if (containerEnd === -1) return null

  const spanStart = content.indexOf('<span', markerIndex)
  if (spanStart === -1 || spanStart > containerEnd) return null
  const spanTagEnd = content.indexOf('>', spanStart)
  if (spanTagEnd === -1 || spanTagEnd > containerEnd) return null

  return content.slice(spanStart, spanTagEnd + 1)
}

export function checkSourceLoadingAnnouncementGuard(content: string): string[] {
  const errors: string[] = []

  const openingTag = extractOpeningTag(content, LOADING_MARKER)
  if (!openingTag) {
    errors.push(
      `Could not find a \`${LOADING_MARKER}\` block in ` +
        'model-builder-source-picker.vue -- has the loadingSources state ' +
        'been renamed, removed, or restructured? If so, this guard needs ' +
        'to move with it.',
    )
    return errors
  }

  if (!openingTag.includes('role="status"')) {
    errors.push(
      'The model-builder-source-picker.vue loadingSources block no ' +
        'longer carries role="status" -- assistive tech gets no signal ' +
        "that sources are loading, unlike this same feature's own " +
        'model-builder-run-history.vue loadingRuns block and ' +
        'model-builder-manager.vue resumingRun block.',
    )
  }
  if (!openingTag.includes('aria-live="polite"')) {
    errors.push(
      'The model-builder-source-picker.vue loadingSources block no ' +
        'longer carries aria-live="polite" -- a screen reader will not ' +
        'announce this state change at all.',
    )
  }
  if (!openingTag.includes('aria-busy="true"')) {
    errors.push(
      'The model-builder-source-picker.vue loadingSources block no ' +
        'longer carries aria-busy="true", unlike the identically-shaped ' +
        'model-builder-run-history.vue loadingRuns block.',
    )
  }

  const spinnerSpan = extractSpinnerSpan(content, LOADING_MARKER)
  if (!spinnerSpan) {
    errors.push(
      'Could not find the decorative spinner <span> inside the ' +
        'loadingSources block in model-builder-source-picker.vue -- has it ' +
        'been renamed, removed, or restructured? If so, this guard needs ' +
        'to move with it.',
    )
  } else if (!spinnerSpan.includes('aria-hidden="true"')) {
    errors.push(
      'The model-builder-source-picker.vue loadingSources spinner span no ' +
        'longer carries aria-hidden="true" -- assistive tech will try to ' +
        'read the decorative spinner icon itself.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(SOURCE_PICKER_PATH, 'utf8')
  const errors = checkSourceLoadingAnnouncementGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder source loading announcement guard contract failed:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder source loading announcement guard contract passed: the ' +
      'loadingSources block still announces itself to assistive tech.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
