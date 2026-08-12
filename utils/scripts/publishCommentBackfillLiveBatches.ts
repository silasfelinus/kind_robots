// /utils/scripts/publishCommentBackfillLiveBatches.ts
// One-shot production publisher for kind_robots#1769. The payload is authored
// outside the DB lane, then each batch is re-planned and re-validated against
// live production state before an atomic insert. Any failure stops the run.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  getCommentBackfillStatus,
  publishManualCommentBackfillSlice,
  type ManualBackfillPayload,
} from '@/server/utils/commentBackfillGeneration'

type BatchFile = {
  version: number
  issueNumber: number
  authoringModel: string
  createdFor: string
  batches: Array<{
    start: number
    payload: ManualBackfillPayload
  }>
}

const file = join(process.cwd(), 'config', 'comment-backfill-live-batches.json')
const batchFile = JSON.parse(readFileSync(file, 'utf8')) as BatchFile

if (batchFile.version !== 1 || batchFile.issueNumber !== 1769) {
  throw new Error('Unexpected live comment backfill payload metadata.')
}
if (batchFile.authoringModel !== 'GPT-5.6 Sol') {
  throw new Error(`Unexpected authoring model: ${batchFile.authoringModel}`)
}
if (!batchFile.batches.length) {
  throw new Error('Live comment backfill payload has no batches.')
}

const before = await getCommentBackfillStatus()
console.log('COMMENT_BACKFILL_BEFORE', JSON.stringify(before))

let publishedTargets = 0
let publishedComments = 0
let skippedExisting = 0

for (const [index, batch] of batchFile.batches.entries()) {
  console.log(
    `COMMENT_BACKFILL_BATCH_START ${index + 1}/${batchFile.batches.length} start=${batch.start} targets=${batch.payload.items.length}`,
  )

  const result = await publishManualCommentBackfillSlice({
    start: batch.start,
    payload: batch.payload,
  })
  console.log('COMMENT_BACKFILL_BATCH_RESULT', JSON.stringify(result))

  publishedTargets += result.publishedTargets
  publishedComments += result.publishedComments
  skippedExisting += result.skippedExisting

  if (result.failedTargets > 0) {
    throw new Error(
      `Batch ${index + 1} failed ${result.failedTargets} target(s); stopping immediately.`,
    )
  }
}

const after = await getCommentBackfillStatus()
console.log('COMMENT_BACKFILL_AFTER', JSON.stringify(after))
console.log(
  'COMMENT_BACKFILL_SUMMARY',
  JSON.stringify({ publishedTargets, publishedComments, skippedExisting }),
)

if (after.remainingTargets !== 0) {
  throw new Error(
    `Backfill ended with ${after.remainingTargets} eligible target(s) still empty.`,
  )
}
