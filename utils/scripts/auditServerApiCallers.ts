// /utils/scripts/auditServerApiCallers.ts
//
// Flags server/api routes with no in-repo caller -- candidates for human
// review, not proof of dead code.
//
// Kaizen from kind-economy/t-028 (kind_robots#3008, 2026-09-23). Silas's own
// PR #2669 (2026-09-12) retired the mission-accrual admin page but left its
// full backend live: two API routes, a utils file, and a regression test sat
// orphaned for 11 days, undetected by any existing CI check or scanner, until
// the weekly site-audit gap-analysis pass caught it by chance while covering
// an unrelated project. Nothing in this repo answers "does every server/api
// route have a live caller" the way check_project_scaffold_drift.py (in the
// conductor repo) answers the equivalent question for project rows.
//
// WHAT THIS DOES. For each server/api/**/*.{get,post,put,delete,patch}.ts
// file, derives the URL path Nitro would route it under, then greps the rest
// of the app source for a string/template literal that could plausibly be
// that path in a fetch-style call. A route with zero matches is a candidate
// orphan -- printed for human review, never deleted automatically. A route
// can be intentionally external-facing (a webhook, a callback URL handed to
// a third party) with no in-repo caller at all; that is a correct, expected
// "orphan" here, not a bug.
//
// FALSE POSITIVES ARE EXPECTED AND ACCEPTABLE (the filing task's own words).
// This script does not try to eliminate them -- it tries to surface real
// candidates within days instead of the 11-day gap that prompted it. So:
//
//   - Default run is advisory: it reports and exits 0. Pass --strict to exit
//     1 when candidates exist, for a workflow that wants to gate on it.
//   - It is intentionally NOT wired into contract-tests.yml as a blocking
//     check, the same way check_project_scaffold_drift.py is a sweep step
//     rather than a merge gate.
//
// KNOWN LIMITATIONS (documented rather than solved, matching the task's own
// "surfacing candidates, not eliminating false positives" scope):
//
//   1. METHOD-BLIND. A call site's URL string does not usually distinguish
//      GET from POST (the HTTP method is a separate call option). So if
//      index.get.ts and index.post.ts share a path and only one method is
//      actually called, both are read as "has a caller."
//   2. TEXT-MATCH, NOT TYPE-MATCH. This grep for a string shaped like the
//      route; it does not resolve a variable holding a path built elsewhere,
//      and it will not find a route called only from a full external URL
//      (https://.../api/...) or via server-to-server code that imports the
//      handler directly rather than issuing an HTTP call (neither pattern
//      was found anywhere in this repo when this script was written).
//   3. SEARCH ROOTS are broader than components/, stores/, server/, utils/
//      (the four the filing task named) -- pages/ and plugins/ were found to
//      hold real, otherwise-uncounted callers (5 and 3 files respectively)
//      during this script's own development, and layouts/, composables/,
//      middleware/ are included too since walking them costs nothing and a
//      narrower scope would have produced exactly the false "orphan" this
//      script exists to avoid.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const API_ROOT = join(ROOT, 'server/api')

const SEARCH_ROOTS = [
  'components',
  'stores',
  'server',
  'utils',
  'pages',
  'plugins',
  'layouts',
  'composables',
  'middleware',
]

const SKIP_DIRS = new Set([
  'node_modules',
  '.nuxt',
  '.output',
  '.git',
  'dist',
  'coverage',
])

const SEARCHABLE_EXTENSIONS = new Set(['.ts', '.vue', '.mjs', '.js'])

const HTTP_METHOD_SUFFIXES = ['get', 'post', 'put', 'delete', 'patch']

/** One path segment of a derived route, in Nitro's own vocabulary. */
export type RouteSegment = {
  value: string
  dynamic: boolean
  catchAll: boolean
}

/**
 * The route path Nitro would serve this file under, as segments -- or null
 * if the file is not itself a route (no recognized HTTP-method suffix: a
 * helper module like selects.ts/mutation.ts/relations.ts, or a nested
 * utils/*.ts the directory walk also visits).
 */
export function routeSegmentsForApiFile(
  relPath: string,
): RouteSegment[] | null {
  if (!relPath.startsWith('server/api/')) return null

  const withoutRoot = relPath.slice('server/api/'.length)
  const extDot = withoutRoot.lastIndexOf('.')
  if (extDot === -1 || withoutRoot.slice(extDot + 1) !== 'ts') return null

  const withoutExtension = withoutRoot.slice(0, extDot)
  const methodDot = withoutExtension.lastIndexOf('.')
  if (methodDot === -1) return null

  const method = withoutExtension.slice(methodDot + 1)
  if (!HTTP_METHOD_SUFFIXES.includes(method)) return null

  const base = withoutExtension.slice(0, methodDot)
  const rawSegments = base.split('/').filter(Boolean)
  // `foo/index` routes as `/api/foo`, same as `foo/index.get.ts` -> GET /api/foo.
  if (rawSegments[rawSegments.length - 1] === 'index') rawSegments.pop()

  return rawSegments.map((segment) => {
    const catchAll = /^\[\.\.\..+\]$/.test(segment)
    const dynamic = catchAll || /^\[\[?.+\]?\]$/.test(segment)
    const value = dynamic ? segment.replace(/^\[+\.{0,3}|\]+$/g, '') : segment
    return { value, dynamic, catchAll }
  })
}

