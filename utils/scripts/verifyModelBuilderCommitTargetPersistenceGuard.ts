// /utils/scripts/verifyModelBuilderCommitTargetPersistenceGuard.ts
//
// Regression guard (model-builder/t-029 cycle 27, kaizen from cycle 26's
// note) -- items/[id]/commit.post.ts claims the item (idempotencyKey set to
// `commit:${id}`) before doing the actual write (promoteAsset / updateText /
// createRecord+linkSourceToTarget), then -- on success -- re-reads
// stageStatuses and writes targetType/targetId together with the merged
// stageStatuses blob in a single final `prisma.modelBuildItem.update()`.
//
// That final write is not the primary write: it's a slower read-modify-write
// (a `findUnique` immediately followed by an `update`) that can fail on its
// own (a DB blip, a connection hiccup) *after* the primary write already
// succeeded. When it does, idempotencyKey correctly stays set -- resetting it
// would let a retry redo the primary write and duplicate the record -- but
// with the old single-combined-write shape, targetType/targetId never got
// persisted either, since they lived in that same doomed write. The item was
// then permanently claimed with its target unrecoverable: every future
// "already committed" response (both early-return branches above, which
// report `target: item.targetType && item.targetId ? {...} : null`) would
// report `target: null` forever, orphaning the record the commit actually
// produced.
//
// Fixed by durably persisting targetType/targetId in their own minimal write
// immediately after the primary write succeeds, separate from the slower
// stageStatuses re-read/merge/write -- so a later failure in that second step
// can no longer orphan the target record.
//
// This asserts the textual shape of that fix stays in place: a
// `prisma.modelBuildItem.update()` call that writes `targetType`/`targetId`
// appears before the final stageStatuses write, and that final write no
// longer carries `targetType`/`targetId` itself (the one thing a future edit
// could easily "simplify" back into a single combined write, silently
// reintroducing the bug).
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const ROUTE_PATH = join(
  repositoryRoot,
  'server/api/model-builder/items/[id]/commit.post.ts',
)

const STAGE_ASSIGNMENT = 'stages.COMMIT = {'
const FINAL_UPDATE_ANCHOR =
  'const updated = await prisma.modelBuildItem.update({'

// Splits the source at the final `const updated = ...update({` call (the
// stageStatuses write) so the "target persisted before this point" and "not
// re-carried in this final write" checks can each look at the right half.
// Exported so the self-test can exercise it directly against synthetic
// fixtures without touching the real route file.
export function splitAroundFinalUpdate(
  content: string,
): { before: string; finalUpdateBlock: string } | null {
  const stageIndex = content.indexOf(STAGE_ASSIGNMENT)
  if (stageIndex === -1) return null

  const finalUpdateIndex = content.indexOf(FINAL_UPDATE_ANCHOR, stageIndex)
  if (finalUpdateIndex === -1) return null

  // The final update's `data: { ... }` object is what we need to inspect;
  // grab a generous slice starting at the anchor through the next top-level
  // closing of the update() call. Looking for the first `include:` or the
  // literal `})` that ends the `data: {...}` block keeps this robust to
  // reordering of fields inside `data`.
  const closeIndex = content.indexOf('\n    })', finalUpdateIndex)
  const finalUpdateBlock = content.slice(
    finalUpdateIndex,
    closeIndex === -1 ? finalUpdateIndex + 400 : closeIndex,
  )

  return { before: content.slice(0, finalUpdateIndex), finalUpdateBlock }
}

export function checkCommitTargetPersistenceGuard(content: string): string[] {
  const errors: string[] = []

  const split = splitAroundFinalUpdate(content)
  if (split === null) {
    errors.push(
      'Could not locate both `stages.COMMIT = {` and the final ' +
        '`const updated = await prisma.modelBuildItem.update({` write in ' +
        'commit.post.ts -- has the final write been renamed, removed, or ' +
        'restructured? If so, this guard (and the bug it protects against) ' +
        'needs to move with it.',
    )
    return errors
  }

  const { before, finalUpdateBlock } = split

  const persistsTargetEarly =
    before.includes('modelBuildItem') &&
    before.includes('data: { targetType: target.type, targetId: target.id }')

  if (!persistsTargetEarly) {
    errors.push(
      'commit.post.ts does not durably persist targetType/targetId in ' +
        'their own write immediately after the primary write succeeds -- it ' +
        'appears the only place target gets written is the final ' +
        'stageStatuses update. If that later read-modify-write fails on its ' +
        'own (after the primary write already succeeded and ' +
        'idempotencyKey is already set and must stay set), the item is left ' +
        'permanently claimed with its target unrecoverable -- every future ' +
        '"already committed" response would report `target: null` forever.',
    )
  }

  if (
    finalUpdateBlock.includes('targetType: target.type') ||
    finalUpdateBlock.includes('targetId: target.id')
  ) {
    errors.push(
      "commit.post.ts's final stageStatuses write still carries " +
        'targetType/targetId in the same `data: {...}` object -- this is ' +
        'the exact combined-write shape the fix was meant to split apart. ' +
        'If that final write fails, target is lost along with it.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(ROUTE_PATH, 'utf8')
  const errors = checkCommitTargetPersistenceGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder commit target-persistence guard contract failed for ' +
        'server/api/model-builder/items/[id]/commit.post.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder commit target-persistence guard contract passed: ' +
      'targetType/targetId are durably persisted in their own write ' +
      'immediately after the primary write succeeds, separate from the ' +
      'final stageStatuses read-modify-write.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
