// /utils/scripts/verifyAppmakerPendingScaffoldPatternGuard.ts
//
// Regression guard (appmaker/t-012) -- two self-serve flows file a scaffold
// Todo: scaffold-request.post.ts (the monorepo apps/<slug>/ flow, title
// "Scaffold new app '<slug>' with scripts/new_app.py") and
// github/create-app.post.ts (the external-repo GitHub-integration flow,
// appmaker/t-009, title "Scaffold external app '<slug>' via AppMaker GitHub
// integration"). apps.get.ts's `pending` list -- the "Being built" section
// appmaker-page.vue renders -- only ever recognized the first title pattern:
// its Prisma query filtered on `title: { startsWith: "Scaffold new app '" }`
// and its extraction regex only matched `^Scaffold new app '...`. A request
// filed through create-app.post.ts (already API-reachable even before any
// front-end wires up to it, per t-012's 2026-08-21 cycle) created a real,
// open Todo that was silently excluded from both the DB query and the
// regex -- it would never appear in the pending list, leaving the requester
// with no visibility that their request was filed and waiting on a Worker
// cycle.
//
// Fixed by widening the Prisma `where` to an OR across both known title
// prefixes, and widening SCAFFOLD_TITLE_RE to `^Scaffold (?:new|external)
// app '...` so the extraction step recognizes either flow's Todo.
//
// This asserts the textual shape of that fix stays in place: the query still
// matches both prefixes, and the regex still recognizes both the "new" and
// "external" scaffold-title patterns, rather than silently regressing to
// recognizing only one flow again.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const ROUTE_PATH = join(repositoryRoot, 'server/api/appmaker/apps.get.ts')

export function checkPendingScaffoldPatternGuard(content: string): string[] {
  const errors: string[] = []

  if (!/startsWith:\s*"Scaffold new app '"/.test(content)) {
    errors.push(
      "the Prisma query no longer filters on the monorepo flow's " +
        '"Scaffold new app \'" title prefix -- has scaffold-request.post.ts\'s ' +
        'Todo shape changed, or was this branch of the OR dropped?',
    )
  }

  if (!/startsWith:\s*"Scaffold external app '"/.test(content)) {
    errors.push(
      "the Prisma query no longer filters on the external-repo flow's " +
        '"Scaffold external app \'" title prefix -- a Todo filed through ' +
        'github/create-app.post.ts will be excluded before it ever reaches ' +
        'the extraction regex, silently vanishing from the pending list ' +
        'again.',
    )
  }

  if (
    !/SCAFFOLD_TITLE_RE\s*=\s*\/\^Scaffold \(\?:new\|external\) app/.test(
      content,
    )
  ) {
    errors.push(
      'SCAFFOLD_TITLE_RE no longer recognizes both "new" and "external" ' +
        'scaffold-title patterns -- has it regressed to matching only one ' +
        "self-serve flow's Todo title?",
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(ROUTE_PATH, 'utf8')
  const errors = checkPendingScaffoldPatternGuard(content)

  if (errors.length) {
    console.error(
      'AppMaker pending-scaffold-pattern guard contract failed in apps.get.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'AppMaker pending-scaffold-pattern guard contract passed: both the ' +
      "monorepo and external-repo self-serve flows' Todos are recognized " +
      'in the pending-scaffold list.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
