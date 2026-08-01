// /utils/scripts/verifyAdminFlagCasts.ts
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Regression guard for a silent authorization failure.
//
// server/api/art/enqueue.post.ts used to read its admin flag like this:
//
//   const isAdmin = Boolean((gate.user as { isAdmin?: boolean }).isAdmin)
//
// `gate.user` is deliberately narrowed to `{ id: number }` by
// server/utils/comfyGate.ts, so that property never existed and `isAdmin` was
// permanently false. The admin bypass in assertEntityArtAccess
// (server/utils/entityArt.ts) was therefore dead code, and on 2026-08-01 it
// rejected 131 of 1,824 entity-art enqueues by the site owner's own admin
// token with "You cannot edit artwork for this item."
//
// The cast is what made it invisible: `as` ASSERTS a shape rather than reading
// one, so the typechecker had nothing to complain about. A structurally
// identical instance existed at server/api/chats/user/human/[id].get.ts, where
// validateApiKey returns `{ id, Role }` and never `isAdmin`.
//
// Rule: never assert `isAdmin` onto a value. Either the type genuinely carries
// it (AuthGuardResult.isAdmin, ComfyGateResult.isAdmin, TextGateResult.isAdmin,
// AuthUser.isAdmin) and no cast is needed, or it does not — in which case
// derive it from Role through userIsAdmin() in server/utils/authUser.ts.
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
// This file documents the exact pattern it scans for -- exclude it from its own
// scan rather than obscuring the pattern to dodge a self-match.
const EXCLUDED_FILES = new Set(['utils/scripts/verifyAdminFlagCasts.ts'])

// Matches an inline object-type assertion that introduces an `isAdmin` member:
//   as { isAdmin?: boolean }
//   as unknown as { id: number; isAdmin?: boolean }
// Deliberately does NOT match `as AuthUser` / `as AuthGuardResult` -- casting to
// a named type that really declares the field is not this bug.
const BAD_CAST_PATTERN = /\bas\s+(?:unknown\s+as\s+)?\{[^{}]*\bisAdmin\b/

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
          `${relativeFile}:${index + 1}: asserts an inline object type ` +
            'carrying `isAdmin`. The cast cannot make the property exist -- if ' +
            'the value never had it, the check is permanently false and the ' +
            'admin bypass silently dies. Read a declared flag ' +
            '(AuthGuardResult/ComfyGateResult/TextGateResult/AuthUser `.isAdmin`) ' +
            'or derive it with userIsAdmin() from server/utils/authUser.ts.',
        )
      }
    })
  }

  if (errors.length) {
    console.error(
      `Admin-flag cast contract failed with ${errors.length} error(s):`,
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    `Admin-flag cast contract passed: ${files.length} source file(s) checked, ` +
      'no inline `as { ... isAdmin ... }` assertions found.',
  )
}

main()
