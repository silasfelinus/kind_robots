// /utils/scripts/verifyDaVinciArtRunGuard.test.ts
//
// Regression test for checkArtRunGuard() in verifyDaVinciArtRunGuard.ts
// (davinci/t-021 slice 13). Exercises the real check against synthetic
// component-shaped fixtures covering: the fixed shape (runId parameter +
// guard on both update functions, both request functions capturing and
// threading runId through), and regressions dropping each piece
// individually.
import assert from 'node:assert/strict'

import { checkArtRunGuard } from './verifyDaVinciArtRunGuard.js'

function fixture(opts: {
  updateChapterParam: string
  updateChapterCheck: string
  updateEndingParam: string
  updateEndingCheck: string
  requestChapterCapture: string
  requestChapterPass: string
  requestEndingCapture: string
  requestEndingPass: string
}): string {
  return `
<script setup lang="ts">
function requestChapterArt(chapter: number, artPrompt: string) {
  if (!run.value || chapterArt.value[chapter]) return
  ${opts.requestChapterCapture}
  void narrativeArtJobs.enqueue(
    { product: 'davinci', sessionId: \`davinci-run-\${run.value.id}\` },
    (art) => ${opts.requestChapterPass},
  )
}

function requestEndingArt() {
  if (!run.value || !endingData.value || endingArt.value) return
  ${opts.requestEndingCapture}
  void narrativeArtJobs.enqueue(
    { product: 'davinci', sessionId: \`davinci-run-\${run.value.id}\` },
    (art) => ${opts.requestEndingPass},
  )
}

function hydrateArtFromRun(data: LifeRunRecord) {
  chapterArt.value = {}
}

function updateChapterArt(
  ${opts.updateChapterParam}
  chapter: number,
  art: NarrativeArtJobState,
) {
  ${opts.updateChapterCheck}
  chapterArt.value = { ...chapterArt.value, [chapter]: art }
}

function updateEndingArt(${opts.updateEndingParam} art: NarrativeArtJobState) {
  ${opts.updateEndingCheck}
  endingArt.value = art
}

async function resumeRun(id: number) {
  phase.value = 'loading'
}
</script>
`
}

const FIXED_ARGS = {
  updateChapterParam: 'runId: number,',
  updateChapterCheck: 'if (run.value?.id !== runId) return',
  updateEndingParam: 'runId: number,',
  updateEndingCheck: 'if (run.value?.id !== runId) return',
  requestChapterCapture: 'const runId = run.value.id',
  requestChapterPass: 'updateChapterArt(runId, chapter, art)',
  requestEndingCapture: 'const runId = run.value.id',
  requestEndingPass: 'updateEndingArt(runId, art)',
}

const FIXED = fixture(FIXED_ARGS)

// Pre-fix shape: no runId anywhere.
const BUGGY = fixture({
  updateChapterParam: '',
  updateChapterCheck: '',
  updateEndingParam: '',
  updateEndingCheck: '',
  requestChapterCapture: '',
  requestChapterPass: 'updateChapterArt(chapter, art)',
  requestEndingCapture: '',
  requestEndingPass: 'updateEndingArt(art)',
})

function run(): void {
  const fixedErrors = checkArtRunGuard(FIXED)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const buggyErrors = checkArtRunGuard(BUGGY)
  assert.equal(
    buggyErrors.length,
    8,
    `expected the buggy fixture to fail all eight checks, got: ${JSON.stringify(buggyErrors)}`,
  )

  // Each piece dropped individually still fails only its own check(s).
  const missingChapterParam = checkArtRunGuard(
    fixture({ ...FIXED_ARGS, updateChapterParam: '' }),
  )
  assert.equal(missingChapterParam.length, 1)
  assert.ok(
    missingChapterParam.some((e) =>
      /no longer takes a `runId: number` parameter/.test(e),
    ),
  )

  const missingChapterCheck = checkArtRunGuard(
    fixture({ ...FIXED_ARGS, updateChapterCheck: '' }),
  )
  assert.equal(missingChapterCheck.length, 1)
  assert.ok(
    missingChapterCheck.some((e) =>
      /updateChapterArt\(\) no longer checks `run\.value\?\.id !== runId`/.test(
        e,
      ),
    ),
  )

  const missingEndingParam = checkArtRunGuard(
    fixture({ ...FIXED_ARGS, updateEndingParam: '' }),
  )
  assert.equal(missingEndingParam.length, 1)
  assert.ok(
    missingEndingParam.some((e) =>
      /no longer takes a `runId: number` parameter/.test(e),
    ),
  )

  const missingEndingCheck = checkArtRunGuard(
    fixture({ ...FIXED_ARGS, updateEndingCheck: '' }),
  )
  assert.equal(missingEndingCheck.length, 1)
  assert.ok(
    missingEndingCheck.some((e) =>
      /updateEndingArt\(\) no longer checks `run\.value\?\.id !== runId`/.test(
        e,
      ),
    ),
  )

  const missingChapterCapture = checkArtRunGuard(
    fixture({ ...FIXED_ARGS, requestChapterCapture: '' }),
  )
  assert.equal(missingChapterCapture.length, 1)
  assert.ok(
    missingChapterCapture.some((e) =>
      /requestChapterArt\(\) no longer captures/.test(e),
    ),
  )

  const missingChapterPass = checkArtRunGuard(
    fixture({
      ...FIXED_ARGS,
      requestChapterPass: 'updateChapterArt(chapter, art)',
    }),
  )
  assert.equal(missingChapterPass.length, 1)
  assert.ok(
    missingChapterPass.some((e) =>
      /requestChapterArt\(\) no longer passes/.test(e),
    ),
  )

  const missingEndingCapture = checkArtRunGuard(
    fixture({ ...FIXED_ARGS, requestEndingCapture: '' }),
  )
  assert.equal(missingEndingCapture.length, 1)
  assert.ok(
    missingEndingCapture.some((e) =>
      /requestEndingArt\(\) no longer captures/.test(e),
    ),
  )

  const missingEndingPass = checkArtRunGuard(
    fixture({ ...FIXED_ARGS, requestEndingPass: 'updateEndingArt(art)' }),
  )
  assert.equal(missingEndingPass.length, 1)
  assert.ok(
    missingEndingPass.some((e) =>
      /requestEndingArt\(\) no longer passes/.test(e),
    ),
  )

  console.log(
    'Da Vinci art-run guard self-test passed: buggy fixture fails all ' +
      'eight checks, fixed fixture passes, and each individual regression ' +
      '(missing param/check/capture/pass, chapter and ending sides) fails ' +
      'only its own check.',
  )
}

run()
