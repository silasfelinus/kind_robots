import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const dir = resolve(process.cwd(), 'utils/scripts')
const guardName = /^verify.*\.(?:mjs|ts)$/
const referenceName = /\b(verify[A-Za-z0-9_-]+\.(?:mjs|ts))\b/g
const historical =
  /\b(?:deleted|removed|retired|historical|formerly|previously|legacy|no longer|used to|before|after|superseded)\b|\b20\d{2}[-/]\d{2}[-/]\d{2}\b/i
// A comment explaining a rename/removal often wraps across two lines (the
// filename on one line, "...were deleted..." on the next) -- check a
// 3-line window so that split doesn't defeat the historical-context skip.
function historicalNearby(lines, index) {
  const start = Math.max(0, index - 1)
  const end = Math.min(lines.length, index + 2)
  return historical.test(lines.slice(start, end).join('\n'))
}
// Guards that ship a `--self-test` branch (the convention this checker
// itself and verifyDeletedGuardReferences.mjs follow) embed deliberately
// fake filenames as test fixtures in that branch -- not real references.
// Skip lines inside the `if (process.argv.includes('--self-test')) { ... }`
// block, up to its `} else {`.
const selfTestStart = /process\.argv\.includes\(['"]--self-test['"]\)/
const selfTestEnd = /^\}\s*else\s*\{/

function missingReferences(source, existing) {
  const found = []
  const lines = source.split('\n')
  let inSelfTestBlock = false
  for (const [index, line] of lines.entries()) {
    if (!inSelfTestBlock && selfTestStart.test(line)) {
      inSelfTestBlock = true
      continue
    }
    if (inSelfTestBlock) {
      if (selfTestEnd.test(line)) inSelfTestBlock = false
      continue
    }
    if (historicalNearby(lines, index)) continue
    for (const match of line.matchAll(referenceName)) {
      if (match[1] && !existing.has(match[1]))
        found.push([index + 1, match[1], line.trim()])
    }
  }
  return found
}

if (process.argv.includes('--self-test')) {
  const existing = new Set(['verifyLiveGuard.ts'])
  assert.equal(
    missingReferences('// see verifyLiveGuard.ts', existing).length,
    0,
  )
  assert.equal(
    missingReferences('// see verifyOldGuard.mjs', existing).length,
    1,
  )
  assert.equal(
    missingReferences(
      '// verifyOldGuard.mjs was deleted in 2026-09-24 cleanup',
      existing,
    ).length,
    0,
  )
  console.log('Verifier reference self-test passed.')
} else {
  const files = readdirSync(dir).filter((name) => guardName.test(name))
  const existing = new Set(files)
  // .test.ts files are synthetic fixtures for exercising some other guard's
  // matching logic, not documentation -- they routinely embed deliberately
  // fake verify*.mjs/.ts-shaped names as test data. They can still be a
  // valid reference *target* (kept in `existing` above); they're just not
  // scanned as a *source* of references.
  const sourceFiles = files.filter((name) => !name.endsWith('.test.ts'))
  const failures = []
  for (const file of sourceFiles) {
    for (const [line, name, text] of missingReferences(
      readFileSync(resolve(dir, file), 'utf8'),
      existing,
    )) {
      failures.push({ file, line, name, text })
    }
  }
  if (failures.length) {
    for (const item of failures)
      console.error(
        `utils/scripts/${item.file}:${item.line} references missing ${item.name}: ${item.text}`,
      )
    throw new Error('Stale verifier filename references found.')
  }
  console.log(
    `Verifier reference check passed across ${sourceFiles.length} surviving verifier files.`,
  )
}
