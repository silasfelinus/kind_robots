// /server/utils/userRoleWrites.ts
import type { Role } from '~/prisma/generated/prisma/client'
import prisma from './prisma'

/**
 * Keeping `User.Role` and the `UserRole` join table in sync.
 *
 * Both are written on every role change, deliberately. `User.Role` is still the
 * primary/display role and is still read as a fallback everywhere a user was
 * resolved without the join (see `userRoles` in ./authUser.ts), so letting the
 * two drift would produce a user who is an admin down one code path and not
 * down another. These helpers exist so no route has to remember that rule.
 *
 * The first element of a role list is always the primary. Callers that offer a
 * UI should present it that way rather than sorting.
 *
 * Each helper takes an optional transaction client so a caller can enlist these
 * writes in a transaction it already opened.
 */

// prisma is $extends()-wrapped (see server/utils/prisma.ts), so its
// $transaction callback's tx param has extended InternalArgs that don't
// structurally match the plain Prisma.TransactionClient type. Derive the type
// from the actual instance instead (same pattern as server/utils/mana.ts and
// server/api/stripe/webhook.post.ts).
type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

/**
 * Replace a user's entire role set.
 *
 * Always transactional: a partial apply would leave the scalar and the join
 * table disagreeing, which is the one state this module exists to prevent.
 * Pass `tx` to enlist in a transaction the caller already opened.
 */
export async function setUserRoles(
  userId: number,
  roles: readonly Role[],
  tx?: Tx,
): Promise<Role[]> {
  const unique: Role[] = []
  for (const role of roles) if (!unique.includes(role)) unique.push(role)
  if (!unique.length) throw new Error('setUserRoles requires at least one role.')

  const apply = async (client: Tx): Promise<void> => {
    await client.userRole.deleteMany({
      where: { userId, role: { notIn: [...unique] } },
    })
    await client.userRole.createMany({
      data: unique.map((role) => ({ userId, role })),
      skipDuplicates: true,
    })
    await client.user.update({
      where: { id: userId },
      data: { Role: unique[0] },
    })
  }

  if (tx) await apply(tx)
  else await prisma.$transaction(apply)

  return unique
}

/**
 * Add a role without disturbing the ones already held.
 *
 * The additive counterpart to setUserRoles, and what relationship side effects
 * should use -- `applyChildRole` must be able to mark an account as CHILD
 * without demoting an admin or clearing a FAMILY grant. `User.Role` is left
 * alone: the primary role is a display choice, and a side effect should not
 * silently relabel an account a user or an admin named.
 */
export async function addUserRole(
  userId: number,
  role: Role,
  tx?: Tx,
): Promise<void> {
  const client = tx ?? prisma
  await client.userRole.createMany({
    data: [{ userId, role }],
    skipDuplicates: true,
  })
}

/** Remove a single role. No-op when the user does not hold it. */
export async function removeUserRole(
  userId: number,
  role: Role,
  tx?: Tx,
): Promise<void> {
  const client = tx ?? prisma
  await client.userRole.deleteMany({ where: { userId, role } })
}

/** The roles a user currently holds, primary first. */
export async function getUserRoles(userId: number): Promise<Role[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { Role: true, UserRoles: { select: { role: true } } },
  })
  if (!user) return []

  const roles: Role[] = [user.Role]
  for (const entry of user.UserRoles) {
    if (!roles.includes(entry.role)) roles.push(entry.role)
  }
  return roles
}
