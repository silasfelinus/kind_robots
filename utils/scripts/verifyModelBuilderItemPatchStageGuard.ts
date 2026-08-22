// /utils/scripts/verifyModelBuilderItemPatchStageGuard.ts
//
// Regression guard (model-builder/t-029, kaizen) -- prepareItemUpdate() in
// server/api/model-builder/runs/index.ts is the shared body behind both
// items/[id].patch.ts and items/batch.patch.ts. modelBuilderStore.ts's
// isStageEditable gate (ready/stale/rejected only) governs every content-
// editing call site client-side -- updatePitch/updateFields/updatePrompt,
// batchSetField -- but until this fix, prepareItemUpdate itself applied
// body.pitch/body.fieldsDraft/body.promptDraft unconditionally, with no
// check against the item's actual (server-stored) stage status. The client
// UI never sends such a request while a stage is 'approved' (the textarea is
// disabled), but this route trusted the client to have gotten there --
// exactly the same "silently rewrites a canonical model" gap
// items/[id]/commit.post.ts's own stage-approval gate exists to close for
// the commit route (kind_robots PR #1139), just reached through the item-
// edit route instead: a direct PATCH (bad client state, a retried/replayed
// request, or curl) for an item whose PITCH or FIELDS_AND_PROMPTS stage is
// already 'approved' (or still 'locked') could silently overwrite reviewed
// content server-side while its badge kept showing 'approved' client-side --
// no re-review, the review gate lying about what's actually stored.
//
// The identical gap existed one field over: body.artImageId (gated against
// GENERATE_ASSETS) was applied unconditionally too, so a direct PATCH for an
// item whose GENERATE_ASSETS was already 'approved' could silently repoint
// it at a different ArtImage (any the caller may attach at all, per
// assertArtImageAttachable -- their own or public) with no re-review, while
// the client-side guards for this exact class of overwrite
// (verifyModelBuilderApprovedAssetGuard.ts's generateItemAsset/
// pollAsyncArtJob checks) only ever run inside the store, never here.
//
// relationshipDraft (model-builder/t-029 cycle 21) had the identical gap:
// unlike pitch/fieldsDraft/promptDraft/artImageId, it was applied
// unconditionally with no assertContentStageEditable call at all -- dead in
// practice today (no client code sends body.relationshipDraft, confirmed via
// grep across modelBuilderStore.ts and every model-builder .vue component),
// but a defense-in-depth gap on a real, writable DB column that the moment
// any future feature starts sending it would silently reopen the same
// already-'approved'-content-overwrite hole this file exists to guard
// against. Gated it under FIELDS_AND_PROMPTS, same bucket as fieldsDraft/
// promptDraft, since it sits in the schema alongside them.
//
// This asserts the textual shape of the fix stays in place: prepareItemUpdate
// calls assertContentStageEditable(existing.stageStatuses, 'PITCH', ...)
// before assigning data.pitch, assertContentStageEditable(existing.
// stageStatuses, 'FIELDS_AND_PROMPTS', ...) before assigning each of
// data.fieldsDraft, data.promptDraft, and data.relationshipDraft, and
// assertContentStageEditable(existing.stageStatuses, 'GENERATE_ASSETS', ...)
// before assigning data.artImageId -- deliberately scoped to this one
// function/bug shape, mirroring verifyModelBuilderCommitCancelledRunGuard.ts's
// preference for explicit, narrow textual checks over a general-purpose
// static analyzer.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const ROUTE_PATH = join(
  repositoryRoot,
  'server/api/model-builder/runs/index.ts',
)

const FN_NAME = 'prepareItemUpdate'
const GUARD_FN = 'assertContentStageEditable'

interface GateCheck {
  field: string
  assignment: string
  stageKey: string
}

const GATES: GateCheck[] = [
  {
    field: 'pitch',
    assignment: 'data.pitch = normalizeText(body.pitch,',
    stageKey: 'PITCH',
  },
  {
    field: 'fieldsDraft',
    assignment: 'data.fieldsDraft = normalizeText(body.fieldsDraft,',
    stageKey: 'FIELDS_AND_PROMPTS',
  },
  {
    field: 'promptDraft',
    assignment: 'data.promptDraft = normalizeText(body.promptDraft,',
    stageKey: 'FIELDS_AND_PROMPTS',
  },
  {
    field: 'relationshipDraft',
    assignment: 'data.relationshipDraft = relationshipDraft',
    stageKey: 'FIELDS_AND_PROMPTS',
  },
  {
    field: 'artImageId',
    assignment: 'data.artImageId = normalizeNullableId(body.artImageId)',
    stageKey: 'GENERATE_ASSETS',
  },
]

