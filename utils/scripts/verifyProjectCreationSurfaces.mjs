// /utils/scripts/verifyProjectCreationSurfaces.mjs
//
// kind-robots/t-063: direct Project creation call sites are cross-repo product
// surfaces documented in conductor/projects/kind-robots/PROJECT-CREATION.md.
// Keep this local manifest in lockstep with that document so a new direct create
// path cannot quietly appear without an explicit surface review.

import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const contractPath = join(repoRoot, 'utils/contracts/project-creation-call-sites.json')
const contract = JSON.parse(readFileSync(contractPath, 'utf8'))
const sourceRoots = ['server', 'scripts']
const sourceExtensions = new Set(['.ts', '.js', '.mjs', '.cjs'])
const directCreatePattern = /\.\s*project\s*\.\s*create\s*\(/g

function stripCommentsAndStrings(source) {
  let output = ''
  let state = 'code'

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]
    const next = source[index + 1]

    if (state === 'code') {
      if (char === '/' && next === '/') {
        state = 'line-comment'
        output += '  '
        index += 1
      } else if (char === '/' && next === '*') {
        state = 'block-comment'
        output += '  '
        index += 1
      } else if (char === "'") {
        state = 'single-quote'
        output += ' '
      } else if (char === '"') {
        state = 'double-quote'
        output += ' '
      } else if (char === '`') {
        state = 'template'
        output += ' '
      } else {
        output += char
      }
      continue
    }

    if (state === 'line-comment') {
      if (char === '\n') {
        state = 'code'
        output += '\n'
      } else {
        output += ' '
      }
      continue
    }

    if (state === 'block-comment') {
      if (char === '*' && next === '/') {
        state = 'code'
        output += '  '
        index += 1
      } else {
        output += char === '\n' ? '\n' : ' '
      }
      continue
    }

    const closingQuote =
      state === 'single-quote' ? "'" : state === 'double-quote' ? '"' : '`'

    if (char === '\\') {
      output += ' '
      if (next !== undefined) {
        output += next === '\n' ? '\n' : ' '
        index += 1
      }
    } else if (char === closingQuote) {
      state = 'code'
      output += ' '
    } else {
      output += char === '\n' ? '\n' : ' '
    }
  }

  return output
}

function findSourceFiles(root) {
  if (!statSync(root).isDirectory()) return []

  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name)
    if (entry.isDirectory()) return findSourceFiles(path)
    if (!entry.isFile()) return []
    if (entry.name.endsWith('.d.ts')) return []
    return sourceExtensions.has(extname(entry.name)) ? [path] : []
  })
}

function findDirectProjectCreateSites() {
  const matches = new Set()

  for (const sourceRoot of sourceRoots) {
    for (const path of findSourceFiles(join(repoRoot, sourceRoot))) {
      const codeOnly = stripCommentsAndStrings(readFileSync(path, 'utf8'))
      directCreatePattern.lastIndex = 0
      if (directCreatePattern.test(codeOnly)) {
        matches.add(relative(repoRoot, path).replaceAll('\\', '/'))
      }
    }
  }

  return [...matches].sort()
}

function runSelfTest() {
  const sample = `
    await tx.project.create({ data: {} })
    // await prisma.project.create({ data: {} })
    /* database.project.create({ data: {} }) */
    const example = "prisma.project.create("
    const template = \`tx.project.create(\`
    const project_create = () => undefined
  `
  const codeOnly = stripCommentsAndStrings(sample)
  assert.equal(codeOnly.match(directCreatePattern)?.length ?? 0, 1)
}

if (process.argv.includes('--self-test')) {
  runSelfTest()
  console.log('Project creation surface scanner self-test passed.')
  process.exit(0)
}

assert.equal(
  typeof contract.conductorDocument,
  'string',
  'project-creation-call-sites.json must name the owning Conductor document.',
)
assert.ok(
  Array.isArray(contract.directCallSites),
  'project-creation-call-sites.json must contain directCallSites.',
)

const documented = [...new Set(contract.directCallSites)].sort()
const actual = findDirectProjectCreateSites()
const undocumented = actual.filter((path) => !documented.includes(path))
const stale = documented.filter((path) => !actual.includes(path))

if (undocumented.length || stale.length) {
  const details = []
  if (undocumented.length) {
    details.push(`Undocumented direct Project creation call sites:\n- ${undocumented.join('\n- ')}`)
  }
  if (stale.length) {
    details.push(`Manifest entries no longer containing a direct Project create call:\n- ${stale.join('\n- ')}`)
  }

  throw new Error(
    `${details.join('\n\n')}\n\nReview the surface change, update ${contract.conductorDocument} in Conductor, and update utils/contracts/project-creation-call-sites.json in the Kind Robots implementation.`,
  )
}

console.log(
  `Project creation surfaces verified: ${actual.length} direct call sites match the local mirror of ${contract.conductorDocument}.`,
)
