// /utils/scripts/verifyCaptureGroupGuards.ts
//
// Kaizen from kind-robots/t-027 (Reviewer, 2026-07-16): that audit hand-checked
// every existing `.exec(`/`.match(` capture-group call site and found all 26
// already safe, but a *new* call site can still reintroduce the
// ai-art-academy/t-017-class bug (TS2345 from an unguarded `match[1]`) --
// vue-tsc catches it eventually, but with a generic error that isn't
// self-explanatory to a first-time contributor. This is a cheap, targeted
// pre-check that diffs a PR's new/changed lines against the base branch (not
// a whole-repo scan -- t-027 already proved the existing 26 sites are clean,
// re-scanning them every PR would just be noise) and flags capture-group
// call sites that get indexed without one of the four guard shapes t-027
// documented as safe:
//   1. optional chaining + nullish fallback: `match?.[1] ?? ''`
//   2. an `if (!match) return/continue` guard before the indexed access
//   3. default-valued destructuring: `const [h = 0, s = 100] = str.match(...)`
//   4. a non-null assertion (`match!`) applied to the match/exec result
//
// This is a heuristic, not a type-checker -- it does not track control flow
// or scopes, only nearby lines of text. t-030's note already flagged that a
// similarly-shaped heuristic (bare path-token detection) carries real
// false-positive risk, so this deliberately only *evaluates* a call site
// when it can also see the site's result being indexed (`[...]`) nearby --
// unindexed `.exec(`/`.match(` calls (e.g. `if (str.match(re))` truthiness
// checks) have no TS2345 risk and are silently skipped, not flagged. A
// missed guard is always still caught by vue-tsc's `noUncheckedIndexedAccess`
// check in the normal typecheck job -- this check only exists to give an
// earlier, more specific error message.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const defaultRepositoryRoot = resolve(scriptDirectory, '../..')

const SCAN_EXTENSIONS = ['.ts', '.tsx', '.vue', '.js', '.mjs', '.cjs']
// Mirrors verifyNoPrismaJsonCast.ts's exclusion list -- 'cypress' also drops
// every `*.cy.ts` spec, whose `.to.match()` calls are Chai assertions, not
// JS RegExp (t-027 excluded these from its manual audit for the same reason).
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
const EXCLUDED_FILES = new Set([
  'utils/scripts/verifyCaptureGroupGuards.ts',
  'utils/scripts/verifyCaptureGroupGuards.test.ts',
])

const CAPTURE_CALL_PATTERN = /\.(exec|match)\(/
const ASSIGNED_SCALAR_PATTERN =
  /\b(?:const|let|var)\s+(\w+)\s*=\s*.*\.(?:exec|match)\(/
const DESTRUCTURE_LINE_PATTERN =
  /\b(?:const|let|var)\s*\[([^\]]*)\]\s*=\s*(.*\.(?:exec|match)\(.*)$/
// `.*` (not `[^)]*`) because the call argument is almost always a regex
// literal containing its own capture-group parens (e.g. `/(\d+)/`) -- a
// negated-`)` class stops at that inner `)` and never reaches the call's
// real closing paren. `.*` backtracks from the end of the line instead, so
// it finds the LAST `)` on the line, which is the one that actually closes
// the call.
const INLINE_CHAINED_INDEX_PATTERN = /\.(?:exec|match)\(.*\)\s*(\?\.)?\s*\[/
const CONTEXT_WINDOW_LINES = 15

type Candidate = {
  file: string
  line: number
  text: string
}

function isExcludedPath(relativePath: string): boolean {
  if (EXCLUDED_FILES.has(relativePath)) return true
  return [...EXCLUDED_DIRECTORIES].some(
    (excluded) =>
      relativePath === excluded || relativePath.startsWith(`${excluded}/`),
  )
}

function hasScanExtension(relativePath: string): boolean {
  return SCAN_EXTENSIONS.some((ext) => relativePath.endsWith(ext))
}

function git(repoRoot: string, args: string[]): string {
  return execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 64,
  })
}

/** Parses a unified, zero-context `git diff` into per-file added lines with their new-file line numbers. */
function parseAddedLines(diffText: string): Candidate[] {
  const added: Candidate[] = []
  let currentFile: string | null = null
  let nextLineNumber: number | null = null

  for (const line of diffText.split('\n')) {
    const fileHeader = line.match(/^\+\+\+ b\/(.+)$/)
    if (fileHeader) {
      currentFile = fileHeader[1] ?? null
      continue
    }
    if (line.startsWith('+++ /dev/null')) {
      currentFile = null // deleted file, nothing to scan
      continue
    }
    const hunkHeader = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/)
    if (hunkHeader) {
      nextLineNumber = Number(hunkHeader[1])
      continue
    }
    if (currentFile === null || nextLineNumber === null) continue
    if (line.startsWith('+') && !line.startsWith('+++')) {
      added.push({
        file: currentFile,
        line: nextLineNumber,
        text: line.slice(1),
      })
      nextLineNumber += 1
    }
    // Zero-context diffs never emit plain context lines, so no `else`
    // branch is needed to advance nextLineNumber for unchanged lines.
  }

  return added
}

