// /utils/scripts/verifyModelBuilderCommitAssetAttachableGuard.ts
//
// Regression guard (model-builder/t-029, kaizen) -- relations.ts's
// assertArtImageAttachable() exists specifically because an item's
// artImageId is later promoted onto the run's owner-verified source record
// (see its own header comment: "An item's artImageId is later promoted onto
// the run's owner-verified source record ... an unchecked FK lets a user pin
// another user's PRIVATE ArtImage onto their own record and surface it
// through that record's canonical art link"). Every route that lets a
// caller SET an item's artImageId already calls it at write time
// (items/[id].patch.ts, items/batch.patch.ts, items/[id]/artifacts.post.ts)
// -- but until this fix, items/[id]/commit.post.ts's ASSET_ONLY branch never
// called it at all. It promoted whatever artImageId the item already carried
// straight onto the source record via promoteAsset(), trusting the
// attach-time check alone.
//
// Concrete repro: user B's Character (id 42) build item is set to a PUBLIC
// ArtImage (id 500, owned by user A) via PATCH /items/:id --
// assertArtImageAttachable passes since it's public at that moment. The item
// sits at GENERATE_ASSETS approved for a while (nothing forces an immediate
// commit). User A then flips ArtImage 500 private via PATCH
// /api/art/image/500 (their own image, their own call). User B commits the
// item: commit.post.ts's ASSET_ONLY branch calls promoteAsset(), which does
// `prisma.character.update({ where: { id: 42 }, data: { artImageId: 500 } })`
// unconditionally -- no re-check -- writing user A's now-private ArtImage
// onto user B's Character's canonical art link. If that Character is public,
// user A's private image becomes reachable through it, exactly the outcome
// the guard's own header comment says it exists to prevent.
//
// Fixed by calling assertArtImageAttachable(plan.value, auth.user.id,
// syncOptions.isAdmin) immediately before promoteAsset() in the ASSET_ONLY
// branch, re-validating against the ArtImage's CURRENT ownership/visibility
// at the moment of the actual privileged write rather than trusting the
// attach-time check alone -- mirrors this same route's existing
// re-read-immediately-before-the-write idiom (see
// verifyModelBuilderCommitStaleSnapshotGuard.ts for stageStatuses).
//
// This asserts the textual shape of the fix stays in place: commit.post.ts
// imports assertArtImageAttachable from '../../relations', and calls it with
// a preceding `assertArtImageAttachable(` occurrence shortly before its
// `await promoteAsset(sourceType, sourceId, plan.value)` call.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const ROUTE_PATH = join(
  repositoryRoot,
  'server/api/model-builder/items/[id]/commit.post.ts',
)

const IMPORT_LINE = "import { assertArtImageAttachable } from '../../relations'"
const PROMOTE_CALL = 'await promoteAsset(sourceType, sourceId, plan.value)'
const ATTACHABLE_CALL = 'assertArtImageAttachable('

// Checks the fix's exact shape against the full source text of a file
// containing commit.post.ts's ASSET_ONLY commit branch. Exported (rather
// than only exercised via main()) so the self-test below can run it against
// synthetic buggy/fixed fixtures without touching the real route file.
export function checkCommitAssetAttachableGuard(content: string): string[] {
  const errors: string[] = []

  if (!content.includes(IMPORT_LINE)) {
    errors.push(
      `commit.post.ts no longer contains \`${IMPORT_LINE}\` -- has ` +
        'assertArtImageAttachable stopped being imported, or moved to a ' +
        'different import shape? Either way this guard needs to move with it.',
    )
  }

  const promoteIndex = content.indexOf(PROMOTE_CALL)
  if (promoteIndex === -1) {
    errors.push(
      `commit.post.ts no longer contains \`${PROMOTE_CALL}\` -- has the ` +
        'ASSET_ONLY promotion call been renamed or restructured? If so, this ' +
        'guard (and the bug it protects against) needs to move with it.',
    )
    return errors
  }

  const precedingSlice = content.slice(
    Math.max(0, promoteIndex - 600),
    promoteIndex,
  )
  if (!precedingSlice.includes(ATTACHABLE_CALL)) {
    errors.push(
      'commit.post.ts calls promoteAsset() in its ASSET_ONLY branch without ' +
        "a preceding assertArtImageAttachable(...) call -- the ArtImage's " +
        'ownership/visibility is only checked once, when it was first ' +
        'attached to the item (items/[id].patch.ts / items/batch.patch.ts), ' +
        "not again at the moment it's actually promoted onto the source " +
        'record. An item can sit approved for an arbitrary stretch between ' +
        'attach and commit; if the ArtImage is made private in that window, ' +
        'the stale attach-time check no longer reflects reality and a ' +
        "private ArtImage gets promoted onto another user's canonical " +
        'record with no re-check.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(ROUTE_PATH, 'utf8')
  const errors = checkCommitAssetAttachableGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder commit asset-attachable guard contract failed for ' +
        'server/api/model-builder/items/[id]/commit.post.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder commit asset-attachable guard contract passed: the ' +
      'ASSET_ONLY commit branch re-checks assertArtImageAttachable ' +
      'immediately before promoting the ArtImage onto the source record, ' +
      "instead of trusting the item's attach-time check alone.",
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
