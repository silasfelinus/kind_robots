import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'

const VERIFY_DIR = resolve(process.cwd(), 'utils/scripts')
const GUARD_PATTERN = /^verify.*\.(?:mjs|ts)$/
const HISTORICAL_CONTEXT = /\b(?:deleted|removed|retired|historical|formerly|previously|legacy|no longer|used to|before|after|superseded)\b|\b20\d{2}[-/]\d{2}[-/]\d{2}\b/i

function normalizeDeletedNames(values) {
  return values.map((value) => basename(value.trim())).filter((name) => GUARD_PATTERN.test(name))
}

function staleReferences(content, deletedNames) {
  const findings = []
  for (const [index, line] of content.split('\n').entries()) {
    for (const name of deletedNames) {
      if (line.includes(name) && !HISTORICAL_CONTEXT.test(line)) findings.push({ line: index + 1, name, text: line.trim() })
    }
  }
  return findings
}

if (process.argv.includes('--self-test')) {
  assert.deepEqual(normalizeDeletedNames(['utils/scripts/verifyOldGuard.mjs', 'components/old.vue']), ['verifyOldGuard.mjs'])
  assert.equal(staleReferences('// see verifyOldGuard.mjs for the contract', ['verifyOldGuard.mjs']).length, 1)
  assert.equal(staleReferences('// verifyOldGuard.mjs was deleted in 2026-09-24 cleanup', ['verifyOldGuard.mjs']).length, 0)
  console.log('Deleted guard reference self-test passed.')
} else {
  const deletedNames = normalizeDeletedNames(process.argv.slice(2))
  if (deletedNames.length === 0) {
    console.log('Deleted guard reference check passed: no verify*.mjs/ts guards were deleted.')
  } else {
    const findings = []
    for (const file of readdirSync(VERIFY_DIR).filter((name) => GUARD_PATTERN.test(name))) {
      if (deletedNames.includes(file)) continue
      const content = readFileSync(resolve(VERIFY_DIR, file), 'utf8')
      for (const finding of staleReferences(content, deletedNames)) findings.push({ file, ...finding })
    }
    if (findings.length > 0) {
      console.error('Deleted guard reference check failed: surviving verifiers still name guards deleted in this change.')
      for (const finding of findings) console.error(`utils/scripts/${finding.file}:${finding.line} references ${finding.name}: ${finding.text}`)
      throw new Error('Stale deleted-guard references found.')
    }
    console.log(`Deleted guard reference check passed: ${deletedNames.length} deleted guard filename(s) have no stale references.`)
  }
}