function candidateGuardedInline(text: string): boolean {
  // `.*` for the same reason as INLINE_CHAINED_INDEX_PATTERN above: the call
  // argument's own regex-literal parens defeat a `[^)]*` class.
  if (CAPTURE_CALL_PATTERN.test(text) && text.includes('?.[')) return true
  if (/\.(?:exec|match)\(.*\)\s*(?:\|\|\s*\[)/.test(text)) return true
  if (/\.(?:exec|match)\(.*\)\s*\?\?\s*\[/.test(text)) return true
  return false
}

/** Default-valued array destructuring (`const [h = 0] = ...`) is treated as self-guarding. */
function destructureHasDefaults(bindingList: string): boolean {
  return /=/.test(bindingList)
}

function windowAroundLine(
  fileLines: string[],
  startLine: number,
): { lines: string[]; startIndex: number } {
  const startIndex = Math.max(0, startLine - 2) // 0-indexed, 1 line of leading context
  const endIndex = Math.min(
    fileLines.length,
    startLine - 1 + CONTEXT_WINDOW_LINES,
  )
  return { lines: fileLines.slice(startIndex, endIndex), startIndex }
}

/**
 * Returns the 1-indexed line (relative to the full file) of an unguarded
 * indexed access on `varName` within the window, or null if every indexed
 * access found is guarded (or none exists at all -- nothing to flag).
 */
function findUnguardedScalarUse(
  windowLines: string[],
  windowStartIndex: number,
  varName: string,
): number | null {
  const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const optionalIndex = new RegExp(`\\b${escaped}\\?\\.\\[`)
  const assertedIndex = new RegExp(`\\b${escaped}!\\s*\\[`)
  const plainIndex = new RegExp(`\\b${escaped}\\s*\\[`)
  const falsyGuard = new RegExp(
    `if\\s*\\(\\s*!\\s*${escaped}\\s*\\)|if\\s*\\(\\s*${escaped}\\s*===?\\s*null\\s*\\)|if\\s*\\(\\s*${escaped}\\s*==\\s*null\\s*\\)`,
  )

  let sawFalsyGuard = false
  for (let i = 0; i < windowLines.length; i += 1) {
    const line = windowLines[i] ?? ''
    if (falsyGuard.test(line)) {
      sawFalsyGuard = true
      continue
    }
    if (optionalIndex.test(line) || assertedIndex.test(line)) {
      return null // guarded access -- this call site is fine
    }
    if (plainIndex.test(line) && !ASSIGNED_SCALAR_PATTERN.test(line)) {
      if (sawFalsyGuard) return null // preceded by an early-return guard
      return windowStartIndex + i + 1 // 1-indexed unguarded use
    }
  }
  return null // no indexed access seen nearby -- nothing to flag
}

export type ScanResult = {
  errors: string[]
  candidatesChecked: number
}

export function scanCaptureGroupGuards(
  repoRoot: string,
  baseRef: string,
): ScanResult {
  const diff = git(repoRoot, [
    'diff',
    '--no-color',
    '--unified=0',
    `${baseRef}...HEAD`,
    '--',
    ...SCAN_EXTENSIONS.map((ext) => `*${ext}`),
  ])

  const addedLines = parseAddedLines(diff).filter(
    (candidate) =>
      hasScanExtension(candidate.file) && !isExcludedPath(candidate.file),
  )

  const errors: string[] = []
  let candidatesChecked = 0
  const fileCache = new Map<string, string[] | null>()

  for (const candidate of addedLines) {
    if (!CAPTURE_CALL_PATTERN.test(candidate.text)) continue
    candidatesChecked += 1

    if (candidateGuardedInline(candidate.text)) continue

    const destructureMatch = candidate.text.match(DESTRUCTURE_LINE_PATTERN)
    if (destructureMatch) {
      const [, bindingList] = destructureMatch
      if (destructureHasDefaults(bindingList ?? '')) continue
      errors.push(
        `${candidate.file}:${candidate.line}: destructures a ${
          candidate.text.includes('.exec(') ? 'RegExp.exec' : 'String.match'
        } result without default values or a "|| []" fallback -- add ` +
          `default values (\`const [h = 0, s = 100] = ...\`) or an ` +
          `\`|| []\` fallback so a no-match result destructures safely.`,
      )
      continue
    }

    if (INLINE_CHAINED_INDEX_PATTERN.test(candidate.text)) {
      // Chained straight into an index with no `?.` seen by
      // candidateGuardedInline() above -- e.g. `str.exec(re)[1]`.
      errors.push(
        `${candidate.file}:${candidate.line}: indexes a ${
          candidate.text.includes('.exec(') ? 'RegExp.exec' : 'String.match'
        } result directly (no \`?.\`) -- use \`?.[n]\` with a nullish ` +
          `fallback, or guard with \`if (!match) return/continue\` first.`,
      )
      continue
    }

    const assignMatch = candidate.text.match(ASSIGNED_SCALAR_PATTERN)
    const varName = assignMatch?.[1]
    if (!varName) continue // not assigned to a plain identifier -- skip rather than guess

    if (!fileCache.has(candidate.file)) {
      const absolutePath = resolve(repoRoot, candidate.file)
      fileCache.set(
        candidate.file,
        existsSync(absolutePath)
          ? readFileSync(absolutePath, 'utf8').split(/\r?\n/)
          : null,
      )
    }
    const fileLines = fileCache.get(candidate.file)
    if (!fileLines) continue // deleted/renamed since the diff was taken

    const { lines: windowLines, startIndex } = windowAroundLine(
      fileLines,
      candidate.line,
    )
    const unguardedLine = findUnguardedScalarUse(
      windowLines,
      startIndex,
      varName,
    )
    if (unguardedLine !== null) {
      errors.push(
        `${candidate.file}:${unguardedLine}: indexes capture-group result ` +
          `"${varName}" (assigned at line ${candidate.line}) without a guard -- ` +
          `use \`${varName}?.[n]\` with a nullish fallback, add an ` +
          `\`if (!${varName}) return/continue\` guard beforehand, or assert ` +
          `\`${varName}!\` only after checking \`${varName}\` truthy.`,
      )
    }
  }

  return { errors, candidatesChecked }
}

function main(): void {
  const baseRef =
    process.argv[2] ?? process.env.CAPTURE_GROUP_GUARD_BASE_REF ?? 'origin/main'

  const { errors, candidatesChecked } = scanCaptureGroupGuards(
    defaultRepositoryRoot,
    baseRef,
  )

  if (errors.length) {
    console.error(
      `Capture-group guard contract failed with ${errors.length} error(s) ` +
        `(${candidatesChecked} new/changed call site(s) checked against ${baseRef}):`,
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    `Capture-group guard contract passed: ${candidatesChecked} new/changed ` +
      `.exec(/.match( call site(s) checked against ${baseRef}, all guarded ` +
      `or unindexed.`,
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
