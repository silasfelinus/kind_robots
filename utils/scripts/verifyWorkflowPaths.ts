// /utils/scripts/verifyWorkflowPaths.ts
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

type PathHit = {
  file: string
  path: string
  source: 'trigger paths' | 'run step'
}

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')
const workflowsDirectory = resolve(repositoryRoot, '.github/workflows')

// Heuristic only -- these hits are known-good non-repo paths (another repo's
// checkout, or a path only known to exist once a build step has generated
// it) rather than dead references. Add an exact string or path prefix here
// when a new false positive shows up; do not loosen the extraction regexes
// to "fix" it.
const ALLOWLIST_PREFIXES = [
  // davinci-seed-verify.yml checks out silasfelinus/conductor into this path
  // and runs its generator script from there -- not part of this repo tree.
  'conductor-src/',
]

// `run:` steps are shell, not YAML -- we don't parse them, we scan for
// tokens that look like repo-relative file paths. Restricting to a known
// extension list keeps this from matching command names, flags, or output
// files that don't exist until the step itself creates them.
const RUN_STEP_EXTENSIONS = [
  'ts',
  'tsx',
  'js',
  'mjs',
  'cjs',
  'py',
  'sql',
  'sh',
  'json',
  'yml',
  'yaml',
  'prisma',
]
const runStepTokenPattern = new RegExp(
  `[A-Za-z0-9._-]+(?:/[A-Za-z0-9._-]+)+\\.(?:${RUN_STEP_EXTENSIONS.join('|')})\\b`,
  'g',
)

function listWorkflowFiles(): string[] {
  return readdirSync(workflowsDirectory)
    .filter((name) => name.endsWith('.yml') || name.endsWith('.yaml'))
    .sort()
    .map((name) => join(workflowsDirectory, name))
}

function indentOf(line: string): number {
  return line.length - line.trimStart().length
}

function unquote(value: string): string {
  const trimmed = value.trim()
  const quote = trimmed[0]
  return (quote === "'" || quote === '"') && trimmed.endsWith(quote)
    ? trimmed.slice(1, -1)
    : trimmed
}

// Collects `- entry` list items nested under a `paths:` / `paths-ignore:`
// trigger key (indentation-based, not a full YAML parse -- these lists are
// always simple string arrays in our workflows).
function extractTriggerPaths(lines: string[], file: string): PathHit[] {
  const hits: PathHit[] = []
  for (const [i, line] of lines.entries()) {
    const keyMatch = line.match(/^(\s*)(?:paths|paths-ignore):\s*$/)
    if (!keyMatch) continue
    const keyIndent = (keyMatch[1] ?? '').length
    for (const next of lines.slice(i + 1)) {
      if (!next.trim()) continue
      if (indentOf(next) <= keyIndent) break
      const item = next.match(/^\s*-\s*(.+?)\s*$/)
      if (!item) break
      hits.push({ file, path: unquote(item[1] ?? ''), source: 'trigger paths' })
    }
  }
  return hits
}

// Scans `run:` step bodies (inline `run: cmd` or block-scalar `run: |`) for
// path-like tokens. Does not attempt to parse shell syntax.
function extractRunStepPaths(lines: string[], file: string): PathHit[] {
  const hits: PathHit[] = []
  const scan = (text: string) => {
    for (const match of text.matchAll(runStepTokenPattern)) {
      hits.push({ file, path: match[0], source: 'run step' })
    }
  }

  for (const [i, line] of lines.entries()) {
    const inline = line.match(/^(\s*)run:\s*(.+)$/)
    const inlineValue = inline?.[2] ?? ''
    if (inline && !/^[|>][-+]?$/.test(inlineValue.trim())) {
      scan(inlineValue)
      continue
    }
    const block = line.match(/^(\s*)run:\s*[|>][-+]?\s*$/)
    if (!block) continue
    const keyIndent = (block[1] ?? '').length
    for (const next of lines.slice(i + 1)) {
      if (!next.trim()) continue
      if (indentOf(next) <= keyIndent) break
      scan(next)
    }
  }
  return hits
}

function isAllowlisted(path: string): boolean {
  return ALLOWLIST_PREFIXES.some((prefix) => path.startsWith(prefix))
}

// Trigger-path entries may be globs (e.g. `server/api/facets/**`); check
// existence of the concrete directory/file prefix before the first `*`.
function resolvableTarget(path: string): string | null {
  const starIndex = path.indexOf('*')
  if (starIndex === -1) return path
  const prefix = path.slice(0, starIndex).replace(/\/+$/, '')
  return prefix.length > 0 ? prefix : null
}

async function main(): Promise<void> {
  const files = listWorkflowFiles()
  const errors: string[] = []
  let checked = 0

  for (const file of files) {
    const relativeFile = file.slice(repositoryRoot.length + 1)
    const lines = readFileSync(file, 'utf8').split(/\r?\n/)
    const hits = [
      ...extractTriggerPaths(lines, relativeFile),
      ...extractRunStepPaths(lines, relativeFile),
    ]

    for (const hit of hits) {
      if (isAllowlisted(hit.path)) continue
      const target = resolvableTarget(hit.path)
      if (target === null) continue // bare glob like `*.ts` -- nothing concrete to check
      checked += 1
      if (!existsSync(resolve(repositoryRoot, target))) {
        errors.push(
          `${hit.file}: ${hit.source} references missing path "${hit.path}"`,
        )
      }
    }
  }

  if (errors.length) {
    console.error(
      `Workflow path references contract failed with ${errors.length} error(s):`,
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    `Workflow path references contract passed: ${files.length} workflow file(s), ${checked} path reference(s) checked.`,
  )
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
