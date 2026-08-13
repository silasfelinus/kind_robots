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
import { createFetcher, pool } from './../../utils/comments/fitnessLoader'

function arg(name: string, fallback = ''): string {
  const hit = process.argv.find((value) => value.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : fallback
}
const baseUrl = arg('base', 'https://kindrobots.org').replace(/\/+$/, '')

/**
 * Speaker names as production currently has them.
 *
 * The publisher aborts on the FIRST name mismatch, so without this a drifted
 * corpus costs one production run per renamed speaker. That happened on the
 * #1769 lane -- seven renames, discovered one at a time -- which is why the
 * check moved offline and over public HTTP, where it names all of them at once
 * in about ten seconds.
 */
async function liveSpeakerNames(): Promise<Map<string, string>> {
  const get = createFetcher(baseUrl)
  const [bots, characters] = await Promise.all([
    get<Array<{ id: number; name: string }>>('/api/bots?page=1&pageSize=500'),
    get<Array<{ id: number; name: string }>>('/api/characters'),
  ])
  const map = new Map<string, string>()
  for (const row of bots) map.set(`BOT:${row.id}`, row.name)
  for (const row of characters) map.set(`CHARACTER:${row.id}`, row.name)
  return map
}

/**
 * Which reaction read route serves each target type.
 *
 * These are the `KarmaRefType` names, not the packet's SCREAMING type names --
 * `/api/reactions/BOT/14` 400s as "not a reaction target type".
 */
const TARGET_ROUTE: Record<PopulationTargetType, string> = {
  BOT: 'bot',
  CHARACTER: 'character',
  DREAM: 'dream',
  SCENARIO: 'scenario',
  PROJECT: 'project',
}

type LiveReaction = {
  comment: string | null
  authorBotId: number | null
  authorCharacterId: number | null
}

/**
 * What each first-party speaker has ALREADY said on the given targets, keyed
 * `TYPE:id|KIND:id`.
 *
 * Only fetched for targets that actually carry a reply, because it is a request
 * per target and most targets have none.
 */
async function liveCommentsOnTargets(
  keys: readonly string[],
): Promise<Map<string, string[]>> {
  const get = createFetcher(baseUrl)
  const out = new Map<string, string[]>()
  await pool([...keys], async (key) => {
    const [type, rawId] = key.split(':') as [PopulationTargetType, string]
    const body = await get<LiveReaction[] | { reactions?: LiveReaction[] }>(
      `/api/reactions/${TARGET_ROUTE[type]}/${rawId}`,
    )
    // The generic `[target]/[id]` route answers with a flat array under `data`.
    // The older hand-written dream route nests its list one level deeper, under
    // `data.reactions`, and a reader that assumes the flat shape sees every
    // Dream as having no comments at all. (It did, for a while: a survey run
    // reported 1 comment per Dream when there were three or four, because it
    // was measuring the length of the wrapper object.)
    const rows = Array.isArray(body) ? body : body?.reactions || []
    for (const row of rows) {
      const speaker =
        row.authorBotId != null
          ? `BOT:${row.authorBotId}`
          : row.authorCharacterId != null
            ? `CHARACTER:${row.authorCharacterId}`
            : null
      // Human-authored reactions have no first-party speaker and cannot be
      // answered by name, so they are not candidates for an anchor.
      if (!speaker) continue
      const mapKey = `${key}|${speaker}`
      out.set(mapKey, [...(out.get(mapKey) || []), String(row.comment || '')])
    }
  })
  return out
}

const root = process.cwd()
const nexusDir = join(root, 'config', 'nexus-comment-drafts')
const PRIOR_DIRS = ['comment-backfill-drafts', 'population-comment-drafts']
const BANNED =
  /\b(components?|wonderlabs?|museums?|exhibits?|star ratings?|ratings?|reviews?|implementations?|usability)\b/i

type Speaker = {
  kind: 'BOT' | 'CHARACTER'
  id: number
  name: string
  comment: string
  /**
   * Marks this comment as answering another one on the same card.
   *
   * Reaction has no parent column -- comments are flat siblings -- so a reply
   * only works as prose, on a card where the reader can see both. That makes it
   * fragile in a way threading is not: if the comment being answered is not
   * actually there, the reply reads as broken rather than as absent.
   *
   * So a reply must name who it answers and quote an anchor phrase from them,
   * and both are checked. `anchor` must genuinely appear in that speaker's
   * comment on this target, either already live or earlier in this batch.
   *
   * Both read routes order `updatedAt: 'desc'` and review-list.vue does not
   * re-sort, so the card is reverse-chronological: a reply published after its
   * referent renders ABOVE it. That is the ordinary shape of a comment feed and
   * needs no correction -- but it does mean the only thing keeping a reply
   * coherent is that the comment it answers is present and quoted, which is
   * precisely what these two fields make checkable.
   */
  repliesTo?: { kind: 'BOT' | 'CHARACTER'; id: number; anchor: string }
}
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

  const packets = names.map((name) => ({
    name,
    packet: JSON.parse(readFileSync(join(nexusDir, name), 'utf8')) as Batch,
  }))

  // Only targets that carry a reply need their live comment list read.
  const replyTargets = new Set<string>()
  for (const { packet } of packets) {
    for (const item of packet.items || []) {
      if ((item.speakers || []).some((speaker) => speaker.repliesTo)) {
        replyTargets.add(`${item.targetType}:${item.targetId}`)
      }
    }
  }

  const [live, liveOnTarget] = await Promise.all([
    liveSpeakerNames(),
    replyTargets.size
      ? liveCommentsOnTargets([...replyTargets])
      : Promise.resolve(new Map<string, string[]>()),
  ])
  const authored = priorCorpusText()
  const seenTargets = new Set<string>()
  let comments = 0
  let replies = 0
  const wordCounts: number[] = []

  for (const { name, packet } of packets) {
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
      // What each speaker has said on THIS target, in batch order, so a later
      // reply can be checked against an earlier comment in the same file.
      const onThisTarget = new Map<string, string[]>()
      for (const speaker of item.speakers) {
        const sKey = speakerKey(speaker)
        if (inExchange.has(sKey)) flag(where, `${sKey} speaks twice in one exchange`)
        inExchange.add(sKey)

        // A reply must answer something the reader can actually see on this
        // card: either a comment already live on the target, or one written
        // earlier in this same item. Anything else is a reply into thin air.
        if (speaker.repliesTo) {
          replies += 1
          const parentKey = `${speaker.repliesTo.kind}:${speaker.repliesTo.id}`
          if (parentKey === sKey) {
            flag(`${where} ${sKey}`, 'replies to itself')
          }
          const anchor = String(speaker.repliesTo.anchor || '').trim()
          if (anchor.split(/\s+/).filter(Boolean).length < 3) {
            flag(
              `${where} ${sKey}`,
              'repliesTo.anchor must quote at least three words of the comment it answers',
            )
          }
          const candidates = [
            ...(onThisTarget.get(parentKey) || []),
            ...(liveOnTarget.get(`${key}|${parentKey}`) || []),
          ]
          if (!candidates.length) {
            flag(
              `${where} ${sKey}`,
              `replies to ${parentKey}, who has not spoken on this target`,
            )
          } else if (!candidates.some((prior) => prior.includes(anchor))) {
            flag(
              `${where} ${sKey}`,
              `repliesTo.anchor "${anchor}" does not appear in ${parentKey}'s comment here`,
            )
          }
        }

        const liveName = live.get(sKey)
        if (!liveName) {
          flag(`${where} ${sKey}`, 'speaker does not exist in production')
        } else if (liveName !== speaker.name) {
          flag(
            `${where} ${sKey}`,
            `production says "${liveName}", packet says "${speaker.name}"`,
          )
        }

        const text = String(speaker.comment || '').trim()
        const words = normalizeWords(text).length
        comments += 1
        wordCounts.push(words)

        if (words < 4 || words > 120) flag(`${where} ${sKey}`, `${words} words`)
        if (text.length > 1200) flag(`${where} ${sKey}`, 'over 1200 characters')
        const banned = text.match(BANNED)?.[0]
        if (banned) flag(`${where} ${sKey}`, `banned vocabulary "${banned}"`)

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
        onThisTarget.set(sKey, [...(onThisTarget.get(sKey) || []), text])
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
    `Nexus comments verified: ${comments} comment(s) across ${names.length} batch file(s), ${seenTargets.size} target(s), ${replies} reply/replies, median ${median} words (${wordCounts[0]}-${wordCounts[wordCounts.length - 1]}).`,
  )
}

await main()
