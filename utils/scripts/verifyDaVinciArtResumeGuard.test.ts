// /utils/scripts/verifyDaVinciArtResumeGuard.test.ts
//
// Regression test for checkArtResumeGuard() in verifyDaVinciArtResumeGuard.ts
// (davinci/t-021 slice 14; cache read/write moved to
// createPersistedNarrativeArtJobsController()'s readCache()/writeCache() in
// davinci/t-025). Exercises the real check against synthetic
// component-shaped fixtures covering: the fixed shape (both update
// functions persist, resumePendingArtJobs() reads the cache and resumes
// both slots while seeding chapterArt first, resumeRun() calls it after
// hydrating, playAgain() clears the cache), and regressions dropping each
// piece individually.
import assert from 'node:assert/strict'

import { checkArtResumeGuard } from './verifyDaVinciArtResumeGuard.js'

function fixture(opts: {
  updateChapterPersist: string
  updateEndingPersist: string
  resumePendingBody: string
  resumeRunHydrate: string
  resumeRunResume: string
  playAgainClear: string
}): string {
  return `
<script setup lang="ts">
function updateChapterArt(runId: number, chapter: number, art: NarrativeArtJobState) {
  if (run.value?.id !== runId) return
  chapterArt.value = { ...chapterArt.value, [chapter]: art }
  ${opts.updateChapterPersist}
}

function updateEndingArt(runId: number, art: NarrativeArtJobState) {
  if (run.value?.id !== runId) return
  endingArt.value = art
  ${opts.updateEndingPersist}
}

function persistArtJobs() {
  if (!run.value) return
  narrativeArtJobs.writeCache(ART_JOBS_STORAGE_KEY, run.value.id, {
    chapterArt: chapterArt.value,
    endingArt: endingArt.value,
  })
}

function resumePendingArtJobs(runId: number) {
  ${opts.resumePendingBody}
}

function requestChapterArt(chapter: number, artPrompt: string) {
  if (!run.value || chapterArt.value[chapter]) return
}

function hydrateArtFromRun(data: LifeRunRecord) {
  chapterArt.value = {}
  endingArt.value = null
}

async function resumeRun(id: number) {
  phase.value = 'loading'
  run.value = response.data
  ${opts.resumeRunHydrate}
  ${opts.resumeRunResume}

  if (response.data.status === 'COMPLETE' && response.data.Ending) {
    phase.value = 'ending'
  }
}

async function startLife() {
  submitting.value = true
}

function playAgain() {
  localStorage.removeItem(STORAGE_KEY)
  ${opts.playAgainClear}
  run.value = null
}

function abandonRun() {
  if (submitting.value) return
}
</script>
`
}

const FIXED_ARGS = {
  updateChapterPersist: 'persistArtJobs()',
  updateEndingPersist: 'persistArtJobs()',
  resumePendingBody: `
    const cached = narrativeArtJobs.readCache<{
      chapterArt?: Record<string, NarrativeArtJobState>
      endingArt?: NarrativeArtJobState | null
    }>(ART_JOBS_STORAGE_KEY, runId)
    if (!cached) return
    for (const [key, state] of Object.entries(cached.chapterArt ?? {})) {
      const chapter = Number(key)
      updateChapterArt(runId, chapter, state)
      narrativeArtJobs.resume(state, (art) => updateChapterArt(runId, chapter, art))
    }
    if (cached.endingArt && !endingArt.value) {
      updateEndingArt(runId, cached.endingArt)
      narrativeArtJobs.resume(cached.endingArt, (art) => updateEndingArt(runId, art))
    }
  `,
  resumeRunHydrate: 'hydrateArtFromRun(response.data)',
  resumeRunResume: 'resumePendingArtJobs(response.data.id)',
  playAgainClear: 'localStorage.removeItem(ART_JOBS_STORAGE_KEY)',
}

const FIXED = fixture(FIXED_ARGS)

// Pre-fix shape: none of slice 14's additions exist at all.
const BUGGY = fixture({
  updateChapterPersist: '',
  updateEndingPersist: '',
  resumePendingBody: '',
  resumeRunHydrate: 'hydrateArtFromRun(response.data)',
  resumeRunResume: '',
  playAgainClear: '',
})

