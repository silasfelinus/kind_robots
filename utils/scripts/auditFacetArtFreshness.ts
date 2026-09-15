// /utils/scripts/auditFacetArtFreshness.ts
//
// Answer one question the codebase could never answer:
//
//     Does every Facet have a picture made from the prompt it carries RIGHT NOW?
//
//   npx tsx utils/scripts/auditFacetArtFreshness.ts
//   npx tsx utils/scripts/auditFacetArtFreshness.ts --taxonomy GENRE,THEME
//   npx tsx utils/scripts/auditFacetArtFreshness.ts --json
//
//   export KR_API_BASE=https://kindrobots.org
//   export KR_API_TOKEN=<admin token>
//
// WHY
// ---
// Every failure in the facet-art work was caught the same way: a number did not
// match, or Silas looked at a card and the picture was wrong. Never by a test.
// The producer's own reporting cannot help here, because it reports what it
// QUEUED -- and every one of these bugs happened after the queue:
//
//   * 146 authored prompts written, then every job cancelled before claim
//     (missing `payload.retry`). Producer said `curatedPromptRequeued: 146`.
//   * 45 swatch prompts never written at all, because the applier died during
//     module import. The applier printed nothing; it exited before its first log.
//   * 36 dream bundles recorded `status: complete` over a Character holding no
//     Facets, for six weeks.
//
// In each case the catalog and the art disagreed, and nothing was looking at
// both. This looks at both, from the outside, over the live API -- the same way
// Silas does when he opens the picker.
//
// THE THREE LAYERS
// ----------------
// Art only counts as fresh when all three agree:
//
//   1. SOURCE   utils/seeds/facetArtPrompts.ts -- what we authored
//   2. CATALOG  facet.artPrompt                -- what the database holds
//   3. RENDER   artImage.promptString          -- what actually got painted
//
// A break between 1 and 2 means an apply step never ran (or was blocked).
// A break between 2 and 3 means the prompt changed and the art was never
// rebuilt -- the stale-render case, which is invisible from every other angle
// because the Facet HAS a picture and nothing reports it as missing.
// Every sibling script that reads KR_API_TOKEN loads the .env first. This one
// did not, so on the box where the token actually lives it exited 2 with
// "KR_API_TOKEN is required" while the token was sitting in .env the whole time.
import 'dotenv/config'
import { CURATED_FACET_ART_PROMPTS } from '../seeds/facetArtPrompts'
import { RETIRED_PROMPT_ENHANCEMENT_SLUGS } from '../promptEnhancementPolicy'

const API_BASE = process.env.KR_API_BASE ?? 'https://kindrobots.org'
const TOKEN = process.env.KR_API_TOKEN ?? ''

const KNOWN_FLAGS = new Set(['--taxonomy', '--json', '--limit', '--help'])

type Facet = {
  id: number
  slug: string
  title: string
  taxonomy: string
  artPrompt: string | null
  artImageId: number | null
  imagePath: string | null
  isActive: boolean
}

type Finding = {
  slug: string
  taxonomy: string
  id: number
  state:
    | 'ok'
    | 'no-art'
    | 'static-art'
    | 'apply-drift'
    | 'render-drift'
    | 'no-prompt'
  detail: string
}

function parseArgs(argv: string[]) {
  const taxonomies: string[] = []
  let json = false
  let limit = 0
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i] ?? ''
    if (!arg.startsWith('--')) continue
    const [rawFlag, inline] = arg.split('=', 2)
    const flag = rawFlag ?? ''
    if (!KNOWN_FLAGS.has(flag)) {
      console.error(`Unknown flag: ${flag}`)
      console.error(`Known flags: ${[...KNOWN_FLAGS].join(', ')}`)
      process.exit(2)
    }
    if (flag === '--json') json = true
    if (flag === '--help') {
      console.log(readHelp())
      process.exit(0)
    }
    if (flag === '--taxonomy') {
      const value = inline ?? argv[++i] ?? ''
      taxonomies.push(...value.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean))
    }
    if (flag === '--limit') limit = Number(inline ?? argv[++i] ?? 0) || 0
  }
  return { taxonomies, json, limit }
}

function readHelp(): string {
  return [
    'auditFacetArtFreshness -- does every Facet have art made from its current prompt?',
    '',
    '  --taxonomy GENRE,THEME   restrict to these taxonomies (default: all art-bearing ones)',
    '  --limit N                stop after N facets (for a quick look)',
    '  --json                   emit findings as JSON instead of a report',
  ].join('\n')
}

async function api<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
  })
  if (!res.ok) throw new Error(`${path} -> ${res.status} ${res.statusText}`)
  const body = (await res.json()) as { success?: boolean; data?: T }
  if (body && typeof body === 'object' && 'data' in body) return body.data as T
  return body as unknown as T
}

const DEFAULT_TAXONOMIES = ['GENRE', 'THEME', 'SETTING', 'OCCUPATION', 'ROLE', 'ARCHETYPE', 'PROMPT_ENHANCEMENT']

async function fetchFacets(taxonomies: string[]): Promise<Facet[]> {
  const rows: Facet[] = []
  for (const taxonomy of taxonomies) {
    let skip = 0
    for (;;) {
      const batch = await api<Facet[]>(
        `/api/facets?taxonomy=${encodeURIComponent(taxonomy)}&take=250&skip=${skip}&includeInactive=true`,
      )
      if (!batch?.length) break
      rows.push(...batch)
      skip += batch.length
      if (batch.length < 250) break
    }
  }
  return rows
}