/** `/api/characters/:id`-style display form, for the report. */
export function routeDisplayPath(segments: RouteSegment[]): string {
  if (!segments.length) return '/api'
  return (
    '/api/' +
    segments
      .map((segment) =>
        segment.dynamic
          ? `:${segment.value}${segment.catchAll ? '*' : ''}`
          : segment.value,
      )
      .join('/')
  )
}

/**
 * A regex matching this route's path as a call-site string/template literal:
 * `/api/characters/${id}` and `/api/characters/42` both match
 * `/api/characters/[id]`'s pattern; `/api/characters/42/facets` does not
 * (extra trailing segment), and neither does `/api/character` (no trailing
 * boundary). A catch-all segment swallows everything after it.
 */
export function routeMatchPattern(segments: RouteSegment[]): RegExp {
  const DYNAMIC_SEGMENT = String.raw`[^/\`'"]+`
  const parts = segments.map((segment) => {
    if (segment.catchAll) return '.*'
    if (segment.dynamic) return DYNAMIC_SEGMENT
    return segment.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  })

  const hasCatchAll = segments.some((segment) => segment.catchAll)
  const body = parts.length ? `/${parts.join('/')}` : ''
  // A POSITIVE whitelist of real terminators (quote/backtick close, whitespace,
  // a call's closing paren/comma, a query string, or end of source) -- not a
  // negative check against word characters. A negative check lets quantifier
  // backtracking land on an accidental non-word byte INSIDE a template
  // expression (`${characterId}/facets` backtracks to stopping right before
  // the harmless-looking `}`, which is not a real path boundary at all) and
  // falsely accept a call to a longer, different route. None of the bytes
  // that make up a template expression's own syntax ($, {, }) are on this
  // whitelist, so backtracking can no longer find a false boundary there.
  const trailingBoundary = hasCatchAll ? '' : String.raw`(?=['"\`\s),?#;&]|$)`

  return new RegExp(String.raw`(?<![\w/])/api${body}${trailingBoundary}`)
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

function main(): void {
  const strict = process.argv.includes('--strict')

  const routeFiles = walk(API_ROOT).filter((file) =>
    HTTP_METHOD_SUFFIXES.some((method) => file.endsWith(`.${method}.ts`)),
  )

  const searchFiles: string[] = []
  for (const root of SEARCH_ROOTS) {
    const dir = join(ROOT, root)
    try {
      statSync(dir)
    } catch {
      continue
    }
    for (const file of walk(dir)) {
      const ext = file.slice(file.lastIndexOf('.'))
      if (SEARCHABLE_EXTENSIONS.has(ext)) searchFiles.push(file)
    }
  }

  const sources = new Map<string, string>()
  for (const file of searchFiles) sources.set(file, readFileSync(file, 'utf8'))

  const candidates: string[] = []

  for (const routeFile of routeFiles) {
    const rel = relative(ROOT, routeFile)
    const segments = routeSegmentsForApiFile(rel)
    if (!segments) continue

    const pattern = routeMatchPattern(segments)
    let called = false

    for (const [file, src] of sources) {
      if (file === routeFile) continue
      if (pattern.test(src)) {
        called = true
        break
      }
    }

    if (!called) candidates.push(`${rel} (${routeDisplayPath(segments)})`)
  }

  console.log(
    `auditServerApiCallers: checked ${routeFiles.length} route file(s) against ` +
      `${searchFiles.length} source file(s) across ${SEARCH_ROOTS.length} root(s).`,
  )

  if (!candidates.length) {
    console.log('No candidate orphan routes found.')
    return
  }

  console.warn(
    `\n${candidates.length} candidate orphan route(s) -- no in-repo caller found. ` +
      `Each is worth a human look, not an automatic deletion: it may be an\n` +
      `intentionally external-facing route (webhook, third-party callback) with no\n` +
      `caller inside this repo at all.\n`,
  )
  for (const candidate of candidates.sort()) console.warn(`  - ${candidate}`)

  if (strict) process.exitCode = 1
}

// Only runs the real directory walk when executed as a script -- importing
// the pure helpers above for a unit test must not also re-run (and print) a
// full live-repo scan as a side effect of the import.
if (process.argv[1]?.endsWith('auditServerApiCallers.ts')) {
  main()
}
