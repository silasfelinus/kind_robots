// /utils/scripts/verifyAppmakerScaffoldCollisionGuard.ts
//
// Regression guard (appmaker/t-012, reshaped by kind-robots/t-094) -- both of
// AppMaker's self-serve app creation routes originally checked slug
// uniqueness only against the kind_robots Prisma `Project`/`Dream` tables
// (and, for the external-repo flow, `AppRepo`), never the conductor repo's
// apps/ folder listing that apps.get.ts itself treats as the real source of
// truth for "already scaffolded" (`conductorList('apps')`, filtered to
// `type === 'dir'`). Several apps were scaffolded directly by an agent before
// either self-serve flow existed (apps/storybook, apps/wishmaster,
// apps/sketchy, ...) and never got a matching Project row.
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
// kind-robots/t-094 then extracted that duplicated check (plus the
// duplicated `SLUG_RE`/`slugify()` pair) into a single shared helper,
// `server/utils/appmakerSlug.ts`'s `isSlugTaken()`. This guard now asserts
// TWO things instead of one: (1) the shared helper module itself still does
// the real collision work (still calls `conductorList('apps')`, still
// filters `dir` entries by name, still folds Project/Dream/scaffolded-folder
// into its returned boolean), and (2) each route still imports and calls
// `isSlugTaken()` and folds its result into its own "already taken" 409 --
// not a bare check that silently reverts to Prisma-only validation again.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

export const SHARED_HELPER_PATH = join(
  repositoryRoot,
  'server/utils/appmakerSlug.ts',
)

interface RouteConfig {
  label: string
  path: string
  // The full "already taken" condition expected in the fixed handler, e.g.
  // `if (await isSlugTaken(slug))`.
  alreadyTakenPattern: RegExp
}

const SCAFFOLD_REQUEST_ALREADY_TAKEN_PATTERN =
  /if\s*\(\s*await\s+isSlugTaken\(slug\)\s*\)/

export const SCAFFOLD_COLLISION_ROUTES: RouteConfig[] = [
  {
    label: 'scaffold-request.post.ts',
    path: join(repositoryRoot, 'server/api/appmaker/scaffold-request.post.ts'),
    alreadyTakenPattern: SCAFFOLD_REQUEST_ALREADY_TAKEN_PATTERN,
  },
  {
    label: 'create-app.post.ts',
    path: join(repositoryRoot, 'server/api/appmaker/github/create-app.post.ts'),
    alreadyTakenPattern: /if\s*\(\s*taken\s*\|\|\s*existingAppRepo\s*\)/,
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

// Checks that a route file still delegates slug-collision checking to the
// shared `isSlugTaken()` helper and folds its result into its own 409.
export function checkRouteUsesSharedHelper(
  content: string,
  alreadyTakenPattern: RegExp,
): string[] {
  const errors: string[] = []

  if (
    !/import\s*\{[^}]*\bisSlugTaken\b[^}]*\}\s*from\s*['"][^'"]*appmakerSlug['"]/.test(
      content,
    )
  ) {
    errors.push(
      'no longer imports `isSlugTaken` from `appmakerSlug` -- has this ' +
        'route reverted to its own inline Project/Dream/apps-folder ' +
        'collision check instead of the shared helper (kind-robots/t-094)?',
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

  if (!/isSlugTaken\(\s*slug\s*\)/.test(body)) {
    errors.push(
      'the handler no longer calls `isSlugTaken(slug)` -- slug ' +
        'uniqueness may no longer be checked against the conductor apps/ ' +
        'folder listing at all.',
    )
  }

  if (!alreadyTakenPattern.test(body)) {
    errors.push(
      'the "already taken" 409 no longer folds `isSlugTaken()`\'s result ' +
        'into its condition -- the shared collision check may be computed ' +
        'but not actually enforced.',
    )
  }

  return errors
}

// Checks that the shared helper module itself still does the real work: the
// same conductorList('apps') call, the same `dir` entry filter, and folding
// existingProject/existingDream/alreadyScaffolded into its returned boolean
// that both routes used to duplicate inline.
export function checkSharedHelperImplementation(content: string): string[] {
  const errors: string[] = []

  if (
    !/import\s*\{\s*conductorList\s*\}\s*from\s*['"][^'"]*conductor-github['"]/.test(
      content,
    )
  ) {
    errors.push(
      'appmakerSlug.ts no longer imports `conductorList` from ' +
        'conductor-github -- has the apps/ folder collision check been ' +
        'dropped from the shared helper?',
    )
  }

  if (!/conductorList\(\s*['"]apps['"]\s*\)/.test(content)) {
    errors.push(
      "appmakerSlug.ts no longer calls conductorList('apps') -- the " +
        "candidate slug is no longer checked against the conductor repo's " +
        'actual apps/ folder listing.',
    )
  }

  if (!/entry\.type === 'dir' && entry\.name === slug/.test(content)) {
    errors.push(
      "appmakerSlug.ts no longer filters conductorList('apps') entries by " +
        "`entry.type === 'dir' && entry.name === slug` -- has the " +
        'collision match against the scaffolded-folder listing been ' +
        'weakened or dropped?',
    )
  }

  if (
    !/existingProject\s*\|\|\s*existingDream\s*\|\|\s*alreadyScaffolded/.test(
      content,
    )
  ) {
    errors.push(
      'appmakerSlug.ts no longer folds `existingProject || existingDream || ' +
        'alreadyScaffolded` into its returned boolean -- the apps/ folder ' +
        'collision result may be computed but no longer actually returned.',
    )
  }

  return errors
}

function main(): void {
  let anyFailed = false

  const helperContent = readFileSync(SHARED_HELPER_PATH, 'utf8')
  const helperErrors = checkSharedHelperImplementation(helperContent)
  if (helperErrors.length) {
    anyFailed = true
    console.error(
      'AppMaker scaffold-collision guard contract failed in appmakerSlug.ts:',
    )
    for (const error of helperErrors) console.error(`- ${error}`)
  } else {
    console.log(
      'AppMaker scaffold-collision guard contract passed for appmakerSlug.ts: ' +
        'isSlugTaken() still checks Project, Dream, and the conductor apps/ ' +
        'folder listing.',
    )
  }

  for (const route of SCAFFOLD_COLLISION_ROUTES) {
    const content = readFileSync(route.path, 'utf8')
    const errors = checkRouteUsesSharedHelper(
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
