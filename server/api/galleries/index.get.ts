import prisma from '../prisma'

export default defineEventHandler(async () => {
  const galleries = await prisma.gallery.findMany({})
  return await galleries
})
