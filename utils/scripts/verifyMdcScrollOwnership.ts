import { readFileSync, readdirSync, statSync } from 'node:fs'
import { basename, extname, join, relative } from 'node:path'

const ROOT = process.cwd()
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

function componentTag(path: string): string {
  return basename(path, '.vue')
}

const vueFiles = [
  ...walk(join(ROOT, 'components'), '.vue'),
  ...walk(join(ROOT, 'pages'), '.vue'),
]
const mdFiles = walk(join(ROOT, 'content'), '.md')

const filesByTag = new Map<string, string[]>()
for (const file of vueFiles) {
  const tag = componentTag(file)
  const files = filesByTag.get(tag) ?? []
  files.push(file)
  filesByTag.set(tag, files)
}

const mountedBy = new Map<string, string[]>()
for (const file of mdFiles) {
  const body = read(file).replace(/^---[\s\S]*?\n---\n/, '')
  const tags = body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^:{1,2}[a-z][a-z0-9-]*\s*$/.test(line))
    .map((line) => line.replace(/^:{1,2}/, ''))

  for (const tag of tags) {
    const owners = mountedBy.get(tag) ?? []
    owners.push(rel(file))
    mountedBy.set(tag, owners)
  }
}

const violations: string[] = []
for (const [tag, owners] of mountedBy) {
  for (const file of filesByTag.get(tag) ?? []) {
    const template = templateOf(read(file))
    if (/overflow-y-auto|overflow-auto/.test(template) || /class="[^"]*\bkr-scroll\b[^"]*"/.test(template)) {
      violations.push(`${rel(file)} mounted by ${owners.join(', ')}`)
    }
  }
}

if (violations.length) {
  throw new Error(
    'MDC scroll ownership violated. pages/[...slug].vue already owns scrolling for these mounted components:\n' +
      violations.sort().map((entry) => `  ${entry}`).join('\n'),
  )
}

console.log(`MDC scroll ownership holds for ${mountedBy.size} mounted component tags.`)
