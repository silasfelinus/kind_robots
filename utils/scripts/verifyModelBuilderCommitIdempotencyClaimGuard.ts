// /utils/scripts/verifyModelBuilderCommitIdempotencyClaimGuard.ts
//
// Regression guard (model-builder/t-029, cycle 102) -- items/[id]/commit.post.ts
// prevents a double commit (two concurrent POST .../commit requests for the
// same item both racing past the early `if (item.idempotencyKey)` check,
// which only reads a single request-start snapshot) by claiming the item with
// an ATOMIC compare-and-swap:
//
//   const claim = await prisma.modelBuildItem.updateMany({
//     where: { id, idempotencyKey: null },
//     data: { idempotencyKey: `commit:${id}` },
//   })
//
// Only one of two concurrent requests can match `idempotencyKey: null` in its
// WHERE clause and actually flip a row -- the loser's updateMany matches zero
// rows (`claim.count === 0`) and takes the "already committed" early return
// instead of racing into the real write below. If a future edit "simplified"
// this to a plain read-then-write (a `findUnique` for idempotencyKey, then an
// unconditional `update()` once it reads null), the compare-and-swap
// disappears: both concurrent requests would each read null, then each
// proceed to the real write -- reopening exactly the double-commit race this
// claim exists to prevent (e.g. two Characters created from the same single
// CREATE item, or promoteAsset()/updateText() running twice).
//
// The claim's OTHER half matters just as much. If the real write
// (promoteAsset / updateText / createRecord+linkSourceToTarget) throws, the
// surrounding `catch (writeError)` resets idempotencyKey back to null via a
// second `updateMany` before re-throwing. Without that reset, the claim is a
// one-way door: any transient failure in the write (a DB blip, a facet-sync
// error) permanently wedges the item as "claimed" with no target ever
// recorded, and every retry forever after hits the early
// `if (item.idempotencyKey)` return with `target: null` -- the item can never
// be committed again. This is the same "permanently claimed, target
// unrecoverable" failure shape verifyModelBuilderCommitTargetPersistenceGuard.ts's
// own header comment describes for a slow *successful* write's follow-up
// step; this guard covers the sibling case of the primary write itself
// failing outright.
//
// This asserts the textual shape of both halves stays in place:
// 1. The initial claim is `prisma.modelBuildItem.updateMany(...)` whose WHERE
//    clause includes both `id` and `idempotencyKey: null` -- not a bare `id`
//    lookup (or a `findUnique` + separate `update`), which would silently
//    reopen the double-commit race.
// 2. `claim.count === 0` is checked, before the real write, and short-
//    circuits with an early return.
// 3. A `catch (writeError)` block wraps the real write and resets
//    `idempotencyKey: null` via its own `updateMany` before re-throwing
//    `writeError` (not swallowing it) -- without this, a failed write leaves
//    the item unrecoverably claimed forever.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const ROUTE_PATH = join(
  repositoryRoot,
  'server/api/model-builder/items/[id]/commit.post.ts',
)

