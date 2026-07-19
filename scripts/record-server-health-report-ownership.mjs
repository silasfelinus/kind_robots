import { readFileSync, writeFileSync } from 'node:fs'

function replaceExact(path, target, replacement, label) {
  const source = readFileSync(path, 'utf8')
  const newline = source.includes('\r\n') ? '\r\n' : '\n'
  const normalizedSource = source.replace(/\r\n/g, '\n')

  if (!normalizedSource.includes(target)) {
    throw new Error(`Expected ${label} was not found in ${path}.`)
  }

  const updated = normalizedSource.replace(target, replacement)
  writeFileSync(path, updated.replace(/\n/g, newline), 'utf8')
}

replaceExact(
  'docs/notes/backend-sweep-2026-07-05.md',
  'Resolved since this audit: achievement writes are authenticated and ownership-aware; Stripe billing identity comes from authentication; Component mutations require admins; bot seed is admin-only; dead SD model switching was removed; art upload derives ownership from authentication; ArtImage connection PATCH is collection-only and checks collection ownership.',
  'Resolved since this audit: achievement writes are authenticated and ownership-aware; Stripe billing identity comes from authentication; Component mutations require admins; bot seed is admin-only; dead SD model switching was removed; art upload and ArtImage collections enforce ownership; browser health reports require server mutation permission.',
  'server health security resolution note',
)

replaceExact(
  'docs/notes/backend-sweep-2026-07-05.md',
  '- `server/api/server/health/[id].patch.ts:37` — optional auth lets anon flip `lastStatus`/`lastCheckedAt` on public servers.\n',
  '',
  'resolved server health report row',
)

replaceExact(
  'docs/architecture/thin-resource-api-audit.md',
  '| ArtImage collection links | Generic connection PATCH let image owners transfer ownership and attach arbitrary Bots, Dreams, Rewards, Servers, and other resources | Endpoint now manages collection membership only, requires image ownership, requires collection ownership for connects, validates all IDs, and rejects unrelated fields |',
  '| ArtImage collection links | Generic connection PATCH let image owners transfer ownership and attach arbitrary Bots, Dreams, Rewards, Servers, and other resources | Endpoint now manages collection membership only, requires image ownership, requires collection ownership for connects, validates all IDs, and rejects unrelated fields |\n| Browser server health reports | Optional authentication reused read permission, so anonymous callers could write status history for public servers | Reports require authenticated server mutation permission, validate a bounded report schema, and preserve owner/admin-only status writes |',
  'server health report audit row',
)
