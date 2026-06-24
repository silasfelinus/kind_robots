#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const apiDir = path.join(root, 'cypress/e2e/api')
const backupDir = path.join(
  root,
  '.migration-backups',
  `cypress-api-auth-${Date.now()}`,
)

const helperImport =
  "import { createLoggedInTestUser } from '../../support/api-auth'"

const files = fs
  .readdirSync(apiDir)
  .filter((name) => name.endsWith('.cy.ts'))
  .map((name) => path.join(apiDir, name))

function moveBakFiles() {
  const bakFiles = fs
    .readdirSync(apiDir)
    .filter((name) => name.endsWith('.cy.ts.bak'))

  if (!bakFiles.length) return

  fs.mkdirSync(backupDir, { recursive: true })

  for (const name of bakFiles) {
    fs.renameSync(path.join(apiDir, name), path.join(backupDir, name))
    console.log(`moved backup: cypress/e2e/api/${name}`)
  }
}

function insertImport(source) {
  if (source.includes("../../support/api-auth")) return source

  const imports = [...source.matchAll(/^import .*$/gm)]
  if (!imports.length) return `${helperImport}\n${source}`

  const last = imports.at(-1)
  const insertAt = last.index + last[0].length

  return `${source.slice(0, insertAt)}\n${helperImport}${source.slice(insertAt)}`
}

function insertBeforeDescribe(source, text) {
  const index = source.indexOf('describe(')
  if (index === -1) return `${text}\n${source}`

  return `${source.slice(0, index)}${text}\n${source.slice(index)}`
}