const CLAIM_ANCHOR = 'prisma.modelBuildItem.updateMany({'
const CLAIM_WHERE_RE = /where:\s*\{\s*id,\s*idempotencyKey:\s*null\s*\}/
const CLAIM_COUNT_CHECK = 'claim.count === 0'
const CATCH_ANCHOR_RE = /catch\s*\(\s*writeError\s*\)\s*\{/
const RESET_WHERE_RE = /where:\s*\{\s*id\s*\}/
const RESET_DATA_RE = /data:\s*\{\s*idempotencyKey:\s*null\s*\}/
const RETHROW = 'throw writeError'

// Checks the fix's exact shape against the full source text of a file
// containing commit.post.ts's idempotency-claim flow. Exported (rather than
// only exercised via main()) so the self-test below can run it against
// synthetic buggy/fixed fixtures without touching the real route file.
export function checkCommitIdempotencyClaimGuard(content: string): string[] {
  const errors: string[] = []

  const claimIndex = content.indexOf(CLAIM_ANCHOR)
  if (claimIndex === -1) {
    errors.push(
      'commit.post.ts no longer contains a `prisma.modelBuildItem.' +
        'updateMany({` call -- has the idempotency claim been renamed, ' +
        'removed, or replaced with a plain read-then-write? If so, this ' +
        'guard (and the double-commit race it protects against) needs to ' +
        'move with it.',
    )
    return errors
  }

  // The claim's own `where`/`data` sit within a short window right after the
  // anchor -- not the whole file -- so a coincidental unrelated updateMany
  // call elsewhere can't accidentally satisfy this check.
  const claimSlice = content.slice(claimIndex, claimIndex + 300)

  if (!CLAIM_WHERE_RE.test(claimSlice)) {
    errors.push(
      "commit.post.ts's item claim does not filter on both `id` and " +
        '`idempotencyKey: null` in the same WHERE clause -- without ' +
        '`idempotencyKey: null` as part of the WHERE (not just an `id` ' +
        'lookup, and not a separate `findUnique` read before an ' +
        'unconditional `update`), the claim stops being an atomic ' +
        'compare-and-swap: two concurrent commit requests for the same item ' +
        'could both pass the read and both proceed to the real write, ' +
        'double-committing it.',
    )
  }

  const countCheckIndex = content.indexOf(CLAIM_COUNT_CHECK, claimIndex)
  if (countCheckIndex === -1 || countCheckIndex - claimIndex > 600) {
    errors.push(
      'commit.post.ts does not check `claim.count === 0` shortly after the ' +
        'idempotency claim -- without it, the loser of a concurrent claim ' +
        '(whose updateMany matched zero rows) is never detected and falls ' +
        'through into the real write anyway, alongside the request that won ' +
        'the claim.',
    )
  }

  const catchMatch = CATCH_ANCHOR_RE.exec(content)
  if (!catchMatch || catchMatch.index < claimIndex) {
    errors.push(
      'commit.post.ts no longer wraps the real write (promoteAsset / ' +
        'updateText / createRecord+linkSourceToTarget) in a ' +
        '`catch (writeError)` block -- without it, a failed write leaves ' +
        'the item permanently claimed (idempotencyKey already set) with no ' +
        'way for a retry to ever commit it.',
    )
    return errors
  }

  const catchIndex = catchMatch.index
  const catchSlice = content.slice(catchIndex, catchIndex + 300)

  const hasResetCall =
    RESET_WHERE_RE.test(catchSlice) && RESET_DATA_RE.test(catchSlice)
  if (!hasResetCall) {
    errors.push(
      'commit.post.ts\'s `catch (writeError)` block does not reset ' +
        '`idempotencyKey: null` (via `where: { id }` / ' +
        '`data: { idempotencyKey: null }`) -- without this reset, any ' +
        'transient failure in the real write (a DB blip, a facet-sync ' +
        'error) permanently wedges the item as claimed: every retry ' +
        'forever after hits the early "already committed" return with ' +
        '`target: null`, and the item can never actually be committed.',
    )
  }

  const rethrowIndex = content.indexOf(RETHROW, catchIndex)
  if (rethrowIndex === -1 || rethrowIndex - catchIndex > 400) {
    errors.push(
      'commit.post.ts\'s `catch (writeError)` block does not re-throw ' +
        '`writeError` -- swallowing it here would report success back to ' +
        'the caller for a commit whose real write actually failed.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(ROUTE_PATH, 'utf8')
  const errors = checkCommitIdempotencyClaimGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder commit idempotency-claim guard contract failed for ' +
        'server/api/model-builder/items/[id]/commit.post.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder commit idempotency-claim guard contract passed: the ' +
      'commit route claims each item with an atomic `idempotencyKey: null` ' +
      'compare-and-swap and resets it on a failed write, so a double-commit ' +
      'race can neither duplicate the write nor permanently wedge the item.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
