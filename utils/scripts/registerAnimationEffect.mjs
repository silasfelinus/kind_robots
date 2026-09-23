import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REQUIRED_FIELDS = [
  'id',
  'label',
  'reveal',
  'icon',
  'tooltip',
  'color',
  'generationSafe',
  'preferredSurface',
]
const SURFACES = new Set(['header', 'sheet', 'page', 'hand', 'fullscreen'])
const CATALOG_END = '] as const satisfies readonly AnimationEffectDefinition[]'

function quote(value) {
  return `'${String(value).replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`
}

export function validateAnimationEffect(entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    throw new Error('Animation effect entry must be a JSON object.')
  }
  for (const field of REQUIRED_FIELDS) {
    if (!(field in entry)) throw new Error(`Missing required field: ${field}`)
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id)) {
    throw new Error('id must be a lowercase kebab-case animation id.')
  }
  for (const field of ['label', 'reveal', 'icon', 'tooltip', 'color']) {
    if (typeof entry[field] !== 'string' || !entry[field].trim()) {
      throw new Error(`${field} must be a non-empty string.`)
    }
  }
  if (typeof entry.generationSafe !== 'boolean') {
    throw new Error('generationSafe must be boolean.')
  }
  if (!SURFACES.has(entry.preferredSurface)) {
    throw new Error(`preferredSurface must be one of: ${[...SURFACES].join(', ')}`)
  }
  if (entry.releasedAt !== undefined && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(entry.releasedAt)) {
    throw new Error('releasedAt must be an ISO UTC timestamp ending in Z.')
  }
  if (entry.blocksInput !== undefined && typeof entry.blocksInput !== 'boolean') {
    throw new Error('blocksInput must be boolean when supplied.')
  }
}

export function formatAnimationEffect(entry) {
  validateAnimationEffect(entry)
  const lines = [
    '  {',
    `    id: ${quote(entry.id)},`,
    `    label: ${quote(entry.label)},`,
    `    reveal: ${quote(entry.reveal)},`,
    `    icon: ${quote(entry.icon)},`,
    `    tooltip: ${quote(entry.tooltip)},`,
    `    color: ${quote(entry.color)},`,
  ]
  if (entry.releasedAt) lines.push(`    releasedAt: ${quote(entry.releasedAt)},`)
  lines.push(`    generationSafe: ${entry.generationSafe},`)
  if (entry.blocksInput !== undefined) lines.push(`    blocksInput: ${entry.blocksInput},`)
  lines.push(`    preferredSurface: ${quote(entry.preferredSurface)},`, '  },')
  return lines.join('\n')
}

export function registerAnimationEffect(catalogText, entry) {
  validateAnimationEffect(entry)
  const singleQuotedId = `id: '${entry.id}'`
  const doubleQuotedId = `id: \"${entry.id}\"`
  if (catalogText.includes(singleQuotedId) || catalogText.includes(doubleQuotedId)) {
    throw new Error(`Animation effect already registered: ${entry.id}`)
  }
  const markerIndex = catalogText.indexOf(CATALOG_END)
  if (markerIndex < 0) throw new Error('Could not find the ANIMATION_EFFECTS closing marker.')
  if (catalogText.indexOf(CATALOG_END, markerIndex + 1) >= 0) {
    throw new Error('Catalog closing marker is ambiguous; refusing to edit.')
  }
  const before = catalogText.slice(0, markerIndex)
  const after = catalogText.slice(markerIndex)
  const separator = before.endsWith('\n') ? '' : '\n'
  return `${before}${separator}${formatAnimationEffect(entry)}\n${after}`
}

function parseArgs(argv) {
  const args = { dryRun: false, catalog: 'stores/animationCatalog.ts' }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--dry-run') args.dryRun = true
    else if (arg === '--entry') args.entry = argv[++i]
    else if (arg === '--catalog') args.catalog = argv[++i]
    else throw new Error(`Unknown argument: ${arg}`)
  }
  if (!args.entry) throw new Error('Usage: node utils/scripts/registerAnimationEffect.mjs --entry <entry.json> [--catalog <path>] [--dry-run]')
  return args
}

export function runCli(argv = process.argv.slice(2)) {
  const args = parseArgs(argv)
  const entryPath = path.resolve(args.entry)
  const catalogPath = path.resolve(args.catalog)
  const entry = JSON.parse(fs.readFileSync(entryPath, 'utf8'))
  const original = fs.readFileSync(catalogPath, 'utf8')
  const updated = registerAnimationEffect(original, entry)
  if (args.dryRun) {
    process.stdout.write(`${formatAnimationEffect(entry)}\n`)
    return
  }
  fs.writeFileSync(catalogPath, updated)
  process.stdout.write(`Registered ${entry.id} in ${path.relative(process.cwd(), catalogPath)}\n`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    runCli()
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
