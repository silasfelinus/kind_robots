// /utils/scripts/verifyAppmakerScaffoldCollisionGuard.ts
//
// Regression guard (appmaker/t-012) -- both of AppMaker's self-serve app
// creation routes originally checked slug uniqueness only against the
// kind_robots Prisma `Project`/`Dream` tables (and, for the external-repo
// flow, `AppRepo`), never the conductor repo's apps/ folder listing that
// apps.get.ts itself treats as the real source of truth for "already
// scaffolded" (`conductorList('apps')`, filtered to `type === 'dir'`).
// Several apps were scaffolded directly by an agent before either self-serve
// flow existed (apps/storybook, apps/wishmaster, apps/sketchy, ...) and never
// got a matching Project row.
//
// That gap let a user request a slug colliding with one of those folders:
// - scaffold-request.post.ts: the request succeeded (201, Todo filed, one of
//   their FREE_PROJECT_LIMIT slots consumed), but the Worker cycle's
//   `scripts/new_app.py <slug>` invocation refuses to run over an existing
//   apps/<slug>/ folder and fails -- with nothing ever surfacing that
//   failure back through this endpoint or the AppMaker UI. The user's
//   Project row (and project-cap slot) is silently orphaned forever.
// - create-app.post.ts: the request would succeed and create a Project +
//   AppRepo that permanently collides with the existing apps/<slug>/
//   folder's own identity, since no Project/Dream/AppRepo row exists for an
//   agent-scaffolded monorepo app to catch the collision.
//
// Fixed in both handlers by also listing the conductor apps/ folder via
// conductorList('apps') alongside the existing Prisma lookups, and folding a
// `type === 'dir'` match on the candidate slug into each handler's own
// "already taken" 409.
//
// This asserts the textual shape of that fix stays in place in both route
// files: each still calls conductorList('apps'), still filters its `dir`
// entries by name against the candidate slug, and still folds that result
// into its own "already taken" condition -- not a bare check that silently
// accepts a slug belonging to a pre-existing, unregistered apps/ folder
// again.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

interface RouteConfig {
  label: string
  path: string
  // The full "already taken" condition expected in the fixed handler, e.g.
  // `existingProject || existingDream || alreadyScaffolded`.
  alreadyTakenPattern: RegExp
}

// Default pattern for checkScaffoldCollisionGuard()'s optional second
// argument -- pulled out as its own constant (rather than indexing into
// SCAFFOLD_COLLISION_ROUTES[0]) so a default-parameter initializer can't trip
// TypeScript's noUncheckedIndexedAccess-style "possibly undefined" check.
const SCAFFOLD_REQUEST_ALREADY_TAKEN_PATTERN =
  /if\s*\(\s*existingProject\s*\|\|\s*existingDream\s*\|\|\s*alreadyScaffolded\s*\)/

export const SCAFFOLD_COLLISION_ROUTES: RouteConfig[] = [
  {
    label: 'scaffold-request.post.ts',
    path: join(repositoryRoot, 'server/api/appmaker/scaffold-request.post.ts'),
    alreadyTakenPattern: SCAFFOLD_REQUEST_ALREADY_TAKEN_PATTERN,
  },
  {
    label: 'create-app.post.ts',
    path: join(repositoryRoot, 'server/api/appmaker/github/create-app.post.ts'),
    alreadyTakenPattern:
      /if\s*\(\s*existingProject\s*\|\|\s*existingDream\s*\|\|\s*existingAppRepo\s*\|\|\s*alreadyScaffolded\s*\)/,
  },
]

function extractHandlerSource(content: string): string | null {
  const signature = /export default defineEventHandler\(async \(event\) => \{/
  const match = signature.exec(content)
  if (!match) return null

  const braceOpen = match.index + match[0].length - 1
  let depth = 0
  let i = braceOpen
  for (; i < content.length; i++) {
    if (content[i] === '{') depth++
    else if (content[i] === '}') {
      depth--
      if (depth === 0) break
    }
  }
  if (depth !== 0) return null
  return content.slice(braceOpen, i + 1)
}

export function checkScaffoldCollisionGuard(
  content: string,
  alreadyTakenPattern: RegExp = SCAFFOLD_REQUEST_ALREADY_TAKEN_PATTERN,
): string[] {
  const errors: string[] = []

  if (
    !/import\s*\{\s*conductorList\s*\}\s*from\s*['"][^'"]*conductor-github['"]/.test(
      content,
    )
  ) {
    errors.push(
      'no longer imports `conductorList` from conductor-github -- has the ' +
        'apps/ folder collision check been dropped, leaving slug uniqueness ' +
        'checked only against the Prisma tables?',
    )
  }

  const body = extractHandlerSource(content)
  if (!body) {
    errors.push(
      'Could not find `export default defineEventHandler(async (event) => ' +
        '{ ... })` -- has it been renamed, removed, or restructured? If so, ' +
        'this guard (and the scaffold-folder collision bug it protects ' +
        'against) needs to move with it.',
    )
    return errors
  }

  if (!/conductorList\(\s*['"]apps['"]\s*\)/.test(body)) {
    errors.push(
      "the handler no longer calls conductorList('apps') -- the candidate " +
        "slug is no longer checked against the conductor repo's actual " +
        'apps/ folder listing, so a slug matching a pre-existing, ' +
        'unregistered apps/<slug>/ folder will silently pass validation.',
    )
  }

  if (!/entry\.type === 'dir' && entry\.name === slug/.test(body)) {
    errors.push(
      "the handler no longer filters conductorList('apps') entries by " +
        "`entry.type === 'dir' && entry.name === slug` -- has the " +
        'collision match against the scaffolded-folder listing been ' +
        'weakened or dropped?',
    )
  }

  if (!alreadyTakenPattern.test(body)) {
    errors.push(
      'the "already taken" 409 no longer folds `alreadyScaffolded` into ' +
        'its condition alongside the existing Prisma lookups -- the apps/ ' +
        'folder collision result is no longer checked even if it is still ' +
        'computed.',
    )
  }

  return errors
}

function main(): void {
  let anyFailed = false

  for (const route of SCAFFOLD_COLLISION_ROUTES) {
    const content = readFileSync(route.path, 'utf8')
    const errors = checkScaffoldCollisionGuard(
      content,
      route.alreadyTakenPattern,
    )

    if (errors.length) {
      anyFailed = true
      console.error(
        `AppMaker scaffold-collision guard contract failed in ${route.label}:`,
      )
      for (const error of errors) console.error(`- ${error}`)
    } else {
      console.log(
        `AppMaker scaffold-collision guard contract passed for ${route.label}: ` +
          'a slug matching an already-scaffolded (but unregistered) apps/ ' +
          'folder is rejected instead of silently accepted.',
      )
    }
  }

  if (anyFailed) process.exitCode = 1
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