function run(): void {
  const fixedErrors = checkArtResumeGuard(FIXED)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const buggyErrors = checkArtResumeGuard(BUGGY)
  assert.equal(
    buggyErrors.length,
    7,
    `expected the buggy fixture to fail all seven checks, got: ${JSON.stringify(buggyErrors)}`,
  )

  // Each piece dropped individually still fails only its own check(s).
  const missingChapterPersist = checkArtResumeGuard(
    fixture({ ...FIXED_ARGS, updateChapterPersist: '' }),
  )
  assert.equal(missingChapterPersist.length, 1)
  assert.ok(
    missingChapterPersist.some((e) =>
      /updateChapterArt\(\) no longer calls persistArtJobs\(\)/.test(e),
    ),
  )

  const missingEndingPersist = checkArtResumeGuard(
    fixture({ ...FIXED_ARGS, updateEndingPersist: '' }),
  )
  assert.equal(missingEndingPersist.length, 1)
  assert.ok(
    missingEndingPersist.some((e) =>
      /updateEndingArt\(\) no longer calls persistArtJobs\(\)/.test(e),
    ),
  )

  const missingResumeCall = checkArtResumeGuard(
    fixture({
      ...FIXED_ARGS,
      resumePendingBody: `
        const cached = narrativeArtJobs.readCache<{
          chapterArt?: Record<string, NarrativeArtJobState>
          endingArt?: NarrativeArtJobState | null
        }>(ART_JOBS_STORAGE_KEY, runId)
        if (!cached) return
        for (const [key, state] of Object.entries(cached.chapterArt ?? {})) {
          const chapter = Number(key)
          updateChapterArt(runId, chapter, state)
        }
      `,
    }),
  )
  assert.equal(missingResumeCall.length, 1)
  assert.ok(
    missingResumeCall.some((e) =>
      /no longer calls narrativeArtJobs\.resume\(\) for both/.test(e),
    ),
  )

  const missingSeed = checkArtResumeGuard(
    fixture({
      ...FIXED_ARGS,
      resumePendingBody: `
        const cached = narrativeArtJobs.readCache<{
          chapterArt?: Record<string, NarrativeArtJobState>
          endingArt?: NarrativeArtJobState | null
        }>(ART_JOBS_STORAGE_KEY, runId)
        if (!cached) return
        for (const [key, state] of Object.entries(cached.chapterArt ?? {})) {
          const chapter = Number(key)
          narrativeArtJobs.resume(state, (art) => updateChapterArt(runId, chapter, art))
        }
        if (cached.endingArt && !endingArt.value) {
          narrativeArtJobs.resume(cached.endingArt, (art) => updateEndingArt(runId, art))
        }
      `,
    }),
  )
  assert.equal(missingSeed.length, 1)
  assert.ok(missingSeed.some((e) => /no longer seeds chapterArt via/.test(e)))

  const missingResumeRunCall = checkArtResumeGuard(
    fixture({ ...FIXED_ARGS, resumeRunResume: '' }),
  )
  assert.equal(missingResumeRunCall.length, 1)
  assert.ok(
    missingResumeRunCall.some((e) =>
      /resumeRun\(\) no longer calls resumePendingArtJobs\(\)/.test(e),
    ),
  )

  const wrongOrder = checkArtResumeGuard(
    fixture({
      ...FIXED_ARGS,
      resumeRunHydrate: '',
      resumeRunResume:
        'resumePendingArtJobs(response.data.id)\n  hydrateArtFromRun(response.data)',
    }),
  )
  assert.equal(wrongOrder.length, 1)
  assert.ok(
    wrongOrder.some((e) =>
      /before \(or without\) hydrateArtFromRun\(\)/.test(e),
    ),
  )

  const missingPlayAgainClear = checkArtResumeGuard(
    fixture({ ...FIXED_ARGS, playAgainClear: '' }),
  )
  assert.equal(missingPlayAgainClear.length, 1)
  assert.ok(
    missingPlayAgainClear.some((e) =>
      /playAgain\(\) no longer removes ART_JOBS_STORAGE_KEY/.test(e),
    ),
  )

  console.log(
    'Da Vinci art-resume guard self-test passed: buggy fixture fails all ' +
      'seven checks, fixed fixture passes, and each individual regression ' +
      'fails only its own check.',
  )
}

run()
