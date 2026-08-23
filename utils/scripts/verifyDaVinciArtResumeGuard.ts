// /utils/scripts/verifyDaVinciArtResumeGuard.ts
//
// Regression guard (davinci/t-021 slice 14) -- a queued or rendering chapter/
// ending art job in components/conductor/davinci-page.vue has no server-side
// row until it reaches 'done' (persistLifeRunArt() in updateChapterArt()/
// updateEndingArt() only POSTs to /api/davinci/runs/{id}/art on a 'done'
// result with an artImageId). hydrateArtFromRun() rebuilds chapterArt/
// endingArt from the server's LifeRunArt rows on every resumeRun() call, but
// since those rows only ever cover *terminal* 'done' art, a job that was
// still queued/rendering -- or had already failed, with its retry button
// showing -- at the moment of a page reload (or any other remount: closing
// the tab, navigating away and back) was silently lost: no busy indicator,
// no retry button, and nothing left holding its dedupeKey or jobId to
// reconnect polling, even though the backend job could still be running or
// have already finished with an ArtImage that never gets attached to the
// run. Same "long-lived async state the component loses track of" shape as
// the stale-response guards above, but the failure direction is reversed --
// those guard against a stale result *arriving late and being misapplied*,
// this guards against an in-flight result *never being tracked again at
// all*.
//
// The fix mirrors storybookStore.ts's own resumeNarrativeArtJobs() (its
// `session.value.beats[].art` is persisted to localStorage in full and
// resumeNarrativeArtJobs() calls narrativeArtJobsHelper's resume() -- which
// already no-ops safely for a terminal state -- unconditionally on every
// beat that has one): here, updateChapterArt()/updateEndingArt() persist the
// current chapterArt/endingArt refs to a dedicated localStorage key on every
// transition, and resumeRun() calls resumePendingArtJobs() right after
// hydrateArtFromRun() to seed back and reconnect anything the server
// hydration didn't already cover.
//
// davinci/t-025: persistArtJobs()/resumePendingArtJobs() now read/write that
// cache through createPersistedNarrativeArtJobsController()'s writeCache()/
// readCache() (persistedNarrativeArtJobsHelper.ts) instead of calling
// localStorage directly -- the same controller storybookStore.ts's
// resumeNarrativeArtJobs() uses for its resume loop -- but the function
// names, the ART_JOBS_STORAGE_KEY cache key, and the seed-then-resume shape
// this guard protects are unchanged.
//
// This asserts the textual shape of the fix stays in place: both update
// functions persist on every call, resumePendingArtJobs() reads the cache
// via readCache() and calls narrativeArtJobs.resume() for both the chapter
// and ending slots, resumeRun() calls it after hydrating from the server,
// and playAgain() clears the cache along with the existing active-run-id
// key. Deliberately scoped via narrow textual checks, mirroring this
// project's other guards over a general-purpose static analyzer (see
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

function extractFunction(
  content: string,
  startMarker: string,
  endMarkers: string[],
): string | null {
  const startIndex = content.indexOf(startMarker)
  if (startIndex === -1) return null

  let end = content.length
  for (const marker of endMarkers) {
    const markerIndex = content.indexOf(marker, startIndex + startMarker.length)
    if (markerIndex !== -1 && markerIndex < end) end = markerIndex
  }

  return content.slice(startIndex, end)
}

