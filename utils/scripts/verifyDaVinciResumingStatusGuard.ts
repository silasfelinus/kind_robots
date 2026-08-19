// /utils/scripts/verifyDaVinciResumingStatusGuard.ts
//
// Regression guard (davinci/t-021 slice 5) -- the "Resuming an existing run"
// skeleton in components/conductor/davinci-page.vue (rendered while
// `phase === 'loading'`, on every page load that finds a stored run id in
// localStorage) was a purely visual `animate-pulse` div: no role="status",
// no aria-live, and no text content at all. Assistive tech got zero signal
// that anything was happening during that load. This is the same shape of
// gap davinci/t-021 slice 4 fixed for the narrating/busy spinner
// (verifyDaVinciNarratingStatusGuard.ts) -- a different busy state in the
// same file was left uncovered. Every comparable "restoring something on
// page load" state elsewhere in the app announces itself the same way: see
// model-builder-manager.vue's `resumingRun` block (role="status" +
// aria-live="polite" + visible text) and academy-manager.vue's
// `isLoadingManager` block (role="status" + aria-live="polite" +
// aria-busy="true" + visible text).
//
// This asserts the textual shape of the fix stays in place: the div
// wrapping `v-else-if="phase === 'loading'"` carries role="status" and
// aria-live="polite", and contains a text node (sr-only or otherwise) so a
// screen reader actually has something to announce -- an empty role="status"
// element announces nothing. Deliberately scoped to this one template
// block, mirroring this project's other narrow textual guards over a
// general-purpose static analyzer (see verifyDaVinciDimensionToneGuard.ts).
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const COMPONENT_PATH = join(
  repositoryRoot,
  'components/conductor/davinci-page.vue',
)

// Anchored on the `phase === 'loading'` marker rather than any surrounding
// wording, so this guard reports *which* attribute regressed instead of
// just "not found" if the block is edited.
const BLOCK_MARKER = "phase === 'loading'"
const NEXT_BLOCK_MARKER = '<!-- Start a new life'

export function extractResumingBlock(content: string): string | null {
  const markerIndex = content.indexOf(BLOCK_MARKER)
  if (markerIndex === -1) return null

  const tagStart = content.lastIndexOf('<div', markerIndex)
  if (tagStart === -1) return null
  const openingTagEnd = content.indexOf('>', markerIndex)
  if (openingTagEnd === -1) return null

  const nextBlockIndex = content.indexOf(NEXT_BLOCK_MARKER, openingTagEnd)
  const blockEnd = nextBlockIndex === -1 ? content.length : nextBlockIndex

  return content.slice(tagStart, blockEnd)
}

export function checkResumingStatusGuard(content: string): string[] {
  const errors: string[] = []

  const block = extractResumingBlock(content)
  if (!block) {
    errors.push(
      'Could not find a <div v-else-if="phase === \'loading\'"> block in ' +
        'davinci-page.vue -- has the resuming/loading state been ' +
        'restructured or removed? If so, this guard needs to move with it.',
    )
    return errors
  }

  const openingTagEnd = block.indexOf('>')
  const openingTag = block.slice(0, openingTagEnd + 1)

  if (!openingTag.includes('role="status"')) {
    errors.push(
      "The resuming block's wrapping <div> no longer carries " +
        'role="status" -- assistive tech gets no signal that an existing ' +
        'run is being restored on page load, unlike every comparable ' +
        '"restoring on load" state elsewhere in the app ' +
        "(model-builder-manager.vue's resumingRun, " +
        "academy-manager.vue's isLoadingManager).",
    )
  }

  if (!openingTag.includes('aria-live="polite"')) {
    errors.push(
      "The resuming block's wrapping <div> no longer carries " +
        'aria-live="polite" -- a screen reader would not be told when ' +
        'this state appears.',
    )
  }

  const afterOpeningTag = block.slice(openingTagEnd + 1)
  if (!/\S/.test(afterOpeningTag.replace(/<[^>]*>/g, ''))) {
    errors.push(
      'The resuming block no longer contains any text content -- an ' +
        'empty role="status" element announces nothing to assistive ' +
        'tech, so the skeleton needs a visible or sr-only text node (e.g. ' +
        '`<span class="sr-only">Resuming your life…</span>`).',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(COMPONENT_PATH, 'utf8')
  const errors = checkResumingStatusGuard(content)

  if (errors.length) {
    console.error(
      'Da Vinci resuming-status guard contract failed in davinci-page.vue:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Da Vinci resuming-status guard contract passed: the "Resuming an ' +
      'existing run" skeleton announces itself to assistive tech via ' +
      'role="status"/aria-live="polite" plus a real text node, matching ' +
      'every other "restoring on page load" convention in the app.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