function removeUserTokenFromCyEnvArrays(source) {
  return source.replace(/cy\.env\(\[([^\]]*)\]\)/g, (match, rawItems) => {
    const items = rawItems
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .filter((item) => !/['"`]USER_TOKEN['"`]/.test(item))

    return `cy.env([${items.join(', ')}])`
  })
}

function removeOldUserTokenAssignments(source) {
  return source
    .replace(/^\s*userToken\s*=\s*String\(env\.USER_TOKEN[^\n]*\n?/gm, '')
    .replace(/^\s*userA_apiKey\s*=\s*String\(env\.USER_TOKEN[^\n]*\n?/gm, '')
    .replace(
      /\n\s*expect\(\s*userToken\s*,[\s\S]*?\.empty\s*;?/g,
      '\n',
    )
    .replace(
      /\n\s*expect\(\s*userA_apiKey\s*,[\s\S]*?\.empty\s*;?/g,
      '\n',
    )
}

function normalizeUserId(source) {
  return source
    .replace(/\bconst\s+userId\s*=\s*9\b/g, 'let userId = 0')
    .replace(/\blet\s+userId\s*=\s*9\b/g, 'let userId = 0')
    .replace(/\buserId\s*:\s*9\b/g, 'userId')
}

function ensureVariables(source) {
  const declarations = []

  const needsUserToken =
    /\buserToken\b/.test(source) || /Bearer \$\{userToken\}/.test(source)
  const needsUserAApiKey = /\buserA_apiKey\b/.test(source)
  const needsUserId = /\buserId\b/.test(source)
  const needsActorUserId = /\bactorUserId\b/.test(source)
  const needsRelatedUserId = /\brelatedUserId\b/.test(source)
  const needsTargetUserId = /\btargetUserId\b/.test(source)

  if (needsUserToken && !/\blet\s+userToken\b/.test(source)) {
    source = source.replace(/\bconst\s+userToken\b/g, 'let userToken')
    if (!/\blet\s+userToken\b/.test(source)) declarations.push("let userToken = ''")
  }

  if (needsUserAApiKey && !/\blet\s+userA_apiKey\b/.test(source)) {
    source = source.replace(/\bconst\s+userA_apiKey\b/g, 'let userA_apiKey')
    if (!/\blet\s+userA_apiKey\b/.test(source)) {
      declarations.push("let userA_apiKey = ''")
    }
  }

  if (needsUserId && !/\blet\s+userId\b/.test(source) && !/\bconst\s+userId\b/.test(source)) {
    declarations.push('let userId = 0')
  }

  if (needsActorUserId && !/\blet\s+actorUserId\b/.test(source)) {
    source = source.replace(/\bconst\s+actorUserId\b/g, 'let actorUserId')
    if (!/\blet\s+actorUserId\b/.test(source)) declarations.push('let actorUserId = 0')
  }

  if (needsRelatedUserId && !/\blet\s+relatedUserId\b/.test(source)) {
    source = source.replace(/\bconst\s+relatedUserId\b/g, 'let relatedUserId')
    if (!/\blet\s+relatedUserId\b/.test(source)) declarations.push('let relatedUserId = 0')
  }

  if (needsTargetUserId && !/\blet\s+targetUserId\b/.test(source)) {
    source = source.replace(/\bconst\s+targetUserId\b/g, 'let targetUserId')
    if (!/\blet\s+targetUserId\b/.test(source)) declarations.push('let targetUserId = 0')
  }

  if (!declarations.length) return source

  return insertBeforeDescribe(source, `${declarations.join('\n')}\n`)
}

function needsAuthHook(source) {
  return (
    /\buserToken\b/.test(source) ||
    /\buserA_apiKey\b/.test(source) ||
    /\buserId\b/.test(source) ||
    /\bactorUserId\b/.test(source) ||
    /\brelatedUserId\b/.test(source) ||
    /\btargetUserId\b/.test(source)
  )
}

function insertFreshAuthHook(source) {
  const marker = 'Auth migration: fresh disposable JWT user'
  if (source.includes(marker)) return source
  if (!needsAuthHook(source)) return source

  const assignments = []

  if (/\buserToken\b/.test(source)) assignments.push('      userToken = auth.token')
  if (/\buserA_apiKey\b/.test(source)) assignments.push('      userA_apiKey = auth.token')
  if (/\blet\s+userId\b/.test(source)) assignments.push('      userId = auth.id')
  if (/\blet\s+actorUserId\b/.test(source)) assignments.push('      actorUserId = auth.id')

  const needsSecondUser =
    /\blet\s+relatedUserId\b/.test(source) || /\blet\s+targetUserId\b/.test(source)

  let secondUserBlock = ''

  if (needsSecondUser) {
    const secondAssignments = []
    if (/\blet\s+relatedUserId\b/.test(source)) {
      secondAssignments.push('        relatedUserId = other.id')
    }
    if (/\blet\s+targetUserId\b/.test(source)) {
      secondAssignments.push('        targetUserId = other.id')
    }

    secondUserBlock = `

      return createLoggedInTestUser().then((other) => {
${secondAssignments.join('\n')}
      })`
  }

  if (!assignments.length && !secondUserBlock) return source

  const hook = `
  // ${marker}
  before(() => {
    createLoggedInTestUser().then((auth) => {
${assignments.join('\n')}${secondUserBlock}
    })
  })

`

  const firstTestIndex = source.search(/\n\s*(it|specify)\s*\(/)
  if (firstTestIndex === -1) return source

  return `${source.slice(0, firstTestIndex)}${hook}${source.slice(firstTestIndex)}`
}

function patchFile(filePath) {
  const relative = path.relative(root, filePath)
  const original = fs.readFileSync(filePath, 'utf8')

  const likelyNeedsWork =
    original.includes('USER_TOKEN') ||
    original.includes('userId: 9') ||
    original.includes('userId = 9') ||
    original.includes('userA_apiKey')

  if (!likelyNeedsWork) return false

  let next = original

  next = insertImport(next)
  next = removeUserTokenFromCyEnvArrays(next)
  next = removeOldUserTokenAssignments(next)
  next = normalizeUserId(next)
  next = ensureVariables(next)
  next = insertFreshAuthHook(next)

  if (next === original) return false

  fs.writeFileSync(`${filePath}.auth2.bak`, original)
  fs.writeFileSync(filePath, next)

  console.log(`patched: ${relative}`)
  return true
}

moveBakFiles()

let changed = 0
for (const file of files) {
  if (patchFile(file)) changed += 1
}

console.log(`\nChanged ${changed} live spec file(s).`)
console.log(`Old .bak files moved to: ${path.relative(root, backupDir)}`)
console.log('Backups for this pass were written as *.auth2.bak next to changed files.')