export function checkArtResumeGuard(content: string): string[] {
  const errors: string[] = []

  const updateChapterArt = extractFunction(
    content,
    'function updateChapterArt(',
    ['function updateEndingArt(', 'async function resumeRun('],
  )
  if (updateChapterArt && !/persistArtJobs\(\)/.test(updateChapterArt)) {
    errors.push(
      'updateChapterArt() no longer calls persistArtJobs() -- a queued or ' +
        "rendering chapter art job's state won't survive a page reload, " +
        'so it would be silently lost instead of reconnecting on resume.',
    )
  }

  const updateEndingArt = extractFunction(
    content,
    'function updateEndingArt(',
    [
      'function persistArtJobs(',
      'function resumePendingArtJobs(',
      'async function resumeRun(',
    ],
  )
  if (updateEndingArt && !/persistArtJobs\(\)/.test(updateEndingArt)) {
    errors.push(
      'updateEndingArt() no longer calls persistArtJobs() -- a queued or ' +
        "rendering ending art job's state won't survive a page reload, " +
        'so it would be silently lost instead of reconnecting on resume.',
    )
  }

  const resumePendingArtJobs = extractFunction(
    content,
    'function resumePendingArtJobs(',
    ['function requestChapterArt(', 'function hydrateArtFromRun('],
  )
  if (!resumePendingArtJobs) {
    errors.push(
      'Could not find `function resumePendingArtJobs(` in davinci-page.vue ' +
        '-- without it, a cached queued/rendering/failed art job from a ' +
        'prior page load is never seeded back into chapterArt/endingArt or ' +
        'reconnected to polling.',
    )
  } else {
    if (
      !/narrativeArtJobs\.readCache[\s\S]*?\(\s*ART_JOBS_STORAGE_KEY\s*,/.test(
        resumePendingArtJobs,
      )
    ) {
      errors.push(
        'resumePendingArtJobs() no longer reads ART_JOBS_STORAGE_KEY via ' +
          'narrativeArtJobs.readCache() -- it has nothing to resume from.',
      )
    }
    const chapterResumeCount = (
      resumePendingArtJobs.match(/narrativeArtJobs\.resume\(/g) || []
    ).length
    if (chapterResumeCount < 2) {
      errors.push(
        'resumePendingArtJobs() no longer calls narrativeArtJobs.resume() ' +
          'for both the chapter-art loop and the ending-art slot -- a ' +
          'cached in-flight job would be seeded into the UI but never ' +
          'reconnected to its poll, so it would stay stuck showing a busy ' +
          'state that never resolves.',
      )
    }
    if (
      !/updateChapterArt\(runId,\s*chapter,\s*state\)/.test(
        resumePendingArtJobs,
      )
    ) {
      errors.push(
        'resumePendingArtJobs() no longer seeds chapterArt via ' +
          'updateChapterArt() before resuming -- a cached failed job would ' +
          "lose its retry button until the next poll, and a queued job's " +
          'busy indicator would be blank until the first poll response.',
      )
    }
  }

  const resumeRun = extractFunction(content, 'async function resumeRun(', [
    'async function startLife(',
  ])
  if (resumeRun) {
    const hydrateIndex = resumeRun.indexOf('hydrateArtFromRun(')
    const resumePendingIndex = resumeRun.indexOf('resumePendingArtJobs(')
    if (resumePendingIndex === -1) {
      errors.push(
        'resumeRun() no longer calls resumePendingArtJobs() -- a page ' +
          "reload while an art job is still queued/rendering won't " +
          'reconnect it, even though hydrateArtFromRun() only ever ' +
          'restores terminal (done) art from the server.',
      )
    } else if (hydrateIndex === -1 || resumePendingIndex < hydrateIndex) {
      errors.push(
        'resumeRun() calls resumePendingArtJobs() before (or without) ' +
          'hydrateArtFromRun() -- the resume step needs to run after the ' +
          "server's terminal art has already been loaded, so it only " +
          "fills in what the server hydration didn't cover.",
      )
    }
  }

  const playAgain = extractFunction(content, 'function playAgain(', [
    'function abandonRun(',
  ])
  if (
    playAgain &&
    !/localStorage\.removeItem\(\s*ART_JOBS_STORAGE_KEY\s*\)/.test(playAgain)
  ) {
    errors.push(
      'playAgain() no longer removes ART_JOBS_STORAGE_KEY from ' +
        "localStorage -- an abandoned or completed run's cached art jobs " +
        'would leak into the next run resumePendingArtJobs() sees.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(COMPONENT_PATH, 'utf8')
  const errors = checkArtResumeGuard(content)

  if (errors.length) {
    console.error(
      'Da Vinci art-resume guard contract failed in davinci-page.vue:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Da Vinci art-resume guard contract passed: a queued, rendering, or ' +
      'failed chapter/ending art job is cached to localStorage and ' +
      "reconnected on resumeRun(), so a page reload can't silently lose " +
      "track of an in-flight illustration the server hasn't persisted yet.",
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
