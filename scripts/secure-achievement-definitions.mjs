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
  `      const response = await performFetch<Achievement>(
        \`/api/achievements/\${achievement.id}\`,
        {
          method: 'PATCH',
          body: JSON.stringify(achievement),
        },
      )`,
  `      const payload = {
        label: achievement.label,
        message: achievement.message,
        icon: achievement.icon,
        karma: achievement.karma,
        pageHint: achievement.pageHint,
        subtleHint: achievement.subtleHint,
        triggerCode: achievement.triggerCode,
        tooltip: achievement.tooltip,
        isActive: achievement.isActive,
        isRepeatable: achievement.isRepeatable,
        artImageId: achievement.artImageId,
        artPrompt: achievement.artPrompt,
        imagePath: achievement.imagePath,
      }

      const response = await performFetch<Achievement>(
        \`/api/achievements/\${achievement.id}\`,
        {
          method: 'PATCH',
          body: JSON.stringify(payload),
        },
      )`,
  'Achievement store PATCH payload',
)

replaceExact(
  'docs/notes/backend-sweep-2026-07-05.md',
  `Resolved since this audit: the click/match high-score endpoints now require authentication, derive user identity from the token, reject identity fields, and preserve monotonic high scores.`,
  `Resolved since this audit: click/match high-score writes now use authenticated identity and monotonic validation. Achievement definition create/update/delete now require admin access, reject model-shaped fields, and separate single CRUD from batch import.`,
  'Achievement security resolution note',
)

replaceExact(
  'docs/notes/backend-sweep-2026-07-05.md',
  `| \`server/api/achievements/[id].patch.ts:37\`            | unauth update + raw body mass-assignment                                                 |
| \`server/api/achievements/[id].delete.ts:21\`           | unauth delete                                                                            |
| \`server/api/achievements/index.post.ts:24\`            | unauth batch create                                                                      |
`,
  ``,
  'resolved Achievement definition security rows',
)

replaceExact(
  'docs/architecture/thin-resource-api-audit.md',
  `| Achievement scores   | Unauthenticated score routes accepted arbitrary user IDs and overwrote click/match records                    | Routes require the authenticated user, reject identity fields, validate safe integer scores, and preserve monotonic high scores |`,
  `| Achievement scores   | Unauthenticated score routes accepted arbitrary user IDs and overwrote click/match records                    | Routes require the authenticated user, reject identity fields, validate safe integer scores, and preserve monotonic high scores |
| Achievement definitions | Create/update/delete were unauthenticated; POST silently required arrays; PATCH accepted raw model fields      | Definition mutations require admins, use explicit field validation, separate single POST from /batch imports, and reject server-owned fields |`,
  'Achievement definition audit row',
)
