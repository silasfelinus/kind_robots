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
// exactly how the ones found on 2026-09-17 came to exist.
//
// WHAT IT READS. Not the file: the QUERY. The first version tested the whole
// source for guard-shaped text, and that cleared two kinds of endpoint that
// were serving everything:
//
//   1. `isPublic: true` inside a SELECT asks for the column and filters
//      nothing. art/collection/index.get.ts read as "public only" while
//      listing every collection, private and mature, to anyone.
//   2. A filter on a DIFFERENT model counts for nothing. scenarios/index.get.ts
//      builds a careful Facet visibility filter for a nested relation and then
//      does `prisma.scenario.findMany()` with no `where` at all.
//
// So each `prisma.<model>.find*()` call is located, its argument brace-matched,
// and only its OWN top-level `where` is read -- resolving `where,` shorthand and
// `where: someVariable` back to the variable's definition, since that is how
// most of these are actually written. A call whose where carries no visibility
// token is only excused by a per-object check elsewhere in the file.
//
// The mechanisms that count:
//
//   visibilityWhere()        the Prisma fragment, for list queries
//   canView()                the per-object check, richer: Grants and Packs
//   canViewWithMaturity()    that, plus the maturity rule
//   maturityAllowsRow()      the maturity rule for one already-fetched row, with
//                            the same own-row carve-out visibilityWhere() makes,
//                            so a listing and its detail page agree
//   viewerShowsMature()      the maturity rule: logged in, not a CHILD, opted in
//   effectiveShowMature()    the role-plus-preference half on its own
//   isMaturityRestricted()   the CHILD barrier alone -- still counts as handling
//                            maturity, but it is the WEAKER half: it stops a
//                            child and lets an adult who never opted in through.
//                            Prefer viewerShowsMature in new code.
//
// ...or one of the model-specific filters that predate those and are
// equivalent for their model:
//
//   buildArtImageWhere()       ArtImage: public-or-own (admin sees all), mature
//   buildArtCollectionWhere()  ArtCollection: the same rule
//   forumReadWhere()           Chat-as-forum-post: isPublic + isActive, mature
//   forumReplyReadWhere()      excluded unless getForumReadContext() allowed
//   requireForumThreadRoot()   it, which it will not for a CHILD
//
// ...or when the endpoint is admin-gated.
//
// Only files with a default export are routes. `index.ts` beside an
// `index.get.ts` is a helper module Nitro never serves -- server/api/art and
// server/api/bots both have one. Their remaining unfiltered reads are
// write-path lookups (dedupe before a create, the post-seed re-read), checked
// by hand on 2026-09-17; the dead unfiltered readers that used to sit in
// bots/index.ts and prompts/index.ts were deleted rather than guarded.
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const API = join(ROOT, 'server/api')

/** Models carrying isPublic and/or isMature, from schema.prisma. */
const GUARDED_MODELS = [
  'artImage',
  'artCollection',
  'bot',
  'challenge',
  'character',
  'chat',
  'directMessage',
  'downloadRequest',
  'dream',
  'facet',
  'monster',
  'narratorTopic',
  'pitchSheet',
  'project',
  'prompt',
  'resource',
  'reward',
  'scenario',
  'smartIcon',
  'theme',
]

/** Models with an isMature column; Theme and NarratorTopic have none. */
const MATURE_MODELS = GUARDED_MODELS.filter(
  (model) => model !== 'theme' && model !== 'narratorTopic',
)

/**
 * Models with an isPublic column. Challenge, DirectMessage and DownloadRequest
 * have none -- there is no privacy flag to apply, so maturity is their whole
 * rule and asking for a privacy filter on them only produces noise.
 */
const PRIVATE_MODELS = GUARDED_MODELS.filter(
  (model) =>
    model !== 'challenge' &&
    model !== 'directMessage' &&
    model !== 'downloadRequest',
)

/** Helpers whose return value IS a correct visibility filter. */
const FILTER_BUILDERS = [
  'visibilityWhere',
  'buildArtImageWhere',
  'buildArtCollectionWhere',
  'forumReadWhere',
  'forumReplyReadWhere',
]

/** Helpers whose return value additionally settles maturity. */
const MATURITY_BUILDERS = FILTER_BUILDERS

/** Per-object checks that legitimately replace a filter on the query. */
const OBJECT_CHECKS = [
  'canView',
  'canViewWithMaturity',
  'maturityAllowsRow',
  'viewerShowsMature',
  'effectiveShowMature',
  'isMaturityRestricted',
  'requireForumThreadRoot',
]

