// /utils/scripts/assembleCommentBackfillDrafts.ts
// Combines temporary reviewed draft packets into the exact payload consumed by
// the one-shot production publisher. This performs structural completeness
// checks only; the publisher performs the live DB + voice freshness validation.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

type DraftSpeaker = {
  kind: 'BOT' | 'CHARACTER'
  id: number
  name: string
  comment: string
}
type DraftItem = {
  key: string
  title?: string
  shape: 'SOLO' | 'DUET' | 'DUET_REPLY' | 'TRIO'
  speakers: DraftSpeaker[]
}
type DraftPacket = {
  version: number
  start: number
  eligibleTargets: number
  draftingModel: string
  releaseGate: string
  items: DraftItem[]
  failures?: Array<{ key?: string; error?: string }>
}

const root = process.cwd()
const dir = join(root, 'config', 'comment-backfill-drafts')
const names = readdirSync(dir)
  .filter((name) => /^batch-\d+\.json$/.test(name))
  .sort()
if (!names.length) throw new Error('No comment backfill draft packets found.')

const packets = names.map((name) => {
  const packet = JSON.parse(readFileSync(join(dir, name), 'utf8')) as DraftPacket
  if (packet.version !== 1) throw new Error(`${name}: unsupported version.`)
  if (packet.failures?.length) throw new Error(`${name}: contains ${packet.failures.length} unresolved drafting failure(s).`)
  if (packet.releaseGate !== 'GPT-5.6 Sol') throw new Error(`${name}: release gate is not GPT-5.6 Sol.`)
  return { name, packet }
}).sort((a, b) => a.packet.start - b.packet.start)

const expectedTargets = packets[0]!.packet.eligibleTargets
const draftingModels = new Set<string>()
const batches: Array<{ start: number; items: DraftItem[] }> = []
let cursor = 0

for (const { name, packet } of packets) {
  if (packet.eligibleTargets !== expectedTargets) {
    throw new Error(`${name}: eligible target count drifted to ${packet.eligibleTargets}.`)
  }
  if (packet.start !== cursor) {
    throw new Error(`${name}: expected start ${cursor}, got ${packet.start}.`)
  }
  if (!packet.items.length) throw new Error(`${name}: empty draft packet.`)
  draftingModels.add(packet.draftingModel)
  batches.push({ start: packet.start, items: packet.items })
  cursor += packet.items.length
}

// A PREFIX of the eligible targets, not necessarily all of them.
//
// This used to require cursor === expectedTargets, so a corpus covering 256 of
// 658 targets assembled into nothing at all. That made the 491 comments already
// written unpublishable until every remaining target had been drafted -- months
// of authoring during which the review layer stayed empty on a live site,
// because the drafts are written in target order and the gate was all-or-
// nothing.
//
// Prefix publishing is safe here for a reason particular to this pipeline: the
// publisher walks eligible targets positionally and skips any target that
// already carries a first-party comment, so publishing 0..255 now and 256..657
// later lands the same rows as publishing all 658 at once. What must not happen
// is a HOLE -- a gap in the middle would silently shift every later item onto
// the wrong target. Contiguity from 0 is what rules that out, and it is still
// enforced above, per packet, before we get here.
if (cursor > expectedTargets) {
  throw new Error(
    `Draft corpus covers ${cursor} targets but only ${expectedTargets} are eligible. A packet claims targets that do not exist.`,
  )
}
if (cursor === 0) {
  throw new Error('Draft corpus is empty.')
}

const allItems = batches.flatMap((batch) => batch.items)
const keys = new Set(allItems.map((item) => item.key))
if (keys.size !== allItems.length) throw new Error('Draft corpus contains duplicate target keys.')

const output = {
  version: 1,
  issueNumber: 1769,
  // Every model that actually wrote part of this corpus, aggregated from the
  // packets rather than asserted. This was a hardcoded singular 'GPT-5.6 Sol',
  // which stopped being true the moment a second author contributed a packet --
  // a provenance record that names the wrong author is worse than none.
  // releaseGate below is a different thing and stays constant: it is the gate
  // the corpus was approved through, not a claim about who wrote it.
  authoringModels: [...draftingModels].sort(),
  draftingModels: [...draftingModels].sort(),
  releaseGate: 'GPT-5.6 Sol',
  createdFor: 'Production Reward/Facet object comments after #1802 voice approval',
  // What this payload covers, which is now a prefix rather than the whole set.
  // eligibleTargets records the full corpus size so the publisher can tell a
  // deliberate partial run from a payload that lost items.
  targetCount: cursor,
  eligibleTargets: expectedTargets,
  batches,
}
writeFileSync(
  join(root, 'config', 'comment-backfill-live-batches.json'),
  `${JSON.stringify(output, null, 2)}\n`,
  'utf8',
)
console.log(
  'COMMENT_BACKFILL_DRAFTS_ASSEMBLED',
  JSON.stringify({
    targetCount: cursor,
    eligibleTargets: expectedTargets,
    complete: cursor === expectedTargets,
    packets: packets.length,
    draftingModels: output.draftingModels,
  }),
)
if (cursor < expectedTargets) {
  console.log(
    `Partial corpus: targets 0..${cursor - 1} of ${expectedTargets}. The remaining ${expectedTargets - cursor} keep their existing comments (none) until a later run.`,
  )
}
