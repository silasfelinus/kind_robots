// /utils/scripts/verifyCommentBackfillAuthors.ts
//
// Every speaker in the draft corpus still goes by the name the draft gives them.
//
// WHY
// ---
// kind_robots#1769. `publishCommentBackfillLiveBatches.ts` re-checks each
// speaker's display name against the live directory before it writes anything,
// and throws on the FIRST mismatch:
//
//   REWARD:281: author name drift for CHARACTER:358:
//     expected Grand Marshal Aurelia Vane, got Aurelia.
//
// That check is right — a comment signed by a name the character no longer uses
// is worse than no comment. But failing one-at-a-time costs a whole production
// run per name: the Tailscale lane, the DB connection, twenty minutes, and a
// human to read the log. Characters get renamed during curation, so by the time
// the corpus is published a handful have always drifted. Four runs died this way
// before anyone diffed the whole corpus in one pass and found seven.
//
// So: check every batch against every speaker, report ALL of them at once, and
// do it before the workflow has connected to anything. This is a read-only HTTP
// check against the public API — no database, no secrets, ~10 seconds.
//
//   npm run test:comment-authors
//   npx tsx utils/scripts/verifyCommentBackfillAuthors.ts --base http://localhost:3000
//
// Deliberately NOT part of `npm run test:comments`. The other comment contracts
// are pure and offline; this one asserts against a live third party, so folding
// it in would make the whole suite go red whenever kindrobots.org is down. It
// runs where it actually pays: on demand, and as the first step of the publish
// job in .github/workflows/comment-backfill-live.yml.
//
// ONE KNOWN DIFFERENCE FROM THE PUBLISHER
// ---------------------------------------
// The publisher reads the directory from the database filtered on `isActive`.
// This reads it from the public API, which filters on `isPublic` instead — the
// price of needing no credentials. The two agree on every speaker in the corpus
// today (201 distinct authors, zero absent), and a name is a name either way, so
// drift is caught identically. What this cannot distinguish is a speaker who is
// public-but-inactive: the publisher would reject it as missing and this would
// pass. An absent speaker is therefore reported as a failure rather than skipped
// — if the two directories ever disagree, that should be loud here, not twenty
// minutes into the production lane.
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { speakerKey } from './../../utils/comments/voiceEvidence'

type DraftSpeaker = {
  kind: 'BOT' | 'CHARACTER'
  id: number
  name: string
  comment: string
}
type DraftItem = { key: string; speakers: DraftSpeaker[] }
type DraftPacket = { items: DraftItem[] }

type Row = { id?: unknown; name?: unknown }

function arg(name: string, fallback: string): string {
  const index = process.argv.indexOf(`--${name}`)
  const value = process.argv[index + 1]
  return index > -1 && value ? value : fallback
}

const baseUrl = arg('base', 'https://kindrobots.org').replace(/\/+$/, '')
const draftsDir = join(process.cwd(), 'config', 'comment-backfill-drafts')

async function getRows(path: string): Promise<Row[]> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { accept: 'application/json' },
  })
  if (!response.ok) throw new Error(`GET ${path} failed: ${response.status}`)
  const body = (await response.json()) as Row[] | { data?: Row[] }
  return Array.isArray(body) ? body : body.data || []
}

/** Bots page at 100 by default; characters return in one response. */
async function getAllBots(): Promise<Row[]> {
  const all: Row[] = []
  for (let page = 1; page <= 50; page += 1) {
    const rows = await getRows(`/api/bots?page=${page}&pageSize=200`)
    all.push(...rows)
    if (rows.length < 200) break
  }
  return all
}

function directoryOf(kind: 'BOT' | 'CHARACTER', rows: Row[]) {
  const map = new Map<string, string>()
  for (const row of rows) {
    const id = Number(row.id)
    const name = typeof row.name === 'string' ? row.name : ''
    if (Number.isInteger(id) && id > 0 && name) {
      map.set(speakerKey({ kind, id }), name)
    }
  }
  return map
}

type Drift = {
  batch: string
  item: string
  key: string
  drafted: string
  live: string | null
}

async function main() {
  const batchNames = readdirSync(draftsDir)
    .filter((name) => /^batch-\d+\.json$/.test(name))
    .sort()
  if (!batchNames.length) {
    throw new Error(`No draft packets found in ${draftsDir}.`)
  }

  const [characters, bots] = await Promise.all([
    getRows('/api/characters'),
    getAllBots(),
  ])
  const directory = new Map([
    ...directoryOf('CHARACTER', characters),
    ...directoryOf('BOT', bots),
  ])
  if (directory.size === 0) {
    throw new Error(
      `${baseUrl} returned an empty author directory. Refusing to report "no drift" against nothing.`,
    )
  }

  const drifted: Drift[] = []
  const missing: Drift[] = []
  const speakers = new Set<string>()
  let comments = 0

  for (const batch of batchNames) {
    const packet = JSON.parse(
      readFileSync(join(draftsDir, batch), 'utf8'),
    ) as DraftPacket
    for (const item of packet.items) {
      for (const speaker of item.speakers) {
        const key = speakerKey(speaker)
        speakers.add(key)
        comments += 1
        const live = directory.get(key)
        const record: Drift = {
          batch,
          item: item.key,
          key,
          drafted: speaker.name,
          live: live ?? null,
        }
        if (live === undefined) missing.push(record)
        else if (live !== speaker.name) drifted.push(record)
      }
    }
  }

  const scope = `${comments} comment(s), ${speakers.size} distinct speaker(s), ${batchNames.length} batch file(s)`

  if (!drifted.length && !missing.length) {
    console.log(
      `Comment backfill authors verified against ${baseUrl}: ${scope}, no name drift.`,
    )
    return
  }

  // Report by speaker, not by occurrence: one rename is one edit, however many
  // comments it signs. The per-item list is what makes it greppable afterwards.
  if (drifted.length) {
    const bySpeaker = new Map<string, Drift[]>()
    for (const record of drifted) {
      const list = bySpeaker.get(record.key) || []
      list.push(record)
      bySpeaker.set(record.key, list)
    }
    console.error(
      `\n${bySpeaker.size} speaker(s) have been renamed since drafting, across ${drifted.length} entr(y/ies):\n`,
    )
    for (const [key, records] of bySpeaker) {
      const first = records[0]!
      console.error(`  ${key}`)
      console.error(`    drafted as: ${first.drafted}`)
      console.error(`    live name:  ${first.live}`)
      console.error(
        `    entries:    ${records.map((r) => `${r.batch}#${r.item}`).join(', ')}`,
      )
    }
  }

  if (missing.length) {
    const keys = [...new Set(missing.map((record) => record.key))]
    console.error(
      `\n${keys.length} speaker(s) are absent from the public directory at ${baseUrl}. The publisher reads the directory from the database filtered on isActive, so this is either a genuinely retired author or one that is merely not public — both need a decision before the run:\n`,
    )
    for (const key of keys) {
      const records = missing.filter((record) => record.key === key)
      console.error(`  ${key} (${records[0]!.drafted})`)
      console.error(
        `    entries: ${records.map((r) => `${r.batch}#${r.item}`).join(', ')}`,
      )
    }
  }

  console.error(
    `\nChecked ${scope}. Fix every name above in one pass — the publisher aborts on the first mismatch, so shipping a partial fix costs another production run per remaining name.\n`,
  )
  process.exitCode = 1
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
