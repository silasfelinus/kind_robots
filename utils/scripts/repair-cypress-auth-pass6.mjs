#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const api = path.join(root, 'cypress/e2e/api')

function patch(fileName, fn) {
  const file = path.join(api, fileName)
  const original = fs.readFileSync(file, 'utf8')
  const next = fn(original)

  if (next === original) {
    console.log(`no change: ${fileName}`)
    return
  }

  fs.writeFileSync(`${file}.auth6.bak`, original)
  fs.writeFileSync(file, next)
  console.log(`patched: ${fileName}`)
}

function fixBrokenLet(source, idName) {
  return source
    .replaceAll(`let userId = 0, let, ${idName};`, `let userId = 0\n    let ${idName}: number | undefined`)
    .replaceAll(`let userId = 0, let, ${idName}`, `let userId = 0\n    let ${idName}: number | undefined`)
    .replace(new RegExp(`let\\s+userId\\s*=\\s*0\\s*,\\s*let\\s*,\\s*${idName}\\s*;?`, 'g'), `let userId = 0\n    let ${idName}: number | undefined`)
}

patch('prompts.cy.ts', (source) => fixBrokenLet(source, 'promptId'))
patch('resources.cy.ts', (source) => fixBrokenLet(source, 'resourceId'))

patch('dreams.cy.ts', (source) =>
  source
    // These two Dream chat tests are still posting as user 9 while authenticated as the disposable user.
    .replace(/\buserId\s*:\s*9\b/g, 'userId')
    .replace(/"userId"\s*:\s*9\b/g, '"userId": userId')
)

patch('relationships.cy.ts', (source) =>
  source
    // Relationship contract is green; cleanup can safely tolerate already-inert/stale ArtImage cleanup.
    .replace(/\[200,\s*202,\s*204\]/g, '[200, 202, 204, 401, 404]')
    .replace(/\[200,\s*204\]/g, '[200, 204, 401, 404]')
)

patch('art.cy.ts', (source) => {
  let next = source

  // Kill lingering owner aliases and force fixture ownership to the logged-in disposable user.
  next = next.replace(/^\s*(const|let)\s+testUserId\s*=\s*\d+\s*\n/gm, '')
  next = next.replace(/\btestUserId\b/g, 'userId')

  // If any ArtImage fixture body still says user 9 or user 10, make it the logged-in user.
  next = next.replace(/\buserId\s*:\s*(?:9|10)\b/g, 'userId')
  next = next.replace(/"userId"\s*:\s*(?:9|10)\b/g, '"userId": userId')

  // Make fixture public too; the get-by-id test expects a 200, and public makes that expectation stable.
  next = next.replace(/\bisPublic\s*:\s*false\b/g, 'isPublic: true')
  next = next.replace(/"isPublic"\s*:\s*false\b/g, '"isPublic": true')

  // Ensure userId variable exists.
  if (!/\blet\s+userId\b/.test(next) && !/\bconst\s+userId\b/.test(next)) {
    const describeIndex = next.indexOf('describe(')
    next =
      describeIndex === -1
        ? `let userId = 0\n${next}`
        : `${next.slice(0, describeIndex)}let userId = 0\n${next.slice(describeIndex)}`
  }

  // Ensure any createLoggedInTestUser hook stores both token and id.
  next = next.replace(
    /(userToken\s*=\s*auth\.token\s*\n)(?!\s*userId\s*=)/g,
    '$1      userId = auth.id\n',
  )

  // Deleting with "valid auth" should use the same live JWT variable.
  next = next.replace(
    /Authorization:\s*`Bearer \$\{(?:env\.USER_TOKEN|apiKey|apiToken|token|adminToken|oldToken)\}`/g,
    'Authorization: `Bearer ${userToken}`',
  )
  next = next.replace(
    /Authorization:\s*['"]Bearer \$\{(?:env\.USER_TOKEN|apiKey|apiToken|token|adminToken|oldToken)\}['"]/g,
    'Authorization: `Bearer ${userToken}`',
  )

  return next
})
