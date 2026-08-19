// /utils/scripts/verifyAppmakerScaffoldCollisionGuard.ts
//
// Regression guard (appmaker/t-012) -- server/api/appmaker/scaffold-request.post.ts's
// slug-collision check only queried the kind_robots Prisma `Project` and
// `Dream` tables (existingProject / existingDream), never the conductor
// repo's apps/ folder listing that apps.get.ts itself treats as the real
// source of truth for "already scaffolded" (`conductorList('apps')`,
// filtered to `type === 'dir'`). Several apps were scaffolded directly by an
// agent before this self-serve flow existed (apps/storybook, apps/wishmaster,
// apps/sketchy, ...) and never got a matching Project row.
//
// That gap let a user request a slug colliding with one of those folders:
// the request succeeded here (201, Todo filed, one of their
// FREE_PROJECT_LIMIT slots consumed), but the Worker cycle's
// `scripts/new_app.py <slug>` invocation refuses to run over an existing
// apps/<slug>/ folder and fails -- with nothing ever surfacing that failure
// back through this endpoint or the AppMaker UI. The user's Project row (and
// project-cap slot) is silently orphaned forever.
//
// Fixed by also listing the conductor apps/ folder via conductorList('apps')
// alongside the existing Project/Dream lookups, and folding a `type ===
// 'dir'` match on the candidate slug into the same "already taken" 409.
//
// This asserts the textual shape of that fix stays in place: the handler
// still calls conductorList('apps'), still filters its `dir` entries by
// name against the candidate slug, and still folds that result into the
// same conditional that throws the "already taken" 409 -- not a bare
// `if (existingProject || existingDream)` that silently accepts a slug
// belonging to a pre-existing, unregistered apps/ folder again.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const ROUTE_PATH = join(
  repositoryRoot,
  'server/api/appmaker/scaffold-request.post.ts',
)

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

export function checkScaffoldCollisionGuard(content: string): string[] {
  const errors: string[] = []

  if (
    !/import\s*\{\s*conductorList\s*\}\s*from\s*['"][^'"]*conductor-github['"]/.test(
      content,
    )
  ) {
    errors.push(
      'scaffold-request.post.ts no longer imports `conductorList` from ' +
        'conductor-github -- has the apps/ folder collision check been ' +
        'dropped, leaving slug uniqueness checked only against the Project ' +
        'and Dream tables?',
    )
  }

  const body = extractHandlerSource(content)
  if (!body) {
    errors.push(
      'Could not find `export default defineEventHandler(async (event) => ' +
        '{ ... })` in scaffold-request.post.ts -- has it been renamed, ' +
        'removed, or restructured? If so, this guard (and the scaffold-' +
        'folder collision bug it protects against) needs to move with it.',
    )
    return errors
  }

  if (!/conductorList\(\s*['"]apps['"]\s*\)/.test(body)) {
    errors.push(
      "The handler no longer calls conductorList('apps') -- the " +
        "candidate slug is no longer checked against the conductor repo's " +
        'actual apps/ folder listing, so a slug matching a pre-existing, ' +
        'unregistered apps/<slug>/ folder will silently pass validation ' +
        'and file a Todo that scripts/new_app.py is guaranteed to fail on.',
    )
  }

  if (!/entry\.type === 'dir' && entry\.name === slug/.test(body)) {
    errors.push(
      "The handler no longer filters conductorList('apps') entries by " +
        "`entry.type === 'dir' && entry.name === slug` -- has the " +
        'collision match against the scaffolded-folder listing been ' +
        'weakened or dropped?',
    )
  }

  if (
    !/if\s*\(\s*existingProject\s*\|\|\s*existingDream\s*\|\|\s*alreadyScaffolded\s*\)/.test(
      body,
    )
  ) {
    errors.push(
      'The "already taken" 409 no longer checks `existingProject || ' +
        'existingDream || alreadyScaffolded` together -- the apps/ folder ' +
        'collision result is no longer folded into the slug-taken check, ' +
        'so it has no effect even if it is still computed.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(ROUTE_PATH, 'utf8')
  const errors = checkScaffoldCollisionGuard(content)

  if (errors.length) {
    console.error(
      'AppMaker scaffold-collision guard contract failed in ' +
        'scaffold-request.post.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'AppMaker scaffold-collision guard contract passed: a slug matching an ' +
      'already-scaffolded (but unregistered) apps/ folder is rejected ' +
      'instead of silently filing a Todo doomed to fail.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
