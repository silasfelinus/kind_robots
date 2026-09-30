// cthulhuquarium/t-022: bring live Monster.games in line with the fish bible
// (silasfelinus/cthulhuquarium, fish/*.yaml) through the admin PATCH route, so
// a stale shared-bestiary tag needs no direct database session.
//
//   node scripts/sync-monster-games.mjs <fish-dir>          # dry run
//   node scripts/sync-monster-games.mjs <fish-dir> --write  # apply
//
// Env: SYNC_BASE_URL (default https://kindrobots.org), SYNC_ADMIN_TOKEN
// (only needed with --write). Only touches rows whose games differ.
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parse } from 'yaml'

const dir = process.argv[2]
const write = process.argv.includes('--write')
const baseUrl = String(
  process.env.SYNC_BASE_URL || 'https://kindrobots.org',
).replace(/\/$/, '')
const token = String(process.env.SYNC_ADMIN_TOKEN || '').trim()

if (!dir) throw new Error('usage: sync-monster-games.mjs <fish-dir> [--write]')
if (write && !token)
  throw new Error('SYNC_ADMIN_TOKEN is required with --write.')

const norm = (list) => [...new Set(list)].sort().join(',')

let changed = 0
let failed = 0
let checked = 0
for (const file of (await readdir(dir))
  .filter((f) => f.endsWith('.yaml'))
  .sort()) {
  const doc = parse(await readFile(join(dir, file), 'utf8'))
  if (!doc?.slug || !Array.isArray(doc.games) || !doc.games.length) continue
  checked++
  const want = norm(doc.games.map((g) => String(g).trim().toLowerCase()))

  const res = await fetch(`${baseUrl}/api/monsters/${doc.slug}`)
  if (res.status === 404) continue // not seeded yet; seed_bestiary's job
  const body = await res.json().catch(() => null)
  if (!res.ok || !body?.data) {
    console.error(`FAIL read ${doc.slug}: HTTP ${res.status}`)
    failed++
    continue
  }
  const have = norm(
    String(body.data.games || '')
      .split(',')
      .map((g) => g.trim()),
  )
  if (have === want) continue

  changed++
  console.log(`${doc.slug}: ${have || '(empty)'} -> ${want}`)
  if (!write) continue
  const patch = await fetch(`${baseUrl}/api/monsters/${doc.slug}`, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      'x-beta-admin-token': token,
    },
    body: JSON.stringify({ games: want.split(',') }),
  })
  if (!patch.ok) {
    console.error(`FAIL patch ${doc.slug}: HTTP ${patch.status}`)
    failed++
  }
}
console.log(
  `${checked} species checked, ${changed} ${write ? 'updated' : 'would change'}, ${failed} failed`,
)
if (failed) process.exit(1)
