// /utils/scripts/verifyDaVinciArtRunGuard.ts
//
// Regression guard (davinci/t-021 slice 13) -- updateChapterArt()/
// updateEndingArt() in components/conductor/davinci-page.vue are passed as
// callbacks to narrativeArtJobsHelper's enqueue()/retry(), which can take
// minutes to resolve (5s poll interval, up to 120 attempts) and has no
// concept of "is this run still active" -- nothing cancels the poll on
// abandon/restart (its timers live in a module-level Map keyed by
// dedupeKey, independent of this component's refs). Without a guard, a
// player who abandons a run and starts or resumes a *different* one before
// an old art job resolves would have the stale callback fire against the
// new run's state: `chapterArt` is keyed only by chapter number (which
// resets to 1 for every new run), so the stale result would silently
// overwrite the new run's own chapter art, and persistLifeRunArt() reads
// `run.value.id` at call time -- attaching the abandoned run's illustration
// to the new run's LifeRunArt row server-side. For the single endingArt
// slot it's worse: requestEndingArt() no-ops once `endingArt.value` is
// already set, so a leaked stale value would also silently suppress the new
// run's own ending illustration from ever being requested. Same shape as
// narrateChapter()'s requestId ticket (davinci/t-021 slice 12, see
// verifyDaVinciNarrateStaleResponseGuard.ts) applied to the art-attachment
// path instead of narration text -- here the run's own id (unique per run,
// unlike a chapter number) doubles as the ticket.
//
// This asserts the textual shape of the fix stays in place: both update
// functions take a `runId` parameter and check it against `run.value?.id`
// before applying anything, and both request functions (plus both retry
// functions) capture `runId` from `run.value.id` before enqueueing/
// retrying and thread it through to the callback. Deliberately scoped via
// narrow textual checks, mirroring this project's other guards over a
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

const RUN_ID_CHECK_RE = /if\s*\(\s*run\.value\?\.id\s*!==\s*runId\s*\)\s*return/

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

export function checkArtRunGuard(content: string): string[] {
  const errors: string[] = []

  const updateChapterArt = extractFunction(
    content,
    'function updateChapterArt(',
    ['function updateEndingArt(', 'async function resumeRun('],
  )
  if (!updateChapterArt) {
    errors.push(
      'Could not find `function updateChapterArt(` in davinci-page.vue -- ' +
        'has it been restructured or removed? If so, this guard needs to ' +
        'move with it.',
    )
  } else {
    if (!/runId:\s*number/.test(updateChapterArt)) {
      errors.push(
        'updateChapterArt() no longer takes a `runId: number` parameter -- ' +
          'without the run that requested this art job, a stale result ' +
          "from an abandoned run can't be told apart from the active one.",
      )
    }
    if (!RUN_ID_CHECK_RE.test(updateChapterArt)) {
      errors.push(
        'updateChapterArt() no longer checks `run.value?.id !== runId` ' +
          'before applying the art update -- a stale result (e.g. from a ' +
          'run the player already abandoned and replaced) would overwrite ' +
          "the new run's own chapter art and could attach the wrong " +
          'illustration to it server-side.',
      )
    }
  }

  const updateEndingArt = extractFunction(
    content,
    'function updateEndingArt(',
    ['async function resumeRun(', 'async function startLife('],
  )
  if (!updateEndingArt) {
    errors.push(
      'Could not find `function updateEndingArt(` in davinci-page.vue -- ' +
        'has it been restructured or removed? If so, this guard needs to ' +
        'move with it.',
    )
  } else {
    if (!/runId:\s*number/.test(updateEndingArt)) {
      errors.push(
        'updateEndingArt() no longer takes a `runId: number` parameter -- ' +
          'without the run that requested this art job, a stale result ' +
          "from an abandoned run can't be told apart from the active one.",
      )
    }
    if (!RUN_ID_CHECK_RE.test(updateEndingArt)) {
      errors.push(
        'updateEndingArt() no longer checks `run.value?.id !== runId` ' +
          'before applying the art update -- a stale result could both ' +
          'mis-attribute art server-side and silently suppress the new ' +
          "run's own ending illustration from ever being requested " +
          '(requestEndingArt() no-ops once endingArt.value is set).',
      )
    }
  }

  const requestChapterArt = extractFunction(
    content,
    'function requestChapterArt(',
    ['function requestEndingArt('],
  )
  if (
    requestChapterArt &&
    !/const\s+runId\s*=\s*run\.value\.id/.test(requestChapterArt)
  ) {
    errors.push(
      'requestChapterArt() no longer captures `const runId = ' +
        'run.value.id` before enqueueing the art job -- the callback has ' +
        'no way to know which run requested it.',
    )
  }
  if (
    requestChapterArt &&
    !/updateChapterArt\(runId,/.test(requestChapterArt)
  ) {
    errors.push(
      'requestChapterArt() no longer passes the captured `runId` through ' +
        'to updateChapterArt() -- the guard in updateChapterArt() has ' +
        'nothing to check against.',
    )
  }

  const requestEndingArt = extractFunction(
    content,
    'function requestEndingArt(',
    ['function hydrateArtFromRun('],
  )
  if (
    requestEndingArt &&
    !/const\s+runId\s*=\s*run\.value\.id/.test(requestEndingArt)
  ) {
    errors.push(
      'requestEndingArt() no longer captures `const runId = ' +
        'run.value.id` before enqueueing the art job -- the callback has ' +
        'no way to know which run requested it.',
    )
  }
  if (requestEndingArt && !/updateEndingArt\(runId,/.test(requestEndingArt)) {
    errors.push(
      'requestEndingArt() no longer passes the captured `runId` through ' +
        'to updateEndingArt() -- the guard in updateEndingArt() has ' +
        'nothing to check against.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(COMPONENT_PATH, 'utf8')
  const errors = checkArtRunGuard(content)

  if (errors.length) {
    console.error('Da Vinci art-run guard contract failed in davinci-page.vue:')
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Da Vinci art-run guard contract passed: updateChapterArt()/' +
      'updateEndingArt() both check the requesting run is still active ' +
      "before applying a poll result, so an abandoned run's art job " +
      "can't overwrite or block the currently active run's art.",
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
