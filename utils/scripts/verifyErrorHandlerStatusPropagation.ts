// /utils/scripts/verifyErrorHandlerStatusPropagation.ts
//
// Kaizen from kind-robots/t-096 (kind_robots#2711, 2026-09-13): 19 route
// handlers called `errorHandler(error)` inside a `catch` block but never
// propagated the resulting `statusCode` to the actual HTTP response
// (`event.node.res.statusCode =`, `setResponseStatus(`, or a
// `createError(`-based rethrow). errorHandler() only returns a correct
// statusCode as a JSON body field -- it never sets the real response status
// -- so every one of those routes answered every failure with a literal
// HTTP 200. Nothing stopped a new route from reintroducing the same bug, so
// this scans for it.
//
// WHAT COUNTS AS A ROUTE, AND WHY THAT MATTERS
// ---------------------------------------------
// t-096's fix deliberately left four files untouched -- server/api/auth/
// index.ts, server/api/users/index.ts, server/api/scenarios/create.ts,
// server/api/reactions/index.ts -- because they are shared helper modules
// with no `defineEventHandler`/`event` of their own: they never handle an
// HTTP response themselves, so "every API failure answers 200" cannot apply
// to them. Auditing this guard while writing it (t-098) turned up two more
// of the same shape that t-096's note didn't name: server/api/prompts/
// index.ts and server/api/resources/create.ts, both exporting plain
// `async function`s that `throw errorHandler(...)` for a caller elsewhere to
// catch -- confirming the note's own "re-check this list, since more may
// exist" caveat.
//
// Rather than hand-maintain a list that can grow stale the same way, this
// guard only looks INSIDE the function passed to `defineEventHandler(...)`
// or `defineCachedEventHandler(...)` -- the one place in a file that can
// actually set an HTTP response. A helper module with no such call has
// nothing for this guard to check, structurally, with no exemption list to
// keep in sync. (`server/api/newsfeed/index.get.ts` uses
// `defineCachedEventHandler` and already sets `event.node.res.statusCode`
// correctly -- it passes, same as any other clean route.)
//
// WHAT IS (AND ISN'T) CHECKED
// ----------------------------
// Source-text only, matching the existing `utils/scripts/verifyXyz.ts`
// pattern (e.g. verifyNoPromiseInStoreState.ts) rather than a real
// TypeScript parse. Within a handler body, a `catch` block containing
// `errorHandler(` must be matched by at least one of the three known
// status-propagation shapes ANYWHERE in that same handler body -- not
// necessarily inside the catch block itself, since a handler may set status
// on one path and merely re-check `errorHandler()`'s output on another. This
// intentionally does not trace which branch actually executes; it is a
// textual presence check, same as the rest of this guard family.
//
//   npx tsx utils/scripts/verifyErrorHandlerStatusPropagation.ts
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { stripComments } from './lib/sourceText'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')
export const SERVER_API_ROOT = join(repositoryRoot, 'server/api')

