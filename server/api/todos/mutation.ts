// /server/api/todos/mutation.ts

// Explicit mutation allowlist for Todo create/patch. Covers every field the routes
// accept (create sets status server-side; patch also accepts status), plus the
// identity/system columns and relation keys a round-tripped row could carry. Those
// are tolerated but never trusted — the routes set userId from authentication and
// scope every write by it. Anything outside this set is rejected, not dropped.
export const todoMutationFields = new Set<string>([
  'title',
  'description',
  'status',
  'priority',
  'category',
  'dueDate',
  'icon',
  'imagePath',
  'order',
  'dreamId',
  'projectId',
  // tolerated-but-untrusted identity/system columns and relations
  'id',
  'userId',
  'createdAt',
  'updatedAt',
  'Dream',
  'Project',
])
