// /utils/scripts/verifyConductorApiAuthGuards.ts
//
// Regression guard (conductor-app/t-011, kaizen from the kind_robots PR #70
// security fix): every write endpoint under server/api/conductor/ must call
// a recognized auth guard before doing work, so a missing guard on a new
// endpoint is caught in CI instead of by manual audit.
//
// Recognized guards:
//   - requireApiUser / requireAdminApiUser / requireMachineUser
//     (server/utils/authGuard.ts)
//   - validateApiKey(...) paired with a userIsAdmin(...) check
//     (server/utils/validateKey.ts + server/utils/authUser.ts) -- the older
//     pattern used by art-request.post.ts and curate-request.post.ts. It is
//     functionally equivalent (same JWT / user-api-key / beta-admin-token
//     resolution as requireAdminApiUser) so it is accepted, not flagged.
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const CONDUCTOR_API_DIR = join(repositoryRoot, 'server/api/conductor')
const WRITE_METHOD_SUFFIXES = ['.post.ts', '.put.ts', '.patch.ts', '.delete.ts']

const AUTH_GUARD_CALL_PATTERN =
  /\b(?:requireApiUser|requireAdminApiUser|requireMachineUser)\s*\(/
const MANUAL_KEY_CHECK_PATTERN = /\bvalidateApiKey\s*\(/
const MANUAL_ADMIN_CHECK_PATTERN = /\buserIsAdmin\s*\(/

export function listConductorWriteEndpoints(directory: string): string[] {
  let entries: import('node:fs').Dirent[]
  try {
    entries = readdirSync(directory, { withFileTypes: true })
  } catch {
    return []
  }

  return entries
    .filter(
      (entry) =>
        entry.isFile() &&
        WRITE_METHOD_SUFFIXES.some((suffix) => entry.name.endsWith(suffix)),
    )
    .map((entry) => join(directory, entry.name))
    .sort()
}

export function fileHasRecognizedAuthGuard(content: string): boolean {
  if (AUTH_GUARD_CALL_PATTERN.test(content)) return true
  return (
    MANUAL_KEY_CHECK_PATTERN.test(content) &&
    MANUAL_ADMIN_CHECK_PATTERN.test(content)
  )
}

export function findUnguardedConductorWriteEndpoints(
  directory: string,
): string[] {
  const files = listConductorWriteEndpoints(directory)
  const unguarded: string[] = []

  for (const file of files) {
    const content = readFileSync(file, 'utf8')
    if (!fileHasRecognizedAuthGuard(content)) {
      unguarded.push(relative(repositoryRoot, file))
    }
  }

  return unguarded
}

function main(): void {
  const files = listConductorWriteEndpoints(CONDUCTOR_API_DIR)
  const unguarded = findUnguardedConductorWriteEndpoints(CONDUCTOR_API_DIR)

  if (unguarded.length) {
    console.error(
      `Conductor API auth-guard contract failed: ${unguarded.length} write ` +
        'endpoint(s) call none of requireApiUser / requireAdminApiUser / ' +
        'requireMachineUser (server/utils/authGuard.ts), nor the ' +
        'validateApiKey + userIsAdmin pattern:',
    )
    for (const file of unguarded) console.error(`- ${file}`)
    process.exitCode = 1
    return
  }

  console.log(
    `Conductor API auth-guard contract passed: ${files.length} write ` +
      'endpoint(s) checked under server/api/conductor/, all call a ' +
      'recognized auth guard.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
