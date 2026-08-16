// /utils/scripts/verifyModelBuilderStageStatusJsonParseGuard.ts
//
// Regression guard (model-builder/t-029) -- ModelBuildItem.stageStatuses and
// ModelBuildRun.sourceSnapshot are both plain `String @db.LongText` columns
// (see utils/scripts/verifyNoPrismaJsonCast.ts), not native Prisma Json
// columns. Every /api/model-builder/* route writes them with JSON.stringify
// and reads them back with parseStoredJson (server/api/model-builder/runs/
// index.ts) -- so any value that has round-tripped through a GET/POST
// response is a JSON *string* on the client, never an already-parsed object.
//
// stores/modelBuilderStore.ts's normalizeStages() and adaptRun()'s
// sourceSnapshot handling used to gate on `typeof raw === 'object'` alone,
// which is never true for server-sourced data -- so normalizeStages always
// silently discarded the real stageStatuses and returned the fresh-item
// default (PITCH ready, everything else locked), and sourceSnapshot always
// came back null. This stayed invisible for the run that actually did the
// approving/promoting/committing: approveStage/pushItem/etc. all mutate the
// SAME long-lived state.run object in place, so optimistic local state kept
// showing the right thing right up until the object was rebuilt from a fresh
// server read (resumeRun() on page load, openRun() for a run not already
// cached in state.runs, fetchRuns() populating the History list). Concrete
// repro (pre-fix): approve PITCH, refresh the page (or reopen the same run
// from Run History) -- the just-approved stage (or even a fully committed
// one) silently reverted to 'ready'/'locked' in the UI, while the item's own
// targetId/targetType/artImageId (typed columns, unaffected) still correctly
// showed "Committed" -- a self-contradicting item panel with no error raised.
//
// Fixed by routing both through a shared parseJsonValue() helper that
// JSON.parses a string before the object check, instead of checking the
// object-ness of the raw (still-serialized) value directly.
//
// This asserts the textual shape of that fix stays in place.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const PARSE_HELPER_ANCHOR = 'function parseJsonValue('
const NORMALIZE_STAGES_ANCHOR = 'function normalizeStages('
const ADAPT_RUN_ANCHOR = 'function adaptRun('

// Extracts a `function name(...) { ... }` body via brace matching from the
// first `{` after the anchor, so the check is robust to reformatting inside
// the function.
export function extractFunctionBody(
  content: string,
  anchor: string,
): string | null {
  const anchorIndex = content.indexOf(anchor)
  if (anchorIndex === -1) return null

  const braceOpen = content.indexOf('{', anchorIndex)
  if (braceOpen === -1) return null

  let depth = 0
  let i = braceOpen
  for (; i < content.length; i++) {
    if (content[i] === '{') depth++
    else if (content[i] === '}') {
      depth--
      if (depth === 0) break
    }
  }
  if (depth !== 0) return null

  return content.slice(braceOpen, i + 1)
}

export function checkStageStatusJsonParseGuard(content: string): string[] {
  const errors: string[] = []

  if (!content.includes(PARSE_HELPER_ANCHOR)) {
    errors.push(
      `Could not find \`${PARSE_HELPER_ANCHOR}\` in stores/modelBuilderStore.ts -- ` +
        'has the shared JSON-string-or-object parse helper been renamed, removed, ' +
        'or restructured? If so, this guard (and the bug it protects against) ' +
        'needs to move with it.',
    )
    return errors
  }

  const normalizeStagesBody = extractFunctionBody(
    content,
    NORMALIZE_STAGES_ANCHOR,
  )
  if (normalizeStagesBody === null) {
    errors.push(
      `Could not find \`${NORMALIZE_STAGES_ANCHOR}\` in stores/modelBuilderStore.ts.`,
    )
  } else if (!normalizeStagesBody.includes('parseJsonValue(raw)')) {
    errors.push(
      'normalizeStages() no longer routes its `raw` argument through ' +
        'parseJsonValue() before checking whether it is an object -- server-sourced ' +
        'stageStatuses is always a JSON string, so this would silently discard every ' +
        "item's real stage progress on the next resume/reopen/refresh and fall back " +
        'to the fresh-item default (PITCH ready, everything else locked).',
    )
  }

  const adaptRunBody = extractFunctionBody(content, ADAPT_RUN_ANCHOR)
  if (adaptRunBody === null) {
    errors.push(
      `Could not find \`${ADAPT_RUN_ANCHOR}\` in stores/modelBuilderStore.ts.`,
    )
  } else if (!adaptRunBody.includes('parseJsonValue(server.sourceSnapshot)')) {
    errors.push(
      'adaptRun() no longer routes server.sourceSnapshot through parseJsonValue() ' +
        'before checking whether it is an object -- server-sourced sourceSnapshot is ' +
        'always a JSON string, so this would silently come back null on every ' +
        "resume/reopen/refresh, even though the run's own creation genuinely " +
        'captured it.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkStageStatusJsonParseGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder stage-status JSON-parse guard contract failed for ' +
        'stores/modelBuilderStore.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder stage-status JSON-parse guard contract passed: ' +
      'normalizeStages()/adaptRun() parse server-sourced JSON-string fields ' +
      'before checking their shape.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
