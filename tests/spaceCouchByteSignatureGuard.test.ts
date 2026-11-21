import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import test from 'node:test'
import ts from 'typescript'

const ROOT = process.cwd()
const SCAN_DIRS = ['server', 'utils']
const ALLOWED = new Set<string>([])
const BYTE_CONSTRUCTORS = new Set([
  'Buffer.from',
  'Uint8Array.from',
  'TextEncoder.encode',
])

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      return sourceFiles(path)
    }
    return /\.[cm]?[jt]sx?$/.test(entry.name) ? [path] : []
  })
}

export function findDoubleEscapedSignatures(
  source: string,
  filename: string,
): string[] {
  const file = ts.createSourceFile(
    filename,
    source,
    ts.ScriptTarget.Latest,
    true,
  )
  const errors: string[] = []

  function visit(node: ts.Node): void {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const raw = node.getText(file)
      if (/\\\\x[0-9a-fA-F]{2}/.test(raw)) {
        let parent: ts.Node | undefined = node.parent
        let signatureContext = false
        while (parent && parent !== file) {
          if (ts.isCallExpression(parent)) {
            const callee = parent.expression.getText(file)
            if (BYTE_CONSTRUCTORS.has(callee)) {
              signatureContext = true
              break
            }
          }
          if (ts.isVariableDeclaration(parent)) {
            signatureContext ||= /signature|magic|header|bytes/i.test(
              parent.name.getText(file),
            )
          }
          parent = parent.parent
        }
        if (signatureContext) {
          const line =
            file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1
          const location = `${filename}:${line}`
          if (!ALLOWED.has(location)) {
            errors.push(location)
          }
        }
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(file)
  return errors
}

test('signature byte literals contain no double-escaped hex bytes', () => {
  const failures = SCAN_DIRS.flatMap((dir) =>
    sourceFiles(join(ROOT, dir)).flatMap((path) =>
      findDoubleEscapedSignatures(
        readFileSync(path, 'utf8'),
        relative(ROOT, path).replaceAll('\\', '/'),
      ),
    ),
  )
  assert.deepEqual(failures, [])
})

test('signature guard distinguishes escaped bytes from harmless text', () => {
  const bad = String.raw`const magic = Buffer.from('\\x1a')`
  const good = String.raw`const magic = Buffer.from('\x1a')`
  const ordinary = String.raw`const description = '\\x1a'`
  assert.deepEqual(findDoubleEscapedSignatures(bad, 'fixture.ts'), [
    'fixture.ts:1',
  ])
  assert.deepEqual(findDoubleEscapedSignatures(good, 'fixture.ts'), [])
  assert.deepEqual(findDoubleEscapedSignatures(ordinary, 'fixture.ts'), [])
  const nested = String.raw`const payload = wrap(Buffer.from('\\\\x89'))`
  assert.deepEqual(findDoubleEscapedSignatures(nested, 'nested.ts'), [
    'nested.ts:1',
  ])
  const named = String.raw`const signature = wrap('\\\\x50')`
  assert.deepEqual(findDoubleEscapedSignatures(named, 'named.ts'), [
    'named.ts:1',
  ])
})
