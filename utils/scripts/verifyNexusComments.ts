// /utils/scripts/verifyNexusComments.ts
//
// Offline prose contract for the second comment pass.
//
//   npm run test:nexus-comments
//
// Same rules as the population lane, with one difference that matters: this
// corpus is measured for freshness against BOTH shipped bodies of work -- the
// 961 facet/reward comments and the 792 population comments -- as well as
// itself. A nexus target already has somebody talking on it, so a speaker
// reusing their own earlier phrasing here would land the repeat on the very
// card where both versions are visible at once.
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { archivedVoiceRecords } from './../../utils/comments/archivedVoiceCorpus'
import { buildVoiceEvidenceIndex, speakerKey } from './../../utils/comments/voiceEvidence'
import { characterVoiceSeeds } from './../../stores/seeds/characterVoices'
import {
  POPULATION_TARGET_TYPES,
  type PopulationTargetType,
} from './../../utils/comments/populationTargets'

const root = process.cwd()
const nexusDir = join(root, 'config', 'nexus-comment-drafts')
const PRIOR_DIRS = ['comment-backfill-drafts', 'population-comment-drafts']
const BANNED =
  /\b(components?|wonderlabs?|museums?|exhibits?|star ratings?|ratings?|reviews?|implementations?|usability)\b/i

type Speaker = { kind: 'BOT' | 'CHARACTER'; id: number; name: string; comment: string }
type Item = {
  targetType: PopulationTargetType
  targetId: number
  targetTitle?: string
  speakers: Speaker[]
}
type Batch = { version: number; batch: string; releaseGate: string; items: Item[] }

function normalizeWords(value: string): string[] {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function shingles(value: string, size = 8): Set<string> {
  const words = normalizeWords(value)
  const out = new Set<string>()
  for (let i = 0; i + size <= words.length; i += 1) out.add(words.slice(i, i + size).join(' '))
  return out
}

function sharedShingle(left: string, right: string): string | null {
  const set = shingles(left)
  for (const candidate of shingles(right)) if (set.has(candidate)) return candidate
  return null
}

/** Everything both shipped corpora already say, keyed by speaker. */
function priorCorpusText(): Map<string, string[]> {
  const map = new Map<string, string[]>()
  for (const relative of PRIOR_DIRS) {
    const dir = join(root, 'config', relative)
    if (!existsSync(dir)) continue
    for (const name of readdirSync(dir).filter((n) => /^batch-\d+\.json$/.test(n)).sort()) {
      const packet = JSON.parse(readFileSync(join(dir, name), 'utf8')) as {
        items: Array<{ speakers: Array<{ kind: string; id: number; comment: string }> }>
      }
      for (const item of packet.items || []) {
        for (const speaker of item.speakers || []) {
          const key = speakerKey(speaker as { kind: 'BOT' | 'CHARACTER'; id: number })
          map.set(key, [...(map.get(key) || []), speaker.comment.trim()])
        }
      }
    }
  }
  return map
}

const voiceIndex = buildVoiceEvidenceIndex(archivedVoiceRecords)
const canonicalById = new Map<number, string | null>(
  characterVoiceSeeds.map((seed) => [seed.id, seed.sampleResponse || null]),
)

const violations: string[] = []
const flag = (where: string, problem: string) => violations.push(`${where}: ${problem}`)

async function main() {
  if (!existsSync(nexusDir)) {
    console.log('No nexus comment batches yet; nothing to verify.')
    return
  }
  const names = readdirSync(nexusDir).filter((n) => n.endsWith('.json')).sort()
  if (!names.length) {
    console.log('No nexus comment batches yet; nothing to verify.')
    return
  }

  const authored = priorCorpusText()
  const seenTargets = new Set<string>()
  let comments = 0
  const wordCounts: number[] = []

  for (const name of names) {
    const packet = JSON.parse(readFileSync(join(nexusDir, name), 'utf8')) as Batch
    assert.equal(packet.version, 1, `${name}: unexpected version.`)
    assert.equal(packet.releaseGate, 'GPT-5.6 Sol', `${name}: unexpected release gate.`)

    for (const item of packet.items || []) {
      const key = `${item.targetType}:${item.targetId}`
      const where = `${name} ${key}`
      if (!POPULATION_TARGET_TYPES.includes(item.targetType)) {
        flag(where, `unknown target type ${item.targetType}`)
        continue
      }
      if (seenTargets.has(key)) flag(where, 'target appears in more than one item')
      seenTargets.add(key)
      if (!item.speakers?.length) {
        flag(where, 'no speakers')
        continue
      }

      const inExchange = new Set<string>()
      for (const speaker of item.speakers) {
        const sKey = speakerKey(speaker)
        if (inExchange.has(sKey)) flag(where, `${sKey} speaks twice in one exchange`)
        inExchange.add(sKey)

        const text = String(speaker.comment || '').trim()
        const words = normalizeWords(text).length
        comments += 1
        wordCounts.push(words)

        if (words < 4 || words > 120) flag(`${where} ${sKey}`, `${words} words`)
        if (text.length > 1200) flag(`${where} ${sKey}`, 'over 1200 characters')
        const banned = text.match(BANNED)
        if (banned) flag(`${where} ${sKey}`, `banned vocabulary "${banned[0]}"`)

        for (const sample of voiceIndex.get(sKey)?.samples || []) {
          const overlap = sharedShingle(text, sample.text)
          if (overlap) flag(`${where} ${sKey}`, `repeats an archived line: "${overlap}"`)
        }
        if (speaker.kind === 'CHARACTER') {
          const canonical = canonicalById.get(speaker.id)
          if (canonical) {
            const overlap = sharedShingle(text, canonical)
            if (overlap) flag(`${where} ${sKey}`, `quotes their canonical sample: "${overlap}"`)
          }
        }
        for (const prior of authored.get(sKey) || []) {
          const overlap = sharedShingle(text, prior)
          if (overlap) flag(`${where} ${sKey}`, `repeats their own earlier comment: "${overlap}"`)
        }
        authored.set(sKey, [...(authored.get(sKey) || []), text])
      }
    }
  }

  if (violations.length) {
    console.error(`Nexus comment contract FAILED (${violations.length}):`)
    for (const message of violations) console.error(`  - ${message}`)
    process.exit(1)
  }

  wordCounts.sort((a, b) => a - b)
  const median = wordCounts[Math.floor(wordCounts.length / 2)] || 0
  console.log(
    `Nexus comments verified: ${comments} comment(s) across ${names.length} batch file(s), ${seenTargets.size} target(s), median ${median} words (${wordCounts[0]}-${wordCounts[wordCounts.length - 1]}).`,
  )
}

await main()
