import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  let tag = null

  if (body.name)
    tag = await prisma.tag.create({
      data: {
        name: body.name
      }
    })
  return {
    tag
  }
})
