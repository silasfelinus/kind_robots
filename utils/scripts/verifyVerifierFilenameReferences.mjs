import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const dir = resolve(process.cwd(), 'utils/scripts')
const guardName = /^verify.*\.(?:mjs|ts)$/
const referenceName = /\b(verify[A-Za-z0-9_-]+\.(?:mjs|ts))\b/g
const historical = /\b(?:deleted|removed|retired|historical|formerly|previously|legacy|no longer|used to|before|after|superseded)\b|\b20\d{2}[-/]\d{2}[-/]\d{2}\b/i

function missingReferences(source, existing) {
  const found = []
  for (const [index, line] of source.split('\n').entries()) {
    if (historical.test(line)) continue
    for (const match of line.matchAll(referenceName)) {
      if (match[1] && !existing.has(match[1])) found.push([index + 1, match[1], line.trim()])
    }
  }
  return found
}

if (process.argv.includes('--self-test')) {
  const existing = new Set(['verifyLiveGuard.ts'])
  assert.equal(missingReferences('// see verifyLiveGuard.ts', existing).length, 0)
  assert.equal(missingReferences('// see verifyOldGuard.mjs', existing).length, 1)
  assert.equal(missingReferences('// verifyOldGuard.mjs was deleted in 2026-09-24 cleanup', existing).length, 0)
  console.log('Verifier reference self-test passed.')
} else {
  const files = readdirSync(dir).filter((name) => guardName.test(name))
  const existing = new Set(files)
  const failures = []
  for (const file of files) {
    for (const [line, name, text] of missingReferences(readFileSync(resolve(dir, file), 'utf8'), existing)) {
      failures.push({ file, line, name, text })
    }
  }
  if (failures.length) {
    for (const item of failures) console.error(`utils/scripts/${item.file}:${item.line} references missing ${item.name}: ${item.text}`)
    throw new Error('Stale verifier filename references found.')
  }
  console.log(`Verifier reference check passed across ${files.length} surviving verifier files.`)
}
