// /server/utils/authUser.ts
import type { User } from '~/prisma/generated/prisma/client'

export type AuthUser = User & {
  isAdmin: boolean
}

export function userIsAdmin(user: Pick<User, 'id' | 'Role'>): boolean {
  return user.Role === 'ADMIN' || user.id === 1
}

export function withAdminFlag(user: User): AuthUser {
  return {
    ...user,
    isAdmin: userIsAdmin(user),
  }
}
