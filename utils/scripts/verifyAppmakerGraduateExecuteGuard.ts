// /utils/scripts/verifyAppmakerGraduateExecuteGuard.ts
//
// Regression guard (appmaker/t-015) for graduate-execute.post.ts, the
// admin-only endpoint that actually performs a squash-graduation: pushing
// apps/<slug>/'s current tree as one commit onto a target repo and opening
// conductor's own removal PR. Both writes are real, irreversible mutations
// to repositories a bug here cannot cleanly undo, so this pins down the
// same class of invariant verifyAppmakerGraduateRequestGuard.ts pins for the
// request-filing half:
//
//   1. Admin-only: must call requireAdminApiUser, same reasoning as the
//      request endpoint -- a monorepo app has no individual owner.
//   2. Must require an OPEN "Graduate app '<slug>' to its own repo" Todo
//      before doing anything -- this is the trigger, not just a status
//      marker; running without one means executing a graduation nobody
//      actually requested (or re-running one that already completed).
//   3. Must re-validate the installation is not suspended and the target
//      repo is still granted, rather than trusting the AppRepo row alone --
//      both can change between request and execution.
//   4. Must mark the triggering Todo DONE only after both writes succeed
//      (i.e. after the removal-PR call), not before -- marking it done
//      earlier would hide a partial failure (pushed but no removal PR) as
//      complete.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const ROUTE_PATH = join(
  repositoryRoot,
  'server/api/appmaker/graduate-execute.post.ts',
)

export function checkGraduateExecuteGuard(routeContent: string): string[] {
  const errors: string[] = []

  if (!/requireAdminApiUser\(event\)/.test(routeContent)) {
    errors.push(
      'graduate-execute.post.ts no longer calls requireAdminApiUser(event) ' +
        '-- a monorepo app has no individual owner, so this must stay ' +
        'admin-only.',
    )
  }

  if (
    !/prisma\.todo\.findFirst\(\{\s*where:\s*\{\s*title:\s*GRADUATE_TODO_TITLE\(slug\),\s*status:\s*'OPEN'/.test(
      routeContent,
    )
  ) {
    errors.push(
      'graduate-execute.post.ts no longer requires an OPEN graduation Todo ' +
        'before executing -- this is the trigger gate, not just a status ' +
        'marker; without it the endpoint could execute an unrequested or ' +
        'already-completed graduation.',
    )
  }

  if (!/installation\.suspendedAt/.test(routeContent)) {
    errors.push(
      'graduate-execute.post.ts no longer checks installation.suspendedAt ' +
        '-- must refuse to push through a suspended installation.',
    )
  }

  if (!/listInstallationRepositories\(/.test(routeContent)) {
    errors.push(
      'graduate-execute.post.ts no longer re-validates the target repo is ' +
        'still granted via listInstallationRepositories -- access can be ' +
        'revoked on GitHub between request and execution.',
    )
  }

  const todoUpdateIndex = routeContent.indexOf('prisma.todo.update(')
  const removalCallIndex = routeContent.indexOf('openConductorAppRemovalPr(')
  if (todoUpdateIndex === -1) {
    errors.push(
      'graduate-execute.post.ts no longer marks the triggering Todo DONE ' +
        'on success -- a completed graduation would keep showing as pending.',
    )
  } else if (removalCallIndex === -1 || todoUpdateIndex < removalCallIndex) {
    errors.push(
      'graduate-execute.post.ts marks the Todo done before (or without) ' +
        'calling openConductorAppRemovalPr -- a partial failure (pushed but ' +
        'no removal PR) would be hidden as complete.',
    )
  }

  return errors
}

function main(): void {
  const routeContent = readFileSync(ROUTE_PATH, 'utf8')
  const errors = checkGraduateExecuteGuard(routeContent)

  if (errors.length) {
    console.error('AppMaker graduate-execute guard contract failed:')
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'AppMaker graduate-execute guard contract passed: admin-only, Todo-' +
      'gated, re-validates suspension/grant, and marks the Todo done only ' +
      'after the removal PR is opened.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
