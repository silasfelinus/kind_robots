// /server/api/resources/compatibility.ts
import { createError } from 'h3'

// Pulled out of [id].patch.ts (conductor/t-072) so this pure ownership check
// -- and its `existingUserId: number | null` contract, since Resource.userId
// is `Int?` in prisma/schema.prisma -- can be exercised directly in a
// DB-free regression test without importing the route handler, which pulls
// in the Prisma client and throws at import time when DATABASE_URL is unset.
export function assertOwnershipIsUnchanged(
  body: Record<string, unknown>,
  existingUserId: number | null,
) {
  if (!Object.prototype.hasOwnProperty.call(body, 'userId')) return

  const requestedUserId = Number(body.userId)

  if (
    !existingUserId ||
    !Number.isInteger(requestedUserId) ||
    requestedUserId !== existingUserId
  ) {
    throw createError({
      statusCode: 400,
      message:
        'Unsupported Resource ownership reassignment. Ownership is server-owned.',
    })
  }
}
