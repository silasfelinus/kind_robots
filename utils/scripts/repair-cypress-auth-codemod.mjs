#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const apiDir = path.join(root, 'cypress/e2e/api')

const helperImport =
  "import { createLoggedInTestUser } from '../../support/api-auth'"

const marker = 'Auth migration: fresh disposable JWT user'

const files = fs
  .readdirSync(apiDir)
  .filter((name) => name.endsWith('.cy.ts'))
  .map((name) => path.join(apiDir, name))

function insertImport(source) {
  if (source.includes("../../support/api-auth")) return source

  const imports = [...source.matchAll(/^import .*$/gm)]
  if (!imports.length) return `${helperImport}\n${source}`

  const last = imports.at(-1)
  const insertAt = last.index + last[0].length

  return `${source.slice(0, insertAt)}\n${helperImport}${source.slice(insertAt)}`
}

function findHookEnd(source, startIndex) {
  const beforeIndex = source.indexOf('before(', startIndex)
  if (beforeIndex === -1) return -1

  const braceStart = source.indexOf('{', beforeIndex)
  if (braceStart === -1) return -1

  let depth = 0

  for (let i = braceStart; i < source.length; i += 1) {
    const char = source[i]

    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1

      if (depth === 0) {
        let end = i + 1

        while (end < source.length && /[\s)]/.test(source[end])) {
          end += 1
          if (source[end - 1] === '\n') break
        }

        return end
      }
    }
  }

  return -1
}

function removeExistingAuthHook(source) {
  const markerIndex = source.indexOf(marker)
  if (markerIndex === -1) return source

  const lineStart = source.lastIndexOf('\n', markerIndex)
  const start = lineStart === -1 ? markerIndex : lineStart + 1
  const end = findHookEnd(source, markerIndex)

  if (end === -1) return source

  return `${source.slice(0, start)}${source.slice(end)}`
}

function buildTopAuthHook(source) {
  const assignments = []

  if (/\buserToken\b/.test(source)) assignments.push('      userToken = auth.token')
  if (/\buserA_apiKey\b/.test(source)) assignments.push('      userA_apiKey = auth.token')
  if (/\blet\s+userId\b/.test(source)) assignments.push('      userId = auth.id')
  if (/\blet\s+actorUserId\b/.test(source)) assignments.push('      actorUserId = auth.id')

  const needsRelated = /\blet\s+relatedUserId\b/.test(source)
  const needsTarget = /\blet\s+targetUserId\b/.test(source)

  let secondUser = ''
  if (needsRelated || needsTarget) {
    const secondAssignments = []

    if (needsRelated) secondAssignments.push('        relatedUserId = other.id')
    if (needsTarget) secondAssignments.push('        targetUserId = other.id')

    secondUser = `

      return createLoggedInTestUser().then((other) => {
${secondAssignments.join('\n')}
      })`
  }

  if (!assignments.length && !secondUser) return ''

  return `

  // ${marker}
  before(() => {
    createLoggedInTestUser().then((auth) => {
${assignments.join('\n')}${secondUser}
    })
  })
`
}

function insertTopAuthHook(source) {
  if (source.includes(marker)) return source

  const hook = buildTopAuthHook(source)
  if (!hook) return source

  const describeIndex = source.indexOf('describe(')
  if (describeIndex === -1) return source

  const openBrace = source.indexOf('{', describeIndex)
  if (openBrace === -1) return source

  return `${source.slice(0, openBrace + 1)}${hook}${source.slice(openBrace + 1)}`
}