const HANDLER_CALL = /\b(?:defineEventHandler|defineCachedEventHandler)\s*\(/g

const STATUS_PROPAGATION_PATTERNS: RegExp[] = [
  /event\.node\.res\.statusCode\b/,
  /setResponseStatus\s*\(/,
  /createError\s*\(/,
]

export type Offence = {
  file: string
  snippet: string
}

/**
 * From `content[callArgsStart..]` (immediately after a
 * `defineEventHandler(`/`defineCachedEventHandler(` opening paren), find the
 * handler function's own body -- the `{ ... }` after its `=>` (or after a
 * `function (...)` signature) -- and return its start/end offsets into
 * `content`, or null if the handler is a brace-less single-expression arrow
 * (nothing that can contain a `catch` block, so nothing to check).
 */
function findHandlerBodyRange(
  content: string,
  callArgsStart: number,
): { start: number; end: number } | null {
  const signature =
    /^\s*(?:async\s+)?(?:function\s*)?\(([^)]*)\)\s*(?::[^=;{]+)?\s*(?:=>)?\s*\{/
  const match = signature.exec(content.slice(callArgsStart))
  if (!match) return null

  const braceOpen = callArgsStart + match.index + match[0].length - 1
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
  return { start: braceOpen, end: i + 1 }
}

/**
 * Find every top-level `catch (...) { ... }` / `catch { ... }` block inside
 * `body` and return the ones that call `errorHandler(`.
 */
export function catchBlocksCallingErrorHandler(body: string): string[] {
  const blocks: string[] = []
  const catchStart = /\bcatch\b\s*(?:\([^)]*\))?\s*\{/g

  for (;;) {
    const match = catchStart.exec(body)
    if (!match) break
    const braceOpen = match.index + match[0].length - 1
    let depth = 0
    let i = braceOpen
    for (; i < body.length; i++) {
      if (body[i] === '{') depth++
      else if (body[i] === '}') {
        depth--
        if (depth === 0) break
      }
    }
    if (depth !== 0) continue
    const block = body.slice(braceOpen, i + 1)
    if (/\berrorHandler\s*\(/.test(block)) blocks.push(block)
    catchStart.lastIndex = i + 1
  }

  return blocks
}

/**
 * Check one already-extracted handler body: does it contain a `catch` block
 * calling `errorHandler(`, and if so, does the body ALSO contain one of the
 * known status-propagation shapes? Returns a short offending snippet (the
 * `errorHandler(...)` call site) for each catch block that fails, or an
 * empty array if the handler is clean.
 */
export function findUnpropagatedErrorHandlerCalls(body: string): string[] {
  const offendingSnippets: string[] = []
  const propagates = STATUS_PROPAGATION_PATTERNS.some((pattern) =>
    pattern.test(body),
  )
  if (propagates) return offendingSnippets

  for (const block of catchBlocksCallingErrorHandler(body)) {
    const call = /errorHandler\s*\([^]{0,40}/.exec(block)
    if (!call) {
      offendingSnippets.push('errorHandler(...)')
      continue
    }
    offendingSnippets.push(call[0].replace(/\s+/g, ' '))
  }

  return offendingSnippets
}

/** Every handler body (one per `defineEventHandler`/`defineCachedEventHandler`
 * call) found in `content`. */
export function extractHandlerBodies(content: string): string[] {
  const clean = stripComments(content)
  const bodies: string[] = []

  for (;;) {
    const match = HANDLER_CALL.exec(clean)
    if (!match) break
    const range = findHandlerBodyRange(clean, match.index + match[0].length)
    if (!range) continue
    bodies.push(clean.slice(range.start, range.end))
    HANDLER_CALL.lastIndex = range.end
  }

  return bodies
}

export function findOffences(files: { file: string; source: string }[]): Offence[] {
  const offences: Offence[] = []

  for (const { file, source } of files) {
    for (const body of extractHandlerBodies(source)) {
      for (const snippet of findUnpropagatedErrorHandlerCalls(body)) {
        offences.push({ file, snippet })
      }
    }
  }

  return offences.sort(
    (a, b) => a.file.localeCompare(b.file) || a.snippet.localeCompare(b.snippet),
  )
}

function walkServerApiFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      out.push(...walkServerApiFiles(full))
    } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
      out.push(full)
    }
  }
  return out
}

/* -------------------------------------------------------------------------- */

function selfTest(): void {
  const fail = (message: string): never => {
    throw new Error(message)
  }

  const buggy = `
    export default defineEventHandler(async (event) => {
      try {
        return await doThing()
      } catch (error) {
        const handled = errorHandler(error)
        return { success: false, message: handled.message }
      }
    })
  `
  if (findOffences([{ file: 'buggy.ts', source: buggy }]).length !== 1) {
    fail(
      'a catch block calling errorHandler() with no status propagation anywhere ' +
        'in the handler must be reported',
    )
  }

  const fixedWithStatusCode = `
    export default defineEventHandler(async (event) => {
      try {
        return await doThing()
      } catch (error) {
        const handled = errorHandler(error)
        event.node.res.statusCode = handled.statusCode || 500
        return { success: false, message: handled.message }
      }
    })
  `
  if (findOffences([{ file: 'fixed1.ts', source: fixedWithStatusCode }]).length) {
    fail('event.node.res.statusCode in the handler body must satisfy the guard')
  }

  const fixedWithSetResponseStatus = `
    export default defineEventHandler(async (event) => {
      try {
        return await doThing()
      } catch (error) {
        const handled = errorHandler(error)
        setResponseStatus(event, handled.statusCode || 500)
        return { success: false, message: handled.message }
      }
    })
  `
  if (
    findOffences([{ file: 'fixed2.ts', source: fixedWithSetResponseStatus }])
      .length
  ) {
    fail('setResponseStatus(...) in the handler body must satisfy the guard')
  }

  const fixedWithRethrow = `
    export default defineEventHandler(async (event) => {
      try {
        return await doThing()
      } catch (error) {
        throw createError({ statusCode: 500, message: errorHandler(error).message })
      }
    })
  `
  if (findOffences([{ file: 'fixed3.ts', source: fixedWithRethrow }]).length) {
    fail('a createError(...)-based rethrow must satisfy the guard')
  }

  const helperModuleNoHandler = `
    export async function updateThing() {
      try {
        return await doThing()
      } catch (error) {
        throw errorHandler({ success: false, message: 'nope', statusCode: 500 })
      }
    }
  `
  if (
    findOffences([{ file: 'helper.ts', source: helperModuleNoHandler }]).length
  ) {
    fail(
      'a helper module with no defineEventHandler/defineCachedEventHandler of ' +
        'its own must not be flagged -- it never handles an HTTP response itself',
    )
  }

  const cleanNoErrorHandler = `
    export default defineEventHandler(async (event) => {
      try {
        return await doThing()
      } catch (error) {
        throw createError({ statusCode: 500 })
      }
    })
  `
  if (findOffences([{ file: 'clean.ts', source: cleanNoErrorHandler }]).length) {
    fail('a catch block that never calls errorHandler() at all must not be flagged')
  }

  const cached = `
    export default defineCachedEventHandler(async (event) => {
      try {
        return await doThing()
      } catch (error) {
        const handled = errorHandler(error)
        return { success: false, message: handled.message }
      }
    }, { maxAge: 60 })
  `
  if (findOffences([{ file: 'cached.ts', source: cached }]).length !== 1) {
    fail('defineCachedEventHandler must be scanned the same as defineEventHandler')
  }

  console.log('✅ verifyErrorHandlerStatusPropagation self-test passed.')
}

/* -------------------------------------------------------------------------- */

function main(): void {
  selfTest()

  const files = walkServerApiFiles(SERVER_API_ROOT).map((full) => ({
    file: relative(repositoryRoot, full),
    source: readFileSync(full, 'utf8'),
  }))

  const offences = findOffences(files)

  if (offences.length) {
    console.error(
      `\nFAIL - ${offences.length} errorHandler() call(s) inside a catch block never ` +
        `reach the actual HTTP response (kind-robots/t-096):\n`,
    )
    for (const { file, snippet } of offences) {
      console.error(`  ${file} -> ${snippet}`)
    }
    console.error(
      `\nEach one answers every failure on that path with a literal HTTP 200. Set ` +
        `\`event.node.res.statusCode\`, call \`setResponseStatus(event, ...)\`, or ` +
        `rethrow via \`createError(...)\` somewhere in the same handler.`,
    )
    process.exitCode = 1
  } else {
    console.log(
      `\nEvery errorHandler() call inside a catch block propagates its status to ` +
        `the HTTP response: checked ${files.length} server/api files.`,
    )
  }
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
