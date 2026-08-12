// Read-only export of exact production comment target/cast plans for #1769.
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { planManualCommentBackfillSlice } from '@/server/utils/commentBackfillGeneration'

const start = Number(process.env.COMMENT_PLAN_START || 256)
const chunk = 24
const first = await planManualCommentBackfillSlice({ start, limit: 1 })
const total = first.eligibleTargets
const items: unknown[] = []

for (let cursor = start; cursor < total; cursor += chunk) {
  const plan = await planManualCommentBackfillSlice({
    start: cursor,
    limit: Math.min(chunk, total - cursor),
  })
  items.push(...plan.items)
  console.log(`COMMENT_PLAN_EXPORT ${cursor}-${cursor + plan.items.length - 1}`)
}

const dir = join(process.cwd(), 'artifacts')
mkdirSync(dir, { recursive: true })
const output = {
  version: 1,
  issueNumber: 1769,
  start,
  eligibleTargets: total,
  items,
}
writeFileSync(
  join(dir, 'comment-backfill-plan-remaining.json'),
  `${JSON.stringify(output, null, 2)}\n`,
  'utf8',
)
console.log(
  'COMMENT_PLAN_EXPORT_COMPLETE',
  JSON.stringify({ start, total, exported: items.length }),
)