/**
 * The render is fresh when the prompt the Facet carries now is the prompt that
 * was painted. The producer appends framing guidance to the stored prompt, so
 * containment -- not equality -- is the honest comparison.
 */
export function renderMatchesPrompt(artPrompt: string, promptString: string): boolean {
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase()
  return norm(promptString).includes(norm(artPrompt))
}

async function main(): Promise<void> {
  const { taxonomies, json, limit } = parseArgs(process.argv.slice(2))
  if (!TOKEN) {
    console.error(
      'KR_API_TOKEN is required -- this reads the live catalog over the API.\n' +
        'It is read from the environment or from .env in the repo root, the same\n' +
        'way applyCuratedFacetArtPrompts.ts reads it. To pass it for one run:\n' +
        '  KR_API_TOKEN=<admin token> npx tsx utils/scripts/auditFacetArtFreshness.ts',
    )
    process.exit(2)
  }

  const wanted = taxonomies.length ? taxonomies : DEFAULT_TAXONOMIES
  const facets = await fetchFacets(wanted)
  const scoped = limit ? facets.slice(0, limit) : facets

  // The retired cargo-cult enhancements were deliberately stripped of their
  // prompts and deactivated; they are not missing art, they are done with.
  const retired = new Set<string>(RETIRED_PROMPT_ENHANCEMENT_SLUGS)

  const findings: Finding[] = []
  for (const facet of scoped) {
    if (retired.has(facet.slug)) continue
    const authored = CURATED_FACET_ART_PROMPTS[facet.slug]
    const live = (facet.artPrompt ?? '').trim()

    if (!live) {
      findings.push({ ...base(facet), state: 'no-prompt', detail: 'no artPrompt on the Facet' })
      continue
    }
    // Layer 1 -> 2. Only checkable for slugs we actually authored.
    if (authored && !renderMatchesPrompt(authored, live)) {
      findings.push({
        ...base(facet),
        state: 'apply-drift',
        detail: 'catalog prompt is not the authored one -- an apply step never landed',
      })
      continue
    }
    if (!facet.artImageId) {
      /*
       * A hand-placed asset under /images is real art -- it is what the picker
       * shows -- but it carries no generated provenance, so there is no painted
       * prompt to compare and nothing here can call it stale. Reporting these as
       * missing would put 34 permanent rows in every run, and a report that is
       * wrong about the same rows every day stops being read.
       */
      findings.push(
        facet.imagePath
          ? {
              ...base(facet),
              state: 'static-art',
              detail: `static asset ${facet.imagePath} -- no generated provenance to check`,
            }
          : { ...base(facet), state: 'no-art', detail: 'prompt present, no art' },
      )
      continue
    }
    // Layer 2 -> 3.
    let promptString: string
    try {
      const image = await api<{ promptString?: string | null }>(`/api/art/image/${facet.artImageId}`)
      promptString = (image?.promptString ?? '').trim()
    } catch (error) {
      findings.push({
        ...base(facet),
        state: 'render-drift',
        detail: `could not read ArtImage ${facet.artImageId}: ${(error as Error).message}`,
      })
      continue
    }
    if (!renderMatchesPrompt(live, promptString)) {
      findings.push({
        ...base(facet),
        state: 'render-drift',
        detail: `art ${facet.artImageId} was painted from a different prompt`,
      })
      continue
    }
    findings.push({ ...base(facet), state: 'ok', detail: '' })
  }

  if (json) {
    console.log(JSON.stringify(findings, null, 2))
  } else {
    report(findings, scoped.length)
  }

  // static-art is a category, not a defect: it never fails the run.
  const stale = findings.filter((f) => f.state !== 'ok' && f.state !== 'static-art')
  process.exit(stale.length ? 1 : 0)
}

function base(facet: Facet) {
  return { slug: facet.slug, taxonomy: facet.taxonomy, id: facet.id }
}

function report(findings: Finding[], total: number): void {
  const byState = new Map<string, Finding[]>()
  for (const finding of findings) {
    const list = byState.get(finding.state) ?? []
    list.push(finding)
    byState.set(finding.state, list)
  }
  const ok = byState.get('ok')?.length ?? 0
  const staticArt = byState.get('static-art')?.length ?? 0
  console.log(`Facets checked: ${total}`)
  console.log(`  fresh art from the current prompt: ${ok}`)
  if (staticArt) console.log(`  hand-placed static art (not checkable): ${staticArt}`)
  for (const state of ['apply-drift', 'render-drift', 'no-art', 'no-prompt', 'static-art'] as const) {
    const list = byState.get(state) ?? []
    if (!list.length) continue
    console.log(`\n  ${state}: ${list.length}`)
    console.log(`    ${list[0]?.detail ?? ''}`)
    for (const finding of list.slice(0, 25)) {
      console.log(`      ${finding.taxonomy.padEnd(18)} ${finding.slug}`)
    }
    if (list.length > 25) console.log(`      ... and ${list.length - 25} more`)
  }
  const stale = findings.length - ok - staticArt
  console.log(
    stale
      ? `\n${stale} facet(s) are showing art that does not match their current prompt, or no art at all.`
      : '\nEvery facet checked has art painted from the prompt it carries now.',
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(2)
})
