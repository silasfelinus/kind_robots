// /utils/scripts/verifyContentVisibilityCoverage.ts
//
// Every READ endpoint that queries a model carrying isPublic/isMature must
// apply a visibility rule, or be listed here with a reason.
//
// Silas, 2026-09-17: "this should be an api barrier, not a front end barrier",
// and "it should cover all relevant objects. this is a global situation."
//
// A one-time grep answered that once. This answers it on every run, because the
// failure mode is a NEW endpoint added later without the guard -- which is
// exactly how the seven found on 2026-09-17 came to exist.
//
// A file counts as guarded when it uses any of the three mechanisms the
// codebase actually has:
//
//   visibilityWhere()        the Prisma fragment, for list queries
//   canView()                the per-object check, richer: Grants and Packs
//   effectiveShowMature()    the maturity half on its own
//
// ...or when it is admin-gated, or scoped to the caller's own rows.
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const API = join(ROOT, 'server/api')

/** Models carrying isPublic and/or isMature, from schema.prisma. */
const GUARDED_MODELS = [
  'artImage', 'artCollection', 'bot', 'challenge', 'character', 'chat',
  'directMessage', 'downloadRequest', 'dream', 'facet', 'monster',
  'narratorTopic', 'pitchSheet', 'project', 'prompt', 'resource', 'reward',
  'scenario', 'smartIcon', 'theme',
]

/*
 * Read endpoints that legitimately query these models without a visibility
 * filter. Each needs a reason, and the reason has to be about the DATA rather
 * than about convenience.
 */
const ALLOWED: Record<string, string> = {
  'server/api/conductor/projects.get.ts':
    'Public one-way projection of Conductor data. Selects presentation fields ' +
    'only (conductorSlug, title, imagePath, cardPath) and exposes no user ' +
    'content; filtering it breaks the projection.',
  'server/api/bots/topics.get.ts':
    'NarratorTopic is narrator configuration, not user content.',
  'server/api/themes/[id].get.ts':
    'Theme is site styling. isPublic marks a shared theme rather than private ' +
    'user content.',
}

function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else if (entry.endsWith('.ts')) out.push(full)
  }
  return out
}

/** Models with an isMature column; Theme and NarratorTopic have none. */
const MATURE_MODELS = GUARDED_MODELS.filter(
  (model) => model !== 'theme' && model !== 'narratorTopic' && model !== 'aquarium',
)

const unguarded: string[] = []
const maturityOnly: string[] = []

for (const file of walk(API)) {
  const rel = relative(ROOT, file)
  const src = readFileSync(file, 'utf8')
  const base = rel.split('/').pop() as string

  // Reads only. A mutation's authorisation is a different contract.
  const isRead = base.endsWith('.get.ts') || base === 'index.ts'
  if (!isRead) continue

  const queries = GUARDED_MODELS.some((model) =>
    new RegExp(`prisma\\.${model}\\.(findMany|findFirst|findUnique)`).test(src),
  )
  if (!queries) continue

  /*
   * Hand-rolled guards count. Several endpoints predate the shared helpers and
   * check privacy inline -- bots/[id].get.ts reads `bot.isPublic` and then
   * requires owner-or-admin, which is correct. Treating those as unguarded
   * overstates the problem, and a sweep that cries wolf gets ignored.
   */
  const handRolledPrivacy =
    /\.isPublic\b/.test(src) && /userIsAdmin|isAdmin|isOwner/.test(src)

  const guarded =
    /visibilityWhere|canView|effectiveShowMature|isMaturityRestricted/.test(src) ||
    handRolledPrivacy
  const adminOnly =
    /requireAdminApiUser|requireMachineUser|isServerKey/.test(src) &&
    !/getOptionalApiUser/.test(src)
  const ownScoped = /userId:\s*(auth|user)\.|auth\.user\.id/.test(src)
  const publicOnly = /isPublic:\s*true/.test(src)

  if (rel in ALLOWED) continue

  /*
   * Maturity is reported separately from privacy, because they fail
   * differently. An endpoint can be perfectly correct about who owns a row and
   * still hand a mature one to a CHILD -- bots/[id].get.ts was exactly that.
   */
  const handlesMaturity =
    /visibilityWhere|canViewWithMaturity|effectiveShowMature|isMaturityRestricted/.test(
      src,
    )
  const touchesMatureModel = MATURE_MODELS.some((model) =>
    new RegExp(`prisma\\.${model}\\.(findMany|findFirst|findUnique)`).test(src),
  )

  if (!(guarded || adminOnly || ownScoped || publicOnly)) {
    unguarded.push(rel)
  } else if (touchesMatureModel && !handlesMaturity && !adminOnly) {
    maturityOnly.push(rel)
  }
}

assert.deepEqual(
  unguarded,
  [],
  `Read endpoints query isPublic/isMature models with no visibility rule:\n` +
    unguarded.map((f) => `  ${f}`).join('\n') +
    `\n\nApply visibilityWhere() or canView(), or add the file to ALLOWED ` +
    `with a reason about the data.`,
)

// The allowlist must not rot into a place to hide things.
assert.ok(
  Object.keys(ALLOWED).length <= 6,
  'The visibility allowlist is growing. Each entry is an endpoint serving ' +
    'flag-carrying models with no filter; they should be rare.',
)

if (maturityOnly.length) {
  console.log(
    `\nPrivacy handled, MATURITY not (${maturityOnly.length}) -- these can ` +
      `serve a mature row to a maturity-restricted account:`,
  )
  for (const file of maturityOnly) console.log(`  ${file}`)
}

console.log(
  `\nverifyContentVisibilityCoverage: ${unguarded.length} unguarded, ` +
    `${maturityOnly.length} missing only maturity, ` +
    `${Object.keys(ALLOWED).length} justified exceptions`,
)
