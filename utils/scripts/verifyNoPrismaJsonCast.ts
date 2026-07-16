// /utils/scripts/verifyNoPrismaJsonCast.ts
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Regression guard: 12 of the 19 TypeScript errors fixed in kind_robots PR
// #295 were the same shape repeated across 10 files -- code casting a plain
// JS object straight to Prisma.InputJsonValue and assigning it to a Prisma
// field that is actually a String/@db.Text/@db.LongText column in
// prisma/schema.prisma or prisma/model-builder.prisma (this repo deliberately
// stores structured data as serialized JSON text rather than native Json
// columns). Neither schema file declares a native `Json` column today, so
// there is no legitimate call site for this cast anywhere in the codebase --
// the correct pattern is normalizeJson/parseStoredJson
// (server/api/model-builder/runs/index.ts) or a plain JSON.stringify. A new
// call site typechecks fine locally and only breaks once vue-tsc runs
// against the real generated Prisma types, so this catches it at contract-test
// speed instead of waiting for that slower job.
const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const SCAN_EXTENSIONS = ['.ts', '.tsx', '.vue', '.js', '.mjs', '.cjs']
const EXCLUDED_DIRECTORIES = new Set([
  '.git',
  '.nuxt',
  '.output',
  '.vercel',
  'node_modules',
  'dist',
  'coverage',
  'cypress',
  'prisma/generated',
])
// This file documents/references the exact string it scans for -- exclude it
// from its own scan rather than obscuring the pattern to dodge a self-match.
const EXCLUDED_FILES = new Set(['utils/scripts/verifyNoPrismaJsonCast.ts'])

// Matches `as Prisma.InputJsonValue` and `as unknown as Prisma.InputJsonValue`.
const BAD_CAST_PATTERN = /\bas\s+(?:unknown\s+as\s+)?Prisma\.InputJsonValue\b/

function isExcluded(relativePath: string): boolean {
  if (EXCLUDED_FILES.has(relativePath)) return true
  return [...EXCLUDED_DIRECTORIES].some(
    (excluded) =>
      relativePath === excluded || relativePath.startsWith(`${excluded}/`),
  )
}

function listSourceFiles(directory: string): string[] {
  const entries = readdirSync(directory, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const path = join(directory, entry.name)
    const relativePath = relative(repositoryRoot, path)
    if (isExcluded(relativePath)) continue

    if (entry.isDirectory()) {
      files.push(...listSourceFiles(path))
      continue
    }

    if (entry.isFile() && SCAN_EXTENSIONS.some((ext) => path.endsWith(ext))) {
      files.push(path)
    }
  }

  return files
}

function main(): void {
  const files = listSourceFiles(repositoryRoot)
  const errors: string[] = []

  for (const file of files) {
    const relativeFile = relative(repositoryRoot, file)
    const lines = readFileSync(file, 'utf8').split(/\r?\n/)

    lines.forEach((line, index) => {
      if (BAD_CAST_PATTERN.test(line)) {
        errors.push(
          `${relativeFile}:${index + 1}: casts to Prisma.InputJsonValue, but ` +
            'no column in prisma/schema.prisma or prisma/model-builder.prisma ' +
            'is a native Json column -- use normalizeJson/parseStoredJson ' +
            '(server/api/model-builder/runs/index.ts) or JSON.stringify against ' +
            'the String/@db.Text/@db.LongText column instead.',
        )
      }
    })
  }

  if (errors.length) {
    console.error(
      `Prisma JSON-cast contract failed with ${errors.length} error(s):`,
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    `Prisma JSON-cast contract passed: ${files.length} source file(s) checked, ` +
      'no Prisma.InputJsonValue casts found.',
  )
}

main()
