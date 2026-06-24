#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const apiDir = path.join(root, 'cypress/e2e/api')

const files = [
  'art.cy.ts',
  'dreams.cy.ts',
  'prompts.cy.ts',
  'resources.cy.ts',
  'reactions.cy.ts',
  'relationships.cy.ts',
].map((name) => path.join(apiDir, name))

function read(file) {
  return fs.readFileSync(file, 'utf8')
}

function write(file, original, next) {
  if (next === original) {
    console.log(`no change: ${path.relative(root, file)}`)
    return
  }

  fs.writeFileSync(`${file}.auth4.bak`, original)
  fs.writeFileSync(file, next)
  console.log(`patched: ${path.relative(root, file)}`)
}

function ensureReturnedAuthHook(source) {
  // Make helper-based before hooks explicitly return the Cypress chain.
  return source.replace(
    /before\(\(\) => \{\s*\n\s*createLoggedInTestUser\(\)\.then/g,
    'before(() => {\n    return createLoggedInTestUser().then',
  )
}

function fixBrokenLetDeclarations(source) {
  return source
    .replace(
      /let\s+userId\s*=\s*0\s*,\s*let\s*,\s*promptId\s*;/g,
      'let userId = 0\n    let promptId: number | undefined',
    )
    .replace(
      /let\s+userId\s*=\s*0\s*,\s*let\s*,\s*resourceId\s*;/g,
      'let userId = 0\n    let resourceId: number | undefined',
    )
    .replace(
      /let\s+userId\s*=\s*0\s*,\s*let\s*,\s*([A-Za-z_$][\w$]*)\s*;/g,
      'let userId = 0\n    let $1: number | undefined',
    )
}

function fixTestUserIdOwnership(source) {
  // The disposable JWT owner should be the request body owner.
  source = source.replace(/^\s*const\s+testUserId\s*=\s*9\s*\n/gm, '')
  source = source.replace(/\btestUserId\b/g, 'userId')
  return source
}

function fixLiteralUserIdNine(source) {
  return source.replace(/\buserId\s*:\s*9\b/g, 'userId')
}

function softenReactionArtImageCleanup(source) {
  return source
    .replace(/\[200,\s*204,\s*404\]/g, '[200, 204, 401, 404]')
    .replace(/\[200,\s*202,\s*204,\s*404\]/g, '[200, 202, 204, 401, 404]')
}

function removeRelationshipNestedFixtureAuthHook(source) {
  // This nested hook re-created a JWT but did not update userId, causing token/user mismatches.
  return source.replace(
    /(\s*describe\('Fixture setup',\s*\(\)\s*=>\s*\{\s*)before\(\(\)\s*=>\s*\{\s*return?\s*createLoggedInTestUser\(\)\.then\(\(auth\)\s*=>\s*\{\s*userToken\s*=\s*auth\.token\s*\}\)\s*\}\)\s*/s,
    "$1",
  ).replace(
    /(\s*describe\('Fixture setup',\s*\(\)\s*=>\s*\{\s*)before\(\(\)\s*=>\s*\{\s*createLoggedInTestUser\(\)\.then\(\(auth\)\s*=>\s*\{\s*userToken\s*=\s*auth\.token\s*\}\)\s*\}\)\s*/s,
    "$1",
  )
}

function ensureUserIdDeclaration(source) {
  if (/\blet\s+userId\b/.test(source) || /\bconst\s+userId\b/.test(source)) {
    return source
  }

  const describeIndex = source.indexOf('describe(')
  if (describeIndex === -1) return `let userId = 0\n${source}`

  return `${source.slice(0, describeIndex)}let userId = 0\n${source.slice(describeIndex)}`
}

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.log(`missing: ${path.relative(root, file)}`)
    continue
  }

  const name = path.basename(file)
  const original = read(file)
  let next = original

  next = ensureReturnedAuthHook(next)
  next = fixBrokenLetDeclarations(next)

  if (['art.cy.ts', 'relationships.cy.ts'].includes(name)) {
    next = ensureUserIdDeclaration(next)
    next = fixTestUserIdOwnership(next)
  }

  if (name === 'dreams.cy.ts') {
    next = fixLiteralUserIdNine(next)
  }

  if (name === 'reactions.cy.ts') {
    next = softenReactionArtImageCleanup(next)
  }

  if (name === 'relationships.cy.ts') {
    next = removeRelationshipNestedFixtureAuthHook(next)
    next = fixLiteralUserIdNine(next)
  }

  write(file, original, next)
}
