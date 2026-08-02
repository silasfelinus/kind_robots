// /server/utils/authUser.ts
import type { Role, User } from '~/prisma/generated/prisma/client'

/**
 * The authenticated user, plus the two derived facts every guard needs.
 *
 * `roles` is the user's COMPLETE role set, read from the UserRole join table.
 * Every user was backfilled with a row matching their `User.Role`, so this
 * array alone is a correct answer -- a caller never has to consult both.
 * `User.Role` remains as the primary/display role and is still written.
 */
export type AuthUser = User & {
  isAdmin: boolean
  roles: Role[]
}

/**
 * The minimum shape the role predicates below can answer questions about.
 *
 * Deliberately loose: `validateApiKey` (server/utils/validateKey.ts) resolves a
 * user through a different path and returns only `{ id, Role }`, with no join
 * table load. Both resolvers must be able to reach these predicates, so `roles`
 * is optional and the legacy scalar is always consulted as a fallback.
 */
type RoleCheckUser = Pick<User, 'id'> & {
  Role?: User['Role'] | string | null
  roles?: readonly (Role | string)[] | null
  // Accepted so a Prisma record loaded with `include: { UserRoles: ... }` can be
  // passed straight in. Without this every call site would hand-map the
  // relation to `roles`, and the one that forgets gets a silent demotion rather
  // than a type error.
  UserRoles?: readonly { role: Role | string }[] | null
}

function normalize(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toUpperCase()
}

/**
 * Every role this user holds, as a normalized uppercase set.
 *
 * Dual-read on purpose. The join table is authoritative once loaded, but the
 * scalar column is included unconditionally so that a caller who resolved the
 * user without the join (validateKey, a narrow Prisma `select`, a test fixture
 * built by hand) still gets a correct answer instead of a silently empty set.
 * An empty `roles` array therefore means "not loaded", never "no roles" --
 * conflating those is what turns a missing include into a privilege bug.
 */
export function userRoles(user: RoleCheckUser): Set<string> {
  const roles = new Set<string>()
  for (const role of user.roles ?? []) {
    const normalized = normalize(role)
    if (normalized) roles.add(normalized)
  }
  for (const entry of user.UserRoles ?? []) {
    const normalized = normalize(entry?.role)
    if (normalized) roles.add(normalized)
  }
  const primary = normalize(user.Role)
  if (primary) roles.add(primary)
  return roles
}

/**
 * Does this user hold `role`? Case-insensitive, and true if the role appears
 * EITHER in the join table or in the legacy primary column.
 *
 * Use this instead of `user.Role === 'FAMILY'`. An inline comparison against
 * the scalar reads only the primary role, so it silently returns false for a
 * user who holds that role as a secondary -- which is the entire point of
 * multi-role.
 */
export function userHasRole(user: RoleCheckUser, role: Role | string): boolean {
  const wanted = normalize(role)
  return wanted ? userRoles(user).has(wanted) : false
}

/**
 * The canonical admin predicate. `id === 1` is the historical bootstrap
 * account and stays an escape hatch.
 *
 * Prefer this over `user.Role === 'ADMIN'`. The inline form was never
 * consistent with this one anyway -- some sites included the `|| id === 1`
 * escape hatch and some did not, and this predicate uppercases where the inline
 * sites compared raw -- and under multi-role it is now also wrong, because an
 * admin whose PRIMARY role is CHILD or FAMILY reads as non-admin.
 */
export function userIsAdmin(user: RoleCheckUser): boolean {
  return userRoles(user).has('ADMIN') || user.id === 1
}

/**
 * Attach the derived flags to a freshly-loaded user.
 *
 * `roles` comes from the `UserRoles` relation when the caller included it. Pass
 * it explicitly rather than letting it default: an omitted include yields an
 * empty array, which `userRoles` deliberately treats as "not loaded" and covers
 * by falling back to the scalar column.
 */
export function withAdminFlag(
  user: User,
  roles?: readonly { role: Role }[] | null,
): AuthUser {
  const resolved = (roles ?? []).map((entry) => entry.role)
  const withRoles = { ...user, roles: resolved }
  return {
    ...withRoles,
    isAdmin: userIsAdmin(withRoles),
  }
}
