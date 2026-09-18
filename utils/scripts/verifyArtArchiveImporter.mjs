import fs from 'node:fs'

const source = fs.readFileSync('server/utils/artArchiveImporter.ts', 'utf8')
const checks = [
  ['private ArtImage invariant', /artImage\.(create|update)[\s\S]*?isPublic:\s*false/],
  ['mature ArtImage invariant', /artImage\.(create|update)[\s\S]*?isMature:\s*true/],
  ['private folder collection invariant', /artCollection\.(create|update)[\s\S]*?isPublic:\s*false/],
  ['mature folder collection invariant', /artCollection\.(create|update)[\s\S]*?isMature:\s*true/],
  ['path-keyed archive idempotency', /archiveEntry\.findUnique\([\s\S]*?relativePath:\s*file\.relativePath/],
  ['existing ArtImage reuse', /existingEntry\?\.artImageId/],
  ['folder identity includes full parent path', /createHash\('sha256'\)\.update\(key\)/],
  ['raw extracted metadata retained', /extractedMetadata:\s*JSON\.stringify\(file\.metadata\)/],
  ['folder collection membership', /ArtImages:\s*\{\s*connect:\s*\{\s*id:\s*artImageId/],
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
console.log('Art Archive importer contract verified.')