// Extracts the body of `export function prepareItemUpdate(...): PreparedItemUpdate {
// ... }` via paren/brace matching -- this file's functions are top-level
// `export function NAME(` (0-indent), a different shape than
// modelBuilderStore.ts's 2-space-indented setup-function convention, so this
// doesn't reuse verifyModelBuilderCompletionGate.ts's extractFunctionBodies.
export function extractPrepareItemUpdateBody(content: string): string | null {
  const signature = new RegExp(`export function ${FN_NAME}\\(`)
  const match = signature.exec(content)
  if (!match) return null

  const parenOpen = match.index + match[0].length - 1
  let parenDepth = 0
  let i = parenOpen
  for (; i < content.length; i++) {
    if (content[i] === '(') parenDepth++
    else if (content[i] === ')') {
      parenDepth--
      if (parenDepth === 0) break
    }
  }
  if (parenDepth !== 0) return null

  const braceOpen = content.indexOf('{', i)
  if (braceOpen === -1) return null

  let braceDepth = 0
  let j = braceOpen
  for (; j < content.length; j++) {
    if (content[j] === '{') braceDepth++
    else if (content[j] === '}') {
      braceDepth--
      if (braceDepth === 0) break
    }
  }
  if (braceDepth !== 0) return null

  return content.slice(braceOpen + 1, j)
}

// Checks the fix's exact shape against the full source text of a file
// containing a `prepareItemUpdate`-named exported function. Exported (rather
// than only exercised via main()) so the self-test below can run it against
// synthetic buggy/fixed fixtures without touching the real route file.
export function checkItemPatchStageGuard(content: string): string[] {
  const errors: string[] = []

  const body = extractPrepareItemUpdateBody(content)
  if (body === null) {
    errors.push(
      `Could not find an exported function named ${FN_NAME}() -- has it ` +
        'been renamed, removed, or inlined? If so, this guard (and the bug ' +
        'it protects against) needs to move with it.',
    )
    return errors
  }

  for (const { field, assignment, stageKey } of GATES) {
    const assignmentIndex = body.indexOf(assignment)
    if (assignmentIndex === -1) {
      errors.push(
        `${FN_NAME}() no longer contains \`${assignment}\` -- this guard's ` +
          `anchor point has moved; re-check where body.${field} is applied ` +
          'to the Prisma update input.',
      )
      continue
    }

    // Prettier may wrap a 3-arg call across multiple lines once it exceeds
    // the line-length limit (which the FIELDS_AND_PROMPTS calls, with their
    // longer stage-key literal, do) -- match tolerant of whitespace/newlines
    // between arguments rather than requiring one contiguous line.
    const guardPattern = new RegExp(
      `${GUARD_FN}\\(\\s*existing\\.stageStatuses,\\s*'${stageKey}'`,
    )
    const guardMatch = guardPattern.exec(body)
    const guardDisplay = `${GUARD_FN}(existing.stageStatuses, '${stageKey}', ...)`
    if (!guardMatch || guardMatch.index >= assignmentIndex) {
      errors.push(
        `${FN_NAME}() does not call \`${guardDisplay}\` before \`${assignment}\`. ` +
          `The client only ever sends body.${field} while '${stageKey}' is ` +
          "ready/stale/rejected (modelBuilderStore.ts's isStageEditable " +
          'gate), but that gate is client-side only -- without this ' +
          `server-side check, a direct PATCH can silently overwrite an ` +
          `already-'approved' (or still-'locked') stage's content while its ` +
          'badge keeps showing the old status, with no re-review.',
      )
    }
  }

  return errors
}

function main(): void {
  const content = readFileSync(ROUTE_PATH, 'utf8')
  const errors = checkItemPatchStageGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder item-patch stage guard contract failed for ' +
        `${FN_NAME}() in server/api/model-builder/runs/index.ts:`,
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    `Model Builder item-patch stage guard contract passed: ${FN_NAME}() ` +
      'refuses to overwrite pitch/fieldsDraft/promptDraft/relationshipDraft/' +
      'artImageId while their stage is not ready/stale/rejected, per the ' +
      "item's server-stored stage status.",
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
