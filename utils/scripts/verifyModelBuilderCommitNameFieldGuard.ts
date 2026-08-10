// /utils/scripts/verifyModelBuilderCommitNameFieldGuard.ts
//
// Regression guard (model-builder/t-029, kaizen) -- every CREATE target's
// field spec in modelBuilderFields.ts (MODEL_FIELDS) declares a required
// 'name' (Character/Bot/Reward) or 'title' (Dream/Scenario/Project/Facet)
// line. defaultFieldsTemplate() pre-fills it, fieldsBrief() tells the AI
// drafter it's required, and model-builder-batch-editor.vue renders it as a
// labeled, red-asterisk "required" input the user can batch-set or hand-edit
// directly in the per-item panel's raw fields textarea. None of that ever
// reached items/[id]/commit.post.ts: the route computed the new record's
// name/title solely from the first line of item.pitch (falling back to
// item.label / 'Untitled'), so a name the user deliberately typed into the
// required field was parsed into fieldMap, displayed, batch-applied, and
// persisted to fieldsDraft -- but silently discarded in favor of pitch text
// on commit. Concrete failure: type "Grommash Ironjaw" into the required
// Name field of a CREATE Character item, approve every stage, commit -- the
// resulting Character.name is the first line of the pitch, not "Grommash
// Ironjaw". Same for Reward/Bot (.name) and Dream/Scenario/Project/Facet
// (.title).
//
// Fixed by computing `name` from fieldMap.name / fieldMap.title first,
// falling back to the pitch-derived heuristic only when neither is set.
//
// This asserts the textual shape of that fix stays in place: the `const
// name = (` assignment in commit.post.ts's default event handler prefers
// `fieldMap.name` and `fieldMap.title` (in that order) ahead of the
// `item.pitch?.split('\n')[0]` fallback it used to rely on exclusively.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const ROUTE_PATH = join(
  repositoryRoot,
  'server/api/model-builder/items/[id]/commit.post.ts',
)

const NAME_ASSIGNMENT = 'const name = ('
const PITCH_FALLBACK = "item.pitch?.split('\\n')[0]?.trim()"

// Extracts the `const name = ( ... )` expression via paren matching from the
// first `(` after the assignment, so the check is robust to reformatting of
// the fallback chain inside it.
export function extractNameAssignment(content: string): string | null {
  const anchorIndex = content.indexOf(NAME_ASSIGNMENT)
  if (anchorIndex === -1) return null

  const parenOpen = anchorIndex + NAME_ASSIGNMENT.length - 1
  let depth = 0
  let i = parenOpen
  for (; i < content.length; i++) {
    if (content[i] === '(') depth++
    else if (content[i] === ')') {
      depth--
      if (depth === 0) break
    }
  }
  if (depth !== 0) return null

  return content.slice(parenOpen, i + 1)
}

// Checks the fix's exact shape against the full source text of a file
// containing commit.post.ts's `const name = (...)` assignment. Exported
// (rather than only exercised via main()) so the self-test below can run it
// against synthetic buggy/fixed fixtures without touching the real route
// file.
export function checkCommitNameFieldGuard(content: string): string[] {
  const errors: string[] = []

  const expr = extractNameAssignment(content)
  if (expr === null) {
    errors.push(
      `Could not find \`${NAME_ASSIGNMENT}\` in commit.post.ts -- has the ` +
        'name/title computation been renamed, removed, or restructured? ' +
        'If so, this guard (and the bug it protects against) needs to ' +
        'move with it.',
    )
    return errors
  }

  const fallbackIndex = expr.indexOf(PITCH_FALLBACK)
  if (fallbackIndex === -1) {
    errors.push(
      `\`${NAME_ASSIGNMENT}\` no longer contains the \`${PITCH_FALLBACK}\` ` +
        "fallback -- this guard's anchor point has moved.",
    )
    return errors
  }

  const nameFieldIndex = expr.indexOf('fieldMap.name')
  const titleFieldIndex = expr.indexOf('fieldMap.title')

  if (nameFieldIndex === -1 || nameFieldIndex >= fallbackIndex) {
    errors.push(
      "commit.post.ts's name assignment does not prefer `fieldMap.name` " +
        'ahead of the pitch-derived fallback. Every CREATE target that uses ' +
        "a 'name' field (Character/Bot/Reward, per MODEL_FIELDS in " +
        'modelBuilderFields.ts) exposes it as a required, user-editable ' +
        'field in the batch editor and item panel -- without this, a ' +
        'deliberately-typed name is silently discarded in favor of the ' +
        "pitch's first line on commit.",
    )
  }

  if (titleFieldIndex === -1 || titleFieldIndex >= fallbackIndex) {
    errors.push(
      "commit.post.ts's name assignment does not prefer `fieldMap.title` " +
        'ahead of the pitch-derived fallback. Every CREATE target that uses ' +
        "a 'title' field (Dream/Scenario/Project/Facet, per MODEL_FIELDS in " +
        'modelBuilderFields.ts) exposes it as a required, user-editable ' +
        'field in the batch editor and item panel -- without this, a ' +
        'deliberately-typed title is silently discarded in favor of the ' +
        "pitch's first line on commit.",
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(ROUTE_PATH, 'utf8')
  const errors = checkCommitNameFieldGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder commit name/title field guard contract failed for ' +
        'server/api/model-builder/items/[id]/commit.post.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder commit name/title field guard contract passed: CREATE ' +
      'commits prefer the user-editable fieldMap.name/fieldMap.title over ' +
      'the pitch-derived fallback.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
