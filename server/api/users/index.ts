// ~/server/api/users/index.ts
import { User as UserRecord, Prisma } from '@prisma/client'
import prisma from './../utils/prisma'

export type User = UserRecord

export async function fetchUsers(page = 1, pageSize = 10): Promise<User[]> {
  const skip = (page - 1) * pageSize
  return await prisma.user.findMany({
    skip,
    take: pageSize
  })
}

export async function fetchUserById(id: number): Promise<User | null> {
  return await prisma.user.findUnique({
    where: { id }
  })
}

export async function addUser(userData: Partial<User>): Promise<User | null> {
  if (!userData.username || !userData.hashedPassword) {
    return null
  }

  return await prisma.user.create({
    data: userData as Prisma.UserCreateInput
  })
}

export async function updateUser(id: number, data: Partial<User>): Promise<User | null> {
  const userExists = await prisma.user.findUnique({ where: { id } })

  if (!userExists) {
    return null
  }

  return await prisma.user.update({
    where: { id },
    data: data as Prisma.UserUpdateInput
  })
}

export async function deleteUser(id: number): Promise<boolean> {
  const userExists = await prisma.user.findUnique({ where: { id } })

  if (!userExists) {
    return false
  }

  await prisma.user.delete({ where: { id } })
  return true
}

export async function randomUser(): Promise<User | null> {
  const totalUsers = await prisma.user.count()

  if (totalUsers === 0) {
    return null
  }

  const randomIndex = Math.floor(Math.random() * totalUsers)
  return await prisma.user.findFirst({
    skip: randomIndex
  })
}
export async function countUsers(): Promise<number> {
  return await prisma.user.count()
}
