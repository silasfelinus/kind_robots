// /utils/scripts/verifyAppmakerFleetDescriptionGuard.ts
//
// Regression guard (appmaker/t-012) -- the `fleet` computed in
// components/pages/appmaker-page.vue used to derive each fleet card's
// `description` solely from `tasks.length === 0 ? 'Freshly scaffolded.' :
// ''`. scripts/new_app.py (the conductor-side scaffolder) always seeds a
// freshly scaffolded app's roadmap.yaml with three milestones/tasks up
// front, so `tasks.length === 0` is essentially never true for a real,
// registry-tracked app -- it only happened in the transient/degraded
// window where conductorStore had no matching project entry at all. In
// practice that made the check backwards: every successfully tracked app
// showed a permanently blank card description, while "Freshly scaffolded."
// only ever surfaced when the project *lookup failed*, which reads like a
// data problem rather than a success state.
//
// Fixed by preferring the project's real one-line description --
// `project?.goal`, falling back to `project?.notesFromSilas` (new_app.py
// always seeds the latter, even if just its own placeholder text) -- and
// only falling through to the empty-task literal when there is truly no
// description available.
//
// This asserts the textual shape of that fix stays in place: the `fleet`
// computed still reads `project?.goal` and `project?.notesFromSilas` before
// falling back to the empty-task literal, scoped narrowly to this one
// function, mirroring this project's other narrow textual guards over a
// general-purpose static analyzer.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const COMPONENT_PATH = join(
  repositoryRoot,
  'components/pages/appmaker-page.vue',
)

function extractFunctionSource(content: string, name: string): string | null {
  const signature = new RegExp(
    `const ${name} = computed<[^>]*>\\(\\(\\) =>`,
    'm',
  )
  const match = signature.exec(content)
  if (!match) return null

  const parenOpen = content.indexOf('(', match.index + match[0].length - 2)
  const braceOpen = content.indexOf('{', parenOpen)
  if (braceOpen === -1) return null

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

export function checkFleetDescriptionGuard(content: string): string[] {
  const errors: string[] = []

  const body = extractFunctionSource(content, 'fleet')
  if (!body) {
    errors.push(
      'Could not find `const fleet = computed<...>(() => { ... })` in ' +
        'appmaker-page.vue -- has it been renamed, removed, or restructured? ' +
        'If so, this guard (and the blank-description bug it protects ' +
        'against) needs to move with it.',
    )
    return errors
  }

  if (!/project\?\.\s*goal/.test(body)) {
    errors.push(
      "fleet's description no longer reads `project?.goal` -- has the " +
        'real one-line project description been dropped again in favor of ' +
        'just the empty-task literal?',
    )
  }

  if (!/project\?\.\s*notesFromSilas/.test(body)) {
    errors.push(
      "fleet's description no longer falls back to " +
        '`project?.notesFromSilas` -- freshly scaffolded apps (which only ' +
        'ever get notesFromSilas seeded, never goal) will show a blank ' +
        "description again instead of new_app.py's placeholder text.",
    )
  }

  if (!/tasks\.length === 0 \? 'Freshly scaffolded\.' : ''/.test(body)) {
    errors.push(
      'fleet no longer falls back to the "Freshly scaffolded." literal ' +
        'when there is truly no description and no tasks yet -- has that ' +
        'transient/degraded-lookup case been dropped?',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(COMPONENT_PATH, 'utf8')
  const errors = checkFleetDescriptionGuard(content)

  if (errors.length) {
    console.error(
      'AppMaker fleet-description guard contract failed in appmaker-page.vue:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'AppMaker fleet-description guard contract passed: fleet cards prefer ' +
      'a real project goal/notesFromSilas description over a permanently ' +
      'blank field once an app is registry-tracked.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
