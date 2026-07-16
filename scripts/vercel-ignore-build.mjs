// /scripts/vercel-ignore-build.mjs
import { spawnSync } from 'node:child_process'

const previousSha = process.env.VERCEL_GIT_PREVIOUS_SHA
const currentSha = process.env.VERCEL_GIT_COMMIT_SHA

const ignoredPrefixes = [
  '.github/',
  '.migration-backups/',
  'artifacts/',
  'cypress/',
  'docs/',
]

const ignoredRootFiles = new Set([
  'AGENTS.md',
  'AI_README.md',
  'CONTROL.md',
  'README.md',
])

function continueBuild(reason) {
  console.log(`[vercel-ignore] Build required: ${reason}`)
  process.exit(1)
}

function ignoreBuild(reason) {
  console.log(`[vercel-ignore] Build skipped: ${reason}`)
  process.exit(0)
}

function isIgnoredPath(filePath) {
  return (
    ignoredRootFiles.has(filePath) ||
    ignoredPrefixes.some((prefix) => filePath.startsWith(prefix)) ||
    filePath.endsWith('.bak')
  )
}

if (!previousSha || !currentSha) {
  continueBuild('missing Vercel commit ancestry')
}

const diff = spawnSync(
  'git',
  ['diff', '--name-only', '--diff-filter=ACMRTUXB', previousSha, currentSha],
  {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  },
)

if (diff.status !== 0) {
  const error = diff.stderr.trim() || `git diff exited with ${diff.status ?? 'unknown status'}`
  continueBuild(error)
}

const changedFiles = diff.stdout
  .split('\n')
  .map((filePath) => filePath.trim())
  .filter(Boolean)

if (changedFiles.length === 0) {
  continueBuild('no changed files were detected')
}

const deployableFiles = changedFiles.filter((filePath) => !isIgnoredPath(filePath))

if (deployableFiles.length === 0) {
  ignoreBuild(`${changedFiles.length} documentation, test, or report file(s) changed`)
}

const preview = deployableFiles.slice(0, 10).join(', ')
const remainder = deployableFiles.length > 10 ? ` and ${deployableFiles.length - 10} more` : ''
continueBuild(`${preview}${remainder}`)
