// model User {
// id          Int      @id @default(autoincrement())
// email       String   @unique
// name        String   @default("")
// createdAt   DateTime @default(now())
// updatedAt   DateTime @updatedAt
// bio         String?
// avatarImage String?
import prisma from '../prisma'

export default eventHandler(async (event) => {
  const body = await readBody(event)
  const id = body.id
  const email = body.email
  const userName = body.name

  if (!(id && email))
    return createError({
      statusCode: 400,
      statusMessage: 'Missing ID or email'
    })

  let user = null

  if (id && email)
    user = await prisma.user.update({
      where: {
        id
      },
      data: {
        userName,
        email
      }
    })

  return user
})
