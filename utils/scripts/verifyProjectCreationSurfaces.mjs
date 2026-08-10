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
import ts from 'typescript'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const contractPath = join(repoRoot, 'utils/contracts/project-creation-call-sites.json')
const contract = JSON.parse(readFileSync(contractPath, 'utf8'))
const sourceRoots = ['server', 'scripts']
const sourceExtensions = new Set(['.ts', '.js', '.mjs', '.cjs'])

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

function scriptKindFor(path) {
  return extname(path) === '.ts' ? ts.ScriptKind.TS : ts.ScriptKind.JS
}

function countDirectProjectCreateCalls(source, filename = 'contract.ts') {
  const sourceFile = ts.createSourceFile(
    filename,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKindFor(filename),
  )
  let count = 0

  function visit(node) {
    if (ts.isCallExpression(node)) {
      const createAccess = node.expression
      if (
        ts.isPropertyAccessExpression(createAccess) &&
        createAccess.name.text === 'create'
      ) {
        const projectAccess = createAccess.expression
        if (
          ts.isPropertyAccessExpression(projectAccess) &&
          projectAccess.name.text === 'project'
        ) {
          count += 1
        }
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return count
}

function findDirectProjectCreateSites() {
  const matches = new Set()

  for (const sourceRoot of sourceRoots) {
    for (const path of findSourceFiles(join(repoRoot, sourceRoot))) {
      const source = readFileSync(path, 'utf8')
      if (countDirectProjectCreateCalls(source, path) > 0) {
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
    const template = \`tx.project.create(\${'not code'})\`
    const project_create = () => undefined
  `
  assert.equal(countDirectProjectCreateCalls(sample), 1)
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
