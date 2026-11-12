import {
  createError,
  defineEventHandler,
  getRouterParam,
  setHeader,
} from 'h3'
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw createError({ statusCode: 404, message: 'Screenshot not found.' })
  }

  const image = await prisma.artImage.findFirst({
    where: {
      id,
      designer: 'site-feedback',
      isActive: true,
      isPublic: true,
      isMature: false,
    },
    select: { imageData: true, fileType: true },
  })
  if (!image?.imageData || !['png', 'jpeg', 'webp'].includes(image.fileType ?? '')) {
    throw createError({ statusCode: 404, message: 'Screenshot not found.' })
  }

  setHeader(event, 'Content-Type', 'image/' + image.fileType)
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return Buffer.from(image.imageData, 'base64')
})