function fixBrokenLetDeclarations(source) {
  return source
    .replace(
      /\blet\s+userId\s*=\s*0\s*,\s*let\s*,\s*([A-Za-z_$][\w$]*)\s*;/g,
      'let userId = 0\nlet $1: number | null = null',
    )
    .replace(
      /\blet\s+userId\s*=\s*0\s*,\s*let\s+([A-Za-z_$][\w$]*)\s*;/g,
      'let userId = 0\nlet $1: number | null = null',
    )
    .replace(
      /\blet\s+userToken\s*=\s*(['"`][^'"`]*['"`])\s*,\s*let\s*,\s*([A-Za-z_$][\w$]*)\s*;/g,
      'let userToken = $1\nlet $2: number | null = null',
    )
}

function fixEmptyEnvBlocks(source) {
  return source
    .replace(/cy\.env\(\s*\[\s*\]\s*\)\.then\(\(\s*env\s*\)\s*=>\s*\{/g, 'cy.wrap(null).then(() => {')
    .replace(/cy\.env\(\s*\[\s*\]\s*\)\.then\(\(\s*\)\s*=>\s*\{/g, 'cy.wrap(null).then(() => {')
}

function ensureVariables(source) {
  const declarations = []

  if (/\buserToken\b/.test(source) && !/\blet\s+userToken\b/.test(source)) {
    source = source.replace(/\bconst\s+userToken\b/g, 'let userToken')
    if (!/\blet\s+userToken\b/.test(source)) declarations.push("let userToken = ''")
  }

  if (/\buserA_apiKey\b/.test(source) && !/\blet\s+userA_apiKey\b/.test(source)) {
    source = source.replace(/\bconst\s+userA_apiKey\b/g, 'let userA_apiKey')
    if (!/\blet\s+userA_apiKey\b/.test(source)) declarations.push("let userA_apiKey = ''")
  }

  if (/\buserId\b/.test(source) && !/\blet\s+userId\b/.test(source) && !/\bconst\s+userId\b/.test(source)) {
    declarations.push('let userId = 0')
  }

  if (/\bactorUserId\b/.test(source) && !/\blet\s+actorUserId\b/.test(source)) {
    source = source.replace(/\bconst\s+actorUserId\b/g, 'let actorUserId')
    if (!/\blet\s+actorUserId\b/.test(source)) declarations.push('let actorUserId = 0')
  }

  if (/\brelatedUserId\b/.test(source) && !/\blet\s+relatedUserId\b/.test(source)) {
    source = source.replace(/\bconst\s+relatedUserId\b/g, 'let relatedUserId')
    if (!/\blet\s+relatedUserId\b/.test(source)) declarations.push('let relatedUserId = 0')
  }

  if (/\btargetUserId\b/.test(source) && !/\blet\s+targetUserId\b/.test(source)) {
    source = source.replace(/\bconst\s+targetUserId\b/g, 'let targetUserId')
    if (!/\blet\s+targetUserId\b/.test(source)) declarations.push('let targetUserId = 0')
  }

  if (!declarations.length) return source

  const describeIndex = source.indexOf('describe(')
  if (describeIndex === -1) return `${declarations.join('\n')}\n${source}`

  return `${source.slice(0, describeIndex)}${declarations.join('\n')}\n${source.slice(describeIndex)}`
}

function fixHardcodedUserIdNine(source) {
  return source
    .replace(/\bconst\s+userId\s*=\s*9\b/g, 'let userId = 0')
    .replace(/\blet\s+userId\s*=\s*9\b/g, 'let userId = 0')
    .replace(/\buserId\s*:\s*9\b/g, 'userId')
    .replace(/expect\(([^)\n]*userId[^)\n]*)\)\.to\.eq\(9\)/g, 'expect($1).to.eq(userId)')
    .replace(/expect\(([^)\n]*userId[^)\n]*)\)\.to\.equal\(9\)/g, 'expect($1).to.eq(userId)')
}

function fixRelationshipFixtureOwnership(relative, source) {
  if (!relative.endsWith('relationships.cy.ts')) return source

  if (!/\blet\s+userId\b/.test(source) && !/\bconst\s+userId\b/.test(source)) {
    const describeIndex = source.indexOf('describe(')
    source =
      describeIndex === -1
        ? `let userId = 0\n${source}`
        : `${source.slice(0, describeIndex)}let userId = 0\n${source.slice(describeIndex)}`
  }

  // Relationship fixture creation is owner-sensitive now. Any literal userId in this
  // contract file should use the logged-in disposable owner unless a test explicitly
  // uses a non-userId invalid id field.
  return source.replace(/\buserId\s*:\s*(?:1|9|10|[1-9][0-9]*)\b/g, 'userId')
}

function cleanUserTokenEnvReads(source) {
  source = source.replace(/cy\.env\(\[([^\]]*)\]\)/g, (match, raw) => {
    const items = raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .filter((item) => !/['"`]USER_TOKEN['"`]/.test(item))

    return `cy.env([${items.join(', ')}])`
  })

  source = source
    .replace(/^\s*userToken\s*=\s*String\(env\.USER_TOKEN[^\n]*\n?/gm, '')
    .replace(/^\s*userA_apiKey\s*=\s*String\(env\.USER_TOKEN[^\n]*\n?/gm, '')
    .replace(/\n\s*expect\(\s*userToken\s*,[\s\S]*?\.empty\s*;?/g, '\n')
    .replace(/\n\s*expect\(\s*userA_apiKey\s*,[\s\S]*?\.empty\s*;?/g, '\n')

  return source
}

function patchFile(filePath) {
  const relative = path.relative(root, filePath)
  const original = fs.readFileSync(filePath, 'utf8')

  let next = original

  next = insertImport(next)
  next = cleanUserTokenEnvReads(next)
  next = fixBrokenLetDeclarations(next)
  next = fixEmptyEnvBlocks(next)
  next = fixHardcodedUserIdNine(next)
  next = fixRelationshipFixtureOwnership(relative, next)
  next = ensureVariables(next)

  // Important: move auth hook to the TOP of describe, before fixture setup hooks.
  next = removeExistingAuthHook(next)
  next = insertTopAuthHook(next)

  if (next === original) return false

  fs.writeFileSync(`${filePath}.auth3.bak`, original)
  fs.writeFileSync(filePath, next)
  console.log(`patched: ${relative}`)

  return true
}

let changed = 0

for (const file of files) {
  if (patchFile(file)) changed += 1
}

console.log(`\nChanged ${changed} file(s).`)
console.log('Backups written as *.auth3.bak')
