import { readFileSync, writeFileSync } from 'node:fs'

function replaceExact(path, target, replacement, label) {
  const source = readFileSync(path, 'utf8')
  const newline = source.includes('\r\n') ? '\r\n' : '\n'
  const normalized = source.replace(/\r\n/g, '\n')

  if (!normalized.includes(target)) {
    throw new Error(`Expected ${label} was not found in ${path}.`)
  }

  writeFileSync(
    path,
    normalized.replace(target, replacement).replace(/\n/g, newline),
    'utf8',
  )
}

replaceExact(
  'docs/notes/backend-sweep-2026-07-05.md',
  `- **Admin-check drift:** ~25 files still use \`Role === 'ADMIN'\`-only instead of the newer \`Role === 'ADMIN' || user.id === 1\` (available as \`userIsAdmin()\` in \`server/utils/authUser.ts\`) — including the canonical \`scenarios/[id].patch.ts|delete.ts|batch.patch.ts\` themselves. \`users/*\` and \`prompts/[id].patch.ts\` are owner-only with no admin bypass at all.`,
  `- **Admin-check drift:** many routes still use \`Role === 'ADMIN'\`-only instead of \`userIsAdmin()\`. The canonical Scenario PATCH, batch PATCH, and DELETE routes are now normalized; continue the sweep by resource rather than with a risky global replacement. \`users/*\` and owner-only routes need product-specific review before adding an admin bypass.`,
  'Scenario admin drift audit update',
)

replaceExact(
  'docs/notes/backend-sweep-2026-07-05.md',
  `- **console.log noise:** 47 hits; worst \`characters/generate.ts\` (17), \`users/register.post.ts\` (5), and 2 in the canonical \`scenarios/[id].delete.ts\`.`,
  `- **console.log noise:** still concentrated in operational/generation routes, especially \`characters/generate.ts\` and \`users/register.post.ts\`; ordinary Scenario deletion is now quiet.`,
  'Scenario delete console audit update',
)

replaceExact(
  'docs/architecture/thin-resource-api-audit.md',
  `| Scenario  | Single/batch create and PATCH returned ArtImage, User, Characters, and Dreams; single-resource POST also accepted arrays and returned skipped pseudo-records                                    | Added \`scenarioMutationSelect\`; \`scenarioStore\` force-hydrates detail after mutations. \`POST /api/scenarios\` now creates one Scenario with \`409\` duplicates; \`POST /api/scenarios/batch\` owns array, skip, and partial-success behavior                      |`,
  `| Scenario  | Single/batch create and PATCH returned ArtImage, User, Characters, and Dreams; single-resource POST also accepted arrays and returned skipped pseudo-records                                    | Added \`scenarioMutationSelect\`; single and batch mutations return lean rows, explicit batch creation owns partial results, authorization uses \`userIsAdmin()\`, and DELETE returns a quiet normalized envelope                                               |`,
  'Scenario completed audit row',
)
