// /server/utils/authUser.ts
import type { User } from '~/prisma/generated/prisma/client'

export type AuthUser = User & {
  isAdmin: boolean
}

type AdminCheckUser = Pick<User, 'id'> & {
  Role?: User['Role'] | string | null
}

export function userIsAdmin(user: AdminCheckUser): boolean {
  return String(user.Role || '').toUpperCase() === 'ADMIN' || user.id === 1
}

export function withAdminFlag(user: User): AuthUser {
  return {
    ...user,
    isAdmin: userIsAdmin(user),
  }
}
