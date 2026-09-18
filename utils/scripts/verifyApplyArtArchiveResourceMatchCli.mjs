import fs from 'node:fs'

const source = fs.readFileSync('utils/scripts/applyArtArchiveResourceMatch.ts', 'utf8')
const checks = [
  ['imports the t-007 apply module', /import \{[\s\S]*?applyArchiveResourceMatches[\s\S]*?\} from '\.\.\/\.\.\/server\/utils\/applyArtArchiveResourceMatch'/],
  ['each entry runs in its own transaction', /prisma\.\$transaction\(\(tx\) => applyArchiveEntryResourceMatch/],
  ['reports applied vs skipped counts', /skipped \(locked\)/],
  ['reports the confirmed/ambiguous/suggested breakdown', /appliedCount\('CONFIRMED'\)[\s\S]*?appliedCount\('AMBIGUOUS'\)[\s\S]*?appliedCount\('SUGGESTED'\)/],
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
console.log('Art Archive resource match apply CLI contract verified.')
