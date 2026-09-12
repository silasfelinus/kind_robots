// /utils/scripts/verifySceneAnimatorResubmit.test.ts
//
// A finished Scene Animator scene can be asked for again — and an in-flight one
// still cannot be duplicated.
//
// WHAT WENT WRONG WITHOUT THIS. The enqueue dedupe treats PENDING, RUNNING and
// DONE alike as "reusable", and that check runs BEFORE `retryFailed` is
// consulted. So `retryFailed` only ever rescued FAILED/CANCELLED, and a DONE
// scene was unreachable from the admin surface by any request the UI could
// send. That is correct exactly while a finished render is the render you
// wanted — and wrong the moment it isn't. On 2026-09-11 the ArtImage offload
// flattened every completed clip to a still; all of them sat DONE, visibly
// wrong, with no way to re-queue them (Silas: "We should be able to resubmit
// from the scene-animator window").
//
// The fix adds `force`, which is a narrow hole in a guard that exists for good
// reasons, so the shape of the hole is what these assertions pin:
//
//   - force re-queues a DONE job (the whole point)
//   - force NEVER re-queues PENDING or RUNNING: the relay renders one clip at a
//     time, so a duplicate does not arrive sooner, it just jumps the queue
//   - force is per-source only; a folder-wide force would re-render every
//     finished scene in the batch off one click
//   - without force, DONE is still skipped, exactly as before
//
// Mirrors verifySceneAnimatorHealth.test.ts: exercises the real decision rather
// than describing it. The decision is pure, so it is re-derived here from the
// route's source instead of booting h3 + prisma, and the source contract at the
// bottom fails if the route stops matching it.
//
//   npx tsx utils/scripts/verifySceneAnimatorResubmit.test.ts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROUTE = 'server/api/scene-animator/enqueue.post.ts'
const STORE = 'stores/sceneAnimatorStore.ts'
const PAGE = 'pages/admin/scene-animator.vue'

const source = readFileSync(resolve(process.cwd(), ROUTE), 'utf8')

type Decision = 'queue' | 'skip'

/**
 * The route's per-source branch, in the order the route applies it.
 *
 * Kept in step with the route by the source contract below — if the route's
 * predicates change names or order, that contract fails and this model must be
 * revisited rather than silently drifting into fiction.
 */
function decide(
  status: string | null,
  opts: { force?: boolean; retryFailed?: boolean } = {},
): Decision {
  const force = Boolean(opts.force)
  if (!status) return 'queue'
  if (status === 'PENDING' || status === 'RUNNING') return 'skip'
  if ((status === 'DONE' || status === 'PENDING' || status === 'RUNNING') && !force) {
    return 'skip'
  }
  if (!opts.retryFailed && !force) return 'skip'
  return 'queue'
}

/* -- the bug: a finished scene was unreachable ------------------------------ */

assert.equal(
  decide('DONE', { retryFailed: true }),
  'skip',
  'retryFailed must NOT resurrect a DONE job — the dedupe skips it first. If ' +
    'this ever starts queueing, the reusable-status guard has been weakened ' +
    'and every batch re-run silently re-renders the whole folder.',
)

assert.equal(
  decide('DONE', { force: true }),
  'queue',
  'force must re-queue a finished scene — this is the whole feature',
)

/* -- but an active job is still never duplicated ---------------------------- */

for (const status of ['PENDING', 'RUNNING']) {
  assert.equal(
    decide(status, { force: true, retryFailed: true }),
    'skip',
    `force must not duplicate a ${status} job: the relay renders one clip at a ` +
      `time, so a second job does not arrive sooner, it only jumps the queue`,
  )
}

/* -- unchanged behaviour for everything else -------------------------------- */

assert.equal(decide(null), 'queue', 'a source with no job at all must queue')
assert.equal(decide('DONE'), 'skip', 'a plain batch run must still skip DONE')
assert.equal(
  decide('FAILED'),
  'skip',
  'a failed job still needs retryFailed — a bare batch run must not retry it',
)
assert.equal(decide('FAILED', { retryFailed: true }), 'queue')
assert.equal(decide('CANCELLED', { retryFailed: true }), 'queue')
assert.equal(
  decide('FAILED', { force: true }),
  'queue',
  'force covers the failed case too, so one button can serve both',
)

/* -- source contract: the route must still match the model above ------------ */

const check = (ok: boolean, message: string) => {
  if (!ok) throw new Error(message)
}

check(
  /function isActiveStatus\s*\(/.test(source),
  `${ROUTE} must keep isActiveStatus() distinct from isReusableStatus(). ` +
    `Collapsing them back into one predicate is what makes force able to ` +
    `duplicate an in-flight render.`,
)

const activeIndex = source.search(/if \(existing && isActiveStatus\(/)
const reusableIndex = source.search(/if \(existing && isReusableStatus\(/)

check(
  activeIndex !== -1 && reusableIndex !== -1 && activeIndex < reusableIndex,
  `${ROUTE} must check isActiveStatus BEFORE the forceable reusable-status ` +
    `branch. Reversed, a forced request reaches a PENDING/RUNNING job and ` +
    `queues a duplicate against it.`,
)

// Same statement only — a multiline window here happily matches the unrelated
// `const sources = requestedSourceFile ? …` two lines down and passes on a
// route that no longer scopes force at all.
check(
  /const force = [^\n]*requestedSourceFile/.test(source),
  `${ROUTE} must scope force to a named sourceFile. A folder-wide force ` +
    `re-renders every finished scene in the batch from a single click.`,
)

check(
  /if \(!existing \|\| force \|\|/.test(source),
  `${ROUTE} must re-read the live job before a forced enqueue. force is the ` +
    `one path that enqueues over a job it has already seen, so a stale read ` +
    `here is how two renders get queued for the same scene.`,
)

/* -- the operator can actually reach it ------------------------------------- */

const store = readFileSync(resolve(process.cwd(), STORE), 'utf8')
const page = readFileSync(resolve(process.cwd(), PAGE), 'utf8')

check(
  /rerenderSource/.test(store) && /\bforce,/.test(store),
  `${STORE} must expose rerenderSource and send force — a server-side flag no ` +
    `client sets is not a feature.`,
)

check(
  /rerenderSource\(source\.name\)/.test(page),
  `${PAGE} must wire a control to rerenderSource. The whole request was to be ` +
    `able to resubmit from this window.`,
)

check(
  /source\.status === 'done'/.test(page),
  `${PAGE} must offer the re-render control on DONE cards — those are the ` +
    `ones with no other route back into the queue.`,
)

console.log(
  '✅ Scene Animator resubmit: DONE is re-renderable with force, PENDING/' +
    'RUNNING are never duplicated, force stays per-source, and the admin ' +
    'surface is wired to it.',
)
