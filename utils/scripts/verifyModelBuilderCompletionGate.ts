// /utils/scripts/verifyModelBuilderCompletionGate.ts
//
// Regression guard (model-builder/t-036, kaizen from t-029 / kind_robots PR
// #1114 -- a GENERATE_ASSETS render completion handler unconditionally
// overwrote the stage status on completion, silently clobbering a concurrent
// upstream reopen's 'stale' marker; fixed ad hoc with
// finishGenerateAssets(item, next), which only writes if the stage is still
// 'in-progress'). This is the third distinct "review/re-review gate silently
// bypassed" bug class found by manual read-through in modelBuilderStore.ts
// (after canApproveAssets and the batch-editor stage-approval-gate fixes).
//
// This walks every `async function` in modelBuilderStore.ts and flags any
// direct `item.stages.<KEY> = ...` write that occurs after that function's
// own first `await` and is not wrapped in an enclosing
// `if (item.stages.<KEY>.status === '...') { ... }` guard for the SAME key
// -- the shape finishGenerateAssets/finishCommit both use, whether reached
// via a named helper call or an inline guard. A write reachable only across
// an await suspension point can race a concurrent edit that changed the
// stage's status while the await was pending; an unguarded write silently
// discards whatever that concurrent edit recorded (e.g. 'stale').
//
// Deliberately scoped to modelBuilderStore.ts's own idiom -- guard
// conditions are matched as literal `item.stages.KEY.status === 'VALUE'`
// text (dot notation, literal key), mirroring
// verifyModelBuilderLinkCoverage.ts's preference for explicit regex
// extraction over a full parser. A dynamic bracket-key write
// (`item.stages[someVar] = ...`) is out of scope -- none exist in the store
// today, and this deliberately fails loudly (via extractFunctionBodies not
// finding a matching function) rather than silently passing if the file's
// shape changes in ways this script doesn't understand.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

export interface FunctionBody {
  name: string
  isAsync: boolean
  bodyStart: number
  bodyEnd: number
  body: string
}

// Finds every top-level `function NAME(` / `async function NAME(` declared
// at 2-space indent (this store's setup-function convention) and extracts
// its body via paren-matching (to skip past a parameter list, which may
// itself contain `{ ... }` object-type braces) followed by brace-matching
// from the body's own opening `{`.
export function extractFunctionBodies(content: string): FunctionBody[] {
  const functions: FunctionBody[] = []
  const signaturePattern = /^ {2}(async )?function (\w+)\s*\(/gm

  for (const match of content.matchAll(signaturePattern)) {
    const isAsync = Boolean(match[1])
    const name = match[2]!
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
    if (parenDepth !== 0) {
      throw new Error(
        `Could not find the closing ')' of ${name}'s parameter list -- has ` +
          "modelBuilderStore.ts's function-declaration shape changed?",
      )
    }

    const braceOpen = content.indexOf('{', i)
    if (braceOpen === -1) {
      throw new Error(
        `Could not find the opening '{' of ${name}'s body -- has ` +
          "modelBuilderStore.ts's function-declaration shape changed?",
      )
    }

    let braceDepth = 0
    let j = braceOpen
    for (; j < content.length; j++) {
      if (content[j] === '{') braceDepth++
      else if (content[j] === '}') {
        braceDepth--
        if (braceDepth === 0) break
      }
    }
    if (braceDepth !== 0) {
      throw new Error(
        `Could not find the closing '}' of ${name}'s body -- has ` +
          "modelBuilderStore.ts's function-declaration shape changed?",
      )
    }

    functions.push({
      name,
      isAsync,
      bodyStart: braceOpen + 1,
      bodyEnd: j,
      body: content.slice(braceOpen + 1, j),
    })
  }

  return functions
}

export interface GuardInterval {
  key: string
  start: number
  end: number
}

// Every `if (item.stages.KEY.status === 'VALUE') { ... }` block in `body`,
// as a [start, end) offset interval spanning its own braces -- covers both
// the named-helper idiom (finishGenerateAssets/finishCommit's own bodies)
// and an inline guard written directly in an async function.
export function findGuardIntervals(body: string): GuardInterval[] {
  const intervals: GuardInterval[] = []
  const guardPattern = /if \(item\.stages\.(\w+)\.status === '[\w-]+'\) \{/g

  for (const match of body.matchAll(guardPattern)) {
    const key = match[1]!
    const braceOpen = match.index + match[0].length - 1
    let depth = 0
    let k = braceOpen
    for (; k < body.length; k++) {
      if (body[k] === '{') depth++
      else if (body[k] === '}') {
        depth--
        if (depth === 0) break
      }
    }
    if (depth !== 0) {
      throw new Error(
        `Unbalanced braces scanning a status guard for '${key}' -- has ` +
          "modelBuilderStore.ts's guard shape changed?",
      )
    }
    intervals.push({ key, start: braceOpen, end: k })
  }

  return intervals
}

export interface UngatedWrite {
  functionName: string
  key: string
  offset: number
  line: number
}

// Every `item.stages.KEY = ` write in `fn`'s body that occurs after its own
// first `await` and falls outside every guard interval for that same key.
export function findUngatedWritesInFunction(
  fn: FunctionBody,
  fullContent: string,
): UngatedWrite[] {
  if (!fn.isAsync) return []

  const awaitMatch = /\bawait\b/.exec(fn.body)
  if (!awaitMatch) return []
  const afterAwait = awaitMatch.index

  const guards = findGuardIntervals(fn.body)
  const writePattern = /item\.stages\.(\w+)\s*=(?!=)/g
  const violations: UngatedWrite[] = []

  for (const match of fn.body.matchAll(writePattern)) {
    if (match.index < afterAwait) continue
    const key = match[1]!
    const gated = guards.some(
      (g) => g.key === key && match.index >= g.start && match.index < g.end,
    )
    if (gated) continue

    const absoluteOffset = fn.bodyStart + match.index
    const line = fullContent.slice(0, absoluteOffset).split('\n').length
    violations.push({
      functionName: fn.name,
      key,
      offset: absoluteOffset,
      line,
    })
  }

  return violations
}

export function findUngatedCompletionWrites(content: string): UngatedWrite[] {
  const functions = extractFunctionBodies(content)
  return functions.flatMap((fn) => findUngatedWritesInFunction(fn, content))
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const violations = findUngatedCompletionWrites(content)

  if (violations.length) {
    console.error(
      `Model Builder completion-gate contract failed: ${violations.length} ` +
        'stage-status write(s) in modelBuilderStore.ts happen after an ' +
        '`await` with no guard against a concurrent status change:',
    )
    for (const v of violations) {
      console.error(
        `- ${v.functionName}() line ${v.line}: writes item.stages.${v.key} ` +
          'after an await with no enclosing `if (item.stages.' +
          `${v.key}.status === '...')\` guard. A concurrent edit that ` +
          "changed this stage's status while the await was pending (e.g. " +
          "markDownstreamStale marking it 'stale') would be silently " +
          'overwritten. Route the write through a gate helper (see ' +
          'finishGenerateAssets/finishCommit) or wrap it in an equivalent ' +
          'inline guard.',
      )
    }
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder completion-gate contract passed: every post-await ' +
      'item.stages write in modelBuilderStore.ts is guarded against a ' +
      'concurrent status change.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
