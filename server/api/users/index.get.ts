// server/api/users/index.get.ts
import prisma from '../utils/prisma'

export default eventHandler(async () => {
  return await prisma.user.findMany()
})
