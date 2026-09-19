import fs from 'node:fs'

const source = fs.readFileSync('utils/scripts/importArtArchive.ts', 'utf8')
const checks = [
  ['imports the t-004 scanner', /import \{ scanArchiveRoot \} from '\.\.\/\.\.\/server\/utils\/artArchiveScanner'/],
  ['imports the t-005 importer', /import \{ importArchiveFile \} from '\.\.\/\.\.\/server\/utils\/artArchiveImporter'/],
  ['imports the t-006 resource matcher', /matchArchiveResources[\s\S]*?artArchiveResourceMatch/],
  ['supports --root override', /resolveRootArg[\s\S]*?--root/],
  ['supports --user-id override with a safe default', /resolveUserIdArg[\s\S]*?: 1/],
  ['reports created/reused image counts', /imagesCreated[\s\S]*?imagesReused/],
  ['reports created/reused collection counts', /collectionsCreated[\s\S]*?collectionsReused/],
  ['matches every imported file against the active resource pool', /matchArchiveResources\([\s\S]*?file\.metadata[\s\S]*?file\.relativePath[\s\S]*?file\.parentFolder[\s\S]*?prisma\.resource/],
  ['reports candidate confidence and evidence', /candidate\.confidence[\s\S]*?candidate\.evidence/],
  ['reports unmatched embedded evidence', /UNMATCHED[\s\S]*?evidence\.name[\s\S]*?evidence\.hash/],
  ['summarizes files carrying match evidence', /filesWithMatchEvidence[\s\S]*?files with evidence/],
  ['a per-file failure does not abort the run', /catch \(error\) \{\s*errors\.push/],
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
console.log('Art Archive import CLI contract verified.')
