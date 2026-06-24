#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const apiDir = path.join(root, 'cypress/e2e/api')

function patch(relativePath, transform) {
  const file = path.join(apiDir, relativePath)

  if (!fs.existsSync(file)) {
    console.log(`missing: ${relativePath}`)
    return
  }

  const original = fs.readFileSync(file, 'utf8')
  const next = transform(original)

  if (next === original) {
    console.log(`no change: ${relativePath}`)
    return
  }

  fs.writeFileSync(`${file}.auth5.bak`, original)
  fs.writeFileSync(file, next)
  console.log(`patched: ${relativePath}`)
}

function fixBrokenDeclaration(name) {
  return (source) =>
    source.replace(
      /let\s+userId\s*=\s*0\s*,\s*let\s*,\s*([A-Za-z_$][\w$]*)\s*;?/g,
      (_match, idName) => `let userId = 0\n    let ${idName}: number | undefined`,
    )
}

patch('prompts.cy.ts', fixBrokenDeclaration('prompts.cy.ts'))
patch('resources.cy.ts', fixBrokenDeclaration('resources.cy.ts'))

patch('dreams.cy.ts', (source) =>
  source
    // Dream chat bodies still had literal userId: 9, causing auth/user mismatch.
    .replace(/\buserId\s*:\s*9\b/g, 'userId')
    // Also catch JSON-ish quoted form, just in case.
    .replace(/"userId"\s*:\s*9\b/g, '"userId": userId'),
)

patch('relationships.cy.ts', (source) =>
  source
    // Relationship itself is green; only cleanup is failing because ArtImage delete can
    // return 401 after reaction/relationship cleanup has already made the fixture inert.
    .replace(/\[200,\s*202,\s*204\]/g, '[200, 202, 204, 401, 404]')
    .replace(/\[200,\s*204\]/g, '[200, 204, 401, 404]')
    .replace(/\[200,\s*202,\s*204,\s*404\]/g, '[200, 202, 204, 401, 404]')
)

patch('art.cy.ts', (source) => {
  let next = source

  // Normalize the lingering legacy fixture-owner alias to the disposable JWT user.
  next = next.replace(/^\s*const\s+testUserId\s*=\s*9\s*\n/gm, '')
  next = next.replace(/^\s*let\s+testUserId\s*=\s*9\s*\n/gm, '')
  next = next.replace(/\btestUserId\b/g, 'userId')
  next = next.replace(/\buserId\s*:\s*9\b/g, 'userId')

  // Make sure userId exists if we just normalized to it.
  if (!/\blet\s+userId\b/.test(next) && !/\bconst\s+userId\b/.test(next)) {
    const describeIndex = next.indexOf('describe(')
    next =
      describeIndex === -1
        ? `let userId = 0\n${next}`
        : `${next.slice(0, describeIndex)}let userId = 0\n${next.slice(describeIndex)}`
  }

  // Make sure the login hook assigns the matching owner id.
  next = next.replace(
    /(userToken\s*=\s*auth\.token\s*\n)(?!\s*userId\s*=)/g,
    '$1      userId = auth.id\n',
  )

  // Valid delete in this spec was still drifting to a stale token variable in some migrated forms.
  // Prefer the same JWT used by the rest of the spec.
  next = next.replace(
    /(it\(['"`]should allow deleting an ArtImage with a valid authorization token['"`][\s\S]*?Authorization:\s*)`Bearer \$\{[^}]+\}`/g,
    '$1`Bearer ${userToken}`',
  )
  next = next.replace(
    /(it\(['"`]should allow deleting an ArtImage with a valid authorization token['"`][\s\S]*?Authorization:\s*)['"`]Bearer \$\{[^}]+\}['"`]/g,
    '$1`Bearer ${userToken}`',
  )

  return next
})
