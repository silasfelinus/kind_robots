import fs from 'node:fs'

const source = fs.readFileSync('utils/scripts/reconcileArtArchive.ts', 'utf8')
const checks = [
  ['imports the t-008 reconciler', /import \{ loadKnownArchiveFiles, reconcileArchiveScan \} from '\.\.\/\.\.\/server\/utils\/artArchiveReconciler'/],
  ['loads the known-file cache before scanning', /loadKnownArchiveFiles\(\)/],
  ['scans with the known-file cache (t-018)', /scanArchiveRoot\(root, \{ knownFiles \}\)/],
  ['reports cache hits', /served from cache/],
  ['reports the move/copy/missing breakdown', /moved:[\s\S]*?copied:[\s\S]*?marked missing:/],
  ['warns when the empty-scan guard trips', /guardTripped/],
  ['disconnects prisma on exit', /\.finally\(async \(\) => \{\s*await prisma\.\$disconnect\(\)/],
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

if (failed) process.exit(1)
console.log('Art Archive reconciler CLI contract verified.')
