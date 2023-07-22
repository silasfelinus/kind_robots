// /server/api/utils/user.ts
import { User, Prisma, Role } from '@prisma/client'
import prisma from './prisma'
import { ErrorHandler } from './error'

export interface UserData {
  Role?: Role
  username: string
  realName?: string
  fancyName?: string
  salt?: string
  hashedPassword: string
  email: string
  bio?: string
  birthday?: string | null
  address1?: string
  address2?: string
  city?: string
  state?: string
  country?: string
  timezone?: string
  phone?: string
  languages?: string
  hideBio?: boolean
  avatarImage?: string
  isPrivate?: boolean
  allowCookies?: boolean
  defaultTheme?: string
  themeOverride?: boolean
  showNsfw?: boolean
  likes?: number
  visits?: number
  hideComments?: boolean
  instagramUrl?: string
  twitterUrl?: string
  facebookUrl?: string
  discordUrl?: string
  kindrobotsUrl?: string
  hideSocialNetworks?: boolean
  questPoints?: number
}

export const createManyUsers = async (
  usersData: Partial<UserData>[]
): Promise<{ count: number }> => {
  return ErrorHandler(async () => {
    const data: Prisma.UserCreateManyInput[] = usersData.map((userData) => {
      if (!userData.username || !userData.hashedPassword || !userData.email) {
        throw new Error(`Each user must have a username, hashedPassword and email.`)
      }
      return userData as Prisma.UserCreateManyInput
    })

    const result = await prisma.user.createMany({
      data,
      skipDuplicates: true
    })

    return { count: result.count }
  }, 'Error while creating multiple users')
}

// Fetches a user from the database using its ID
export const findUser = async (id: number): Promise<User> => {
  return ErrorHandler(async () => {
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      throw new Error('User not found.')
    }
    return user
  }, 'Error while finding a user')
}

export const updateUser = async (id: number, userData: Partial<UserData>): Promise<User> => {
  if (
    userData.username === undefined ||
    userData.hashedPassword === undefined ||
    userData.email === undefined
  ) {
    throw new Error(`Username, hashedPassword, and email cannot be undefined.`)
  }

  const data = userData

  const updatedUser = await prisma.user.update({
    where: { id },
    data
  })

  if (!updatedUser) {
    throw new Error('User update failed.')
  }

  return updatedUser
}

export const randomUser = async () => {
  const totalUsers = await prisma.user.count()
  const randomIndex = Math.floor(Math.random() * totalUsers)
  const randomUser = await prisma.user.findFirst({
    skip: randomIndex
  })

  if (!randomUser) {
    throw new Error('User not found.')
  }

  return randomUser
}

export const deleteUser = async (id: number) => {
  await prisma.user.delete({ where: { id } })
}

export const getUsers = async () => {
  const users = await prisma.user.findMany()
  return users
}

export const countUsers = async () => {
  const userCount = await prisma.user.count()
  return userCount
}