/** Per-object checks that settle maturity specifically. */
const MATURITY_CHECKS = [
  'canViewWithMaturity',
  'maturityAllowsRow',
  'viewerShowsMature',
  'effectiveShowMature',
  'isMaturityRestricted',
  'requireForumThreadRoot',
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
  'server/api/themes/index.get.ts':
    'Theme is site styling. isPublic marks a shared theme rather than private ' +
    'user content.',
  'server/api/todos/project/[projectId].get.ts':
    'The Project row is read as `{ userId: true }` purely to authorise the ' +
    'caller and is never returned. What comes back is Todos, which carry no ' +
    'isPublic or isMature of their own.',
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

/** Index of the `}` closing the `{` at `open`, or -1. */
function matchBrace(src: string, open: number): number {
  let depth = 0
  for (let i = open; i < src.length; i += 1) {
    if (src[i] === '{') depth += 1
    else if (src[i] === '}') {
      depth -= 1
      if (depth === 0) return i
    }
  }
  return -1
}

/**
 * The value of `key` at the TOP level of an object-literal region -- depth 1,
 * so a `where` belonging to a nested relation include is not mistaken for the
 * query's own. Returns `'\0shorthand'` for `{ where, ... }`, which the caller
 * resolves against the file's variables.
 */
function topLevelValue(region: string, key: string): string | null {
  let depth = 0

  for (let i = 0; i < region.length; i += 1) {
    const char = region[i]
    if (char === '{' || char === '[' || char === '(') depth += 1
    else if (char === '}' || char === ']' || char === ')') depth -= 1
    else if (depth === 1 && region.startsWith(key, i)) {
      const before = region[i - 1] ?? ''
      if (/[\w$.]/.test(before)) continue

      let j = i + key.length
      while (j < region.length && /\s/.test(region[j] as string)) j += 1

      if (region[j] === ',' || region[j] === '}') return '\0shorthand'
      if (region[j] !== ':') continue

      j += 1
      while (j < region.length && /\s/.test(region[j] as string)) j += 1

      if (region[j] === '{') {
        const close = matchBrace(region, j)
        return close === -1 ? region.slice(j) : region.slice(j, close + 1)
      }

      // An identifier, call, or ternary: take it to the next top-level comma.
      let inner = 0
      let k = j
      for (; k < region.length; k += 1) {
        const c = region[k]
        if (c === '{' || c === '[' || c === '(') inner += 1
        else if (c === '}' || c === ']' || c === ')') {
          if (inner === 0) break
          inner -= 1
        } else if (c === ',' && inner === 0) break
      }
      return region.slice(j, k)
    }
  }

  return null
}

/** `const foo = <expr>` bodies, so `where: foo` can be resolved. */
function localBindings(src: string): Map<string, string> {
  const bindings = new Map<string, string>()
  const re = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=\n]*)?=\s*/g
  let match: RegExpExecArray | null

  while ((match = re.exec(src))) {
    const start = match.index + match[0].length
    let depth = 0
    let i = start

    for (; i < src.length; i += 1) {
      const c = src[i]
      if (c === '{' || c === '[' || c === '(') depth += 1
      else if (c === '}' || c === ']' || c === ')') {
        if (depth === 0) break
        depth -= 1
      } else if (depth === 0 && (c === '\n' || c === ';')) {
        // A binding can wrap; only stop at a newline that ends a statement.
        const rest = src.slice(i + 1, i + 200)
        if (!/^\s*[.?:]/.test(rest)) break
      }
    }

    bindings.set(match[1] as string, src.slice(start, i))
  }

  return bindings
}

type Query = { model: string; where: string }

