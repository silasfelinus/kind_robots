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

if (cursor !== expectedTargets) {
  throw new Error(`Draft corpus covers ${cursor}/${expectedTargets} targets.`)
}

const allItems = batches.flatMap((batch) => batch.items)
const keys = new Set(allItems.map((item) => item.key))
if (keys.size !== allItems.length) throw new Error('Draft corpus contains duplicate target keys.')

const output = {
  version: 1,
  issueNumber: 1769,
  authoringModel: 'GPT-5.6 Sol',
  draftingModels: [...draftingModels].sort(),
  releaseGate: 'GPT-5.6 Sol',
  createdFor: 'Production Reward/Facet object comments after #1802 voice approval',
  targetCount: expectedTargets,
  batches,
}
writeFileSync(
  join(root, 'config', 'comment-backfill-live-batches.json'),
  `${JSON.stringify(output, null, 2)}\n`,
  'utf8',
)
console.log(
  'COMMENT_BACKFILL_DRAFTS_ASSEMBLED',
  JSON.stringify({ targetCount: expectedTargets, packets: packets.length, draftingModels: output.draftingModels }),
)
