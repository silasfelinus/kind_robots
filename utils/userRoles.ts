// /utils/userRoles.ts
//
// Isomorphic role predicates, shared by the client stores and mirrored by
// server/utils/authUser.ts.
//
// Two copies exist on purpose: the server version is typed against Prisma's
// generated `User` and accepts a raw `include: { UserRoles }` record, which the
// client has no business knowing about. What must NOT diverge is the semantics,
// so both implement the same three rules:
//
//   1. A user's roles are the UNION of the `roles` array and the primary `Role`
//      column. `Role` alone is not the answer -- that is the whole point of
//      multi-role.
//   2. An absent or empty `roles` means "not loaded", never "no roles". A
//      payload that predates the multi-role rollout, or a store hydrated from a
//      narrower endpoint, still has a correct primary role to fall back on.
//      Treating absent as empty would demote every such user.
//   3. Matching is case-insensitive.
//
// Rule 2 is also what makes this safe to ship before every endpoint returns
// `roles`: an old-shaped payload keeps behaving exactly as it did.

export type RoleBearer = {
  id?: number | null
  Role?: string | null
  roles?: readonly string[] | null
}

function normalize(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toUpperCase()
}

/** Every role this user holds, normalized to uppercase. */
export function resolveUserRoles(user: RoleBearer | null | undefined): Set<string> {
  const roles = new Set<string>()
  if (!user) return roles

  for (const role of user.roles ?? []) {
    const normalized = normalize(role)
    if (normalized) roles.add(normalized)
  }
  const primary = normalize(user.Role)
  if (primary) roles.add(primary)

  return roles
}

/** Does this user hold `role`, as primary or secondary? */
export function hasUserRole(
  user: RoleBearer | null | undefined,
  role: string,
): boolean {
  const wanted = normalize(role)
  return wanted ? resolveUserRoles(user).has(wanted) : false
}

/** `id === 1` is the historical bootstrap account and stays an escape hatch. */
export function isUserAdmin(user: RoleBearer | null | undefined): boolean {
  if (!user) return false
  return resolveUserRoles(user).has('ADMIN') || user.id === 1
}

/**
 * The primary/display role, uppercased, defaulting to USER.
 *
 * Use for labels and for the single-role `requiredRole` comparison in content
 * frontmatter. Never use it to decide what a user may DO -- that is what
 * hasUserRole/isUserAdmin are for.
 */
export function primaryUserRole(user: RoleBearer | null | undefined): string {
  return normalize(user?.Role) || 'USER'
}
