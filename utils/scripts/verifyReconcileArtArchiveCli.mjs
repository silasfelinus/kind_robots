import fs from 'node:fs'

const source = fs.readFileSync('utils/scripts/reconcileArtArchive.ts', 'utf8')
const checks = [
  [
    'imports the t-008 reconciler',
    /import \{[\s\S]*?loadKnownArchiveFiles,[\s\S]*?reconcileArchiveScan,[\s\S]*?\} from '\.\.\/\.\.\/server\/utils\/artArchiveReconciler'/,
  ],
  ['loads the known-file cache before scanning', /loadKnownArchiveFiles\(\)/],
  ['scans with the known-file cache (t-018)', /scanArchiveRoot\(root, \{ knownFiles \}\)/],
  ['reports cache hits', /served from cache/],
  ['reports the move/copy/missing breakdown', /moved:[\s\S]*?copied:[\s\S]*?marked missing:/],
  ['warns when the empty-scan guard trips', /guardTripped/],
  ['disconnects prisma on exit', /\.finally\(async \(\) => \{\s*await prisma\.\$disconnect\(\)/],
  // art-archive/t-019: the dry-run report must never touch the write path.
  ['supports --dry-run', /process\.argv\.includes\('--dry-run'\)/],
  ['dry-run uses the pure planner directly', /async function runDryRun[\s\S]*?planArchiveReconciliation\(scan\.files, existingEntries\)/],
  ['dry-run reports resource-match evidence (t-023)', /async function runDryRun[\s\S]*?matchArchiveResources\(/],
  ['dry-run states no writes were performed', /NO DATABASE WRITES PERFORMED/],
]

let failed = false
for (const [name, pattern] of checks) {
  if (!pattern.test(source)) {
    console.error(`FAIL: ${name}`)
    failed = true
  } else {
    console.log(`PASS: ${name}`)
  }
}

// A regex can prove a call is present but is unreliable for proving one is
// ABSENT from an arbitrary span (a lazy [\s\S]*? plus a lookahead does not
// scan every position). Extract runDryRun's own body by brace-matching and
// assert the actual write-path calls never appear in it as substrings --
// the whole point of --dry-run is that it cannot reach reconcileArchiveScan()
// or importArchiveFile().
const bodyStart = source.indexOf('async function runDryRun')
if (bodyStart === -1) {
  console.error('FAIL: could not locate runDryRun to check its body for write calls')
  failed = true
} else {
  const openBrace = source.indexOf('{', bodyStart)
  let depth = 0
  let end = -1
  for (let i = openBrace; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1
    else if (source[i] === '}') {
      depth -= 1
      if (depth === 0) {
        end = i
        break
      }
    }
  }
  const body = end === -1 ? source.slice(bodyStart) : source.slice(bodyStart, end + 1)
  const forbidden = ['reconcileArchiveScan(', 'importArchiveFile(', '.create(', '.update(', '.delete(']
  const found = forbidden.filter((token) => body.includes(token))
  if (found.length > 0) {
    console.error(`FAIL: runDryRun's body calls a write path: ${found.join(', ')}`)
    failed = true
  } else {
    console.log('PASS: runDryRun never calls the write path (reconcileArchiveScan/importArchiveFile/create/update/delete)')
  }
}

if (failed) process.exit(1)
console.log('Art Archive reconciler CLI contract verified.')
