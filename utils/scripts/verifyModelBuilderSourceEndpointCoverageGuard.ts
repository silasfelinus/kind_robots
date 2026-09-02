// /utils/scripts/verifyModelBuilderSourceEndpointCoverageGuard.ts
//
// Regression guard (model-builder/t-029, cycle 84) -- every SOURCE_TYPES
// entry (stores/helpers/modelBuilderRecipes.ts) carries a hand-written
// `endpoint: '/api/<slug>'` string, fetched directly by
// modelBuilderStore.ts's loadSources() (`performFetch<SourceRecord[]>
// (config.endpoint)`) whenever a user opens that source type's tab in
// model-builder-source-picker.vue. Nothing ties that string to a real
// server route: a typo, a stale path left behind by an API rename, or a
// route that never had a GET handler in the first place would only be
// caught the moment a user actually clicks that specific tab -- the same
// "nothing at compile time or CI time stops a hand-typed field from
// silently going stale" shape this task's own history has hit repeatedly
// for other SOURCE_TYPES fields (titleField/subtitleField cycle 22 and 31,
// blurb cycle 81, icon cycle 82), just one step later in the failure chain:
// loadSources() does surface a visible "Failed to load <plural>." error
// rather than rendering blank, but only at click time, in production, per
// affected source type -- not at PR time, before it ships.
//
// This reads every `endpoint: '/api/<slug>'` literal out of SOURCE_TYPES
// and asserts server/api/<slug>/index.get.ts (Nuxt/Nitro's file-based
// routing convention for a GET handler on that path) actually exists, so a
// route rename or typo fails loudly here instead of shipping a source type
// whose tab silently errors for every user who opens it. Deliberately
// scoped to this one field/convention pairing, mirroring this project's
// other narrow textual guards over a general-purpose static analyzer (see
// verifyModelBuilderIconCoverageGuard.ts's header for the same rationale).
//
// Extraction splits SOURCE_TYPES' body on `key: '...'` boundaries rather
// than brace-matching each entry object -- verifyModelBuilderIconCoverageGuard.ts
// shipped last cycle with a brace-matching version of this exact split and
// it silently dropped the Facet entry, because Facet's leading comment
// mentions `server/api/{dreams,scenarios}/...`, a literal `{`/`}` pair in
// prose that desynchronized the naive regex (fixed there this same cycle).
// Written correctly from the start here so the new guard doesn't ship with
// the identical gap.
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const MODEL_BUILDER_RECIPES_PATH = join(
  repositoryRoot,
  'stores/helpers/modelBuilderRecipes.ts',
)
const SERVER_API_DIRECTORY = join(repositoryRoot, 'server/api')

export interface SourceEndpointEntry {
  key: string
  endpoint: string
}

// Every `{ key: '...', ..., endpoint: '/api/...', ... }` entry in
// SOURCE_TYPES. Splits the array body on `key: '...'` boundaries (not brace
// matching -- see the header note above) so free-text comments containing
// `{`/`}` can't desynchronize the split. Exported so the self-test can
// exercise it against a synthetic fixture.
export function extractSourceEndpointEntries(
  recipesFileContent: string,
): SourceEndpointEntry[] {
  const match = recipesFileContent.match(
    /SOURCE_TYPES:\s*SourceTypeConfig\[\]\s*=\s*\[([\s\S]*?)\n\]\n/,
  )
  if (!match) {
    throw new Error(
      'Could not find SOURCE_TYPES array literal in modelBuilderRecipes.ts ' +
        '-- has its shape changed?',
    )
  }

  const body = match[1]!
  const keyMatches = [...body.matchAll(/key:\s*'(\w+)'/g)]
  if (!keyMatches.length) {
    throw new Error(
      'Found the SOURCE_TYPES array literal but no key: entries inside it ' +
        '-- has its shape changed?',
    )
  }

  const entries: SourceEndpointEntry[] = []
  keyMatches.forEach((keyMatch, index) => {
    const start = keyMatch.index!
    const end =
      index + 1 < keyMatches.length
        ? keyMatches[index + 1]!.index!
        : body.length
    const chunk = body.slice(start, end)
    const endpointMatch = chunk.match(/endpoint:\s*'(\/api\/[\w-]+)'/)
    if (!endpointMatch) return
    entries.push({ key: keyMatch[1]!, endpoint: endpointMatch[1]! })
  })

  return entries
}

// Checks the real contract: every extracted endpoint resolves to a real
// server/api/<slug>/index.get.ts route file. Takes a `routeExists`
// predicate (rather than reading the filesystem directly) so the self-test
// can exercise the logic against a synthetic route set without touching
// disk.
export function checkSourceEndpointCoverageGuard(
  entries: SourceEndpointEntry[],
  routeExists: (endpoint: string) => boolean,
): string[] {
  const errors: string[] = []

  for (const entry of entries) {
    if (!routeExists(entry.endpoint)) {
      const slug = entry.endpoint.replace(/^\/api\//, '')
      errors.push(
        `SOURCE_TYPES['${entry.key}'].endpoint = '${entry.endpoint}' has no ` +
          `matching server/api/${slug}/index.get.ts route -- loadSources() ` +
          `will fail (a visible "Failed to load ..." error) for every user ` +
          `who opens the ${entry.key} source tab.`,
      )
    }
  }

  return errors
}

function main(): void {
  const content = readFileSync(MODEL_BUILDER_RECIPES_PATH, 'utf8')
  const entries = extractSourceEndpointEntries(content)

  const routeExists = (endpoint: string): boolean => {
    const slug = endpoint.replace(/^\/api\//, '')
    return existsSync(join(SERVER_API_DIRECTORY, slug, 'index.get.ts'))
  }

  const errors = checkSourceEndpointCoverageGuard(entries, routeExists)

  if (errors.length) {
    console.error(
      `Model Builder source-endpoint coverage guard failed: ${errors.length} ` +
        'SOURCE_TYPES endpoint(s) in modelBuilderRecipes.ts have no matching ' +
        'server route:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    `Model Builder source-endpoint coverage guard passed: all ${entries.length} ` +
      'SOURCE_TYPES endpoint references resolve to a real ' +
      'server/api/<slug>/index.get.ts route.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
