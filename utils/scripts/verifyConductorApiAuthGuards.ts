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
//     pattern used by art-request.post.ts (curate-request.post.ts used to be
//     a second example but was removed in PR #1244, 2026-08-01, when the
//     curator vision-model pass it fed was retired -- see conductor
//     kind-robots/t-051). It is functionally equivalent (same JWT /
//     user-api-key / beta-admin-token resolution as requireAdminApiUser) so
//     it is accepted, not flagged.
//   - A named signed-link endpoint (SIGNED_LINK_ENDPOINTS below): public on
//     purpose because the caller is an email link, not a signed-in user, and
//     authorized instead by an HMAC signature over exactly one pitch, one
//     vote and an expiry (or, for the inbox, over an expiry alone). It is accepted only while it is listed AND still
//     calls its verifier, so it cannot quietly lose the check.
import { readdirSync, readFileSync } from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const CONDUCTOR_API_DIR = join(repositoryRoot, 'server/api/conductor')
const WRITE_METHOD_SUFFIXES = ['.post.ts', '.put.ts', '.patch.ts', '.delete.ts']

const AUTH_GUARD_CALL_PATTERN =
  /\b(?:requireApiUser|requireAdminApiUser|requireMachineUser)\s*\(/
const MANUAL_KEY_CHECK_PATTERN = /\bvalidateApiKey\s*\(/
const MANUAL_ADMIN_CHECK_PATTERN = /\buserIsAdmin\s*\(/

// File name -> the verifier call that must appear in it.
export const SIGNED_LINK_ENDPOINTS: Record<string, RegExp> = {
  'pitch-decision.post.ts': /\bverifyPitchDecision\s*\(/,
  'pitch-inbox.post.ts': /\bverifyPitchInbox\s*\(/,
}

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

export function fileHasRecognizedAuthGuard(
  content: string,
  fileName?: string,
): boolean {
  if (AUTH_GUARD_CALL_PATTERN.test(content)) return true
  const signedLinkVerifier = fileName && SIGNED_LINK_ENDPOINTS[fileName]
  if (signedLinkVerifier && signedLinkVerifier.test(content)) return true
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
    if (!fileHasRecognizedAuthGuard(content, basename(file))) {
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
