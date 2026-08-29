// /utils/scripts/auditDefaultArt.ts
//
// Reconcile utils/defaultArtPool.ts against the stand-in art that is actually
// being served.
//
// WHY THIS IS A SCRIPT AND NOT A RUNTIME LOOKUP. public/images/ is gitignored
// and served off the media share, so neither the build nor a serverless route
// can enumerate it -- the repo has to carry the list. That list going stale is
// the failure mode: names added before their renders land show a broken image
// (kr-art-plate degrades it to a placeholder icon), and renders that landed but
// were never added are art nobody sees. This closes both directions by asking
// the live site what exists.
//
//   npx tsx utils/scripts/auditDefaultArt.ts            # report only
//   npx tsx utils/scripts/auditDefaultArt.ts --write    # rewrite the manifest
//   KR_BASE_URL=https://kindrobots.org npx tsx ... --write
//
// Run it after the art queue drains a batch of newsfeed-default requests
// (conductor projects/art-prompts.yaml). Safe to run any time: without --write
// it only reports.

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  DEFAULT_ART_POOL_TARGET,
  READY_DEFAULT_ART,
  defaultArtPath,
} from '../defaultArtPool'

const ROOT = process.cwd()
const MANIFEST_PATH = join(ROOT, 'utils/defaultArtPool.ts')
const START_MARKER = '/* default-art:ready-start */'
const END_MARKER = '/* default-art:ready-end */'

const BASE_URL = (
  process.env.KR_BASE_URL ||
  process.env.MEDIA_ORIGIN ||
  'https://kindrobots.org'
).replace(/\/+$/, '')

const REQUEST_TIMEOUT_MS = 8_000

/** Scan a little past the target so a batch that overshot is still found. */
const SCAN_HEADROOM = 8

const write = process.argv.includes('--write')

async function isServed(path: string): Promise<boolean> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
    })

    /*
     * A 200 with a zero-length body is a placeholder some CDNs serve for a
     * missing object; treating it as present would put an empty frame back in
     * the pool this file exists to keep full.
     */
    if (!response.ok) return false

    const length = Number(response.headers.get('content-length') ?? '1')
    return !Number.isFinite(length) || length > 0
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

async function main(): Promise<void> {
  const candidates = Array.from(
    { length: DEFAULT_ART_POOL_TARGET + SCAN_HEADROOM },
    (_, index) => defaultArtPath(index + 1),
  )

  console.log(
    `Checking ${candidates.length} candidate stand-ins against ${BASE_URL} …`,
  )

  const results = await Promise.all(
    candidates.map(async (path) => ({ path, served: await isServed(path) })),
  )

  const served = results.filter((entry) => entry.served).map((e) => e.path)
  const known = new Set(READY_DEFAULT_ART)

  const added = served.filter((path) => !known.has(path))
  const missing = READY_DEFAULT_ART.filter((path) => !served.includes(path))

  console.log(`\n  serving  ${served.length}`)
  console.log(`  in manifest  ${READY_DEFAULT_ART.length}`)

  if (added.length) {
    console.log(`\n  new, not yet in the manifest (${added.length}):`)
    for (const path of added) console.log(`    + ${path}`)
  }

  if (missing.length) {
    console.log(
      `\n  in the manifest but NOT being served (${missing.length}) — these render as empty plates:`,
    )
    for (const path of missing) console.log(`    - ${path}`)
  }

  if (!added.length && !missing.length) {
    console.log('\nManifest matches what is served. Nothing to do.')
    return
  }

  if (!write) {
    console.log('\nRe-run with --write to apply.')
    return
  }

  if (!served.length) {
    /*
     * Every check failing means the site was unreachable far more often than
     * it means every stand-in was deleted, and emptying the pool would strip
     * the fallback from every card in the app. Refuse rather than "fix" it.
     */
    throw new Error(
      `Refusing to write an empty manifest: nothing at ${BASE_URL} answered. Check the base URL and network before rerunning.`,
    )
  }

  const source = readFileSync(MANIFEST_PATH, 'utf8')
  const start = source.indexOf(START_MARKER)
  const end = source.indexOf(END_MARKER)

  if (start === -1 || end === -1 || end < start) {
    throw new Error(
      `Could not find the ${START_MARKER} / ${END_MARKER} markers in ${MANIFEST_PATH}.`,
    )
  }

  const block = [
    START_MARKER,
    'export const READY_DEFAULT_ART: readonly string[] = [',
    ...served.map((path) => `  '${path}',`),
    ']',
  ].join('\n')

  writeFileSync(
    MANIFEST_PATH,
    `${source.slice(0, start)}${block}\n${source.slice(end)}`,
    'utf8',
  )

  console.log(
    `\nWrote ${served.length} stand-ins into ${MANIFEST_PATH}. Run prettier and commit.`,
  )
}

await main()
