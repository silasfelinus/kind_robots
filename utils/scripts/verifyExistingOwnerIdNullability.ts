// /utils/scripts/verifyExistingOwnerIdNullability.ts
//
// Static companion to verifyOwnershipNullability.test.ts (conductor/t-072).
// Scans server/api for a parameter named `existing<Something>UserId` or
// `existing<Something>OwnerId` -- the naming convention this codebase uses
// for "an existing record's owner id, passed in so a patch handler can
// reject ownership reassignment" (server/api/characters/compatibility.ts,
// server/api/resources/compatibility.ts) -- and fails if one is typed as a
// bare `number` instead of `number | null`. The corresponding Prisma scalar
// (Character.userId, Resource.userId, ...) is `Int?` in
// prisma/schema.prisma, so a bare `number` type-checks locally but only
// breaks once vue-tsc runs against the real generated Prisma types
// (conductor/t-069, kind_robots PR #575 / #569).
//
// Deliberately narrow to the `existing...UserId`/`existing...OwnerId` naming
// convention rather than every nullable Int field in the schema -- per
// kind-robots/t-033's discipline, a heuristic this shape-specific stays
// narrow until a second concrete instance justifies broadening; a
// schema-wide nullable-Int scan would false-positive on the many
// `authenticatedUserId`/`callerUserId` parameters that are genuinely
// non-nullable (sourced from the authenticated session, not a DB row).
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')
const SCAN_ROOT = join(repositoryRoot, 'server/api')

const EXCLUDED_DIRECTORIES = new Set(['node_modules'])

// Matches `existingUserId: number` / `existingCharacterOwnerId: number,` but
// not `existingUserId: number | null` (the union is checked separately so
// the error message can distinguish "missing | null" from "not a param at
// all", and so `| null | undefined` etc. still pass).
const PARAM_PATTERN =
  /\bexisting[A-Za-z]*(?:UserId|OwnerId)\s*:\s*number\b/g

function listSourceFiles(directory: string): string[] {
  const entries = readdirSync(directory, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    if (EXCLUDED_DIRECTORIES.has(entry.name)) continue
    const path = join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...listSourceFiles(path))
      continue
    }

    if (entry.isFile() && path.endsWith('.ts')) {
      files.push(path)
    }
  }

  return files
}

function main(): void {
  const files = listSourceFiles(SCAN_ROOT)
  const errors: string[] = []
  let matched = 0

  for (const file of files) {
    const relativeFile = relative(repositoryRoot, file)
    const lines = readFileSync(file, 'utf8').split(/\r?\n/)

    lines.forEach((line, index) => {
      const matches = line.match(PARAM_PATTERN)
      if (!matches) return

      for (const match of matches) {
        matched += 1
        const afterMatch = line.slice(
          line.indexOf(match) + match.length,
        )

        if (!/^\s*\|\s*null\b/.test(afterMatch)) {
          errors.push(
            `${relativeFile}:${index + 1}: "${match.trim()}" is typed as a bare ` +
              'number, but this codebase\'s existing<Owner>Id convention marks a ' +
              'value read from an existing record\'s nullable owner column -- type ' +
              'it `number | null` and narrow at the call site instead (see ' +
              'server/api/characters/compatibility.ts / ' +
              'server/api/resources/compatibility.ts).',
          )
        }
      }
    })
  }

  if (errors.length) {
    console.error(
      `Existing-owner-id nullability contract failed with ${errors.length} error(s):`,
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    `Existing-owner-id nullability contract passed: ${files.length} source file(s) ` +
      `checked, ${matched} existing<Owner>Id parameter(s) all typed \`number | null\`.`,
  )
}

main()
