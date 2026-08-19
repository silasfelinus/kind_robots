// /utils/scripts/verifyDaVinciChapterFocusGuard.ts
//
// Regression guard (davinci/t-021 slice 9) -- the narrating/narrationError/
// currentChapter/resolve-panel blocks in components/conductor/davinci-page.vue
// swap in and out via one v-if/v-else-if chain, but nothing moved focus
// after a swap that was itself triggered by a click *inside* the region
// being replaced. Choosing an option (kr-choice-list -> chooseOptionByKey ->
// chooseOption -> narrateChapter), clicking "Try again", and clicking "Play
// the written chapters instead" all click a button that then gets unmounted
// along with whichever block held it, so the browser dropped focus to
// <body> -- a keyboard or screen-reader user had to re-discover the new
// chapter (or the busy/error state) from the top of the page after every
// single choice, the core interaction loop of this whole product.
//
// This is the exact focus-loss shape model-builder-manager.vue's own
// `mainContent` region already documents and fixes: "several buttons
// *inside* the current step's own component change store.step, unmounting
// that whole component ... with nothing moving focus anywhere afterward, so
// the browser drops it to <body>." Fixed the same way: wrap the swapping
// blocks in one persistent `ref="chapterRegion" tabindex="-1"` container
// that never itself unmounts across the swap, then a `watch` on the trio of
// refs the v-if chain switches on that checks
// `chapterRegion.value?.contains(document.activeElement)` at watch time
// (before Vue patches the DOM) to tell an in-region click apart from
// anything else, and calls `chapterRegion.value?.focus()` in `nextTick()`
// when it was.
//
// Deliberately scoped to this one template block and its paired script-side
// ref/watch, mirroring this project's other narrow textual guards over a
// general-purpose static analyzer (see verifyDaVinciNarrationErrorRoleGuard.ts,
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

// Anchored on the `v-if="narrating"` marker -- the first branch of the chain
// this guard's wrapper needs to enclose -- rather than any surrounding
// wording, so a rename/restructure of the block reports *how* it moved
// instead of just "not found".
const NARRATING_MARKER = 'v-if="narrating"'

export function extractChapterRegionOpeningTag(content: string): string | null {
  const markerIndex = content.indexOf(NARRATING_MARKER)
  if (markerIndex === -1) return null

  // The wrapper is the nearest enclosing <div ...> that opens before the
  // narrating block's own <div v-if="narrating" ...> tag.
  const narratingTagStart = content.lastIndexOf('<div', markerIndex)
  if (narratingTagStart === -1) return null

  const wrapperTagStart = content.lastIndexOf('<div', narratingTagStart - 1)
  if (wrapperTagStart === -1) return null
  const wrapperTagEnd = content.indexOf('>', wrapperTagStart)
  if (wrapperTagEnd === -1) return null

  return content.slice(wrapperTagStart, wrapperTagEnd + 1)
}

export function checkChapterFocusGuard(content: string): string[] {
  const errors: string[] = []

  const openingTag = extractChapterRegionOpeningTag(content)
  if (!openingTag) {
    errors.push(
      `Could not find the wrapper enclosing \`${NARRATING_MARKER}\` in ` +
        'davinci-page.vue -- has the chapter region been renamed, removed, ' +
        'or restructured? If so, this guard needs to move with it.',
    )
    return errors
  }

  if (!openingTag.includes('ref="chapterRegion"')) {
    errors.push(
      'The narrating/narrationError/currentChapter/resolve-panel chain no ' +
        'longer has a ref="chapterRegion" wrapper -- the paired focus-' +
        'restoring watch has nothing to focus, so a keyboard/screen-reader ' +
        'user is dropped to <body> after every choice again.',
    )
  }

  if (!openingTag.includes('tabindex="-1"')) {
    errors.push(
      'The chapter-region wrapper no longer carries tabindex="-1" -- it ' +
        "can't receive focus programmatically (a plain <div> isn't " +
        "focusable), matching model-builder-manager.vue's " +
        '`<main ref="mainContent" tabindex="-1">` precedent for this same ' +
        'focus-loss shape.',
    )
  }

  if (
    !content.includes('const chapterRegion = ref<HTMLElement | null>(null)')
  ) {
    errors.push(
      'The `chapterRegion` template ref declaration is missing from the ' +
        '<script setup> block.',
    )
  }

  if (
    !content.includes('chapterRegion.value?.contains(document.activeElement)')
  ) {
    errors.push(
      'The focus-restoring watch no longer checks ' +
        '`chapterRegion.value?.contains(document.activeElement)` before ' +
        'moving focus -- without this check, the watch would steal focus ' +
        'even when the state change did not originate from a click inside ' +
        'the region (e.g. a future caller flipping narrationMode), the ' +
        "exact false-positive model-builder-manager.vue's own watch is " +
        'careful to avoid.',
    )
  }

  if (!content.includes('chapterRegion.value?.focus()')) {
    errors.push(
      'The focus-restoring watch no longer calls `chapterRegion.value?.focus()` ' +
        '-- the region exists but focus is never actually moved back to it.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(COMPONENT_PATH, 'utf8')
  const errors = checkChapterFocusGuard(content)

  if (errors.length) {
    console.error(
      'Da Vinci chapter-focus guard contract failed in davinci-page.vue:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Da Vinci chapter-focus guard contract passed: the narrating/' +
      'narrationError/currentChapter/resolve-panel chain still restores ' +
      'focus to itself after an in-region click swaps the visible block, ' +
      'so keyboard and screen-reader users are never dropped to <body> ' +
      'after a choice.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
