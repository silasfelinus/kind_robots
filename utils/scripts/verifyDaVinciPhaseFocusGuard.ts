// /utils/scripts/verifyDaVinciPhaseFocusGuard.ts
//
// Regression guard (davinci/t-021 slice 10) -- the outer
// logged-out/loading/start/playing/ending blocks in
// components/conductor/davinci-page.vue swap via one v-if/v-else-if chain
// keyed on `phase`, but nothing moved focus after a phase change that was
// itself triggered by a click *inside* the block being replaced. startLife()
// (start -> playing), resolveLife()/resumeRun() (playing -> loading ->
// ending or playing), and playAgain()/abandonRun() (ending/playing -> start)
// all click a button that then gets unmounted along with whichever phase
// block held it, so the browser dropped focus to <body> -- including cases
// the narrower chapterRegion guard (verifyDaVinciChapterFocusGuard.ts,
// slice 9) can't catch on its own: "See your ending" lives inside
// chapterRegion, but resolveLife's phase transition unmounts the *entire*
// `playing` block, chapterRegion included.
//
// Fixed the same way, one level up: wrap the whole outer phase chain in one
// persistent `ref="phaseRegion" tabindex="-1"` container that never itself
// unmounts across a phase change, then a `watch` on `phase` that checks
// `phaseRegion.value?.contains(document.activeElement)` at watch time
// (before Vue patches the DOM) to tell an in-region click apart from
// anything else, and calls `phaseRegion.value?.focus()` in `nextTick()`
// when it was. Mirrors model-builder-manager.vue's `mainContent` region and
// this file's own chapterRegion guard for the identical focus-loss shape.
//
// Deliberately scoped to this one template block and its paired script-side
// ref/watch, mirroring this project's other narrow textual guards over a
// general-purpose static analyzer (see verifyDaVinciChapterFocusGuard.ts,
// verifyDaVinciDimensionGroupGuard.ts).
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const COMPONENT_PATH = join(
  repositoryRoot,
  'components/conductor/davinci-page.vue',
)

// Anchored on the `v-if="!userStore.isLoggedIn"` marker -- the first branch
// of the chain this guard's wrapper needs to enclose -- rather than any
// surrounding wording, so a rename/restructure of the block reports *how*
// it moved instead of just "not found".
const LOGGED_OUT_MARKER = 'v-if="!userStore.isLoggedIn"'

export function extractPhaseRegionOpeningTag(content: string): string | null {
  const markerIndex = content.indexOf(LOGGED_OUT_MARKER)
  if (markerIndex === -1) return null

  // The wrapper is the nearest enclosing <div ...> that opens before the
  // logged-out block's own <div v-if="!userStore.isLoggedIn" ...> tag.
  const loggedOutTagStart = content.lastIndexOf('<div', markerIndex)
  if (loggedOutTagStart === -1) return null

  const wrapperTagStart = content.lastIndexOf('<div', loggedOutTagStart - 1)
  if (wrapperTagStart === -1) return null
  const wrapperTagEnd = content.indexOf('>', wrapperTagStart)
  if (wrapperTagEnd === -1) return null

  return content.slice(wrapperTagStart, wrapperTagEnd + 1)
}

export function checkPhaseFocusGuard(content: string): string[] {
  const errors: string[] = []

  const openingTag = extractPhaseRegionOpeningTag(content)
  if (!openingTag) {
    errors.push(
      `Could not find the wrapper enclosing \`${LOGGED_OUT_MARKER}\` in ` +
        'davinci-page.vue -- has the outer phase chain been renamed, ' +
        'removed, or restructured? If so, this guard needs to move with it.',
    )
    return errors
  }

  if (!openingTag.includes('ref="phaseRegion"')) {
    errors.push(
      'The logged-out/loading/start/playing/ending chain no longer has a ' +
        'ref="phaseRegion" wrapper -- the paired focus-restoring watch has ' +
        'nothing to focus, so a keyboard/screen-reader user is dropped to ' +
        '<body> after a phase change again.',
    )
  }

  if (!openingTag.includes('tabindex="-1"')) {
    errors.push(
      'The phase-region wrapper no longer carries tabindex="-1" -- it ' +
        "can't receive focus programmatically (a plain <div> isn't " +
        "focusable), matching model-builder-manager.vue's " +
        '`<main ref="mainContent" tabindex="-1">` precedent for this same ' +
        'focus-loss shape.',
    )
  }

  if (!content.includes('const phaseRegion = ref<HTMLElement | null>(null)')) {
    errors.push(
      'The `phaseRegion` template ref declaration is missing from the ' +
        '<script setup> block.',
    )
  }

  if (
    !content.includes('phaseRegion.value?.contains(document.activeElement)')
  ) {
    errors.push(
      'The focus-restoring watch no longer checks ' +
        '`phaseRegion.value?.contains(document.activeElement)` before ' +
        'moving focus -- without this check, the watch would steal focus ' +
        'even when the state change did not originate from a click inside ' +
        'the region, the exact false-positive the chapterRegion watch (and ' +
        "model-builder-manager.vue's own watch) is careful to avoid.",
    )
  }

  if (!content.includes('phaseRegion.value?.focus()')) {
    errors.push(
      'The focus-restoring watch no longer calls `phaseRegion.value?.focus()` ' +
        '-- the region exists but focus is never actually moved back to it.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(COMPONENT_PATH, 'utf8')
  const errors = checkPhaseFocusGuard(content)

  if (errors.length) {
    console.error(
      'Da Vinci phase-focus guard contract failed in davinci-page.vue:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Da Vinci phase-focus guard contract passed: the outer logged-out/' +
      'loading/start/playing/ending chain still restores focus to itself ' +
      'after an in-region click swaps the visible phase block, so keyboard ' +
      'and screen-reader users are never dropped to <body> after a phase ' +
      'change.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
