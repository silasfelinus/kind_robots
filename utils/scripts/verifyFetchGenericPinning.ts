// /utils/scripts/verifyFetchGenericPinning.ts
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Regression guard: kind_robots PR #812 (appmaker/t-009) added 2 new
// server/api/** route files, which grew the project's typed
// NitroFetchRequest route-key union just enough to push vue-tsc over its
// recursion limit (TS2589 "Type instantiation is excessively deep") on
// every direct `$fetch` call whose request-type generic (R) was left to
// infer from the full route union instead of being pinned explicitly. That
// PR found and fixed 12 files this way -- fixing the first failing call
// site only ever revealed the next-worst one, because the ceiling was
// already sitting right at the edge repo-wide. `$fetch<T>(url)` (a single
// generic, or none at all) lets R default to the full NitroFetchRequest
// union; `$fetch<T, string>(url)` (or a plain `fetch()` for a client-only
// static-asset read that doesn't need $fetch's isomorphic base-URL
// handling) pins R and keeps that match cheap. Typing the request
// argument/variable as `string` on its own is NOT sufficient -- TS still
// infers R from it and falls back to the union; only an explicit second
// generic argument (or switching to plain `fetch`) avoids the cost. This
// scan is a static-source check (no vue-tsc run, no live network) so it
// catches a new un-pinned call site at contract-test speed, before the next
// unrelated route addition tips the same ceiling again and turns into a
// cryptic TS2589 in a file nobody would think to check.
const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const SCAN_EXTENSIONS = ['.ts', '.tsx', '.vue']
const EXCLUDED_DIRECTORIES = new Set([
  '.git',
  '.nuxt',
  '.output',
  '.vercel',
  'node_modules',
  'dist',
  'coverage',
  'cypress',
  'prisma/generated',
])
// This file documents/references the exact pattern it scans for -- exclude
// it from its own scan rather than obscuring the pattern to dodge a
// self-match.
const EXCLUDED_FILES = new Set(['utils/scripts/verifyFetchGenericPinning.ts'])

function isExcluded(relativePath: string): boolean {
  if (EXCLUDED_FILES.has(relativePath)) return true
  return [...EXCLUDED_DIRECTORIES].some(
    (excluded) =>
      relativePath === excluded || relativePath.startsWith(`${excluded}/`),
  )
}

function listSourceFiles(directory: string): string[] {
  const entries = readdirSync(directory, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const path = join(directory, entry.name)
    const relativePath = relative(repositoryRoot, path)
    if (isExcluded(relativePath)) continue

    if (entry.isDirectory()) {
      files.push(...listSourceFiles(path))
      continue
    }

    if (entry.isFile() && SCAN_EXTENSIONS.some((ext) => path.endsWith(ext))) {
      files.push(path)
    }
  }

  return files
}

function lineNumberAt(content: string, index: number): number {
  return content.slice(0, index).split('\n').length
}

// Scans forward from `startIndex` (just past an opening bracket already
// consumed) tracking combined <>{}[]() depth, and returns the index just
// past the matching close for the bracket kind implied by the caller's
// depth bookkeeping. Used both to find where a `$fetch<...>` generic list
// ends and, on that captured text, to check for a top-level comma.
function findMatchingAngleClose(content: string, openIndex: number): number {
  let depth = 1
  let i = openIndex + 1
  while (i < content.length && depth > 0) {
    const ch = content[i]
    if (ch === '<') depth++
    else if (ch === '>') depth--
    i++
  }
  return i
}

function hasTopLevelComma(genericsText: string): boolean {
  let depth = 0
  for (const ch of genericsText) {
    if (ch === '<' || ch === '{' || ch === '[' || ch === '(') depth++
    else if (ch === '>' || ch === '}' || ch === ']' || ch === ')') depth--
    else if (ch === ',' && depth === 0) return true
  }
  return false
}

const FETCH_CALL_RE = /\$fetch(<|\()/g

function findIssues(content: string, relativeFile: string): string[] {
  const issues: string[] = []
  let match: RegExpExecArray | null

  FETCH_CALL_RE.lastIndex = 0
  while ((match = FETCH_CALL_RE.exec(content))) {
    const line = lineNumberAt(content, match.index)

    if (match[1] === '(') {
      // `$fetch(url, ...)` with zero generics -- both T and R are fully
      // inferred, R against the whole route union.
      issues.push(
        `${relativeFile}:${line}: $fetch call has no explicit generics -- ` +
          'R is inferred against the full NitroFetchRequest route-key union. ' +
          'Add `$fetch<ResponseType, string>(...)` (or switch to plain ' +
          '`fetch()` for a client-only static-asset read).',
      )
      continue
    }

    // match[1] === '<': the generic argument list starts right after it.
    const genericsStart = match.index + match[0].length
    const afterGenerics = findMatchingAngleClose(content, genericsStart - 1)
    const genericsText = content.slice(genericsStart, afterGenerics - 1)
    FETCH_CALL_RE.lastIndex = afterGenerics

    if (!hasTopLevelComma(genericsText)) {
      issues.push(
        `${relativeFile}:${line}: $fetch<${genericsText.trim().slice(0, 40)}${genericsText.length > 40 ? '…' : ''}> only pins the response type, not R -- ` +
          'R still infers against the full NitroFetchRequest route-key union ' +
          '(typing the request argument/variable as `string` does NOT avoid ' +
          'this). Add an explicit second generic: `$fetch<T, string>(...)`.',
      )
    }
  }

  return issues
}

function main(): void {
  const files = listSourceFiles(repositoryRoot)
  const errors: string[] = []

  for (const file of files) {
    const relativeFile = relative(repositoryRoot, file)
    const content = readFileSync(file, 'utf8')
    if (!content.includes('$fetch')) continue
    errors.push(...findIssues(content, relativeFile))
  }

  if (errors.length) {
    console.error(
      `$fetch generic-pinning contract failed with ${errors.length} error(s):`,
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    `$fetch generic-pinning contract passed: ${files.length} source file(s) checked.`,
  )
}

main()
