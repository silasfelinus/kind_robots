// /utils/scripts/verifyDaVinciNarrateStaleResponseGuard.test.ts
//
// Regression test for checkNarrateStaleResponseGuard() in
// verifyDaVinciNarrateStaleResponseGuard.ts (davinci/t-021 slice 12).
// Exercises the real check against synthetic component-shaped fixtures
// covering: the fixed shape (ticket declared, captured before the await,
// checked after it), a missing-declaration regression, a
// missing-capture regression, a missing-check regression, and a
// missing-function regression (narrateChapter removed entirely).
import assert from 'node:assert/strict'

import {
  checkNarrateStaleResponseGuard,
  extractNarrateChapterFunction,
} from './verifyDaVinciNarrateStaleResponseGuard.js'

function fixture(declaration: string, capture: string, check: string): string {
  return `
<script setup lang="ts">
const aiChapter = ref<ActiveChapter | null>(null)
${declaration}

async function narrateChapter() {
  if (!run.value) return
  ${capture}
  narrating.value = true
  narrationError.value = ''
  aiChapter.value = null

  const response = await performFetch<NarrationResponseData>(
    \`/api/davinci/runs/\${run.value.id}/narrate\`,
    { method: 'POST', body: JSON.stringify({ chapter: chapterIndex.value }) },
  )

  ${check}

  narrating.value = false

  if (!response.success || !response.data) {
    narrationError.value = response.message || 'The narrator could not be reached.'
    return
  }
}

function useCuratedChapters() {
  narrationMode.value = 'curated'
}
</script>
`
}

const DECLARATION = 'let narrateChapterRequestId = 0'
const CAPTURE = 'const requestId = ++narrateChapterRequestId'
const CHECK = 'if (narrateChapterRequestId !== requestId) return'

const FIXED = fixture(DECLARATION, CAPTURE, CHECK)

// Pre-fix shape: no ticket at all.
const BUGGY = fixture('', '', '')

// Declaration and capture present, but the post-await check was dropped.
const NO_CHECK = fixture(DECLARATION, CAPTURE, '')

// Declaration and check present, but the pre-await capture was dropped.
const NO_CAPTURE = fixture(DECLARATION, '', CHECK)

// The ticket variable itself was renamed/removed.
const NO_DECLARATION = fixture('', CAPTURE, CHECK)

const FUNCTION_REMOVED = `
<script setup lang="ts">
function useCuratedChapters() {
  narrationMode.value = 'curated'
}
</script>
`

function run(): void {
  const fixedErrors = checkNarrateStaleResponseGuard(FIXED)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const buggyErrors = checkNarrateStaleResponseGuard(BUGGY)
  assert.equal(
    buggyErrors.length,
    3,
    `expected the buggy fixture to fail all three checks, got: ${JSON.stringify(buggyErrors)}`,
  )
  assert.ok(
    buggyErrors.some((e) =>
      /Could not find `let narrateChapterRequestId/.test(e),
    ),
  )
  assert.ok(
    buggyErrors.some((e) => /no longer captures `const requestId/.test(e)),
  )
  assert.ok(
    buggyErrors.some((e) =>
      /no longer checks `narrateChapterRequestId/.test(e),
    ),
  )

  const noCheckErrors = checkNarrateStaleResponseGuard(NO_CHECK)
  assert.equal(noCheckErrors.length, 1)
  assert.ok(
    noCheckErrors.some((e) =>
      /no longer checks `narrateChapterRequestId/.test(e),
    ),
  )

  const noCaptureErrors = checkNarrateStaleResponseGuard(NO_CAPTURE)
  assert.equal(noCaptureErrors.length, 1)
  assert.ok(
    noCaptureErrors.some((e) => /no longer captures `const requestId/.test(e)),
  )

  const noDeclarationErrors = checkNarrateStaleResponseGuard(NO_DECLARATION)
  assert.equal(noDeclarationErrors.length, 1)
  assert.ok(
    noDeclarationErrors.some((e) =>
      /Could not find `let narrateChapterRequestId/.test(e),
    ),
  )

  const functionRemovedErrors = checkNarrateStaleResponseGuard(FUNCTION_REMOVED)
  assert.equal(functionRemovedErrors.length, 2)
  assert.ok(
    functionRemovedErrors.some((e) =>
      /Could not find `let narrateChapterRequestId/.test(e),
    ),
  )
  assert.ok(
    functionRemovedErrors.some((e) =>
      /Could not find `async function narrateChapter/.test(e),
    ),
  )

  assert.equal(extractNarrateChapterFunction(FUNCTION_REMOVED), null)

  console.log(
    'Da Vinci narrate-stale-response guard self-test passed: buggy ' +
      'fixture fails all three checks, fixed fixture passes, and the ' +
      'missing-declaration/missing-capture/missing-check/missing-function ' +
      'regressions all fail individually as expected.',
  )
}

run()
