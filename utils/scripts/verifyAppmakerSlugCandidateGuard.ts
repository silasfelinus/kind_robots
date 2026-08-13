// /utils/scripts/verifyAppmakerSlugCandidateGuard.ts
//
// Regression guard (appmaker/t-004) -- slugError() in
// components/pages/appmaker-page.vue mirrors the server's SLUG_RE so an
// obviously-invalid slug is caught client-side with an inline error and a
// disabled Create button, instead of round-tripping to the server just to
// bounce off the same regex there. That mirroring had a gap: when both the
// slug field and the title-derived slugPreview reduce to an empty string
// (e.g. a title of "###", "---", or pure emoji/punctuation, with the slug
// field left blank), `candidate` was `''`, and `!candidate` short-circuited
// to "no error" unconditionally -- even though the title itself was
// non-empty and the Create button's separate `!form.title.trim()` guard was
// therefore already satisfied. The button stayed enabled, the user could
// click Create, and the request was guaranteed to fail server-side with a
// 400 from scaffold-request.post.ts's own SLUG_RE check -- exactly the
// round trip the client-side mirror exists to avoid.
//
// Fixed by making the empty-candidate branch conditional on the title: an
// empty candidate is only a non-error while the title is *also* empty (the
// button's title guard covers that case); once the title is non-empty but
// yields no usable slug, slugError() now returns an explicit message and the
// Create button stays disabled.
//
// This asserts the textual shape of that fix stays in place: slugError()
// branches on `form.title.trim()` inside its empty-candidate handling
// (not a bare `if (!candidate) return ''` that silently accepts an
// untitled-derived empty slug again), scoped narrowly to this one function,
// mirroring this project's other narrow textual guards over a
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
  const signature = new RegExp(`const ${name} = computed\\(\\(\\) => \\{`, 'm')
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

export function checkSlugCandidateGuard(content: string): string[] {
  const errors: string[] = []

  const body = extractFunctionSource(content, 'slugError')
  if (!body) {
    errors.push(
      'Could not find `const slugError = computed(() => { ... })` in ' +
        'appmaker-page.vue -- has it been renamed, removed, or restructured? ' +
        'If so, this guard (and the empty-slug-candidate bug it protects ' +
        'against) needs to move with it.',
    )
    return errors
  }

  if (!/if\s*\(\s*!candidate\s*\)\s*\{/.test(body)) {
    errors.push(
      'slugError() no longer branches separately on `if (!candidate)` -- ' +
        'has the empty-candidate case been collapsed back into a single ' +
        "`if (!candidate || SLUG_RE.test(candidate)) return ''` that treats " +
        'an empty candidate as always valid, regardless of whether the ' +
        'title actually produced one?',
    )
  }

  if (!/form\.title\.trim\(\)/.test(body)) {
    errors.push(
      'slugError() no longer checks form.title.trim() inside its ' +
        'empty-candidate handling -- an empty candidate from a non-empty, ' +
        'unslugifiable title (e.g. "###") will silently pass validation ' +
        'again and let the Create button stay enabled for a guaranteed ' +
        'server-side 400.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(COMPONENT_PATH, 'utf8')
  const errors = checkSlugCandidateGuard(content)

  if (errors.length) {
    console.error(
      'AppMaker slug-candidate guard contract failed in appmaker-page.vue:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'AppMaker slug-candidate guard contract passed: a non-empty title that ' +
      'slugifies to nothing is flagged as an error instead of silently ' +
      'passing validation.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
