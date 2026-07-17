#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const targets = [
  'cypress/e2e/api/art.cy.ts',
  'cypress/e2e/api/butterflies.cy.ts',
  'cypress/e2e/api/dreams.cy.ts',
  'cypress/e2e/api/friendships.cy.ts',
  'cypress/e2e/api/icons.cy.ts',
  'cypress/e2e/api/prompts.cy.ts',
  'cypress/e2e/api/reactions.cy.ts',
  'cypress/e2e/api/relationships.cy.ts',
  'cypress/e2e/api/resources.cy.ts',
  'cypress/e2e/api/rewards.cy.ts',
  'cypress/e2e/api/scenario.cy.ts',
  'cypress/e2e/api/servers.cy.ts',
  'cypress/e2e/api/sheets.cy.ts',
  'cypress/e2e/api/social.cy.ts',
  'cypress/e2e/api/themes.cy.ts',
]

const helperImport = `import { createLoggedInTestUser } from '../../support/api-auth'`

function insertImport(source) {
  if (source.includes(`../../support/api-auth`)) return source

  const importMatches = [...source.matchAll(/^import .*$/gm)]
  if (!importMatches.length) return `${helperImport}\n${source}`

  const last = importMatches.at(-1)
  const insertAt = last.index + last[0].length

  return `${source.slice(0, insertAt)}\n${helperImport}${source.slice(insertAt)}`
}

function ensureUserTokenVariable(source) {
  if (/\blet\s+userToken\b/.test(source)) return source

  source = source.replace(/\bconst\s+userToken\s*=/, 'let userToken =')
  if (/\blet\s+userToken\b/.test(source)) return source

  const describeIndex = source.indexOf('describe(')
  if (describeIndex === -1) return source

  return `${source.slice(0, describeIndex)}let userToken = ''\n${source.slice(describeIndex)}`
}

function ensureUserIdVariable(source) {
  source = source.replace(/\bconst\s+userId\s*=\s*9\b/g, 'let userId = 0')
  source = source.replace(/\blet\s+userId\s*=\s*9\b/g, 'let userId = 0')

  if (/\blet\s+userId\b/.test(source)) return source
  if (!/\buserId\s*:\s*9\b/.test(source)) return source

  const tokenMatch = source.match(
    /\blet\s+userToken\s*=\s*['"`][^'"`]*['"`]\s*/,
  )
  if (tokenMatch?.index !== undefined) {
    const insertAt = tokenMatch.index + tokenMatch[0].length
    return `${source.slice(0, insertAt)}\nlet userId = 0${source.slice(insertAt)}`
  }

  const describeIndex = source.indexOf('describe(')
  if (describeIndex === -1) return source

  return `${source.slice(0, describeIndex)}let userId = 0\n${source.slice(describeIndex)}`
}

function replaceHardcodedUserId(source) {
  return source
    .replace(/\buserId\s*:\s*9\b/g, 'userId')
    .replace(/\buserId\s*=\s*9\b/g, 'userId = 0')
}

function injectAuthHook(source) {
  if (source.includes('createLoggedInTestUser().then((auth)')) return source

  const firstTestIndex = source.search(/\n\s*(it|specify)\s*\(/)
  if (firstTestIndex === -1) return source

  const assigns = [`    userToken = auth.token`]

  if (/\blet\s+userId\b/.test(source)) {
    assigns.push(`    userId = auth.id`)
  }

  const hook = `
  before(() => {
    createLoggedInTestUser().then((auth) => {
${assigns.join('\n')}
    })
  })

`

  return `${source.slice(0, firstTestIndex)}${hook}${source.slice(firstTestIndex)}`
}

function stripUserTokenFromEnvAssert(source) {
  // Many old specs still read USER_TOKEN from cy.env(). Leaving that read is harmless
  // only if they do not assert it is non-empty before our injected login hook runs.
  return source
    .replace(
      /expect\(userToken,\s*['"`]USER_TOKEN['"`]\)\.to\.be\.a\(['"`]string['"`]\)\.and\.not\.be\.empty;?\n?/g,
      '',
    )
    .replace(
      /expect\(userToken\)\.to\.be\.a\(['"`]string['"`]\)\.and\.not\.be\.empty;?\n?/g,
      '',
    )
}

function patchFile(relativePath) {
  const fullPath = path.join(root, relativePath)

  if (!fs.existsSync(fullPath)) {
    console.warn(`skip missing: ${relativePath}`)
    return false
  }

  const original = fs.readFileSync(fullPath, 'utf8')

  if (
    !original.includes('USER_TOKEN') &&
    !original.includes('userId: 9') &&
    original.includes('createLoggedInTestUser')
  ) {
    console.log(`skip already migrated: ${relativePath}`)
    return false
  }

  let next = original
  next = insertImport(next)
  next = ensureUserTokenVariable(next)
  next = ensureUserIdVariable(next)
  next = replaceHardcodedUserId(next)
  next = stripUserTokenFromEnvAssert(next)
  next = injectAuthHook(next)

  if (next === original) {
    console.log(`no change: ${relativePath}`)
    return false
  }

  fs.writeFileSync(`${fullPath}.bak`, original)
  fs.writeFileSync(fullPath, next)
  console.log(`patched: ${relativePath}`)
  return true
}

let changed = 0

for (const target of targets) {
  if (patchFile(target)) changed += 1
}

console.log(`\nChanged ${changed} file(s). Backups written as *.bak.`)
console.log(
  'Next: run npx cypress run --spec cypress/e2e/api/<spec>.cy.ts on affected specs.',
)
