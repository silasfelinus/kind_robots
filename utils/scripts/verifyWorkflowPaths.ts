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
  // Build output, never checked into git -- whether it exists depends on
  // whether a prior step in the same job ran an install, not on repo state.
  'node_modules/',
  // A git remote-tracking ref (e.g. `origin/main`), not a repo-relative file
  // path -- contract-tests.yml's capture-group guard step passes this as a
  // base-ref argument to a script, which reads path-shaped to the bare-token
  // extractor above (kind-robots/t-031).
  'origin/',
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
// Shared boundary for every path-shaped pattern in this file: plain `\b`
// only checks a word/non-word transition, and `.`/`/`/`@` are all non-word,
// so it happily anchors mid-token -- e.g. against a `curl`'d install-script
// URL like `https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh`,
// an absolute toolcache path like `/opt/hostedtoolcache/node/20.11.0/x64/bin/
// activate.sh`, or an npm-scoped CDN path like `some-scope@1.2.3/dist/
// index.js`, an un-anchored pattern matches the domain/path/version-pin as
// if it were a repo-relative file reference. Requiring the match not be
// immediately preceded/followed by another path/token/version-pin character
// stops it from starting partway through a longer non-repo token. Build any
// new path-matching pattern in this file from `anchorPathToken()` so it
// inherits correct anchoring by construction instead of needing its own
// manual audit pass (see kind-robots/t-030, t-034, t-035).
function anchorPathToken(body: string): RegExp {
  return new RegExp(`(?<![A-Za-z0-9._/@-])${body}(?![A-Za-z0-9._-])`, 'g')
}

const runStepTokenPattern = anchorPathToken(
  `[A-Za-z0-9._-]+(?:/[A-Za-z0-9._-]+)+\\.(?:${RUN_STEP_EXTENSIONS.join('|')})`,
)

// Extension-less directory references (e.g. `git diff --quiet -- stores/fallback`).
// Deliberately narrower than the extension-based pattern above -- bare
// `word/word` tokens collide with a lot of non-path shell content (git refs,
// npm builtin module specifiers, prose, /dev/null, CIDR ranges like
// 100.64.0.0/10). To keep the false-positive rate down without a full shell
// parser:
//   - every segment must be lowercase (repo directories are lowercase; this
//     alone rules out prose like "Codespaces/Dependabot" in echoed strings
//     and GitHub Actions context expressions)
//   - a segment may start with a single leading dot (`.bin`, `.github`) but
//     is otherwise dot-free
//   - the boundary comes from anchorPathToken() above (`\b` alone doesn't
//     cover this: "." and "/" are both non-word, so `\b` happily anchors
//     mid-token, e.g. inside "100.64.0.0/10" or right after the "/" in
//     "/dev/null") -- it's what actually keeps this pattern from matching a
//     fragment of a longer non-path token, or a fragment of a path the
//     extension-based pattern above already owns
const bareSegment = String.raw`\.?[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?`
const bareTokenPattern = anchorPathToken(`${bareSegment}(?:/${bareSegment})+`)

// Bare tokens sit inside shell, so `require('dns/promises')` / `from
// 'stream/promises'` / `import('node:fs/promises')` read as path-shaped
// text even though they're Node module specifiers, not repo paths.
const importSpecifierContext = /(?:\brequire\(\s*|\bfrom\s+|\bimport\(\s*)['"]$/

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
  // Bare tokens run over whole shell lines, so (unlike the extension pattern
  // above) a `#` comment line reads as path-shaped text too easily -- skip
  // it outright rather than trying to strip inline comments from arbitrary
  // shell.
  const scanBare = (text: string) => {
    if (text.trim().startsWith('#')) return
    for (const match of text.matchAll(bareTokenPattern)) {
      if (importSpecifierContext.test(text.slice(0, match.index))) continue
      hits.push({ file, path: match[0], source: 'run step' })
    }
  }

  for (const [i, line] of lines.entries()) {
    const inline = line.match(/^(\s*)run:\s*(.+)$/)
    const inlineValue = inline?.[2] ?? ''
    if (inline && !/^[|>][-+]?$/.test(inlineValue.trim())) {
      scan(inlineValue)
      scanBare(inlineValue)
      continue
    }
    const block = line.match(/^(\s*)run:\s*[|>][-+]?\s*$/)
    if (!block) continue
    const keyIndent = (block[1] ?? '').length
    for (const next of lines.slice(i + 1)) {
      if (!next.trim()) continue
      if (indentOf(next) <= keyIndent) break
      scan(next)
      scanBare(next)
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

// GitHub's trigger-paths filter treats `[`/`]` as a glob character class, so
// a real bracketed filename (e.g. Nuxt's `[id].patch.ts` dynamic routes)
// must be written `\[id\].patch.ts` to match itself literally there
// (kind-robots/t-041). That backslash isn't part of the on-disk filename --
// unescape it before the existence check below, or every such entry reads
// as a missing file.
function unescapeGlobLiteral(path: string): string {
  return path.replace(/\\([[\]])/g, '$1')
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
      const resolvedTarget =
        hit.source === 'trigger paths' ? unescapeGlobLiteral(target) : target
      if (!existsSync(resolve(repositoryRoot, resolvedTarget))) {
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
