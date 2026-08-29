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

/**
 * Candidate class lists in a template, judged per ELEMENT rather than per file.
 *
 * `/class="/` matches `:class="` too, which is deliberate and preserves the old
 * rule's reach: art-manager.vue hides a `kr-scroll` inside a ternary
 * (`: 'kr-scroll p-3'`), and a rule that only read static attributes would stop
 * seeing it. Each quoted literal inside a dynamic binding becomes its own
 * candidate, so `cond ? 'max-h-40 overflow-y-auto' : 'overflow-y-auto'` is
 * correctly read as one bounded branch and one unbounded one.
 */
function classGroups(template: string): string[] {
  const groups: string[] = []

  for (const attribute of template.matchAll(/class="([^"]*)"/g)) {
    const value = attribute[1] ?? ''

    if (/['`]/.test(value)) {
      for (const literal of value.matchAll(/['`]([^'`]*)['`]/g)) {
        groups.push(literal[1] ?? '')
      }
      continue
    }

    groups.push(value)
  }

  return groups
}

/**
 * A scroll owner: an element that scrolls and is NOT height-bounded.
 *
 * THE `max-h-*` EXEMPTION IS THE POINT, and it is borrowed rather than
 * invented -- verifyLayoutContract.ts's ownScrollCount has carried it from the
 * start ("Bounded max-h-* regions are intentionally nested previews, not
 * page-level owners"). This checker had a blunter rule: a bare regex for
 * `overflow-y-auto` anywhere in the file. The two therefore disagreed about the
 * same concept, and the home page found the seam -- a `max-h-64` newsfeed box
 * (Silas, 2026-08-29: "newsfeeds should scroll vertically, and take up less
 * height") is a nested preview by the layout contract's definition and a
 * violation by this one.
 *
 * A bounded box cannot compete with the host for the page's scroll gesture the
 * way an unbounded one does, which is what this rule exists to prevent. So the
 * definitions are reconciled here, in the direction the more considered rule
 * already documents.
 */
function ownsScrollRegion(template: string): boolean {
  return classGroups(template).some((classList) => {
    const tokens = classList.split(/\s+/).filter(Boolean)
    const scrolls =
      tokens.includes('overflow-y-auto') ||
      tokens.includes('overflow-auto') ||
      tokens.includes('kr-scroll')

    return scrolls && !tokens.some((token) => token.startsWith('max-h-'))
  })
}

const current: string[] = []
for (const tag of mountedTags) {
  for (const file of filesByTag.get(tag) ?? []) {
    if (ownsScrollRegion(templateOf(read(file)))) current.push(rel(file))
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
