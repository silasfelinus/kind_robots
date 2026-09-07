// /utils/scripts/verifyProjectConductorSlugImmutabilityGuard.ts
//
// Regression guard (kind-robots/t-061, pitches/2026-08-10-kind-robots-slug-
// integrity.md) -- `conductorSlug` is the join key between a kind_robots
// `Project` row and its `projects/<slug>/roadmap.yaml` directory in
// Conductor (PROJECT-CREATION.md). `server/api/conductor/sync.post.ts`
// already treats it as set-once (`existing.conductorSlug ?? project.slug`),
// but `PATCH /api/projects/:id` originally put `conductorSlug` in the
// general owner-facing mutation allowlist with no immutability guard, so
// any project owner could silently rewrite it -- letting Conductor and this
// app disagree about which project a row belongs to with no error anywhere.
//
// Fixed by rejecting (409) any PATCH that would change an already-set
// `conductorSlug` to a different value, mirroring sync.post.ts's own
// set-once pattern. This asserts the textual shape of that guard stays in
// place in the PATCH handler: it still reads `existing.conductorSlug`
// before accepting a new value, and still throws a 409 when the two
// disagree -- not a bare passthrough that silently accepts the rewrite
// again.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

export const PROJECT_PATCH_ROUTE_PATH = join(
  repositoryRoot,
  'server/api/projects/[id].patch.ts',
)

function extractConductorSlugBlock(content: string): string | null {
  const signature = /if\s*\(\s*body\.conductorSlug\s*!==\s*undefined\s*\)\s*\{/
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

export function checkConductorSlugImmutabilityGuard(content: string): string[] {
  const errors: string[] = []

  const block = extractConductorSlugBlock(content)
  if (!block) {
    errors.push(
      'Could not find `if (body.conductorSlug !== undefined) { ... }` in ' +
        'the PATCH /api/projects/:id handler -- has the conductorSlug ' +
        'field handling been renamed, removed, or restructured? If so, ' +
        'this guard (and the immutability check it protects) needs to ' +
        'move with it.',
    )
    return errors
  }

  if (!/existing\.conductorSlug/.test(block)) {
    errors.push(
      'the conductorSlug block no longer reads `existing.conductorSlug` -- ' +
        'has the already-set check been dropped, letting any owner ' +
        'silently rewrite conductorSlug once it is linked to Conductor?',
    )
  }

  if (!/statusCode:\s*409/.test(block)) {
    errors.push(
      'the conductorSlug block no longer throws a 409 -- an attempt to ' +
        'change an already-linked conductorSlug is no longer rejected.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(PROJECT_PATCH_ROUTE_PATH, 'utf8')
  const errors = checkConductorSlugImmutabilityGuard(content)

  if (errors.length) {
    console.error('conductorSlug immutability guard contract failed:')
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
  } else {
    console.log(
      'conductorSlug immutability guard contract passed: PATCH ' +
        '/api/projects/:id rejects an attempt to change an already-linked ' +
        'conductorSlug instead of silently accepting the rewrite.',
    )
  }
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
