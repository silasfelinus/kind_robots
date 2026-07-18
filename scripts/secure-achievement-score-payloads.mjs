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
  `      const userId = userStore.userId

      const response = await performFetch('/api/achievements/updateClickRecord', {
        method: 'PUT',
        body: JSON.stringify({ newScore, userId }),
      })`,
  `      const response = await performFetch('/api/achievements/updateClickRecord', {
        method: 'PUT',
        body: JSON.stringify({ newScore }),
      })`,
  'click score payload',
)

replaceExact(
  'stores/achievementStore.ts',
  `      const userId = userStore.userId

      await performFetch('/api/achievements/updateMatchRecord', {
        method: 'PUT',
        body: JSON.stringify({ newScore, userId }),
      })`,
  `      await performFetch('/api/achievements/updateMatchRecord', {
        method: 'PUT',
        body: JSON.stringify({ newScore }),
      })`,
  'match score payload',
)

replaceExact(
  'docs/notes/backend-sweep-2026-07-05.md',
  `Anyone on the internet can call these. Fix order roughly top-to-bottom.

| File:line`,
  `Anyone on the internet can call these. Fix order roughly top-to-bottom.

Resolved since this audit: the click/match high-score endpoints now require authentication, derive user identity from the token, reject identity fields, and preserve monotonic high scores.

| File:line`,
  'achievement score security resolution note',
)

replaceExact(
  'docs/notes/backend-sweep-2026-07-05.md',
  `| \`server/api/achievements/updateClickRecord.put.ts:26\` | unauth \`prisma.user.update\` on any userId from body                                      |
| \`server/api/achievements/updateMatchRecord.put.ts:26\` | same — writes matchRecord on any user                                                    |
`,
  ``,
  'resolved achievement score security rows',
)

replaceExact(
  'docs/architecture/thin-resource-api-audit.md',
  `| Dream delete       | Manually detached Chats, deleted Reactions, and cleared many-to-many links before deletion                    | Declared preserve-vs-cascade behavior in Prisma, migrated Dream reactions to cascade, and reduced the route to one Dream delete |`,
  `| Dream delete       | Manually detached Chats, deleted Reactions, and cleared many-to-many links before deletion                    | Declared preserve-vs-cascade behavior in Prisma, migrated Dream reactions to cascade, and reduced the route to one Dream delete |
| Achievement scores   | Unauthenticated score routes accepted arbitrary user IDs and overwrote click/match records                    | Routes require the authenticated user, reject identity fields, validate safe integer scores, and preserve monotonic high scores |`,
  'achievement score audit row',
)