function queries(src: string, bindings: Map<string, string>): Query[] {
  const out: Query[] = []
  const re =
    /prisma\.([A-Za-z_$][\w$]*)\.(findMany|findFirst|findUnique|findUniqueOrThrow|findFirstOrThrow)\s*\(/g
  let match: RegExpExecArray | null

  while ((match = re.exec(src))) {
    const model = match[1] as string
    if (!GUARDED_MODELS.includes(model)) continue

    const open = src.indexOf('{', match.index + match[0].length - 1)
    if (open === -1) continue

    const close = matchBrace(src, open)
    const region = close === -1 ? src.slice(open) : src.slice(open, close + 1)

    let where = topLevelValue(region, 'where') ?? ''
    if (where === '\0shorthand') where = bindings.get('where') ?? ''
    else {
      const identifier = where.trim().match(/^([A-Za-z_$][\w$]*)$/)?.[1]
      if (identifier) where = bindings.get(identifier) ?? where
    }

    /*
     * Where-objects are routinely assembled from other locals, and just as
     * often from an array that is `push`ed into a clause at a time
     * (dreams/index.get.ts builds `andFilters` over thirty lines). Splice in
     * both, or a correctly-filtered endpoint reads as unfiltered.
     */
    for (const [name, value] of bindings) {
      if (!new RegExp(`\\b${name}\\b`).test(where)) continue
      if (!where.includes(value)) where += `\n/* ${name} */ ${value}`

      const pushes = new RegExp(`\\b${name}\\.push\\s*\\(`, 'g')
      let push: RegExpExecArray | null
      while ((push = pushes.exec(src))) {
        const open = push.index + push[0].length - 1
        let depth = 0
        let i = open
        for (; i < src.length; i += 1) {
          if ('{(['.includes(src[i] as string)) depth += 1
          else if (')}]'.includes(src[i] as string)) {
            depth -= 1
            if (depth === 0) break
          }
        }
        where += `\n/* ${name}.push */ ${src.slice(open, i + 1)}`
      }
    }

    out.push({ model, where })
  }

  return out
}

function mentions(text: string, names: string[]): boolean {
  return names.some((name) => new RegExp(`\\b${name}\\b`).test(text))
}

const unguarded: string[] = []
const maturityOnly: string[] = []

for (const file of walk(API)) {
  const rel = relative(ROOT, file)
  if (rel in ALLOWED) continue

  const src = readFileSync(file, 'utf8')
  const base = rel.split('/').pop() as string

  // Reads only. A mutation's authorisation is a different contract, and only
  // a file with a default export is a route at all.
  const isRoute = /export default/.test(src)
  const isRead = base.endsWith('.get.ts') || (base === 'index.ts' && isRoute)
  if (!isRead || !isRoute) continue

  const bindings = localBindings(src)
  const found = queries(src, bindings)
  if (!found.length) continue

  const adminOnly =
    /requireAdminApiUser|requireMachineUser|isServerKey/.test(src) &&
    !/getOptionalApiUser/.test(src)
  if (adminOnly) continue

  /*
   * A per-object check after the query is a legitimate alternative to a filter
   * on it -- characters/[id].get.ts fetches by id and then asks canView().
   */
  /*
   * Hand-rolled ones count too, and several endpoints predate the helpers:
   * bots/[id].get.ts reads `bot.isPublic` off the fetched row and then
   * requires owner-or-admin, which is correct. `row.isPublic` is a check;
   * `isPublic: true` is a select key, which is why this wants the dot.
   */
  const handRolledPrivacy =
    /\.isPublic\b/.test(src) && /userIsAdmin|isAdmin|isOwner/.test(src)
  const handRolledMaturity = /\.isMature\b/.test(src)

  /*
   * Scoping a read to the CALLER -- their own rows, or a membership row keyed
   * on their id -- answers privacy more strictly than isPublic ever could.
   * Deliberately narrow: it wants a comparison against the caller's own id,
   * not just any mention of a userId column, because `where: { userId }` from
   * a query parameter is the opposite of a guard.
   */
  const ownScoped =
    /userId:\s*(?:auth\.)?user\.id\b/.test(src) ||
    /\.userId\s*!==?\s*(?:auth\.)?user\.id\b/.test(src)

  const objectCheck =
    mentions(src, OBJECT_CHECKS) || handRolledPrivacy || ownScoped
  const maturityCheck = mentions(src, MATURITY_CHECKS) || handRolledMaturity

  let privacyGap = false
  let maturityGap = false

  for (const query of found) {
    const filtered =
      /\bisPublic\b/.test(query.where) ||
      /\buserId\b/.test(query.where) ||
      mentions(query.where, FILTER_BUILDERS)

    if (PRIVATE_MODELS.includes(query.model) && !filtered && !objectCheck) {
      privacyGap = true
    }

    if (!MATURE_MODELS.includes(query.model)) continue

    /*
     * A query that pins userId to the CALLER's own id is reading that person's
     * own records. Maturity is a rule about what someone is SHOWN of other
     * people's content -- it does not stand between anyone and their own rows,
     * and a CHILD's own stylist gallery vanishing out from under them would be
     * a bug, not a protection. Narrow on purpose: it must be the caller's id
     * in this query's own where, not a userId from a route or query parameter.
     */
    const ownRows = /\buserId:\s*(?:auth\.)?user\.id\b/.test(query.where)

    const matureFiltered =
      /\bisMature\b/.test(query.where) ||
      mentions(query.where, MATURITY_BUILDERS)

    if (!matureFiltered && !maturityCheck && !ownRows) maturityGap = true
  }

  if (privacyGap) unguarded.push(rel)
  else if (maturityGap) maturityOnly.push(rel)
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
