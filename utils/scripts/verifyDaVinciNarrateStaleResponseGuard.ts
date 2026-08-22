// /utils/scripts/verifyDaVinciNarrateStaleResponseGuard.ts
//
// Regression guard (davinci/t-021 slice 12) -- narrateChapter() in
// components/conductor/davinci-page.vue is called from resumeRun(),
// startLife(), and chooseOption(), and nothing stopped a PRIOR call's
// response from landing after a NEWER one. "Abandon this life" is only
// disabled by `submitting`, which chooseOption() already clears before its
// own post-choice narrateChapter() call begins, so a player can abandon a
// run while its narration request is still in flight, then immediately
// start (or resume) a different run before the old response resolves.
// Without a per-call ticket, that stale response would silently overwrite
// aiChapter/narratorName with the abandoned run's chapter, and
// requestChapterArt() would then attach the abandoned run's art job to the
// *new* run's id (run.value.id has already moved on by the time the stale
// response lands) via POST /api/davinci/runs/{id}/art -- corrupting the new
// run's persisted art, not just a stale UI flash. Same pattern this
// codebase already uses for the identical class of bug elsewhere (see
// stores/modelBuilderStore.ts's `fetchRunsRequestId`/`loadSources`'
// `requestedType`): capture a ticket per call, discard any response whose
// ticket no longer matches the latest one.
//
// This asserts the textual shape of the fix stays in place: narrateChapter()
// captures a ticket from a shared, monotonically-incrementing counter before
// awaiting the fetch, and checks that ticket against the counter's current
// value before applying the response. Deliberately scoped to this one
// function via narrow textual checks, mirroring this project's other guards
// over a general-purpose static analyzer (see
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

const FUNCTION_MARKER = 'async function narrateChapter()'
const NEXT_FUNCTION_MARKER = 'function useCuratedChapters()'

const TICKET_DECLARATION_RE = /let\s+narrateChapterRequestId\s*=\s*0/

export function extractNarrateChapterFunction(content: string): string | null {
  const markerIndex = content.indexOf(FUNCTION_MARKER)
  if (markerIndex === -1) return null

  const nextIndex = content.indexOf(NEXT_FUNCTION_MARKER, markerIndex)
  const end = nextIndex === -1 ? content.length : nextIndex

  return content.slice(markerIndex, end)
}

export function checkNarrateStaleResponseGuard(content: string): string[] {
  const errors: string[] = []

  if (!TICKET_DECLARATION_RE.test(content)) {
    errors.push(
      'Could not find `let narrateChapterRequestId = 0` in ' +
        'davinci-page.vue -- has the stale-response ticket for ' +
        'narrateChapter() been removed or renamed? A shared, ' +
        'monotonically-incrementing counter is required for the guard ' +
        'below to mean anything.',
    )
  }

  const fn = extractNarrateChapterFunction(content)
  if (!fn) {
    errors.push(
      'Could not find `async function narrateChapter()` in ' +
        'davinci-page.vue -- has it been restructured or removed? If so, ' +
        'this guard needs to move with it.',
    )
    return errors
  }

  const awaitIndex = fn.indexOf('await performFetch')
  if (awaitIndex === -1) {
    errors.push(
      'narrateChapter() no longer calls `await performFetch` where ' +
        'expected -- has the narration request been restructured?',
    )
    return errors
  }

  const beforeAwait = fn.slice(0, awaitIndex)
  const afterAwait = fn.slice(awaitIndex)

  if (
    !/const\s+requestId\s*=\s*\+\+narrateChapterRequestId/.test(beforeAwait)
  ) {
    errors.push(
      'narrateChapter() no longer captures `const requestId = ' +
        '++narrateChapterRequestId` before awaiting the narration ' +
        'fetch -- without a ticket captured up front, a stale response ' +
        'can no longer be told apart from the current one.',
    )
  }

  if (!/narrateChapterRequestId\s*!==\s*requestId/.test(afterAwait)) {
    errors.push(
      'narrateChapter() no longer checks `narrateChapterRequestId !== ' +
        'requestId` after awaiting the narration fetch -- a stale ' +
        'response (e.g. from a run the player already abandoned and ' +
        "replaced) would be applied on top of the current run's state " +
        'instead of being discarded.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(COMPONENT_PATH, 'utf8')
  const errors = checkNarrateStaleResponseGuard(content)

  if (errors.length) {
    console.error(
      'Da Vinci narrate-stale-response guard contract failed in ' +
        'davinci-page.vue:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Da Vinci narrate-stale-response guard contract passed: ' +
      'narrateChapter() captures a per-call ticket and discards any ' +
      "response whose ticket no longer matches the counter's current " +
      'value, so an abandoned run cannot overwrite a newer one.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
