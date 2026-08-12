// /utils/scripts/verifyEarnedKarmaWiring.ts
//
// interface-vision/t-066. Two contracts, both of which were violated in
// practice before this file existed.
//
// 1. ONE FETCH. /api/economy/karma-earned is requested from exactly one place
//    on the client: stores/userStore.ts. reward-gallery wrote the
//    first copy under t-019 and its comment invited "the remaining eleven
//    reactable-card consumers" to copy it. Two did, and by the third copy they
//    had already diverged — two clamped to the endpoint's 200-item batch limit
//    and one did not, so a gallery rendering more than 200 cards would have
//    taken a 400 instead of showing karma. That is what copy-the-pattern buys;
//    this check is what stops the twelfth copy.
//
// 2. THE REF TYPES ARE THE REACTION TARGETS. utils/karmaRefTypes.ts claims the
//    set of karma-earning types is the set of reaction target fields "by
//    construction," because the only award call site that writes refType
//    derives it from the target field (`botId` -> `bot`). That claim is load
//    bearing: it is why a new gallery needs no per-type award wiring before it
//    can show a total. Here it is checked against the map it describes, so
//    adding a reaction category without a karma refType (or the reverse) fails
//    instead of silently producing cards whose karma is always zero.
//
//   npx tsx utils/scripts/verifyEarnedKarmaWiring.ts
import { readFile } from 'node:fs/promises'
import { readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { KARMA_REF_TYPES } from '../karmaRefTypes'
import { containsCode } from './lib/sourceText'

const root = process.cwd()

/** The endpoint path, as it appears in a fetch call. */
const ENDPOINT = '/api/economy/karma-earned'

/** The single client-side owner of that fetch. */
const OWNER = 'stores/userStore.ts'

/** Where the server derives refType from the reaction's target field. */
const REACTION_ROUTE = 'server/api/reactions/index.post.ts'

/** Client trees a gallery could plausibly fetch from. */
const CLIENT_DIRS = ['components', 'pages', 'stores', 'utils']

const SKIP_DIRS = new Set(['node_modules', '.nuxt', '.output', 'dist'])

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.(ts|vue)$/.test(entry)) out.push(full)
  }
  return out
}

/**
 * The refTypes the reaction route can actually produce, read out of
 * getExpectedTargetField's map: each `[Reaction_reactionCategory.X]: 'fooId'`
 * entry yields `foo`. Entries mapped to `null` (MESSAGE) name no object and
 * are correctly absent from the karma list.
 */
function reactionRefTypes(source: string): string[] {
  const map = source.slice(
    source.indexOf('function getExpectedTargetField'),
    source.indexOf('function buildTargetWhere'),
  )

  if (!map) throw new Error(`Could not locate getExpectedTargetField in ${REACTION_ROUTE}.`)

  return Array.from(map.matchAll(/:\s*'([a-zA-Z]+)Id'/g)).map(
    (match) => match[1] as string,
  )
}

function sorted(values: readonly string[]): string[] {
  return [...values].sort((a, b) => a.localeCompare(b))
}

/**
 * Mutation check for the parser above, per the t-063 rule that a checker only
 * ever seen to pass is indistinguishable from one that cannot fail. A map
 * missing an entry must be reported as missing, not silently tolerated.
 */
function verifyReactionRefTypesFixture(): void {
  const fixture = `function getExpectedTargetField(category: X) {
  const map = {
    [X.BOT]: 'botId',
    [X.ART_IMAGE]: 'artImageId',
    [X.MESSAGE]: null,
  }
  return map[category] ?? null
}
function buildTargetWhere() {}`

  const found = sorted(reactionRefTypes(fixture))
  const expected = ['artImage', 'bot']

  if (JSON.stringify(found) !== JSON.stringify(expected)) {
    throw new Error(
      `Self-test failed: parsed [${found.join(', ')}], expected [${expected.join(', ')}].`,
    )
  }
}

async function main(): Promise<void> {
  verifyReactionRefTypesFixture()

  const failures: string[] = []

  /* --- contract 1: one fetch ------------------------------------------- */

  const offenders: string[] = []

  for (const dir of CLIENT_DIRS) {
    for (const file of walk(resolve(root, dir))) {
      const rel = relative(root, file).replace(/\\/g, '/')
      if (rel === OWNER) continue
      // This verifier names the endpoint in prose; so may a comment pointing
      // a reader at the store. Only real code counts.
      if (rel.startsWith('utils/scripts/')) continue
      if (containsCode(await readFile(file, 'utf8'), ENDPOINT)) offenders.push(rel)
    }
  }

  if (offenders.length) {
    failures.push(
      `${ENDPOINT} must be requested only from ${OWNER}, but these fetch it directly:\n` +
        offenders.map((path) => `    - ${path}`).join('\n') +
        `\n  Use useUserStore().trackEarnedKarma(refType, () => visibleIds) instead of a new copy.`,
    )
  }

  /* --- contract 2: refTypes are the reaction targets -------------------- */

  const route = await readFile(resolve(root, REACTION_ROUTE), 'utf8')
  const fromReactions = sorted(reactionRefTypes(route))
  const declared = sorted(KARMA_REF_TYPES)

  const missing = fromReactions.filter((type) => !declared.includes(type))
  const extra = declared.filter((type) => !fromReactions.includes(type))

  if (missing.length) {
    failures.push(
      `${REACTION_ROUTE} can award karma to [${missing.join(', ')}], which utils/karmaRefTypes.ts ` +
        `does not list — the endpoint would reject those objects with a 400.`,
    )
  }

  if (extra.length) {
    failures.push(
      `utils/karmaRefTypes.ts lists [${extra.join(', ')}], which no reaction category targets — ` +
        `a gallery wired to one would show a permanent zero.`,
    )
  }

  if (failures.length) {
    throw new Error(`Earned-karma wiring contract failed:\n- ${failures.join('\n- ')}`)
  }

  process.stdout.write(
    `Earned-karma wiring verified: one fetch (${OWNER}), ` +
      `${declared.length} refTypes matching ${REACTION_ROUTE}'s reaction targets.\n`,
  )
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
