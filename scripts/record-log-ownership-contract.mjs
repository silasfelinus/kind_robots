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
  'Resolved since this audit: achievement writes are authenticated and ownership-aware; Stripe billing identity comes from authentication; Component mutations require admins; bot seed is admin-only; dead SD model switching was removed; art upload and ArtImage collections enforce ownership; browser health reports require server mutation permission.',
  'Resolved since this audit: achievement writes are authenticated and ownership-aware; Stripe billing identity comes from authentication; Component mutations require admins; bot seed is admin-only; dead SD model switching was removed; art resources and browser health reports enforce ownership; log reads, writes, and deletion are self-scoped with admin override.',
  'log ownership security resolution note',
)

replaceExact(
  'docs/notes/backend-sweep-2026-07-05.md',
  '- `server/api/logs/[id].delete.ts:41` — any authed user deletes any log (no `existing.userId` compare).\n',
  '',
  'resolved log delete ownership row',
)

replaceExact(
  'docs/notes/backend-sweep-2026-07-05.md',
  '- `server/api/logs/[id].delete.ts:12-16` — returns `errorHandler({...})` as the body **without** setting `event.node.res.statusCode`, so failures return HTTP 200 with a `{success:false}` body — breaks clients that trust HTTP status.\n',
  '',
  'resolved log HTTP status bug row',
)

replaceExact(
  'docs/architecture/thin-resource-api-audit.md',
  '| Browser server health reports | Optional authentication reused read permission, so anonymous callers could write status history for public servers | Reports require authenticated server mutation permission, validate a bounded report schema, and preserve owner/admin-only status writes |',
  '| Browser server health reports | Optional authentication reused read permission, so anonymous callers could write status history for public servers | Reports require authenticated server mutation permission, validate a bounded report schema, and preserve owner/admin-only status writes |\n| Logs | Any authenticated user could list, read, or delete another user’s logs; POST accepted forged identity/timestamps; errors often returned HTTP 200 | Reads and deletes are owner/admin scoped, lists default to self, POST derives identity/time from auth, and every route returns explicit HTTP status envelopes |',
  'log ownership audit row',
)
