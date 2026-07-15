// /utils/scripts/verifyAcademyStyleDetailCallers.ts
//
// Regression guard for ai-art-academy/t-017 (kaizen from t-016): academy-style-detail.vue
// carries a hand-written comment atop its <script setup> listing every call site and the
// showClose/showRemixButton subset each one passes. A hand-written comment can silently go
// stale the same way an undocumented prop did before (PR #301 fixed a showRemixButton
// no-op-handler bug caused exactly by a caller's expectations not being obvious from the
// component alone). This script fails CI when a new file uses academy-style-detail.vue
// without a matching entry in that comment, or when a documented entry no longer exists.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const COMPONENT_PATH = path.resolve('components/academy/academy-style-detail.vue')
const SEARCH_ROOTS = ['components', 'pages', 'layouts']
const SKIP_DIRS = new Set(['node_modules', '.nuxt', '.output', '.git', 'dist', 'coverage'])
const USAGE_PATTERN = /<academy-style-detail\b|<AcademyStyleDetail\b/

function walkVueFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue
    const fullPath = path.join(dir, entry)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      walkVueFiles(fullPath, out)
    } else if (entry.endsWith('.vue')) {
      out.push(fullPath)
    }
  }
  return out
}

function findActualCallers(): Set<string> {
  const callers = new Set<string>()
  for (const root of SEARCH_ROOTS) {
    const dir = path.resolve(root)
    if (!fs.existsSync(dir)) continue
    for (const filePath of walkVueFiles(dir)) {
      if (path.resolve(filePath) === COMPONENT_PATH) continue
      const contents = fs.readFileSync(filePath, 'utf8')
      if (USAGE_PATTERN.test(contents)) {
        callers.add(path.basename(filePath))
      }
    }
  }
  return callers
}

function findDocumentedCallers(): Set<string> {
  const contents = fs.readFileSync(COMPONENT_PATH, 'utf8')
  const documented = new Set<string>()
  const lineRegex = /^\/\/\s+-\s+([\w-]+\.vue):/gm
  let match: RegExpExecArray | null
  while ((match = lineRegex.exec(contents)) !== null) {
    documented.add(match[1])
  }
  return documented
}

const actualCallers = findActualCallers()
const documentedCallers = findDocumentedCallers()

assert.ok(
  documentedCallers.size > 0,
  'academy-style-detail.vue is missing its usage-context comment (expected lines like ' +
    '"//   - some-caller.vue: ..." atop the <script setup> block) — see t-016/t-017.',
)

const undocumented = [...actualCallers].filter((file) => !documentedCallers.has(file))
assert.deepEqual(
  undocumented,
  [],
  `academy-style-detail.vue has undocumented caller(s): ${undocumented.join(', ')}. ` +
    'Add an entry to the usage-context comment atop academy-style-detail.vue\'s ' +
    '<script setup> block describing the showClose/showRemixButton subset this caller passes.',
)

const stale = [...documentedCallers].filter((file) => !actualCallers.has(file))
assert.deepEqual(
  stale,
  [],
  `academy-style-detail.vue's usage-context comment documents caller(s) that no longer use ` +
    `it: ${stale.join(', ')}. Remove the stale entry from the comment.`,
)

console.log(
  `academy-style-detail.vue usage-context comment verified: ${actualCallers.size} caller(s) ` +
    `match the documented list (${[...documentedCallers].sort().join(', ')}).`,
)
