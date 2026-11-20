/**
 * Slime City art delivery audit (conductor slime-city/t-012).
 *
 * verifySlimeCityArtCoverage proves every slot names an ArtImage id. This
 * proves the site actually serves each one: it requests every id in the
 * manifest the way the game does (/api/art/images/<id>/file with the
 * player's token) and expects an image back. Headers only; the body is
 * dropped as soon as the type is known.
 *
 * /play/slime-city is account-gated, so pass a signed-in session:
 *   npm run audit:slime-city-art-delivery -- --base https://kindrobots.org
 *     --storage-state /path/outside/repo/kr-qa-state.json
 *     [--groups cards,story] [--concurrency 6]
 * or set KR_AUDIT_USERNAME and KR_AUDIT_PASSWORD (lib/auditSession.mjs).
 */
import { readFileSync } from 'node:fs'
import { SLIME_CITY_ART } from '../slimeCity/artManifest'
import { resolveAuditSession } from './lib/auditSession.mjs'

const args = process.argv.slice(2)
const flag = (name: string, fallback?: string) => {
  const i = args.indexOf('--' + name)
  return i === -1 || !args[i + 1] ? fallback : args[i + 1]
}
const base = (flag('base', 'https://kindrobots.org') as string).replace(
  /\/$/,
  '',
)
const groups = flag('groups')?.split(',')
const concurrency = Math.max(1, Number(flag('concurrency', '6')))

interface StorageState {
  origins?: { localStorage?: { name: string; value: string }[] }[]
}
function tokenFrom(state: string | StorageState): string | null {
  const parsed: StorageState =
    typeof state === 'string' ? JSON.parse(readFileSync(state, 'utf8')) : state
  for (const origin of parsed.origins ?? [])
    for (const entry of origin.localStorage ?? [])
      if (entry.name === 'token' && entry.value) return entry.value
  return null
}

const session = await resolveAuditSession({
  base,
  storageStatePath: flag('storage-state'),
})
const token = session ? tokenFrom(session.storageState) : null
if (!token) {
  console.error(
    'SIGNED_OUT: art is served to signed-in players. Pass --storage-state ' +
      '<signed-in QA state file>, or set KR_AUDIT_USERNAME and ' +
      'KR_AUDIT_PASSWORD.',
  )
  process.exit(2)
}

const slots: { slot: string; id: number }[] = []
for (const [group, ids] of Object.entries(SLIME_CITY_ART)) {
  if (groups && !groups.includes(group)) continue
  for (const [slug, id] of Object.entries(ids as Record<string, number>))
    slots.push({ slot: group + '/' + slug, id })
}

const failures: string[] = []
const perGroup = new Map<string, { ok: number; bad: number }>()
let next = 0
async function check(slot: string, id: number): Promise<string | null> {
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(`${base}/api/art/images/${id}/file`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const type = response.headers.get('content-type') ?? ''
      await response.body?.cancel().catch(() => undefined)
      if (response.ok && type.startsWith('image/')) return null
      // A busy server is not a missing painting: retry those, report the rest.
      if (response.status >= 500 && attempt < 3) continue
      return `${slot} (ArtImage ${id}): HTTP ${response.status} ${type || 'no content-type'}`
    } catch (error) {
      if (attempt < 3) continue
      return `${slot} (ArtImage ${id}): ${String(error).split('\n')[0]}`
    }
  }
}
async function worker(): Promise<void> {
  while (next < slots.length) {
    const { slot, id } = slots[next++]!
    const problem = await check(slot, id)
    const group = slot.split('/')[0]!
    const tally = perGroup.get(group) ?? { ok: 0, bad: 0 }
    if (problem) {
      tally.bad += 1
      failures.push(problem)
    } else tally.ok += 1
    perGroup.set(group, tally)
  }
}
await Promise.all(Array.from({ length: concurrency }, worker))

for (const [group, tally] of perGroup)
  console.log(
    `${group}: ${tally.ok}/${tally.ok + tally.bad} delivered` +
      (tally.bad ? ` (${tally.bad} failed)` : ''),
  )
if (failures.length) {
  console.error(
    `Slime City art delivery: ${failures.length} of ${slots.length} slots ` +
      'did not return an image:\n  ' +
      failures.slice(0, 60).join('\n  ') +
      (failures.length > 60 ? `\n  ...and ${failures.length - 60} more` : ''),
  )
  process.exit(1)
}
console.log(
  `Slime City art delivery: all ${slots.length} manifest slots returned an image`,
)
