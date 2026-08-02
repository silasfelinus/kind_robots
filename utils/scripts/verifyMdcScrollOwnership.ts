import { readFileSync, readdirSync, statSync } from 'node:fs'
import { basename, extname, join, relative } from 'node:path'

const ROOT = process.cwd()
const BASELINE_PATH = join(
  ROOT,
  'utils/scripts/mdc-scroll-ownership-baseline.json',
)
const SKIP_DIRS = new Set([
  'node_modules',
  '.nuxt',
  '.git',
  'dist',
  '.output',
  'abandonware',
  'archives',
  'cypress',
  'sample',
])

type Baseline = {
  note: string
  recorded: string
  violations: string[]
}

function walk(dir: string, ext: string, out: string[] = []): string[] {
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue

    const full = join(dir, entry)
    let isDir: boolean
    try {
      isDir = statSync(full).isDirectory()
    } catch {
      continue
    }

    if (isDir) walk(full, ext, out)
    else if (extname(entry) === ext) out.push(full)
  }

  return out
}

const read = (path: string): string => readFileSync(path, 'utf8')
const rel = (path: string): string => relative(ROOT, path).replace(/\\/g, '/')

function templateOf(source: string): string {
  return source
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
}

const vueFiles = [
  ...walk(join(ROOT, 'components'), '.vue'),
  ...walk(join(ROOT, 'pages'), '.vue'),
]
const mdFiles = walk(join(ROOT, 'content'), '.md')

const filesByTag = new Map<string, string[]>()
for (const file of vueFiles) {
  const tag = basename(file, '.vue')
  const files = filesByTag.get(tag) ?? []
  files.push(file)
  filesByTag.set(tag, files)
}

const mountedTags = new Set<string>()
for (const file of mdFiles) {
  const body = read(file).replace(/^---[\s\S]*?\n---\n/, '')
  const tags = body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^:{1,2}[a-z][a-z0-9-]*\s*$/.test(line))
    .map((line) => line.replace(/^:{1,2}/, ''))

  for (const tag of tags) mountedTags.add(tag)
}

const current: string[] = []
for (const tag of mountedTags) {
  for (const file of filesByTag.get(tag) ?? []) {
    const template = templateOf(read(file))
    const ownsScroll =
      /overflow-y-auto|overflow-auto/.test(template) ||
      /class="[^"]*\bkr-scroll\b[^"]*"/.test(template)
    if (ownsScroll) current.push(rel(file))
  }
}

const baseline = JSON.parse(read(BASELINE_PATH)) as Baseline
const allowed = new Set(baseline.violations)
const added = [...new Set(current)].sort().filter((file) => !allowed.has(file))

if (added.length) {
  throw new Error(
    'MDC scroll ownership violated. pages/[...slug].vue already owns scrolling for these newly nested scrollers:\n' +
      added.map((entry) => `  + ${entry}`).join('\n'),
  )
}

const removed = baseline.violations.filter((file) => !current.includes(file))
if (removed.length) {
  console.log(
    `MDC scroll ownership improved by ${removed.length}. Ratchet the baseline down:\n` +
      removed.map((entry) => `  - ${entry}`).join('\n'),
  )
}

console.log(
  `MDC scroll ownership holds: ${current.length} existing violations, no new violations across ${mountedTags.size} mounted component tags.`,
)
