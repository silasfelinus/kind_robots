import { readFileSync, writeFileSync } from 'node:fs'

function replaceExact(path, target, replacement, label) {
  const source = readFileSync(path, 'utf8')

  if (!source.includes(target)) {
    throw new Error(`Expected ${label} was not found in ${path}.`)
  }

  writeFileSync(path, source.replace(target, replacement), 'utf8')
}

replaceExact(
  'docs/notes/backend-sweep-2026-07-05.md',
  `Resolved since this audit: achievement scores use authenticated identity and monotonic validation; definition mutations require admins; record reads/writes are owner-scoped; Stripe checkout and subscription derive billing identity from authentication and reject caller-supplied user IDs. Component mutation routes now require admins and use explicit update contracts.`,
  `Resolved since this audit: achievement writes are authenticated and ownership-aware; Stripe billing identity comes from authentication; Component mutations require admins; the bot seed command is admin-only and offers a no-write dry run.`,
  'security resolution note',
)

replaceExact(
  'docs/notes/backend-sweep-2026-07-05.md',
  `| \`server/api/bots/seed.post.ts:9\`                      | unauth bot seed/overwrite                                                                |
`,
  ``,
  'resolved bot seed exposure row',
)

replaceExact(
  'docs/notes/backend-sweep-2026-07-05.md',
  `- \`server/api/reactions/chat/[id].patch.ts:53\` and \`reactions/component/[id].patch.ts:56\` — double-nested \`data: { reaction }\` / \`data: { updatedReaction }\`, off-pattern vs every other reaction endpoint.
`,
  ``,
  'retired specialized Reaction route bug row',
)

replaceExact(
  'docs/notes/backend-sweep-2026-07-05.md',
  `- **Envelope drift:** \`achievements/*\` omit \`message\`; \`bots/seed.post.ts\` returns \`{success,data}\`; \`art/sd/setModel.post.ts\` returns \`{success,message,model}\` (no data); \`relations/*\` use \`setResponseStatus\` and omit \`statusCode\`.`,
  `- **Envelope drift:** \`art/sd/setModel.post.ts\` returns \`{success,message,model}\` (no data); \`relations/*\` use \`setResponseStatus\` and omit \`statusCode\`.`,
  'resolved bot seed envelope drift note',
)

replaceExact(
  'docs/architecture/thin-resource-api-audit.md',
  `| Stripe checkout | One-time checkout trusted a body user ID and loosely shaped cart entries before creating Stripe customers and sessions | Checkout derives billing identity from authentication, validates trusted catalog IDs and bounded quantities before Stripe calls, and UI/store callers no longer pass user IDs |`,
  `| Stripe checkout | One-time checkout trusted a body user ID and loosely shaped cart entries before creating Stripe customers and sessions | Checkout derives billing identity from authentication, validates trusted catalog IDs and bounded quantities before Stripe calls, and UI/store callers no longer pass user IDs |
| Bot seed command | Public POST could trigger bulk seed-data updates with no authentication or safe inspection mode | Command requires an admin, accepts only an optional dry-run flag, and exposes a no-write validation path for operational tests |`,
  'bot seed command audit row',
)
