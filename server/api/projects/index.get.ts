import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const designs = await prisma.design.findMany()
  return {
    designs
  }
})
