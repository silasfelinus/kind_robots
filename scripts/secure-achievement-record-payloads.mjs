import { readFileSync, writeFileSync } from 'node:fs'

function replaceExact(path, target, replacement, label) {
  const source = readFileSync(path, 'utf8')

  if (!source.includes(target)) {
    throw new Error(`Expected ${label} was not found in ${path}.`)
  }

  writeFileSync(path, source.replace(target, replacement), 'utf8')
}

replaceExact(
  'stores/achievementStore.ts',
  `          method: 'PATCH',
          body: JSON.stringify(record),`,
  `          method: 'PATCH',
          body: JSON.stringify({ isConfirmed: record.isConfirmed }),`,
  'Achievement record PATCH payload',
)

replaceExact(
  'stores/achievementStore.ts',
  `          method: 'POST',
          body: JSON.stringify(record),`,
  `          method: 'POST',
          body: JSON.stringify({ achievementId: record.achievementId }),`,
  'Achievement record POST payload',
)

replaceExact(
  'stores/achievementStore.ts',
  `      return await addAchievementRecord({
        userId,
        achievementId,
        username: userStore.username,
      })`,
  `      return await addAchievementRecord({ achievementId })`,
  'Achievement record award payload',
)

replaceExact(
  'docs/notes/backend-sweep-2026-07-05.md',
  `Resolved since this audit: click/match high-score writes now use authenticated identity and monotonic validation. Achievement definition create/update/delete now require admin access, reject model-shaped fields, and separate single CRUD from batch import.`,
  `Resolved since this audit: achievement scores use authenticated identity and monotonic validation; definition mutations require admins; record reads/writes are owner-scoped, derive identity from auth, and whitelist confirmation updates.`,
  'Achievement security resolution note',
)

replaceExact(
  'docs/notes/backend-sweep-2026-07-05.md',
  `| \`server/api/achievements/records/[id].patch.ts:45\`    | unauth update + mass-assignment                                                          |
`,
  ``,
  'resolved Achievement record security row',
)

replaceExact(
  'docs/architecture/thin-resource-api-audit.md',
  `| Achievement definitions | Create/update/delete were unauthenticated; POST silently required arrays; PATCH accepted raw model fields      | Definition mutations require admins, use explicit field validation, separate single POST from /batch imports, and reject server-owned fields |`,
  `| Achievement definitions | Create/update/delete were unauthenticated; POST silently required arrays; PATCH accepted raw model fields      | Definition mutations require admins, use explicit field validation, separate single POST from /batch imports, and reject server-owned fields |
| Achievement records | GET exposed every user's awards; POST accepted caller identity; PATCH was unauthenticated raw model input | Reads are self-scoped except for admins, POST derives owner/username from auth, duplicate awards are idempotent, and PATCH permits only owner/admin confirmation |`,
  'Achievement record audit row',
)
