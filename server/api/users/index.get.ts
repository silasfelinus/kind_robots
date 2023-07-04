// model User {
// id          Int      @id @default(autoincrement())
// email       String   @unique
// name        String   @default("")
// createdAt   DateTime @default(now())
// updatedAt   DateTime @updatedAt
// bio         String?
// avatarImage String?
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default eventHandler(async () => {
  return await prisma.user.findMany()
})
